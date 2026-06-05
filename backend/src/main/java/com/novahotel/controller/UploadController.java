package com.novahotel.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.novahotel.dto.ApiResponse;
import com.novahotel.exception.BadRequestException;

/**
 * Upload Controller
 * Xử lý upload file ảnh cho admin (phòng, v.v.)
 * 
 * Base URL: /api/uploads
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);

    // Thư mục lưu ảnh phòng (tạo nếu chưa có)
    private static final Path ROOM_IMAGE_DIR = Paths.get("uploads", "rooms").toAbsolutePath();

    // Cho phép các đuôi file ảnh phổ biến
    private static final List<String> ALLOWED_EXT = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

    /**
     * Upload ảnh phòng (ADMIN only)
     * POST /api/uploads/rooms
     * Form-data: file (MultipartFile)
     * 
     * Trả về: { code, message, data: { url: "/uploads/rooms/xxx.jpg" } }
     */
    @PostMapping("/rooms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadRoomImage(
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được để trống");
        }

        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new BadRequestException("Kích thước ảnh vượt quá 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Chỉ chấp nhận file ảnh (image/*)");
        }

        String original = file.getOriginalFilename();
        String ext = getFileExtension(original);
        if (ext.isEmpty()) {
            // không hợp lệ hoặc không được hỗ trợ -> reject
            throw new BadRequestException("Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, WEBP, GIF");
        }

        String filename = UUID.randomUUID().toString() + ext;
        Path targetPath = ROOM_IMAGE_DIR.resolve(filename);

        try {
            Files.createDirectories(ROOM_IMAGE_DIR);
            file.transferTo(targetPath.toFile());
            log.info("Uploaded room image: {} -> {}", original, targetPath);
        } catch (Exception e) {
            log.error("Failed to save uploaded file", e);
            throw new BadRequestException("Không thể lưu file ảnh: " + e.getMessage());
        }

        String publicUrl = "/uploads/rooms/" + filename;
        Map<String, String> result = new HashMap<>();
        result.put("url", publicUrl);

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Image uploaded successfully",
                result
        );
        return ResponseEntity.ok(response);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == filename.length() - 1) {
            return "";
        }
        String ext = filename.substring(dotIndex).toLowerCase();
        return ALLOWED_EXT.contains(ext) ? ext : "";
    }
}
