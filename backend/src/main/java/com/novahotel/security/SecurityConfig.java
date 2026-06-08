package com.novahotel.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Cấu hình Spring Security
 * Định nghĩa:
 * - Endpoints không cần xác thực (public endpoints)
 * - Endpoints cần xác thực (protected endpoints)
 * - Session policy: STATELESS (vì sử dụng JWT)
 * - CSRF: Disable (vì là REST API)
 * - Password encoder: BCrypt
 * 
 * Spring Boot 3.3 sử dụng Spring Security 6.x
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * JWT Filter
     */
    @Autowired
    private JwtFilter jwtFilter;

        @Autowired
        private RestAuthenticationEntryPoint authenticationEntryPoint;

        @Autowired
        private RestAccessDeniedHandler accessDeniedHandler;

    /**
     * Cấu hình SecurityFilterChain
     * 
     * @param http HttpSecurity object
     * @return SecurityFilterChain
     * @throws Exception Exception
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Cấu hình CORS (phải đặt trước authorizeHttpRequests)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF (vì là REST API, không cần bảo vệ CSRF)
                .csrf(csrf -> csrf.disable())
                // Cấu hình authorization
                .authorizeHttpRequests(authz -> authz
                        // Always allow browser CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints (không cần xác thực)
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/google",
                                "/api/rooms",
                                "/api/rooms/**",
                                "/api/rooms/available",
                                "/api/rooms/search",
                                // Uploaded static images (public for room display to all users/guests)
                                "/uploads/**"
                        ).permitAll()
                        // Admin-only room management
                        .requestMatchers(HttpMethod.POST, "/api/rooms/admin", "/api/rooms/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/rooms/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/rooms/admin/**").hasRole("ADMIN")
                        // Admin image uploads for rooms
                        .requestMatchers(HttpMethod.POST, "/api/uploads/**").hasRole("ADMIN")
                        // User profile endpoints (USER/ADMIN/RECEPTIONIST)
                        .requestMatchers(HttpMethod.GET, "/api/users/profile").hasAnyRole("USER", "ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile").hasAnyRole("USER", "ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/profile").hasAnyRole("USER", "ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PUT, "/api/users/change-password").hasAnyRole("USER", "ADMIN", "RECEPTIONIST")
                        // Admin-only user management
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users/admin", "/api/users/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/admin/**").hasRole("ADMIN")
                        // Booking endpoints
                        .requestMatchers(HttpMethod.GET, "/api/bookings").hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers("/api/bookings/my-bookings").hasAnyRole("USER", "ADMIN", "RECEPTIONIST")
                        // Swagger/OpenAPI endpoints
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // Tất cả các endpoints khác cần xác thực
                        .anyRequest().authenticated()
                )
                // Session policy: STATELESS (không lưu session, dùng JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                // Thêm JwtFilter vào filter chain
                // Chạy trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cấu hình CORS cho Spring Security (quan trọng nhất cho preflight).
     * Cách này hoạt động tốt hơn WebConfig khi có Security.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Danh sách origin được phép (127.0.0.1 và localhost là khác nhau)
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000"
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Password encoder bean
     * Dùng BCrypt để encode password
     * 
     * @return PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
                return configuration.getAuthenticationManager();
        }
}
