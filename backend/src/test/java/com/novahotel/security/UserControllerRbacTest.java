package com.novahotel.security;

import com.novahotel.config.JwtConfig;
import com.novahotel.model.User;
import com.novahotel.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.web.context.WebApplicationContext;

import java.util.Collections;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test RBAC cho endpoint `/api/users`.
 *
 * Tránh gọi MongoDB bằng cách cung cấp một bean `UserService` thay thế trả về dữ
 * liệu rỗng qua `@TestConfiguration`.
 */
@SpringBootTest
public class UserControllerRbacTest {

    @Autowired
    private WebApplicationContext wac;

    private MockMvc mockMvc;

    @Autowired
    private JwtConfig jwtConfig;

    @Autowired
    private UserService userService;

    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).apply(springSecurity()).build();
    }

    @Test
    void usersEndpoint_forbidden_for_user_role() throws Exception {
        String token = jwtConfig.generateToken("user-id-1", "USER");

        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void usersEndpoint_allowed_for_admin_role() throws Exception {
        String token = jwtConfig.generateToken("admin-id-1", "ADMIN");

        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public UserService userService() {
            return new UserService() {
                @Override
                public List<User> getAllUsers() {
                    return Collections.emptyList();
                }

                // Các phương thức khác của UserService nếu cần có thể trả về giá trị mặc định
            };
        }
    }
}
