package com.novahotel.security;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.novahotel.config.JwtConfig;
import com.novahotel.service.UserService;

/**
 * Test RBAC cho endpoint `/api/users`.
 *
 * Sử dụng @MockBean cho UserService để tránh gọi MongoDB thật và tập trung kiểm tra phân quyền.
 */
@SpringBootTest
public class UserControllerRbacTest {

    @Autowired
    private WebApplicationContext wac;

    private MockMvc mockMvc;

    @Autowired
    private JwtConfig jwtConfig;

    @MockitoBean
    private UserService userService;

    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).apply(springSecurity()).build();
        when(userService.getAllUsers(anyInt(), anyInt())).thenReturn(new PageImpl<>(Collections.emptyList()));
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
}
