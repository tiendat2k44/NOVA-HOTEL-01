package com.novahotel.dto;

/**
 * DTO cho đăng nhập bằng Google (gửi idToken từ frontend)
 */
public class GoogleLoginRequest {
    private String credential; // id_token or access token from Google GIS / OAuth

    public GoogleLoginRequest() {}

    public String getCredential() { return credential; }
    public void setCredential(String credential) { this.credential = credential; }
}
