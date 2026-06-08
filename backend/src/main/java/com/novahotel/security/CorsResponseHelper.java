package com.novahotel.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Gắn CORS headers vào response lỗi (401/403) để browser không chặn preflight/actual request.
 */
public final class CorsResponseHelper {

    private static final String[] ALLOWED_ORIGINS = {
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
    };

    private CorsResponseHelper() {}

    public static void applyCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null || !isAllowedOrigin(origin)) {
            return;
        }
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Vary", "Origin");
    }

    private static boolean isAllowedOrigin(String origin) {
        for (String allowed : ALLOWED_ORIGINS) {
            if (allowed.equals(origin)) {
                return true;
            }
        }
        return false;
    }
}