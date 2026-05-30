package com.novahotel.controller;

import com.novahotel.dto.ApiResponse;
import com.novahotel.model.Review;
import com.novahotel.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Review Controller
 * Xử lý các yêu cầu liên quan tới đánh giá phòng
 * 
 * Base URL: /api/reviews
 * Public endpoints: lấy review
 * Protected endpoints: tạo, cập nhật, xóa review (cần JWT token)
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

        private static final Logger log = LoggerFactory.getLogger(ReviewController.class);

    /**
     * ReviewService để xử lý logic review
     */
    @Autowired
    private ReviewService reviewService;

    /**
     * Tạo review mới cho phòng
     * 
     * POST /api/reviews
     * 
     * @param review Review object chứa: roomId, rating, comment
     * @param authentication Authentication object (lấy userId)
     * @return Review object sau khi tạo
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Review>> createReview(
            @RequestBody Review review,
            Authentication authentication) {
        log.info("Create review for user: {}, room: {}", 
                authentication.getPrincipal(), review.getRoomId());
        
        String userId = (String) authentication.getPrincipal();
        Review createdReview = reviewService.createReview(userId, review);
        
        ApiResponse<Review> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "Review created successfully",
                createdReview
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy tất cả review của phòng
     * 
     * GET /api/reviews/room/{roomId}
     * 
     * @param roomId ID của phòng
     * @param page Số trang (mặc định: 0)
     * @param size Kích thước trang (mặc định: 10)
     * @return Page<Review>
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<ApiResponse<Page<Review>>> getReviewsByRoom(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("Get reviews for room: {}, page: {}, size: {}", roomId, page, size);
        
        Page<Review> reviews = reviewService.getReviewsByRoom(roomId, page, size);
        
        ApiResponse<Page<Review>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Reviews retrieved successfully",
                reviews
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy review của user
     * 
     * GET /api/reviews/user/{userId}
     * 
     * @param userId ID của user
     * @return List<Review>
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Review>>> getReviewsByUser(
            @PathVariable String userId) {
        log.info("Get reviews for user: {}", userId);
        
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        
        ApiResponse<List<Review>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Reviews retrieved successfully",
                reviews
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin review theo ID
     * 
     * GET /api/reviews/{reviewId}
     * 
     * @param reviewId ID của review
     * @return Review object
     */
    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Review>> getReviewById(
            @PathVariable String reviewId) {
        log.info("Get review: {}", reviewId);
        
        Review review = reviewService.getReviewById(reviewId);
        
        ApiResponse<Review> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Review retrieved successfully",
                review
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật review
     * 
     * PUT /api/reviews/{reviewId}
     * 
     * @param reviewId ID của review
     * @param reviewUpdate Review object chứa cập nhật (rating, comment)
     * @param authentication Authentication object (kiểm tra quyền)
     * @return Review object sau khi cập nhật
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Review>> updateReview(
            @PathVariable String reviewId,
            @RequestBody Review reviewUpdate,
            Authentication authentication) {
        log.info("Update review: {} for user: {}", reviewId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        Review updatedReview = reviewService.updateReview(reviewId, reviewUpdate, userId);
        
        ApiResponse<Review> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Review updated successfully",
                updatedReview
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa review
     * 
     * DELETE /api/reviews/{reviewId}
     * 
     * @param reviewId ID của review
     * @param authentication Authentication object (kiểm tra quyền)
     * @return Success message
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable String reviewId,
            Authentication authentication) {
        log.info("Delete review: {} for user: {}", reviewId, authentication.getPrincipal());
        
        String userId = (String) authentication.getPrincipal();
        reviewService.deleteReview(reviewId, userId);
        
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Review deleted successfully"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy rating trung bình của phòng
     * 
     * GET /api/reviews/room/{roomId}/average-rating
     * 
     * @param roomId ID của phòng
     * @return Rating trung bình
     */
    @GetMapping("/room/{roomId}/average-rating")
    public ResponseEntity<ApiResponse<Double>> getAverageRating(
            @PathVariable String roomId) {
        log.info("Get average rating for room: {}", roomId);
        
        Double averageRating = reviewService.getAverageRating(roomId);
        
        ApiResponse<Double> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Average rating retrieved successfully",
                averageRating
        );
        return ResponseEntity.ok(response);
    }
}
