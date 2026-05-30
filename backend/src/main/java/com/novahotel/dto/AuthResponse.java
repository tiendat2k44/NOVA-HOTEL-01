package com.novahotel.dto;

/**
 * DTO cho response khi đăng nhập/đăng ký thành công
 * Chứa JWT token và thông tin người dùng
 */
public class AuthResponse {
    /**
     * ID của người dùng
     */
    private String userId;

    /**
     * Email của người dùng
     */
    private String email;

    /**
     * Họ tên của người dùng
     */
    private String fullName;

    /**
     * Role của người dùng (customer, admin, receptionist)
     */
    private String role;

    /**
     * JWT token để xác thực các request tiếp theo
     */
    private String token;

    public AuthResponse() {}
    public AuthResponse(String userId, String email, String fullName, String role, String token) {
        this.userId = userId; this.email = email; this.fullName = fullName; this.role = role; this.token = token;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
