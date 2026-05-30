package com.novahotel.controller;

import com.novahotel.dto.ApiResponse;
import com.novahotel.dto.RoomFilterRequest;
import com.novahotel.model.Room;
import com.novahotel.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Room Controller
 * Xử lý các yêu cầu liên quan tới phòng
 * 
 * Base URL: /api/rooms
 * Các endpoints: public (không cần JWT token)
 * 
 * Truy vấn cốt lõi #1: Tìm phòng trống theo khoảng thời gian
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

        private static final Logger log = LoggerFactory.getLogger(RoomController.class);

    /**
     * RoomService để xử lý logic phòng
     */
    @Autowired
    private RoomService roomService;

    /**
     * Lấy all phòng (có phân trang)
     * 
     * GET /api/rooms?page=0&size=10
     * 
     * @param page Số trang (mặc định: 0)
     * @param size Kích thước trang (mặc định: 10)
     * @return Page<Room>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Room>>> getAllRooms(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("Get all rooms - page: {}, size: {}", page, size);
        Page<Room> rooms = roomService.getAllRooms(page, size);
        
        ApiResponse<Page<Room>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Rooms retrieved successfully",
                rooms
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin phòng theo ID
     * 
     * GET /api/rooms/{roomId}
     * 
     * @param roomId ID của phòng
     * @return Room object
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<Room>> getRoomById(@PathVariable String roomId) {
        log.info("Get room by ID: {}", roomId);
        Room room = roomService.getRoomById(roomId);
        
        ApiResponse<Room> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Room retrieved successfully",
                room
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Tìm phòng trống theo khoảng thời gian
     * TRUY VẤN CỐT LÕI #1: Tìm phòng trống theo khoảng thời gian
     * 
     * POST /api/rooms/search
     * 
     * Request body chứa:
     * - checkInDate: ngày check-in
     * - checkOutDate: ngày check-out
     * - numberOfGuests: số khách (optional)
     * - roomType: loại phòng (optional)
     * - maxPrice: giá tối đa (optional)
     * - minPrice: giá tối thiểu (optional)
     * - page: số trang (optional, mặc định: 0)
     * - size: kích thước trang (optional, mặc định: 10)
     * 
     * @param filterRequest Điều kiện lọc
     * @return Page<Room> - danh sách phòng trống
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Page<Room>>> searchAvailableRooms(
            @RequestBody RoomFilterRequest filterRequest) {
        log.info("Search available rooms - checkIn: {}, checkOut: {}", 
                filterRequest.getCheckInDate(), filterRequest.getCheckOutDate());
        
        Page<Room> availableRooms = roomService.findAvailableRooms(filterRequest);
        
        ApiResponse<Page<Room>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Available rooms retrieved successfully",
                availableRooms
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách phòng trống trong khoảng thời gian (simplified)
     * 
     * GET /api/rooms/available?checkInDate=2024-05-15&checkOutDate=2024-05-20
     * 
     * @param checkInDate Ngày check-in
     * @param checkOutDate Ngày check-out
     * @return List<Room> - danh sách phòng trống
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Room>>> getAvailableRooms(
            @RequestParam LocalDate checkInDate,
            @RequestParam LocalDate checkOutDate) {
        log.info("Get available rooms - checkIn: {}, checkOut: {}", checkInDate, checkOutDate);
        
        List<Room> availableRooms = roomService.getAvailableRooms(checkInDate, checkOutDate);
        
        ApiResponse<List<Room>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Available rooms retrieved successfully",
                availableRooms
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách phòng theo loại
     * 
     * GET /api/rooms/by-type?roomType=Double%20Room
     * 
     * @param roomType Loại phòng
     * @return List<Room>
     */
    @GetMapping("/by-type")
    public ResponseEntity<ApiResponse<List<Room>>> getRoomsByType(
            @RequestParam String roomType) {
        log.info("Get rooms by type: {}", roomType);
        
        List<Room> rooms = roomService.getRoomsByType(roomType);
        
        ApiResponse<List<Room>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Rooms retrieved successfully",
                rooms
        );
        return ResponseEntity.ok(response);
    }

        /**
         * Tạo phòng mới (ADMIN)
         * 
         * POST /api/rooms/admin
         */
        @PostMapping("/admin")
        public ResponseEntity<ApiResponse<Room>> createRoom(@RequestBody Room room) {
                log.info("Create room: {}", room.getRoomNumber());
                Room saved = roomService.createRoom(room);
                ApiResponse<Room> response = new ApiResponse<>(
                                HttpStatus.CREATED.value(),
                                "Room created successfully",
                                saved
                );
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * Cập nhật phòng (ADMIN)
         * 
         * PUT /api/rooms/admin/{roomId}
         */
        @PutMapping("/admin/{roomId}")
        public ResponseEntity<ApiResponse<Room>> updateRoom(
                        @PathVariable String roomId,
                        @RequestBody Room payload) {
                log.info("Update room: {}", roomId);
                Room updated = roomService.updateRoom(roomId, payload);
                ApiResponse<Room> response = new ApiResponse<>(
                                HttpStatus.OK.value(),
                                "Room updated successfully",
                                updated
                );
                return ResponseEntity.ok(response);
        }

        /**
         * Xóa phòng (ADMIN)
         * 
         * DELETE /api/rooms/admin/{roomId}
         */
        @DeleteMapping("/admin/{roomId}")
        public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable String roomId) {
                log.info("Delete room: {}", roomId);
                roomService.deleteRoom(roomId);
                ApiResponse<Void> response = new ApiResponse<>(
                                HttpStatus.OK.value(),
                                "Room deleted successfully",
                                null
                );
                return ResponseEntity.ok(response);
        }
}
