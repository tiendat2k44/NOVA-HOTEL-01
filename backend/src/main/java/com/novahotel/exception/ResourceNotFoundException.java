package com.novahotel.exception;

/**
 * Exception cho resource không tìm thấy
 * HTTP Status: 404 Not Found
 */
public class ResourceNotFoundException extends RuntimeException {
    /**
     * Constructor với message
     * 
     * @param message Thông báo lỗi
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructor với message và cause
     * 
     * @param message Thông báo lỗi
     * @param cause Nguyên nhân
     */
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
