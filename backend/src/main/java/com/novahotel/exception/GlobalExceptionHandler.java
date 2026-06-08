package com.novahotel.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.novahotel.dto.ApiResponse;

/**
 * Global Exception Handler
 * Xử lý tất cả exceptions trong ứng dụng một cách tập trung
 * Trả về ApiResponse thống nhất cho tất cả lỗi
 * 
 * Sử dụng @RestControllerAdvice để xử lý exceptions từ tất cả @RestController
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handler cho ResourceNotFoundException
     * Trả về HTTP 404 Not Found
     * 
     * @param ex ResourceNotFoundException
     * @param request WebRequest
     * @return ApiResponse với statusCode 404
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handler cho BadRequestException
     * Trả về HTTP 400 Bad Request
     * 
     * @param ex BadRequestException
     * @param request WebRequest
     * @return ApiResponse với statusCode 400
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequestException(
            BadRequestException ex,
            WebRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handler cho UnauthorizedException
     * Trả về HTTP 401 Unauthorized
     * 
     * @param ex UnauthorizedException
     * @param request WebRequest
     * @return ApiResponse với statusCode 401
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorizedException(
            UnauthorizedException ex,
            WebRequest request) {
        log.warn("Unauthorized access: {}", ex.getMessage());
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Handler cho validation exception
     * Trả về HTTP 400 Bad Request khi @Valid validation fail
     * 
     * @param ex MethodArgumentNotValidException
     * @param request WebRequest
     * @return ApiResponse với statusCode 400 và error details
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            WebRequest request) {
        log.warn("JSON parse error: {}", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST.value(),
                "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại định dạng JSON."
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        log.warn("Validation error: {}", ex.getMessage());
        
        String errorMessage = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST.value(),
                "Validation error: " + errorMessage
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handler cho IllegalArgumentException
     * Trả về HTTP 400 Bad Request
     * 
     * @param ex IllegalArgumentException
     * @param request WebRequest
     * @return ApiResponse với statusCode 400
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex,
            WebRequest request) {
        log.warn("Max upload size exceeded: {}", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(
                413,
                "Kích thước file vượt quá giới hạn upload. Vui lòng chọn file nhỏ hơn 10MB."
        );
        return ResponseEntity.status(413).body(response);
    }

        @ExceptionHandler(NoResourceFoundException.class)
        public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(
                        NoResourceFoundException ex,
                        WebRequest request) {
                log.warn("No resource found: {}", ex.getMessage());

                String msg = ex.getMessage();
                // Helpful message for developers when API routes are missing (usually means need mvn clean + restart)
                if (msg != null && (msg.contains("/api/bookings/") || msg.contains("payment-qr") || msg.contains("banks"))) {
                        msg = "API endpoint không được tìm thấy. Hãy chạy 'mvn clean' và restart backend (spring-boot:run) sau khi sửa controller.";
                }

                ApiResponse<Object> response = new ApiResponse<>(
                                HttpStatus.NOT_FOUND.value(),
                                "Resource not found: " + msg
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

    /**
     * Handler cho các exception khác (catch-all)
     * Trả về HTTP 500 Internal Server Error
     * 
     * @param ex Exception
     * @param request WebRequest
     * @return ApiResponse với statusCode 500
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
            Exception ex,
            WebRequest request) {

        String message = ex.getMessage() != null ? ex.getMessage() : ex.toString();

        // If this is the "No static resource" for our known dynamic API routes (payment-qr, banks...),
        // treat it as 404 with actionable advice instead of ugly 500. This usually means the
        // controller method was not registered because the app was not restarted after a code change.
        if (message.contains("No static resource") &&
            (message.contains("/payment-qr") || message.contains("/banks") || message.contains("/api/bookings/"))) {

            log.warn("Treating unmatched API route as 404 (likely needs mvn clean + restart): {}", message);

            ApiResponse<Object> response = new ApiResponse<>(
                    HttpStatus.NOT_FOUND.value(),
                    "API endpoint không tồn tại trong backend đang chạy. Chạy 'mvn clean spring-boot:run' (hoặc xóa thư mục target rồi start lại) để đăng ký lại controller mappings."
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        log.error("Internal server error: ", ex);

        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error: " + message
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
