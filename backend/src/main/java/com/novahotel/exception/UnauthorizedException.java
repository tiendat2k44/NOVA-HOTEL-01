package com.novahotel.exception;

/**
 * Exception cho unauthorized access
 * HTTP Status: 401 Unauthorized
 */
public class UnauthorizedException extends RuntimeException {
    /**
     * Constructor với message
     * 
     * @param message Thông báo lỗi
     */
    public UnauthorizedException(String message) {
        super(message);
    }

    /**
     * Constructor với message và cause
     * 
     * @param message Thông báo lỗi
     * @param cause Nguyên nhân
     */
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
