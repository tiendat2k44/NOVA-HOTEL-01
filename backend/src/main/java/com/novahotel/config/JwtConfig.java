package com.novahotel.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Cấu hình JWT cho ứng dụng.
 * Token hiện tại là chuỗi Base64 có chữ ký HMAC để giữ cho việc xác thực đơn giản nhưng vẫn có kiểm tra toàn vẹn.
 */
@Component
public class JwtConfig {
    /**
     * Secret dùng để ký và kiểm tra chữ ký token.
     */
    @Value("${jwt.secret:your_secret_key_must_be_at_least_32_characters_long_for_hs256_algorithm}")
    private String jwtSecret;

    /**
     * Thời gian hết hạn token, tính bằng mili giây.
     */
    @Value("${jwt.expiration:86400000}")
    private Long jwtExpirationMs;

    /**
     * Tạo token cho một người dùng.
     */
    public String generateToken(String userId, String role) {
        long expiration = System.currentTimeMillis() + jwtExpirationMs;
        String payload = userId + ":" + role + ":" + expiration;
        String signature = sign(payload);
        String tokenPayload = payload + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenPayload.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Lấy mã người dùng từ token.
     */
    public String getUserIdFromToken(String token) {
        try {
            String[] parts = decodeTokenParts(token);
            return parts.length > 0 ? parts[0] : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Lấy role (chuỗi) từ token.
     */
    public String getRoleFromToken(String token) {
        try {
            String[] parts = decodeTokenParts(token);
            return parts.length > 1 ? parts[1] : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Kiểm tra token còn hợp lệ và đúng chữ ký hay không.
     */
    public boolean isTokenValid(String token) {
        try {
            String[] parts = decodeTokenParts(token);
            if (parts.length < 4) return false;
            long exp = Long.parseLong(parts[2]);
            String expectedSignature = sign(parts[0] + ":" + parts[1] + ":" + parts[2]);
            return System.currentTimeMillis() <= exp && expectedSignature.equals(parts[3]);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy thời điểm hết hạn từ token.
     */
    public Long getExpirationFromToken(String token) {
        try {
            String[] parts = decodeTokenParts(token);
            if (parts.length < 3) return 0L;
            return Long.parseLong(parts[2]);
        } catch (Exception e) {
            return 0L;
        }
    }

    private String[] decodeTokenParts(String token) {
        byte[] decoded = Base64.getUrlDecoder().decode(token);
        String raw = new String(decoded, StandardCharsets.UTF_8);
        return raw.split(":", 4);
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể ký token", e);
        }
    }
}
