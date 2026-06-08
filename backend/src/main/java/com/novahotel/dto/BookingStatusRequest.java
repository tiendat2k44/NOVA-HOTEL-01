package com.novahotel.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO gọn cho cập nhật trạng thái booking (admin / khách báo đã thanh toán).
 * Tránh lỗi deserialize khi client chỉ gửi { "status": "confirmed" }.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingStatusRequest {
    private String status;

    public BookingStatusRequest() {}

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}