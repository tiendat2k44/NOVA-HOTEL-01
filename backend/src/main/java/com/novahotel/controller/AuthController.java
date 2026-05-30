package com.novahotel.controller;

import com.novahotel.dto.AuthResponse;
import com.novahotel.dto.ApiResponse;
import com.novahotel.dto.LoginRequest;
import com.novahotel.dto.RegisterRequest;
import com.novahotel.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Xử lý các yêu cầu đăng nhập, đăng ký
 * 
 * Base URL: /api/auth
 * Public endpoints (không cần JWT token)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    /**
     * UserService để xử lý logic authenticate và register
     */
    @Autowired
    private UserService userService;

    /**
     * Đăng nhập
     * 
     * POST /api/auth/login
     * 
     * @param loginRequest Email và password
     * @return AuthResponse với JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest loginRequest) {
        log.info("Login request for email: {}", loginRequest.getEmail());
        AuthResponse authResponse = userService.login(loginRequest);
        
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Login successful",
                authResponse
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Đăng ký tài khoản mới
     * 
     * POST /api/auth/register
     * 
     * @param registerRequest Thông tin đăng ký (fullName, email, password, phoneNumber)
     * @return AuthResponse với JWT token
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest registerRequest) {
        log.info("Register request for email: {}", registerRequest.getEmail());
        AuthResponse authResponse = userService.register(registerRequest);
        
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "User registered successfully",
                authResponse
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Refresh JWT token
     * 
     * POST /api/auth/refresh
     * Yêu cầu: Authorization header với current token
     * 
     * @param currentToken JWT token hiện tại
     * @return AuthResponse với token mới
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader("Authorization") String currentToken) {
        log.info("Refresh token request");
        AuthResponse authResponse = userService.refreshToken(currentToken);
        
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Token refreshed successfully",
                authResponse
        );
        return ResponseEntity.ok(response);
    }
}
