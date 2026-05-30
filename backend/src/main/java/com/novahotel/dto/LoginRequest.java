package com.novahotel.dto;

/**
 * DTO cho request login
 * Chứa thông tin email và mật khẩu
 */
public class LoginRequest {
    /**
     * Email của người dùng
     */
    private String email;

    /**
     * Mật khẩu của người dùng
     */
    private String password;

    public LoginRequest() {}
    public LoginRequest(String email, String password) { this.email = email; this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
