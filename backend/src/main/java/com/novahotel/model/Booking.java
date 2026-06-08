package com.novahotel.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;

    private String bookingId;
    private String userId;
    private String roomId;
    private Date checkIn;
    private Date checkOut;
    private String status;
    private Double totalPrice;
    private String specialRequests;
    private Date createdAt;

    // Denormalized fields for display (populated on create / enrichment)
    private String bookingCode;
    private String guestName;
    private String roomName;
    private String roomNumber;

    // Contact info (lưu riêng để gửi email, hiển thị, thanh toán)
    private String contactEmail;
    private String contactPhone;

    public Booking() {}

    public Booking(String id, String bookingId, String userId, String roomId, Date checkIn, Date checkOut, String status, Double totalPrice, String specialRequests, Date createdAt,
                   String bookingCode, String guestName, String roomName, String roomNumber,
                   String contactEmail, String contactPhone) {
        this.id = id;
        this.bookingId = bookingId;
        this.userId = userId;
        this.roomId = roomId;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.status = status;
        this.totalPrice = totalPrice;
        this.specialRequests = specialRequests;
        this.createdAt = createdAt;
        this.bookingCode = bookingCode;
        this.guestName = guestName;
        this.roomName = roomName;
        this.roomNumber = roomNumber;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Date getCheckIn() { return checkIn; }
    public void setCheckIn(Date checkIn) { this.checkIn = checkIn; }

    public Date getCheckOut() { return checkOut; }
    public void setCheckOut(Date checkOut) { this.checkOut = checkOut; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getBookingCode() {
        if (bookingCode != null && !bookingCode.isBlank()) return bookingCode;
        if (bookingId != null && !bookingId.isBlank()) return bookingId;
        if (id != null && !id.isBlank()) return "BK-" + id.substring(0, Math.min(8, id.length()));
        return "BK-UNK";
    }
    public void setBookingCode(String bookingCode) { this.bookingCode = bookingCode; }

    /**
     * Convenience for frontend code that expects "code" (legacy).
     * Returns bookingCode if present, else bookingId.
     * Never returns null/blank for UI tables.
     */
    public String getCode() {
        return getBookingCode();  // reuse the logic
    }

    public String getGuestName() { 
        return (guestName != null && !guestName.isBlank()) ? guestName : "Khách hàng"; 
    }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getRoomName() { 
        return (roomName != null && !roomName.isBlank()) ? roomName : "Phòng không xác định"; 
    }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
}