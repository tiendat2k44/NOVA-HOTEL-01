package com.novahotel.dto;

/**
 * DTO cho request đăng ký
 * Chứa thông tin cơ bản để tạo tài khoản mới
 */
public class RegisterRequest {
    /**
     * Họ tên của người dùng
     */
    private String fullName;

    /**
     * Email của người dùng (dùng làm username duy nhất)
     */
    private String email;

    /**
     * Mật khẩu của người dùng
     */
    private String password;

    /**
     * Số điện thoại của người dùng
     */
    private String phone;

    public RegisterRequest() {}
    public RegisterRequest(String fullName, String email, String password, String phone) {
        this.fullName = fullName; this.email = email; this.password = password; this.phone = phone;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
