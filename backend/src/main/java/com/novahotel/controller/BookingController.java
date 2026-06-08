package com.novahotel.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.novahotel.dto.ApiResponse;
import com.novahotel.dto.BookingRequest;
import com.novahotel.dto.BookingStatusRequest;
import com.novahotel.model.Booking;
import com.novahotel.service.BookingService;
import com.novahotel.service.VietQRService;

/**
 * Booking Controller
 * Xử lý các yêu cầu liên quan tới đặt phòng
 * 
 * Base URL: /api/bookings
 * Protected endpoints (cần JWT token)
 * 
 * Truy vấn cốt lõi #2: Đặt phòng (booking)
 * Truy vấn cốt lõi #3: Xem lịch sử đặt phòng của khách
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

        private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    /**
     * BookingService để xử lý logic đặt phòng
     */
    @Autowired
    private BookingService bookingService;

    @Autowired
    private VietQRService vietQRService;

    /**
     * Đặt phòng (tạo booking mới)
     * TRUY VẤN CỐT LÕI #2: Đặt phòng (booking)
     * 
     * POST /api/bookings
     * 
     * Request body chứa:
     * - roomId: ID của phòng
     * - checkInDate: ngày check-in
     * - checkOutDate: ngày check-out
     * - numberOfGuests: số khách
     * - notes: ghi chú (optional)
     * - contactName: tên người liên hệ
     * - contactEmail: email người liên hệ
     * - contactPhone: số điện thoại người liên hệ
     * 
     * @param bookingRequest Thông tin booking
     * @param authentication Authentication object (lấy userId)
     * @return Booking object sau khi tạo
     */
    @PostMapping
        @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Booking>> createBooking(
            @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        log.info("Create booking for user: {}, room: {}", 
                authentication.getPrincipal(), bookingRequest.getRoomId());
        
        String userId = (String) authentication.getPrincipal();
        Booking booking = bookingService.createBooking(userId, bookingRequest);
        
        ApiResponse<Booking> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "Booking created successfully",
                booking
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách ngân hàng hỗ trợ VietQR (dùng cho dropdown chọn ngân hàng).
     * GET /api/bookings/banks
     *
     * Đặt sớm (ngay sau create) để đảm bảo Spring đăng ký trước các mapping động.
     */
    @GetMapping("/banks")
    @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getSupportedBanks() {
        List<Map<String, String>> banks = (vietQRService != null)
                ? vietQRService.getSupportedBanks()
                : List.of();
        ApiResponse<List<Map<String, String>>> resp = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Danh sách ngân hàng hỗ trợ VietQR",
                banks
        );
        return ResponseEntity.ok(resp);
    }

    /**
     * Lấy QR VietQR để thanh toán (checkout / chuyển khoản).
     * Dùng cho khách hàng sau khi đặt phòng hoặc khi booking confirmed.
     *
     * GET /api/bookings/{bookingId}/payment-qr?bank=VCB
     * Được khai báo sớm ngay sau /banks để đảm bảo Spring đăng ký handler
     * trước mapping động /{bookingId}.
     */
    @GetMapping({"/{bookingId}/payment-qr", "/{bookingId}/payment-qr/"})
    @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<VietQRService.PaymentQRInfo>> getPaymentQR(
            @PathVariable String bookingId,
            @RequestParam(required = false) String bank,
            Authentication authentication) {

        if (authentication == null) {
            ApiResponse<VietQRService.PaymentQRInfo> response = new ApiResponse<>(
                    HttpStatus.UNAUTHORIZED.value(),
                    "Chưa xác thực"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Object principal = authentication.getPrincipal();
        log.info("Get payment QR for booking: {} (bank={}) by user: {}", bookingId, bank, principal);

        String userId = (principal instanceof String) ? (String) principal : null;
        boolean isStaff = hasStaffRole(authentication);

        try {
            VietQRService.PaymentQRInfo qrInfo = bookingService.getPaymentQRInfo(bookingId, userId, isStaff, bank);
            ApiResponse<VietQRService.PaymentQRInfo> response = new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "QR thanh toán được tạo thành công",
                    qrInfo
            );
            return ResponseEntity.ok(response);
        } catch (com.novahotel.exception.ResourceNotFoundException ex) {
            ApiResponse<VietQRService.PaymentQRInfo> response = new ApiResponse<>(
                    HttpStatus.NOT_FOUND.value(),
                    ex.getMessage()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

        /**
         * Lấy toàn bộ booking cho admin hoặc màn hình quản trị (hỗ trợ phân trang)
         *
         * GET /api/bookings?page=0&size=10
         *
         * @return Page<Booking>
         */
        @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
        public ResponseEntity<ApiResponse<Page<Booking>>> getAllBookings(
                        @RequestParam(defaultValue = "0") Integer page,
                        @RequestParam(defaultValue = "10") Integer size) {
                log.info("Get all bookings - page: {}, size: {}", page, size);
                Page<Booking> bookings = bookingService.getAllBookings(page, size);

                // Safety net: force the 3 important display fields (Mã, Khách, Phòng) on the returned content
                // This guarantees the columns show data even if service enrichment is not active in current .class
                if (bookings != null && bookings.getContent() != null) {
                        for (Booking b : bookings.getContent()) {
                                if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
                                        String fb = (b.getBookingId() != null && !b.getBookingId().isBlank()) ? b.getBookingId()
                                                        : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
                                        b.setBookingCode(fb);
                                }
                                if (b.getGuestName() == null || b.getGuestName().isBlank()) {
                                        b.setGuestName("Khách hàng");
                                }
                                if (b.getRoomName() == null || b.getRoomName().isBlank()) {
                                        b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
                                }
                                if (b.getRoomNumber() == null || b.getRoomNumber().isBlank() && b.getRoomId() != null) {
                                        b.setRoomNumber(b.getRoomId());
                                }
                        }
                }

                ApiResponse<Page<Booking>> response = new ApiResponse<>(
                                HttpStatus.OK.value(),
                                "Bookings retrieved successfully",
                                bookings
                );
                return ResponseEntity.ok(response);
        }

    /**
     * Xem lịch sử đặt phòng của khách hàng
     * TRUY VẤN CỐT LÕI #3: Xem lịch sử đặt phòng của khách
     * 
     * GET /api/bookings/my-bookings
     * 
     * @param authentication Authentication object (lấy userId)
     * @param page Số trang (mặc định: 0)
     * @param size Kích thước trang (mặc định: 10)
     * @return Page<Booking> - danh sách booking của khách
     */
    @GetMapping("/my-bookings")
        @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Page<Booking>>> getMyBookings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("Get bookings for user: {}, page: {}, size: {}", 
                authentication.getPrincipal(), page, size);
        
        String userId = (String) authentication.getPrincipal();
        Page<Booking> bookings = bookingService.getUserBookings(userId, page, size);

        // Safety net for my-bookings too
        if (bookings != null && bookings.getContent() != null) {
                for (Booking b : bookings.getContent()) {
                        if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
                                String fb = (b.getBookingId() != null && !b.getBookingId().isBlank()) ? b.getBookingId()
                                                : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
                                b.setBookingCode(fb);
                        }
                        if (b.getGuestName() == null || b.getGuestName().isBlank()) {
                                b.setGuestName("Khách hàng");
                        }
                        if (b.getRoomName() == null || b.getRoomName().isBlank()) {
                                b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
                        }
                        if ((b.getRoomNumber() == null || b.getRoomNumber().isBlank()) && b.getRoomId() != null) {
                                b.setRoomNumber(b.getRoomId());
                        }
                }
        }
        
        ApiResponse<Page<Booking>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User bookings retrieved successfully",
                bookings
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin booking theo ID (đã enrich thông tin khách hàng + phòng).
     *
     * GET /api/bookings/{bookingId}
     *
     * Lưu ý: /banks và các mapping payment-qr đã được khai báo sớm hơn trong class
     * (ngay sau createBooking) để đảm bảo Spring đăng ký chúng trước mapping động này.
     */
    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Booking>> getBookingById(
            @PathVariable String bookingId,
            Authentication authentication) {
        log.info("Get booking: {} for user: {}", bookingId, authentication.getPrincipal());

        String userId = (String) authentication.getPrincipal();
        boolean isStaff = hasStaffRole(authentication);
        Booking booking = bookingService.getBookingById(bookingId, userId, isStaff);

        ApiResponse<Booking> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking retrieved successfully",
                booking
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Hủy booking
     * 
     * DELETE /api/bookings/{bookingId}
     * 
     * @param bookingId ID của booking
     * @param authentication Authentication object (kiểm tra quyền)
     * @return Success message
     */
    @DeleteMapping("/{bookingId}")
        @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable String bookingId,
            Authentication authentication) {
        log.info("Cancel booking: {} for user: {}", bookingId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        boolean isStaff = hasStaffRole(authentication);
        bookingService.cancelBooking(bookingId, userId, isStaff);
        
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking cancelled successfully"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật trạng thái booking (chỉ gửi { "status": "confirmed" }).
     *
     * PATCH /api/bookings/{bookingId}/status
     */
    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Booking>> updateBookingStatus(
            @PathVariable String bookingId,
            @RequestBody BookingStatusRequest statusRequest,
            Authentication authentication) {
        log.info("Update booking status: {} -> {} by user: {}",
                bookingId,
                statusRequest != null ? statusRequest.getStatus() : null,
                authentication.getPrincipal());

        if (statusRequest == null || statusRequest.getStatus() == null || statusRequest.getStatus().isBlank()) {
            ApiResponse<Booking> bad = new ApiResponse<>(
                    HttpStatus.BAD_REQUEST.value(),
                    "Thiếu trạng thái cần cập nhật"
            );
            return ResponseEntity.badRequest().body(bad);
        }

        String userId = (String) authentication.getPrincipal();
        boolean isStaff = hasStaffRole(authentication);
        Booking updatedBooking = bookingService.updateBookingStatus(
                bookingId, statusRequest.getStatus(), userId, isStaff);

        ApiResponse<Booking> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking status updated successfully",
                updatedBooking
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật booking
     * 
     * PUT /api/bookings/{bookingId}
     * 
     * @param bookingId ID của booking
     * @param bookingRequest Thông tin cập nhật
     * @param authentication Authentication object (kiểm tra quyền)
     * @return Booking object sau khi cập nhật
     */
    @PutMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Booking>> updateBooking(
            @PathVariable String bookingId,
            @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        log.info("Update booking: {} for user: {}", bookingId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        boolean isStaff = hasStaffRole(authentication);
        Booking updatedBooking = bookingService.updateBooking(bookingId, bookingRequest, userId, isStaff);
        
        ApiResponse<Booking> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking updated successfully",
                updatedBooking
        );
        return ResponseEntity.ok(response);
    }

    private boolean hasStaffRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> {
                    String auth = a.getAuthority() != null ? a.getAuthority().toUpperCase() : "";
                    return auth.contains("ADMIN") || auth.contains("RECEPTIONIST");
                });
    }
}
