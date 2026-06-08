package com.novahotel.service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import com.novahotel.config.JwtConfig;
import com.novahotel.dto.AuthResponse;
import com.novahotel.dto.LoginRequest;
import com.novahotel.dto.RegisterRequest;
import com.novahotel.exception.BadRequestException;
import com.novahotel.exception.ResourceNotFoundException;
import com.novahotel.exception.UnauthorizedException;
import com.novahotel.model.User;
import com.novahotel.repository.UserRepository;
import com.novahotel.security.RoleUtils;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtConfig jwtConfig;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private EmailService emailService;

    @Value("${google.client-id:}")
    private String googleClientId;

    public org.springframework.data.domain.Page<User> getAllUsers(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        java.util.List<User> all = userRepository.findAll();
        int start = Math.min(safePage * safeSize, all.size());
        int end = Math.min(start + safeSize, all.size());
        java.util.List<User> pageContent = all.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(pageContent, org.springframework.data.domain.PageRequest.of(safePage, safeSize), all.size());
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tìm thấy"));
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    public AuthResponse login(LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email không được để trống");
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu không được để trống");
        }
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (!userOpt.isPresent()) {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa");
        }

        user.setLastLogin(new Date());
        userRepository.save(user);
        String normalizedRole = RoleUtils.normalizeRole(user.getRole());
        String token = jwtConfig.generateToken(user.getId(), normalizedRole);

        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), normalizedRole, token);
    }
    
    public AuthResponse register(RegisterRequest registerRequest) {
        if (registerRequest.getEmail() == null || registerRequest.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email không được để trống");
        }
        if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu không được để trống");
        }
        if (registerRequest.getFullName() == null || registerRequest.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên không được để trống");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email này đã được sử dụng");
        }
        if (!registerRequest.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BadRequestException("Email không hợp lệ");
        }
        if (registerRequest.getPassword().length() < 6) {
            throw new BadRequestException("Mật khẩu phải ít nhất 6 ký tự");
        }

        User newUser = new User();
        newUser.setId(UUID.randomUUID().toString());
        newUser.setUserId(UUID.randomUUID().toString());
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setFullName(registerRequest.getFullName());
        newUser.setPhone(registerRequest.getPhone() != null ? registerRequest.getPhone() : "");
        newUser.setRole("customer");
        newUser.setCreatedAt(new Date());
        newUser.setLastLogin(new Date());
        newUser.setActive(true);

        User savedUser = userRepository.save(newUser);
        String normalizedRole = RoleUtils.normalizeRole(savedUser.getRole());
        String token = jwtConfig.generateToken(savedUser.getId(), normalizedRole);
        return new AuthResponse(savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(), normalizedRole, token);
    }
    
    public AuthResponse refreshToken(String currentToken) {
        if (currentToken == null || currentToken.trim().isEmpty()) {
            throw new UnauthorizedException("Token không được để trống");
        }
        if (currentToken.startsWith("Bearer ")) {
            currentToken = currentToken.substring(7);
        }
        if (!jwtConfig.isTokenValid(currentToken)) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
        }
        String userId = jwtConfig.getUserIdFromToken(currentToken);
        User user = getUserById(userId);
        String normalizedRole = RoleUtils.normalizeRole(user.getRole());
        String newToken = jwtConfig.generateToken(user.getId(), normalizedRole);
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), normalizedRole, newToken);
    }
    
    public User updateUser(String userId, User userUpdate) {
        User user = getUserById(userId);
        if (userUpdate.getFullName() != null && !userUpdate.getFullName().trim().isEmpty()) {
            user.setFullName(userUpdate.getFullName());
        }
        if (userUpdate.getPhone() != null && !userUpdate.getPhone().trim().isEmpty()) {
            user.setPhone(userUpdate.getPhone());
        }
        return userRepository.save(user);
    }
    
    public void deleteUser(String userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }
    
    public void changePassword(String userId, String oldPassword, String newPassword) {
        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu cũ không được để trống");
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu mới không được để trống");
        }
        if (newPassword.length() < 6) {
            throw new BadRequestException("Mật khẩu mới phải ít nhất 6 ký tự");
        }
        User user = getUserById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new UnauthorizedException("Mật khẩu cũ không đúng");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Tạo người dùng mới bởi admin (Admin CRUD)
     * Không gọi register request, admin có thể chỉ định role và kích hoạt tài khoản.
     */
    public User createUserByAdmin(User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email không được để trống");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new BadRequestException("Email này đã được sử dụng");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu không được để trống");
        }

        user.setId(UUID.randomUUID().toString());
        user.setUserId(UUID.randomUUID().toString());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(new Date());
        user.setLastLogin(new Date());
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("customer");
        }
        user.setActive(true);
        return userRepository.save(user);
    }

    /**
     * Cập nhật người dùng bởi admin (có thể thay role, active, password...)
     */
    public User updateUserByAdmin(String userId, User userUpdate) {
        User user = getUserById(userId);
        if (userUpdate.getFullName() != null && !userUpdate.getFullName().trim().isEmpty()) {
            user.setFullName(userUpdate.getFullName());
        }
        if (userUpdate.getPhone() != null && !userUpdate.getPhone().trim().isEmpty()) {
            user.setPhone(userUpdate.getPhone());
        }
        if (userUpdate.getRole() != null && !userUpdate.getRole().trim().isEmpty()) {
            user.setRole(userUpdate.getRole());
        }
        // Admin có thể bật/tắt tài khoản
        user.setActive(userUpdate.isActive());
        // Nếu cung cấp mật khẩu mới, mã hoá lại
        if (userUpdate.getPassword() != null && !userUpdate.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }
        return userRepository.save(user);
    }

    /**
     * Bắt đầu quy trình quên mật khẩu.
     * Tạo token reset, lưu vào user, và gửi email thật (nếu cấu hình mail).
     */
    public void initiatePasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email không được để trống");
        }
        Optional<User> opt = userRepository.findByEmail(email.trim().toLowerCase());
        if (opt.isEmpty()) {
            // Không tiết lộ user có tồn tại hay không (bảo mật)
            log.info("Forgot password requested for non-existing email: {}", email);
            return;
        }
        User user = opt.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 60 * 60 * 1000)); // 1 giờ
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        try {
            emailService.sendPasswordResetEmail(email, resetLink);
            log.info("[PasswordReset] Email reset sent to {}", email);
        } catch (Exception e) {
            log.error("[PasswordReset] Failed to send email to {}: {}", email, e.getMessage());
            // Fallback: vẫn log ra console để dev có thể test nếu mail fail
            System.out.println("\n=== [FALLBACK] PASSWORD RESET LINK ===");
            System.out.println("User: " + email);
            System.out.println("Reset link: " + resetLink);
            System.out.println("Token expires in 1 hour.");
            System.out.println("======================================\n");
        }
    }

    /**
     * Thực hiện reset mật khẩu với token.
     */
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Token không hợp lệ");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        Optional<User> opt = userRepository.findByResetToken(token);
        if (opt.isEmpty()) {
            throw new BadRequestException("Token không hợp lệ hoặc đã được sử dụng");
        }

        User user = opt.get();
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().before(new Date())) {
            // clear expired
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new BadRequestException("Token đã hết hạn. Vui lòng yêu cầu lại.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setLastLogin(new Date());
        userRepository.save(user);
    }

    /**
     * Xử lý đăng nhập bằng Google ID token.
     * Verify token, lấy email/name, tạo user mới nếu chưa có (role customer), trả JWT.
     */
    public AuthResponse googleLogin(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new BadRequestException("Thiếu Google credential");
        }

        // Bắt buộc phải có client ID thật từ Google Cloud Console.
        // Không hỗ trợ chế độ demo/fake nữa.
        if (googleClientId == null || googleClientId.isBlank() || googleClientId.startsWith("your-")) {
            log.error("Google login bị gọi nhưng google.client-id chưa được cấu hình đúng cách.");
            throw new BadRequestException(
                "Google login chưa được cấu hình. " +
                "Vui lòng thiết lập 'google.client-id' trong application.properties " +
                "bằng Client ID thật (dạng xxxxx.apps.googleusercontent.com) từ Google Cloud Console."
            );
        }

        // Luôn verify token thật với Google
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
                    .setAudience(java.util.Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                // Thử parse JWT để lấy thông tin debug (audience) mà không verify (chỉ cho log)
                String tokenAud = "unknown";
                try {
                    String[] parts = credential.split("\\.");
                    if (parts.length == 3) {
                        String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                        // crude extract "aud"
                        if (payloadJson.contains("\"aud\"")) {
                            int start = payloadJson.indexOf("\"aud\"") + 6;
                            int colon = payloadJson.indexOf(":", start);
                            int quote = payloadJson.indexOf("\"", colon + 1);
                            if (quote > 0) {
                                int end = payloadJson.indexOf("\"", quote + 1);
                                tokenAud = payloadJson.substring(quote + 1, end);
                            }
                        }
                    }
                } catch (Exception ignore) {}

                log.warn("Google ID token verify returned null. Expected audience (backend google.client-id): [{}], token audience (aud claim): [{}]. " +
                        "Common causes: 1) Client ID mismatch between VITE_GOOGLE_CLIENT_ID (frontend) and google.client-id (backend). " +
                        "2) http://localhost:5173 (and 127.0.0.1:5173) not added to 'Authorized JavaScript origins' in Google Cloud Console for this Client ID. " +
                        "3) Token expired or from wrong Google project.",
                        googleClientId, tokenAud);

                throw new UnauthorizedException("Google token không hợp lệ hoặc đã hết hạn (kiểm tra Client ID khớp giữa frontend/backend và Authorized origins trong Google Console)");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            if (email == null || email.isBlank()) {
                throw new UnauthorizedException("Không lấy được email từ Google token");
            }

            return loginOrRegisterWithGoogle(email, name != null ? name : email.split("@")[0]);
        } catch (UnauthorizedException ue) {
            // rethrow our own clean errors
            throw ue;
        } catch (Exception ex) {
            log.error("Google token verify failed", ex);
            throw new UnauthorizedException("Không thể xác thực Google: " + ex.getMessage());
        }
    }

    private AuthResponse loginOrRegisterWithGoogle(String email, String fullName) {
        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setUserId(UUID.randomUUID().toString());
            user.setEmail(email);
            user.setFullName(fullName);
            user.setPhone("");
            user.setRole("customer");
            user.setCreatedAt(new Date());
            user.setLastLogin(new Date());
            user.setActive(true);
            // No password for Google users (or set random)
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user = userRepository.save(user);
        }
        user.setLastLogin(new Date());
        userRepository.save(user);

        String normalizedRole = RoleUtils.normalizeRole(user.getRole());
        String token = jwtConfig.generateToken(user.getId(), normalizedRole);
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), normalizedRole, token);
    }
}