package com.novahotel.dto;

import java.time.LocalDate;

/**
 * DTO cho request đặt phòng
 * Chứa thông tin chi tiết để thực hiện booking
 * Truy vấn cốt lõi #2: Đặt phòng (booking)
 */
public class BookingRequest {
    /**
     * ID của phòng được đặt
     */
    private String roomId;

    /**
     * Ngày check-in (định dạng: YYYY-MM-DD)
     */
    private LocalDate checkInDate;

    /**
     * Ngày check-out (định dạng: YYYY-MM-DD)
     */
    private LocalDate checkOutDate;

    /**
     * Số lượng khách
     */
    private Integer numberOfGuests;

    /**
     * Ghi chú/yêu cầu đặc biệt từ khách hàng
     */
    private String notes;

    /**
     * Họ tên người liên hệ
     */
    private String contactName;

    /**
     * Email người liên hệ
     */
    private String contactEmail;

    /**
     * Số điện thoại người liên hệ
     */
    private String contactPhone;

    public BookingRequest() {}
    public BookingRequest(String roomId, LocalDate checkInDate, LocalDate checkOutDate, Integer numberOfGuests, String notes, String contactName, String contactEmail, String contactPhone) {
        this.roomId = roomId; this.checkInDate = checkInDate; this.checkOutDate = checkOutDate; this.numberOfGuests = numberOfGuests; this.notes = notes; this.contactName = contactName; this.contactEmail = contactEmail; this.contactPhone = contactPhone;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public LocalDate getCheckInDate() { return checkInDate; }
    public void setCheckInDate(LocalDate checkInDate) { this.checkInDate = checkInDate; }

    public LocalDate getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(LocalDate checkOutDate) { this.checkOutDate = checkOutDate; }

    public Integer getNumberOfGuests() { return numberOfGuests; }
    public void setNumberOfGuests(Integer numberOfGuests) { this.numberOfGuests = numberOfGuests; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
}
