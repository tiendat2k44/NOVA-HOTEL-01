package com.novahotel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình CORS (Cross-Origin Resource Sharing)
 * Cho phép React frontend (localhost:5173) gọi API từ backend
 * 
 * Cấu hình này cho phép:
 * - Origin từ localhost:5173 (React dev server)
 * - HTTP methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
 * - Headers: *, Credentials: true
 * - Credentials (cookies, authorization headers)
 */

@Configuration


public class WebConfig implements WebMvcConfigurer {

    /**
     * Cấu hình CORS mapping cho tất cả endpoints
     * 
     * @param registry CorsRegistry để cấu hình CORS
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Cho phép React frontend
                .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                // Cho phép tất cả HTTP methods
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                // Cho phép tất cả headers
                .allowedHeaders("*")
                // Cho phép gửi credentials (cookies, authorization headers)
                .allowCredentials(true)
                // Thời gian cache CORS preflight response (giây)
                .maxAge(3600);
    }
}
