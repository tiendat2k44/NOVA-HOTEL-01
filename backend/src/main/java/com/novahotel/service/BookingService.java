package com.novahotel.service;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.novahotel.dto.BookingRequest;
import com.novahotel.exception.BadRequestException;
import com.novahotel.exception.ResourceNotFoundException;
import com.novahotel.exception.UnauthorizedException;
import com.novahotel.model.Booking;
import com.novahotel.repository.BookingRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking createBooking(String userId, BookingRequest req) {
        if (req == null) {
            throw new BadRequestException("Thiếu thông tin đặt phòng");
        }
        if (req.getRoomId() == null || req.getRoomId().isBlank()) {
            throw new BadRequestException("Thiếu mã phòng");
        }
        if (req.getCheckInDate() == null || req.getCheckOutDate() == null) {
            throw new BadRequestException("Thiếu ngày nhận phòng hoặc trả phòng");
        }
        if (!req.getCheckOutDate().isAfter(req.getCheckInDate())) {
            throw new BadRequestException("Ngày trả phòng phải sau ngày nhận phòng");
        }

        Booking b = new Booking();
        b.setUserId(userId);
        b.setRoomId(req.getRoomId());
        b.setCheckIn(Date.from(req.getCheckInDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        b.setCheckOut(Date.from(req.getCheckOutDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        b.setStatus("CONFIRMED");
        b.setSpecialRequests(req.getNotes());
        b.setCreatedAt(new Date());
        return bookingRepository.save(b);
    }

    public Page<Booking> getUserBookings(String userId, int page, int size) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());
        return new PageImpl<>(list.subList(start, end), PageRequest.of(page, size), list.size());
    }

    public Booking getBookingById(String bookingId, String userId) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        Booking booking = opt.orElseThrow(() -> new ResourceNotFoundException("Booking không tìm thấy"));
        ensureOwnership(booking, userId);
        return booking;
    }

    public void cancelBooking(String bookingId, String userId) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            ensureOwnership(b, userId);
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
            return;
        }
        throw new ResourceNotFoundException("Booking không tìm thấy");
    }

    public Booking updateBooking(String bookingId, BookingRequest req, String userId) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            ensureOwnership(b, userId);
            if (req != null) {
                if (req.getCheckInDate() != null)
                    b.setCheckIn(Date.from(req.getCheckInDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                if (req.getCheckOutDate() != null)
                    b.setCheckOut(Date.from(req.getCheckOutDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                if (req.getNotes() != null)
                    b.setSpecialRequests(req.getNotes());
            }
            return bookingRepository.save(b);
        }
        throw new ResourceNotFoundException("Booking không tìm thấy");
    }

    public List<Booking> getBookingsByUserId(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Booking saveBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    private void ensureOwnership(Booking booking, String userId) {
        if (booking == null) {
            throw new ResourceNotFoundException("Booking không tìm thấy");
        }
        if (userId == null || !userId.equals(booking.getUserId())) {
            throw new UnauthorizedException("Bạn không có quyền truy cập booking này");
        }
    }
}