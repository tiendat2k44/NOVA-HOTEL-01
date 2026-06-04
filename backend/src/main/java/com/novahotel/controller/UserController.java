package com.novahotel.controller;

import com.novahotel.dto.ApiResponse;
import com.novahotel.model.User;
import com.novahotel.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;

/**
 * User Controller
 * Xử lý các yêu cầu liên quan tới thông tin người dùng
 * 
 * Base URL: /api/users
 * Protected endpoints (cần JWT token)
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    /**
     * UserService để xử lý logic người dùng
     */
    @Autowired
    private UserService userService;

    /**
     * Lấy thông tin người dùng hiện tại
     * 
     * GET /api/users/profile
     * 
     * @param authentication Authentication object được set bởi JwtFilter
     * @return User object
     */
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<User>> getCurrentUserProfile(Authentication authentication) {
        log.info("Get profile for user: {}", authentication.getPrincipal());
        String userId = (String) authentication.getPrincipal();
        User user = userService.getUserById(userId);
        
        ApiResponse<User> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User profile retrieved successfully",
                user
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách toàn bộ người dùng cho màn hình admin (phân trang)
     *
     * GET /api/users?page=0&size=10
     *
     * @return Page<User>
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<User>>> getAllUsers(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("Get all users - page: {}, size: {}", page, size);
        org.springframework.data.domain.Page<User> users = userService.getAllUsers(page, size);

        ApiResponse<org.springframework.data.domain.Page<User>> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Users retrieved successfully",
                users
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin người dùng theo ID
     * 
     * GET /api/users/{userId}
     * 
     * @param userId ID của người dùng
     * @return User object
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable String userId) {
        log.info("Get user by ID: {}", userId);
        User user = userService.getUserById(userId);
        
        ApiResponse<User> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User retrieved successfully",
                user
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật thông tin người dùng
     * 
     * PUT /api/users/profile
     * 
     * @param userUpdate User object chứa thông tin cần cập nhật
     * @param authentication Authentication object
     * @return User object sau khi cập nhật
     */
    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUserProfile(
            @RequestBody User userUpdate,
            Authentication authentication) {
        log.info("Update profile for user: {}", authentication.getPrincipal());
        String userId = (String) authentication.getPrincipal();
        User updatedUser = userService.updateUser(userId, userUpdate);
        
        ApiResponse<User> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User profile updated successfully",
                updatedUser
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa tài khoản người dùng
     * 
     * DELETE /api/users/profile
     * 
     * @param authentication Authentication object
     * @return Success message
     */
    @DeleteMapping("/profile")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUserProfile(Authentication authentication) {
        log.info("Delete account for user: {}", authentication.getPrincipal());
        String userId = (String) authentication.getPrincipal();
        userService.deleteUser(userId);
        
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User account deleted successfully"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Đổi mật khẩu
     * 
     * PUT /api/users/change-password
     * Body JSON: { "currentPassword": "...", "newPassword": "..." }
     * 
     * @param body chứa currentPassword + newPassword
     * @param authentication Authentication object
     * @return Success message
     */
    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        log.info("Change password for user: {}", authentication.getPrincipal());
        String userId = (String) authentication.getPrincipal();
        String currentPassword = body != null ? body.get("currentPassword") : null;
        String newPassword = body != null ? body.getOrDefault("newPassword", body.get("newPass")) : null;
        if (currentPassword == null) {
            // fallback cho tương thích cũ
            currentPassword = body != null ? body.get("oldPassword") : null;
        }
        userService.changePassword(userId, currentPassword, newPassword);
        
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "Password changed successfully"
        );
        return ResponseEntity.ok(response);
    }

    // ---------------- Admin CRUD endpoints ----------------

    /**
     * Tạo người dùng mới (Admin)
     * POST /api/users/admin
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> createUserByAdmin(@RequestBody User user) {
        log.info("Admin creating user: {}", user.getEmail());
        User created = userService.createUserByAdmin(user);
        ApiResponse<User> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "User created successfully",
                created
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Cập nhật người dùng (Admin)
     * PUT /api/users/admin/{userId}
     */
    @PutMapping("/admin/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUserByAdmin(@PathVariable String userId, @RequestBody User userUpdate) {
        log.info("Admin updating user: {}", userId);
        User updated = userService.updateUserByAdmin(userId, userUpdate);
        ApiResponse<User> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User updated successfully",
                updated
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa người dùng (Admin)
     * DELETE /api/users/admin/{userId}
     */
    @DeleteMapping("/admin/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUserByAdmin(@PathVariable String userId) {
        log.info("Admin deleting user: {}", userId);
        userService.deleteUser(userId);
        ApiResponse<Void> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "User deleted successfully"
        );
        return ResponseEntity.ok(response);
    }
}
