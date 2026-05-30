package com.novahotel.controller;

import com.novahotel.dto.ApiResponse;
import com.novahotel.dto.BookingRequest;
import com.novahotel.model.Booking;
import com.novahotel.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        @PreAuthorize("hasAnyRole('USER','ADMIN')")
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
         * Lấy toàn bộ booking cho admin hoặc màn hình quản trị
         *
         * GET /api/bookings
         *
         * @return danh sách booking
         */
        @GetMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<List<Booking>>> getAllBookings() {
                log.info("Get all bookings");
                List<Booking> bookings = bookingService.getAllBookings();

                ApiResponse<List<Booking>> response = new ApiResponse<>(
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
        @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<Booking>>> getMyBookings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("Get bookings for user: {}, page: {}, size: {}", 
                authentication.getPrincipal(), page, size);
        
        String userId = (String) authentication.getPrincipal();
        Page<Booking> bookings = bookingService.getUserBookings(userId, page, size);
        
        ApiResponse<Page<Booking>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User bookings retrieved successfully",
                bookings
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin booking theo ID
     * 
     * GET /api/bookings/{bookingId}
     * 
     * @param bookingId ID của booking
     * @param authentication Authentication object (kiểm tra quyền)
     * @return Booking object
     */
    @GetMapping("/{bookingId}")
        @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Booking>> getBookingById(
            @PathVariable String bookingId,
            Authentication authentication) {
        log.info("Get booking: {} for user: {}", bookingId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        Booking booking = bookingService.getBookingById(bookingId, userId);
        
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
        @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable String bookingId,
            Authentication authentication) {
        log.info("Cancel booking: {} for user: {}", bookingId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        bookingService.cancelBooking(bookingId, userId);
        
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking cancelled successfully"
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
        @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Booking>> updateBooking(
            @PathVariable String bookingId,
            @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        log.info("Update booking: {} for user: {}", bookingId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        Booking updatedBooking = bookingService.updateBooking(bookingId, bookingRequest, userId);
        
        ApiResponse<Booking> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Booking updated successfully",
                updatedBooking
        );
        return ResponseEntity.ok(response);
    }
}
