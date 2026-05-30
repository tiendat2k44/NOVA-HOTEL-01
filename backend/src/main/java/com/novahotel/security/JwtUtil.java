package com.novahotel.security;

import org.springframework.stereotype.Component;

/**
 * Tiện ích JWT
 * Xử lý các tác vụ liên quan tới JWT như
 * extract token từ Authorization header
 */
@Component
public class JwtUtil {

    /**
     * Tiền tố của Authorization header
     */
    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * Header name cho authorization
     */
    private static final String AUTHORIZATION_HEADER = "Authorization";

    /**
     * Extract JWT token từ Authorization header
     * Header format: "Bearer <token>"
     * 
     * @param authorizationHeader Authorization header value
     * @return JWT token (hoặc null nếu header không hợp lệ)
     */
    public String extractTokenFromHeader(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
            return authorizationHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    /**
     * Kiểm tra xem Authorization header có hợp lệ không
     * 
     * @param authorizationHeader Authorization header value
     * @return true nếu header có format "Bearer <token>"
     */
    public boolean isValidBearerFormat(String authorizationHeader) {
        return authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX);
    }

    /**
     * Lấy tên Authorization header
     * 
     * @return "Authorization"
     */
    public String getAuthorizationHeaderName() {
        return AUTHORIZATION_HEADER;
    }
}
