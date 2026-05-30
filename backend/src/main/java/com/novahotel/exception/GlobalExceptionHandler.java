package com.novahotel.exception;

import com.novahotel.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

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
        log.error("Internal server error: ", ex);
        
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error: " + ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
