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
import com.novahotel.model.Room;
import com.novahotel.repository.BookingRepository;
import com.novahotel.repository.RoomRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    public Page<Booking> getAllBookings(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        List<Booking> all = bookingRepository.findAll();
        all.forEach(this::enrichIfNeeded);
        int start = Math.min(safePage * safeSize, all.size());
        int end = Math.min(start + safeSize, all.size());
        List<Booking> pageContent = all.subList(start, end);
        return new PageImpl<>(pageContent, PageRequest.of(safePage, safeSize), all.size());
    }

    private void enrichIfNeeded(Booking b) {
        if (b == null) return;
        // Fallback code
        if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
            b.setBookingCode( b.getBookingId() != null ? b.getBookingId() : (b.getId() != null ? "BK-" + b.getId().substring(0, 6) : "BK-UNK") );
        }
        if (b.getBookingId() == null || b.getBookingId().isBlank()) {
            b.setBookingId(b.getBookingCode());
        }
        // Enrich roomName if missing (for imported sample data)
        if ((b.getRoomName() == null || b.getRoomName().isBlank()) && b.getRoomId() != null) {
            try {
                Room r = roomRepository.findById(b.getRoomId())
                        .or(() -> roomRepository.findByRoomId(b.getRoomId()))
                        .orElse(null);
                if (r != null) {
                    b.setRoomName(r.getName());
                    if (b.getRoomNumber() == null) b.setRoomNumber(r.getRoomNumber() != null ? r.getRoomNumber() : r.getRoomId());
                }
            } catch (Exception ignored) {}
        }
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

        // Resolve room by id or roomId to use canonical business key + get price/name
        Room room = roomRepository.findById(req.getRoomId())
                .or(() -> roomRepository.findByRoomId(req.getRoomId()))
                .orElseThrow(() -> new ResourceNotFoundException("Phòng không tìm thấy"));

        String canonicalRoomId = room.getRoomId() != null ? room.getRoomId() : room.getId();
        double basePrice = (room.getPrice() != null) ? room.getPrice().getBasePrice() : 0.0;
        long nights = java.time.temporal.ChronoUnit.DAYS.between(req.getCheckInDate(), req.getCheckOutDate());
        double total = basePrice * Math.max(nights, 1);

        Booking b = new Booking();
        b.setUserId(userId);
        b.setRoomId(canonicalRoomId);
        b.setCheckIn(Date.from(req.getCheckInDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        b.setCheckOut(Date.from(req.getCheckOutDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        b.setStatus("pending");  // Bắt đầu ở trạng thái chờ xác nhận (admin sẽ confirm)
        b.setSpecialRequests(req.getNotes());
        b.setCreatedAt(new Date());
        b.setTotalPrice(total);

        // Denormalize for UI display (fix missing roomName/guestName in lists)
        b.setBookingId(generateBookingCode());
        b.setBookingCode(b.getBookingId());
        b.setRoomName(room.getName());
        b.setRoomNumber(room.getRoomNumber() != null ? room.getRoomNumber() : room.getRoomId());
        if (req.getContactName() != null && !req.getContactName().isBlank()) {
            b.setGuestName(req.getContactName());
        } else {
            b.setGuestName("Khách hàng");
        }
        // Lưu thêm contact vào specialRequests nếu cần (giữ đơn giản)
        if (req.getContactPhone() != null || req.getContactEmail() != null) {
            String extra = (req.getContactEmail() != null ? "Email: " + req.getContactEmail() + " " : "") +
                           (req.getContactPhone() != null ? "Phone: " + req.getContactPhone() : "");
            if (!extra.isBlank()) {
                b.setSpecialRequests( (b.getSpecialRequests() != null ? b.getSpecialRequests() + " | " : "") + extra );
            }
        }

        Booking saved = bookingRepository.save(b);
        enrichIfNeeded(saved);
        return saved;
    }

    private String generateBookingCode() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String ts = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        return "BK" + ts + "-" + (int)(Math.random() * 900 + 100);
    }

    public Page<Booking> getUserBookings(String userId, int page, int size) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        list.forEach(this::enrichIfNeeded);
        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());
        return new PageImpl<>(list.subList(start, end), PageRequest.of(page, size), list.size());
    }

    public Booking getBookingById(String bookingId, String userId) {
        return getBookingById(bookingId, userId, false);
    }

    public Booking getBookingById(String bookingId, String userId, boolean isAdmin) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        Booking booking = opt.orElseThrow(() -> new ResourceNotFoundException("Booking không tìm thấy"));
        ensureCanAccess(booking, userId, isAdmin);
        enrichIfNeeded(booking);
        return booking;
    }

    public void cancelBooking(String bookingId, String userId) {
        cancelBooking(bookingId, userId, false);
    }

    public void cancelBooking(String bookingId, String userId, boolean isAdmin) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            ensureCanAccess(b, userId, isAdmin);
            b.setStatus("cancelled");
            bookingRepository.save(b);
            return;
        }
        throw new ResourceNotFoundException("Booking không tìm thấy");
    }

    public Booking updateBooking(String bookingId, BookingRequest req, String userId) {
        return updateBooking(bookingId, req, userId, false);
    }

    public Booking updateBooking(String bookingId, BookingRequest req, String userId, boolean isAdmin) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            ensureCanAccess(b, userId, isAdmin);
            if (req != null) {
                if (req.getCheckInDate() != null)
                    b.setCheckIn(Date.from(req.getCheckInDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                if (req.getCheckOutDate() != null)
                    b.setCheckOut(Date.from(req.getCheckOutDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                if (req.getNotes() != null)
                    b.setSpecialRequests(req.getNotes());
                // Hỗ trợ cập nhật status (dành cho admin)
                if (req.getStatus() != null && !req.getStatus().isBlank()) {
                    b.setStatus(normalizeStatus(req.getStatus()));
                }
            }
            Booking saved = bookingRepository.save(b);
            enrichIfNeeded(saved);
            return saved;
        }
        throw new ResourceNotFoundException("Booking không tìm thấy");
    }

    private String normalizeStatus(String s) {
        if (s == null) return "pending";
        String v = s.toLowerCase().trim();
        if (v.contains("cancel")) return "cancelled";
        if (v.contains("confirm")) return "confirmed";
        if (v.contains("complete") || v.contains("check")) return "completed";
        if (v.contains("pend")) return "pending";
        return v;
    }

    public List<Booking> getBookingsByUserId(String userId) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        list.forEach(this::enrichIfNeeded);
        return list;
    }

    public Booking saveBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    private void ensureOwnership(Booking booking, String userId) {
        ensureCanAccess(booking, userId, false);
    }

    private void ensureCanAccess(Booking booking, String userId, boolean isAdmin) {
        if (booking == null) {
            throw new ResourceNotFoundException("Booking không tìm thấy");
        }
        if (isAdmin) {
            return; // Admin được phép thao tác mọi booking
        }
        if (userId == null || !userId.equals(booking.getUserId())) {
            throw new UnauthorizedException("Bạn không có quyền truy cập booking này");
        }
    }
}