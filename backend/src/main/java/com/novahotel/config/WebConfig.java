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
                // Cho phép các origin frontend thực tế đang dùng
                // Lưu ý: 127.0.0.1 và localhost là 2 origin khác nhau theo browser
                .allowedOrigins(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:3000"
                )
                // Cho phép tất cả HTTP methods (rất quan trọng cho preflight OPTIONS)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                // Cho phép tất cả headers (đặc biệt Authorization)
                .allowedHeaders("*")
                // Cho phép gửi credentials (JWT token, cookies)
                .allowCredentials(true)
                // Thời gian cache CORS preflight response (giây)
                .maxAge(3600);
    }
}
