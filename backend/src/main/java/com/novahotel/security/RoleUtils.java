package com.novahotel.security;

public final class RoleUtils {
    private RoleUtils() {}

    public static String normalizeRole(String role) {
        String value = role == null ? "" : role.trim().toLowerCase();
        if (value.startsWith("role_")) {
            value = value.substring(5);
        }
        if (value.contains("admin")) {
            return "ROLE_ADMIN";
        }
        if (value.contains("receptionist") || value.contains("lễ tân") || value.contains("le tan")) {
            return "ROLE_RECEPTIONIST";
        }
        return "ROLE_USER";
    }
}
