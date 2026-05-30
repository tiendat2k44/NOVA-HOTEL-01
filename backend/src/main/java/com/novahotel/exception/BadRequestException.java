package com.novahotel.exception;

/**
 * Exception cho bad request
 * HTTP Status: 400 Bad Request
 */
public class BadRequestException extends RuntimeException {
    /**
     * Constructor với message
     * 
     * @param message Thông báo lỗi
     */
    public BadRequestException(String message) {
        super(message);
    }

    /**
     * Constructor với message và cause
     * 
     * @param message Thông báo lỗi
     * @param cause Nguyên nhân
     */
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
