package com.novahotel.service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import com.novahotel.model.User;
import com.novahotel.repository.BookingRepository;
import com.novahotel.repository.RoomRepository;
import com.novahotel.repository.UserRepository;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomService roomService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private VietQRService vietQRService;

    @Value("${hotel.qr-surcharge:0}")
    private double qrSurcharge;

    public Page<Booking> getAllBookings(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        List<Booking> all = bookingRepository.findAll();

        log.info("[BookingService] getAllBookings - loaded {} bookings, starting enrichment for Mã/Khách/Phòng", all.size());

        // Enrich toàn bộ danh sách trước (data nhỏ, đảm bảo nhất quán)
        // Mục tiêu: luôn có Mã (bookingCode/code), Khách (guestName), Phòng (roomName)
        all.forEach(this::enrichIfNeeded);

        // Double force cho 3 cột quan trọng (Mã / Khách / Phòng) — an toàn cho UI
        int enrichedCount = 0;
        for (Booking b : all) {
            boolean changed = false;
            // Mã
            if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
                String fallback = (b.getBookingId() != null && !b.getBookingId().isBlank()) ? b.getBookingId()
                        : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
                b.setBookingCode(fallback);
                changed = true;
            }
            // Tên người đặt (Khách)
            if (b.getGuestName() == null || b.getGuestName().isBlank()) {
                b.setGuestName("Khách hàng");
                changed = true;
            }
            // Tên phòng
            if (b.getRoomName() == null || b.getRoomName().isBlank()) {
                b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
                changed = true;
            }
            if (b.getRoomNumber() == null || b.getRoomNumber().isBlank()) {
                b.setRoomNumber(b.getRoomId() != null ? b.getRoomId() : "");
                changed = true;
            }
            if (changed) enrichedCount++;
        }

        log.info("[BookingService] getAllBookings - enrichment complete, {} items had fields populated (fallbacks or lookup)", enrichedCount);

        // Sau đó mới slice cho phân trang
        int start = Math.min(safePage * safeSize, all.size());
        int end = Math.min(start + safeSize, all.size());
        List<Booking> pageContent = all.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(safePage, safeSize), all.size());
    }

    /**
     * Enrich booking with denormalized display fields (roomName, guestName, bookingCode).
     * This is critical because the list APIs return Booking directly to frontend,
     * and frontend expects roomName, guestName, bookingCode/code for tables (AdminBookings, Dashboard...).
     * We do runtime lookup for old/sample data that only stored IDs.
     */
    private void enrichIfNeeded(Booking b) {
        if (b == null) return;

        Room room = null;

        boolean hasRoomName = hasText(b.getRoomName()) && !isUnknownRoomName(b.getRoomName());
        boolean hasRoomNumber = hasText(b.getRoomNumber());
        boolean hasGuestName = hasText(b.getGuestName()) && !isDefaultGuestName(b.getGuestName());
        boolean hasContactEmail = hasText(b.getContactEmail());
        boolean hasContactPhone = hasText(b.getContactPhone());

        // === bookingCode / bookingId fallback (for display as "Mã") ===
        if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
            String code = b.getBookingId();
            if (code == null || code.isBlank()) {
                code = (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
            }
            b.setBookingCode(code);
        }
        if (b.getBookingId() == null || b.getBookingId().isBlank()) {
            b.setBookingId(b.getBookingCode());
        }

        // === Room name / number enrichment (tên phòng được đặt) ===
        // Luôn cố gắng điền roomName + roomNumber nếu thiếu (hỗ trợ data cũ / import)
        if (b.getRoomId() != null) {
            boolean needRoomName = !hasRoomName;
            boolean needRoomNumber = !hasRoomNumber;

            if (needRoomName || needRoomNumber) {
                try {
                    room = roomRepository.findById(b.getRoomId())
                            .or(() -> roomRepository.findByRoomId(b.getRoomId()))
                            .orElse(null);
                    if (room != null) {
                        if (needRoomName) {
                            b.setRoomName(hasText(room.getName()) ? room.getName() : "Phòng " + b.getRoomId());
                        }
                        if (needRoomNumber) {
                            String rn = room.getRoomNumber();
                            b.setRoomNumber(hasText(rn) ? rn : (hasText(room.getRoomId()) ? room.getRoomId() : b.getRoomId()));
                        }
                    } else {
                        // Fallback rõ ràng
                        if (needRoomName) {
                            b.setRoomName("Phòng " + b.getRoomId());
                        }
                        if (needRoomNumber) {
                            b.setRoomNumber(b.getRoomId());
                        }
                    }
                } catch (Exception ignored) {
                    // Đảm bảo không bao giờ null
                    if (needRoomName && !hasText(b.getRoomName())) {
                        b.setRoomName("Phòng " + b.getRoomId());
                    }
                    if (needRoomNumber && !hasText(b.getRoomNumber())) {
                        b.setRoomNumber(b.getRoomId());
                    }
                }
            }
        } else {
            if (!hasRoomName) {
                b.setRoomName("Phòng không xác định");
            }
        }

        // === Guest name enrichment (tên người đặt) ===
        // Ưu tiên guestName đã lưu (từ lúc tạo), nếu thiếu thì lookup từ User
        if (!hasGuestName || !hasContactEmail || !hasContactPhone) {
            if (b.getUserId() != null) {
                try {
                        User user = userRepository.findById(b.getUserId())
                            .or(() -> userRepository.findByUserId(b.getUserId()))
                            .orElse(null);
                    if (user != null) {
                        if (!hasGuestName) {
                            String name = hasText(user.getFullName()) ? user.getFullName() : user.getEmail();
                            b.setGuestName(hasText(name) ? name : "Khách hàng");
                        }
                        if (!hasContactEmail && hasText(user.getEmail())) {
                            b.setContactEmail(user.getEmail());
                        }
                        if (!hasContactPhone && hasText(user.getPhone())) {
                            b.setContactPhone(user.getPhone());
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        // Đảm bảo cuối cùng luôn có guestName (tên người đặt)
        if (!hasText(b.getGuestName())) {
            b.setGuestName("Khách hàng");
        }

        applyDisplayDefaults(b);

        // Tính lại tổng tiền nếu booking cũ đang lưu 0đ hoặc âm
        double currentTotal = b.getTotalPrice() != null ? b.getTotalPrice() : 0.0;
        if (currentTotal <= 0 && room != null && room.getPrice() != null && room.getPrice().getBasePrice() != null) {
            double basePrice = room.getPrice().getBasePrice();
            long nights = 1;
            if (b.getCheckIn() != null && b.getCheckOut() != null) {
                long diff = java.time.temporal.ChronoUnit.DAYS.between(
                        b.getCheckIn().toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                        b.getCheckOut().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
                nights = Math.max(diff, 1);
            }
            if (basePrice > 0) {
                b.setTotalPrice(basePrice * nights);
            }
        }

        // Hỗ trợ data cũ: extract contactEmail/phone từ specialRequests nếu chưa có
        if ((b.getContactEmail() == null || b.getContactEmail().isBlank()) && b.getSpecialRequests() != null) {
            String sr = b.getSpecialRequests();
            if (sr.contains("Email:")) {
                try {
                    int start = sr.indexOf("Email:") + 6;
                    int end = sr.indexOf("Phone:", start);
                    if (end < 0) end = sr.length();
                    String em = sr.substring(start, end).trim().split("\\s+")[0];
                    if (em.contains("@")) b.setContactEmail(em);
                } catch (Exception ignored) {}
            }
            if ((b.getContactPhone() == null || b.getContactPhone().isBlank()) && sr.contains("Phone:")) {
                try {
                    int start = sr.indexOf("Phone:") + 6;
                    String ph = sr.substring(start).trim().split("\\s+")[0];
                    b.setContactPhone(ph);
                } catch (Exception ignored) {}
            }
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isDefaultGuestName(String value) {
        if (!hasText(value)) return true;
        String normalized = value.trim().toLowerCase();
        return "khách hàng".equals(normalized) || "khach hang".equals(normalized);
    }

    private boolean isUnknownRoomName(String value) {
        if (!hasText(value)) return true;
        String normalized = value.trim().toLowerCase();
        return normalized.contains("phòng không xác định") || normalized.contains("phong khong xac dinh");
    }

    /**
     * Đảm bảo các field hiển thị (mã, khách, phòng, liên hệ) luôn có giá trị trước khi trả về frontend.
     */
    private void applyDisplayDefaults(Booking b) {
        if (b == null) return;

        if (!hasText(b.getBookingCode())) {
            String code = hasText(b.getBookingId()) ? b.getBookingId()
                    : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
            b.setBookingCode(code);
        }
        if (!hasText(b.getBookingId())) {
            b.setBookingId(b.getBookingCode());
        }
        if (!hasText(b.getGuestName())) {
            b.setGuestName("Khách hàng");
        }
        if (!hasText(b.getRoomName())) {
            b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
        }
        if (!hasText(b.getRoomNumber()) && hasText(b.getRoomId())) {
            b.setRoomNumber(b.getRoomId());
        }
        if (b.getTotalPrice() == null) {
            b.setTotalPrice(0.0);
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

        // === NEW RULES ===
        // 1. User chỉ được đặt 1 phòng tại 1 thời điểm (chỉ 1 booking active: pending/paid/confirmed)
        List<Booking> userBookings = bookingRepository.findByUserId(userId);
        boolean hasActiveBooking = userBookings.stream()
                .anyMatch(b -> {
                    String st = b.getStatus();
                    return st == null || (!"CANCELLED".equalsIgnoreCase(st) && !"COMPLETED".equalsIgnoreCase(st));
                });
        if (hasActiveBooking) {
            throw new BadRequestException("Bạn chỉ có thể đặt phòng tại một thời điểm. Vui lòng hoàn tất hoặc hủy đơn đặt phòng hiện tại trước khi đặt phòng mới.");
        }

        // 2. Phòng chỉ được đặt nếu chưa có ai đặt (không có booking active overlapping, bao gồm pending/confirmed)
        //    Pending chờ xác nhận coi như đã "đặt", không cho người khác đặt nữa.
        if (!roomService.isRoomAvailable(room, req.getCheckInDate(), req.getCheckOutDate())) {
            throw new BadRequestException("Phòng này đã có người đặt (hoặc đang chờ xác nhận) trong khoảng thời gian bạn chọn. Vui lòng chọn phòng khác hoặc thời gian khác.");
        }
        double basePrice = (room.getPrice() != null && room.getPrice().getBasePrice() != null)
                ? room.getPrice().getBasePrice() : 0.0;
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

        // Lưu contact riêng (quan trọng cho email + QR payment)
        b.setContactEmail(req.getContactEmail());
        b.setContactPhone(req.getContactPhone());

        // specialRequests chỉ giữ notes thật (không còn append contact)
        // (nếu muốn giữ tương thích ngược với data cũ thì enrich sẽ xử lý)

        Booking saved = bookingRepository.save(b);
        enrichIfNeeded(saved);

        // === GỬI EMAIL XÁC NHẬN ===
        try {
            String contactEmail = (saved.getContactEmail() != null && !saved.getContactEmail().isBlank())
                    ? saved.getContactEmail()
                    : null; // có thể enrich từ user nếu cần, nhưng hiện tại dùng contact

            if (contactEmail != null) {
                DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                String checkInStr = req.getCheckInDate() != null ? req.getCheckInDate().format(df) : "";
                String checkOutStr = req.getCheckOutDate() != null ? req.getCheckOutDate().format(df) : "";

                double savedTotal = saved.getTotalPrice() != null ? saved.getTotalPrice() : 0.0;
                emailService.sendBookingConfirmation(
                        contactEmail,
                        saved.getGuestName(),
                        saved.getBookingCode(),
                        saved.getRoomName(),
                        checkInStr,
                        checkOutStr,
                        savedTotal,
                        saved.getStatus()
                );

                // Thông báo admin (nếu cấu hình)
                emailService.sendAdminBookingNotification(
                        saved.getBookingCode(),
                        saved.getGuestName(),
                        contactEmail,
                        saved.getRoomName(),
                        savedTotal
                );
            } else {
                log.warn("Booking {} không có contactEmail, bỏ qua gửi email xác nhận.", saved.getBookingCode());
            }
        } catch (Exception ex) {
            log.error("Gửi email booking thất bại (không ảnh hưởng tạo đơn): {}", ex.getMessage());
        }

        return saved;
    }

    private String generateBookingCode() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String ts = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        return "BK" + ts + "-" + (int)(Math.random() * 900 + 100);
    }

    public Page<Booking> getUserBookings(String userId, int page, int size) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Enrich + force 3 cột Mã/Khách/Phòng cho danh sách của khách
        list.forEach(this::enrichIfNeeded);

        for (Booking b : list) {
            if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
                String fb = (b.getBookingId() != null && !b.getBookingId().isBlank()) ? b.getBookingId()
                        : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
                b.setBookingCode(fb);
            }
            if (b.getGuestName() == null || b.getGuestName().isBlank()) {
                b.setGuestName("Khách hàng");
            }
            if (b.getRoomName() == null || b.getRoomName().isBlank()) {
                b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
            }
            if (b.getRoomNumber() == null || b.getRoomNumber().isBlank() && b.getRoomId() != null) {
                b.setRoomNumber(b.getRoomId());
            }
        }

        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());
        List<Booking> pageContent = list.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), list.size());
    }

    public Booking getBookingById(String bookingId, String userId) {
        return getBookingById(bookingId, userId, false);
    }

    public Booking getBookingById(String bookingId, String userId, boolean isStaff) {
        Booking booking = resolveBooking(bookingId);
        ensureCanAccess(booking, userId, isStaff);
        enrichIfNeeded(booking);
        return booking;
    }

    /**
     * Linh hoạt resolve booking theo nhiều kiểu id mà client hay gửi:
     * - mongo _id (ưu tiên)
     * - bookingId / bookingCode (mã BK...)
     * Giúp tránh lỗi "Booking không tìm thấy" khi UI truyền mã thay vì _id, hoặc data legacy.
     */
    private Booking resolveBooking(String key) {
        if (key == null || key.isBlank()) {
            throw new ResourceNotFoundException("Booking không tìm thấy");
        }
        // 1. Thử trực tiếp theo _id (mongo id)
        Optional<Booking> opt = bookingRepository.findById(key);
        if (opt.isPresent()) return opt.get();

        // 2. Thử theo business bookingId
        opt = bookingRepository.findByBookingId(key);
        if (opt.isPresent()) return opt.get();

        // 3. Thử theo bookingCode
        opt = bookingRepository.findByBookingCode(key);
        if (opt.isPresent()) return opt.get();

        throw new ResourceNotFoundException("Booking không tìm thấy");
    }

    public void cancelBooking(String bookingId, String userId) {
        cancelBooking(bookingId, userId, false);
    }

    public void cancelBooking(String bookingId, String userId, boolean isStaff) {
        Booking b = resolveBooking(bookingId);
        ensureCanAccess(b, userId, isStaff);
        b.setStatus("cancelled");
        bookingRepository.save(b);
    }

    public Booking updateBooking(String bookingId, BookingRequest req, String userId) {
        return updateBooking(bookingId, req, userId, false);
    }

    public Booking updateBookingStatus(String bookingId, String status, String userId, boolean isStaff) {
        BookingRequest req = new BookingRequest();
        req.setStatus(status);
        return updateBooking(bookingId, req, userId, isStaff);
    }

    public Booking updateBooking(String bookingId, BookingRequest req, String userId, boolean isStaff) {
        Booking b = resolveBooking(bookingId);
        ensureCanAccess(b, userId, isStaff);
        if (req != null) {
            if (req.getCheckInDate() != null)
                b.setCheckIn(Date.from(req.getCheckInDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
            if (req.getCheckOutDate() != null)
                b.setCheckOut(Date.from(req.getCheckOutDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
            if (req.getNotes() != null)
                b.setSpecialRequests(req.getNotes());
            // Hỗ trợ cập nhật status (dành cho admin)
            if (req.getStatus() != null && !req.getStatus().isBlank()) {
                String oldStatus = b.getStatus();
                String newStatus = normalizeStatus(req.getStatus());
                b.setStatus(newStatus);

                // Gửi email thông báo thay đổi trạng thái (nếu có email)
                if (!newStatus.equalsIgnoreCase(oldStatus)) {
                    try {
                        String emailTo = (b.getContactEmail() != null && !b.getContactEmail().isBlank())
                                ? b.getContactEmail() : null;
                        if (emailTo != null) {
                            String note = "Vui lòng kiểm tra chi tiết trong My Bookings. ";
                            if ("confirmed".equalsIgnoreCase(newStatus)) {
                                note += "Bạn có thể thanh toán qua QR VietQR ngay bây giờ.";
                            } else if ("completed".equalsIgnoreCase(newStatus)) {
                                note += "Cảm ơn quý khách đã sử dụng dịch vụ.";
                            } else if ("cancelled".equalsIgnoreCase(newStatus)) {
                                note += "Nếu cần hỗ trợ hoàn tiền, vui lòng liên hệ chúng tôi.";
                            } else if ("paid".equalsIgnoreCase(newStatus)) {
                                note += "Cảm ơn bạn đã thanh toán! Admin sẽ kiểm tra và xác nhận sớm.";
                            }
                            emailService.sendBookingStatusUpdate(emailTo, b.getGuestName(),
                                    b.getBookingCode(), b.getRoomName(), newStatus, note);
                        }

                        // Nếu khách báo "đã thanh toán" → gửi thông báo cho admin
                        if ("paid".equalsIgnoreCase(newStatus)) {
                            double paidTotal = b.getTotalPrice() != null ? b.getTotalPrice() : 0.0;
                            emailService.sendAdminBookingNotification(
                                    b.getBookingCode() + " - ĐÃ THANH TOÁN",
                                    b.getGuestName(),
                                    emailTo != null ? emailTo : "N/A",
                                    b.getRoomName(),
                                    paidTotal
                            );
                        }
                    } catch (Exception ex) {
                        log.warn("Gửi email cập nhật trạng thái thất bại: {}", ex.getMessage());
                    }
                }
            }
        }
        Booking saved = bookingRepository.save(b);
        enrichIfNeeded(saved);
        return saved;
    }

    private String normalizeStatus(String s) {
        if (s == null) return "pending";
        String v = s.toLowerCase().trim();
        if (v.contains("cancel")) return "cancelled";
        if (v.equals("checked-in") || v.equals("checked_in")) return "checked-in";
        if (v.equals("checked-out") || v.equals("checked_out")) return "checked-out";
        if (v.contains("confirm")) return "confirmed";
        if (v.equals("completed") || v.equals("complete")) return "completed";
        if (v.contains("pend")) return "pending";
        if (v.contains("paid") || v.contains("thanh toan") || v.contains("da thanh")) return "paid";
        return v;
    }

    public List<Booking> getBookingsByUserId(String userId) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        list.forEach(this::enrichIfNeeded);

        // Force Mã / Khách / Phòng cho mọi trường hợp
        for (Booking b : list) {
            if (b.getBookingCode() == null || b.getBookingCode().isBlank()) {
                String fb = (b.getBookingId() != null && !b.getBookingId().isBlank()) ? b.getBookingId()
                        : (b.getId() != null ? "BK-" + b.getId().substring(0, Math.min(8, b.getId().length())) : "BK-UNK");
                b.setBookingCode(fb);
            }
            if (b.getGuestName() == null || b.getGuestName().isBlank()) {
                b.setGuestName("Khách hàng");
            }
            if (b.getRoomName() == null || b.getRoomName().isBlank()) {
                b.setRoomName(b.getRoomId() != null ? "Phòng " + b.getRoomId() : "Phòng không xác định");
            }
        }
        return list;
    }

    public Booking saveBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    private void ensureCanAccess(Booking booking, String userId, boolean isStaff) {
        if (booking == null) {
            throw new ResourceNotFoundException("Booking không tìm thấy");
        }
        if (isStaff) {
            return; // Admin / Lễ tân được phép thao tác mọi booking
        }
        if (userId == null || !userId.equals(booking.getUserId())) {
            throw new UnauthorizedException("Bạn không có quyền truy cập booking này");
        }
    }

    /**
     * Lấy thông tin QR VietQR để thanh toán cho booking (checkout).
     * Hỗ trợ chọn ngân hàng (bankKey ví dụ: VCB, MB, TCB...).
     */
    public VietQRService.PaymentQRInfo getPaymentQRInfo(String bookingId, String userId, boolean isStaff) {
        return getPaymentQRInfo(bookingId, userId, isStaff, null);
    }

    public VietQRService.PaymentQRInfo getPaymentQRInfo(String bookingId, String userId, boolean isStaff, String bankKey) {
        Booking booking = getBookingById(bookingId, userId, isStaff); // sẽ check quyền + enrich

        double roomTotal = booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0;
        double surcharge = Math.max(0, qrSurcharge);
        double payableAmount = roomTotal + surcharge;

        String guest = booking.getGuestName();
        String code = booking.getBookingCode() != null ? booking.getBookingCode() : booking.getBookingId();

        VietQRService.PaymentQRInfo info = vietQRService.generateForBooking(code, payableAmount, guest, bankKey);

        // Bổ sung breakdown để frontend có thể hiển thị rõ (nếu muốn tách "tiền phòng + phụ phí QR")
        info.setRoomAmount(Math.round(roomTotal));
        info.setSurchargeAmount(Math.round(surcharge));

        // Bổ sung thông tin khách hàng + booking cho frontend (QR modal / hóa đơn)
        info.setGuestName(booking.getGuestName());
        info.setContactEmail(booking.getContactEmail());
        info.setContactPhone(booking.getContactPhone());
        info.setRoomName(booking.getRoomName());
        info.setRoomNumber(booking.getRoomNumber());
        info.setTransferContent(info.getDescription());
        info.setCustomerName(booking.getGuestName());
        info.setTotalPrice(Math.round(roomTotal));

        if (surcharge > 0) {
            String note = String.format(" (Đã bao gồm phụ phí QR %,.0fđ)", surcharge);
            info.setInstructions((info.getInstructions() != null ? info.getInstructions() : "") + note);
        }

        return info;
    }
}