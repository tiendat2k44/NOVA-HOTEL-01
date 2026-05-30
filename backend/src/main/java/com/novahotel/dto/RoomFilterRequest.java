package com.novahotel.dto;

import java.time.LocalDate;

/**
 * DTO cho request lọc phòng trống
 * Truy vấn cốt lõi #1: Tìm phòng trống theo khoảng thời gian
 */
public class RoomFilterRequest {
    /**
     * Ngày check-in (định dạng: YYYY-MM-DD)
     */
    private LocalDate checkInDate;

    /**
     * Ngày check-out (định dạng: YYYY-MM-DD)
     */
    private LocalDate checkOutDate;

    /**
     * Số lượng khách (không bắt buộc)
     */
    private Integer numberOfGuests;

    /**
     * Loại phòng để lọc (không bắt buộc)
     * Ví dụ: "Single Room", "Double Room", "Suite", v.v.
     */
    private String roomType;

    /**
     * Giá tối đa cho phòng (không bắt buộc)
     */
    private Double maxPrice;

    /**
     * Giá tối thiểu cho phòng (không bắt buộc)
     */
    private Double minPrice;

    /**
     * Số trang cho phân trang (mặc định: 0)
     */
    private Integer page;

    /**
     * Kích thước trang (mặc định: 10)
     */
    private Integer size;

    public RoomFilterRequest() {}
    public RoomFilterRequest(LocalDate checkInDate, LocalDate checkOutDate, Integer numberOfGuests, String roomType, Double maxPrice, Double minPrice, Integer page, Integer size) {
        this.checkInDate = checkInDate; this.checkOutDate = checkOutDate; this.numberOfGuests = numberOfGuests; this.roomType = roomType; this.maxPrice = maxPrice; this.minPrice = minPrice; this.page = page; this.size = size;
    }

    public LocalDate getCheckInDate() { return checkInDate; }
    public void setCheckInDate(LocalDate checkInDate) { this.checkInDate = checkInDate; }

    public LocalDate getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(LocalDate checkOutDate) { this.checkOutDate = checkOutDate; }

    public Integer getNumberOfGuests() { return numberOfGuests; }
    public void setNumberOfGuests(Integer numberOfGuests) { this.numberOfGuests = numberOfGuests; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }

    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
}
