package com.novahotel.security;

import com.novahotel.config.JwtConfig;
import com.novahotel.model.User;
import com.novahotel.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * JWT Authentication Filter
 * Chạy một lần trên mỗi request để xác thực JWT token
 * 
 * Quy trình:
 * 1. Extract token từ Authorization header
 * 2. Validate token bằng JwtConfig
 * 3. Lấy userId từ token
 * 4. Tạo Authentication object và set vào SecurityContext
 * 5. Nếu token không hợp lệ, request sẽ tiếp tục nhưng không có authentication
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    /**
     * JwtConfig để validate token
     */
    @Autowired
    private JwtConfig jwtConfig;

    /**
     * JwtUtil để extract token từ header
     */
    @Autowired
    private JwtUtil jwtUtil;

    /**
     * UserRepository để load role hiện tại từ DB (tránh staleness role trong token)
     */
    @Autowired
    private UserRepository userRepository;

    /**
     * Thực hiện filter logic
     * 
     * @param request HttpServletRequest
     * @param response HttpServletResponse
     * @param filterChain FilterChain
     * @throws ServletException Servlet exception
     * @throws IOException IO exception
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Preflight CORS — không xử lý JWT, để CorsFilter trả headers đúng.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT processing entirely for public authentication endpoints.
        // This prevents stale tokens from triggering AuthenticationEntryPoint on /auth/google, login, register, etc.
        String requestPath = request.getRequestURI();
        if (requestPath != null && (
                requestPath.endsWith("/auth/login") ||
                requestPath.endsWith("/auth/register") ||
                requestPath.endsWith("/auth/google") ||
                requestPath.endsWith("/auth/forgot-password") ||
                requestPath.endsWith("/auth/reset-password")
        )) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Lấy Authorization header
            String authorizationHeader = request.getHeader("Authorization");

            // Nếu header hợp lệ
            if (authorizationHeader != null && jwtUtil.isValidBearerFormat(authorizationHeader)) {
                // Extract token
                String token = jwtUtil.extractTokenFromHeader(authorizationHeader);

                // Validate token
                if (token != null && jwtConfig.isTokenValid(token)) {
                    // Lấy userId từ token (đã verify chữ ký + exp)
                    String userId = jwtConfig.getUserIdFromToken(token);

                    // Load user từ DB để lấy role *hiện tại* (fix 403 khi role thay đổi sau login,
                    // e.g. admin thăng quyền user -> profile setUser cập nhật local role, nhưng JWT cũ vẫn chứa role snapshot)
                    // Fallback về role trong token nếu user không có trong DB (hỗ trợ test, user đã xóa nhưng token còn hạn)
                    Optional<User> userOpt = userRepository.findById(userId);
                    String effectiveRole;
                    if (userOpt.isPresent() && userOpt.get().isActive()) {
                        effectiveRole = userOpt.get().getRole();
                    } else {
                        effectiveRole = jwtConfig.getRoleFromToken(token);
                    }
                    if (effectiveRole != null && !effectiveRole.trim().isEmpty()) {
                        String normalized = RoleUtils.normalizeRole(effectiveRole);
                        List<GrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority(normalized));

                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            authorities
                        );

                        // Set Authentication vào SecurityContext
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception e) {
            // Log error nhưng không throw exception
            // Cho phép request tiếp tục mà không có authentication
            logger.error("Cannot set user authentication", e);
        }

        // Tiếp tục filter chain
        filterChain.doFilter(request, response);
    }
}
