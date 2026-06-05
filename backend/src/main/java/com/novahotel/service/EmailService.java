package com.novahotel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * EmailService - Gửi email xác nhận đặt phòng, v.v.
 * Hỗ trợ gửi thật (nếu cấu hình SMTP) hoặc fallback log console (demo).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${hotel.admin-email:admin@novahotel.vn}")
    private String adminEmail;

    /**
     * Gửi email xác nhận đặt phòng cho khách hàng (HTML đẹp).
     */
    public void sendBookingConfirmation(String toEmail, String guestName, String bookingCode,
                                        String roomName, String checkIn, String checkOut,
                                        double totalPrice, String status) {
        String subject = "[Nova Hotel] Xác nhận đặt phòng - Mã " + bookingCode;

        String html = buildBookingConfirmationHtml(guestName, bookingCode, roomName, checkIn, checkOut, totalPrice, status);
        sendEmail(toEmail, subject, html, true);
    }

    private String buildBookingConfirmationHtml(String guestName, String bookingCode, String roomName,
                                                 String checkIn, String checkOut, double totalPrice, String status) {
        String safeName = guestName != null ? guestName : "Quý khách";
        String safeAdmin = adminEmail != null ? adminEmail : "admin@novahotel.vn";

        return String.format("""
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"><style>
              body { font-family: system-ui, -apple-system, sans-serif; background:#f8f9fa; margin:0; padding:20px; color:#222; }
              .card { max-width:560px; margin:0 auto; background:white; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden; }
              .header { background: linear-gradient(135deg, #1a1a1a, #333); color:white; padding:24px; text-align:center; }
              .header h1 { margin:0; font-size:22px; letter-spacing:1px; }
              .content { padding:28px; }
              table { width:100%%; border-collapse:collapse; margin:16px 0; }
              td { padding:8px 0; border-bottom:1px solid #eee; }
              .label { color:#666; width:140px; }
              .value { font-weight:600; color:#111; }
              .total { font-size:20px; color:#c8102e; font-weight:700; }
              .btn { display:inline-block; background:#1a1a1a; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin:12px 0; }
              .footer { background:#f8f9fa; padding:18px 28px; font-size:13px; color:#666; }
              .note { background:#fff3cd; border-left:4px solid #ffc107; padding:12px; margin:16px 0; border-radius:4px; font-size:14px; }
            </style></head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>🏨 NOVA HOTEL</h1>
                  <p style="margin:8px 0 0; opacity:0.9;">Xác nhận đặt phòng thành công</p>
                </div>
                <div class="content">
                  <p>Kính gửi <strong>%s</strong>,</p>
                  <p>Cảm ơn quý khách đã tin tưởng và đặt phòng tại <strong>Nova Hotel</strong>!</p>

                  <table>
                    <tr><td class="label">Mã đơn</td><td class="value">%s</td></tr>
                    <tr><td class="label">Phòng</td><td class="value">%s</td></tr>
                    <tr><td class="label">Check-in</td><td class="value">%s</td></tr>
                    <tr><td class="label">Check-out</td><td class="value">%s</td></tr>
                    <tr><td class="label">Tổng tiền</td><td class="value total">%,.0f VND</td></tr>
                    <tr><td class="label">Trạng thái</td><td class="value">%s</td></tr>
                  </table>

                  <div class="note">
                    <strong>Thanh toán:</strong> Vui lòng sử dụng mã QR VietQR trong mục <strong>Lịch sử đặt phòng</strong> để chuyển khoản.<br>
                    Sau khi thanh toán, bấm nút <strong>"Tôi đã chuyển khoản thành công"</strong> để chúng tôi kiểm tra nhanh hơn.
                  </div>

                  <p style="text-align:center;">
                    <a href="http://localhost:5173/my-bookings" class="btn">Xem đơn đặt phòng của tôi</a>
                  </p>

                  <p>Nếu cần hỗ trợ, vui lòng liên hệ <a href="mailto:%s">%s</a>.</p>
                </div>
                <div class="footer">
                  Trân trọng,<br>
                  <strong>Đội ngũ Nova Hotel</strong><br>
                  <small>Email này được gửi tự động. Vui lòng không trả lời trực tiếp.</small>
                </div>
              </div>
            </body></html>
            """,
            safeName, bookingCode, roomName, checkIn, checkOut, totalPrice, status, safeAdmin, safeAdmin
        );
    }

    /**
     * Gửi email thông báo cho admin khi có booking mới hoặc khách báo đã thanh toán (HTML).
     */
    public void sendAdminBookingNotification(String bookingCode, String guestName, String contactEmail,
                                             String roomName, double total) {
        if (adminEmail == null || adminEmail.isBlank()) return;

        String subject = "[Nova Hotel - Admin] Booking mới / Thanh toán: " + bookingCode;

        String html = String.format("""
            <html><body style="font-family:system-ui;padding:20px;background:#f4f4f4;">
              <div style="max-width:520px;margin:auto;background:white;padding:20px;border-radius:8px;">
                <h2 style="color:#c8102e;margin-top:0;">📢 Thông báo Booking</h2>
                <p>Có cập nhật đơn đặt phòng:</p>
                <ul style="line-height:1.7;">
                  <li><strong>Mã đơn:</strong> %s</li>
                  <li><strong>Khách:</strong> %s (email: %s)</li>
                  <li><strong>Phòng:</strong> %s</li>
                  <li><strong>Tổng tiền:</strong> %,.0f VND</li>
                </ul>
                <p style="margin:16px 0;">
                  <a href="http://localhost:5173/admin/bookings" style="background:#1a1a1a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Mở Admin Panel</a>
                </p>
                <small style="color:#888;">Email tự động từ hệ thống Nova Hotel.</small>
              </div>
            </body></html>
            """, bookingCode, guestName, contactEmail != null ? contactEmail : "N/A", roomName, total);

        sendEmail(adminEmail, subject, html, true);
    }

    /**
     * Gửi email cập nhật trạng thái (HTML đẹp).
     */
    public void sendBookingStatusUpdate(String toEmail, String guestName, String bookingCode,
                                        String roomName, String newStatus, String note) {
        String subject = "[Nova Hotel] Cập nhật đơn đặt phòng " + bookingCode;

        String statusColor = switch (newStatus.toLowerCase()) {
            case "confirmed" -> "#28a745";
            case "paid" -> "#fd7e14";
            case "completed" -> "#0d6efd";
            case "cancelled" -> "#dc3545";
            default -> "#6c757d";
        };

        String html = String.format("""
            <html><body style="font-family:system-ui;background:#f8f9fa;padding:20px;">
              <div style="max-width:520px;margin:0 auto;background:white;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
                <div style="padding:24px;border-bottom:1px solid #eee;">
                  <h2 style="margin:0 0 8px;color:#1a1a1a;">Cập nhật đơn đặt phòng</h2>
                  <p style="margin:0;color:#555;">Mã đơn: <strong>%s</strong></p>
                </div>
                <div style="padding:24px;">
                  <p>Kính gửi <strong>%s</strong>,</p>
                  <p>Đơn đặt phòng của quý khách đã được cập nhật:</p>

                  <table style="width:100%%;margin:12px 0;">
                    <tr><td style="color:#666;padding:4px 0;">Phòng</td><td><strong>%s</strong></td></tr>
                    <tr><td style="color:#666;padding:4px 0;">Trạng thái mới</td>
                        <td><span style="background:%s;color:white;padding:2px 10px;border-radius:999px;font-size:13px;">%s</span></td></tr>
                  </table>

                  <div style="background:#f1f3f5;padding:14px;border-radius:6px;font-size:14px;margin:16px 0;">
                    %s
                  </div>

                  <p style="text-align:center;margin-top:20px;">
                    <a href="http://localhost:5173/my-bookings" style="background:#1a1a1a;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Xem chi tiết đơn của tôi</a>
                  </p>
                </div>
                <div style="background:#f8f9fa;padding:16px 24px;font-size:12px;color:#888;border-top:1px solid #eee;">
                  Trân trọng, Đội ngũ Nova Hotel
                </div>
              </div>
            </body></html>
            """,
            bookingCode,
            guestName != null ? guestName : "Quý khách",
            roomName,
            statusColor, newStatus,
            note != null ? note.replace("\n", "<br>") : "Vui lòng kiểm tra lại thông tin trong tài khoản của bạn."
        );

        sendEmail(toEmail, subject, html, true);
    }

    /**
     * Gửi email đặt lại mật khẩu (HTML).
     */
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("[Email] Bỏ qua gửi email reset vì thiếu địa chỉ người nhận.");
            return;
        }

        String subject = "[Nova Hotel] Đặt lại mật khẩu tài khoản";

        String html = String.format("""
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"><style>
              body { font-family: system-ui, -apple-system, sans-serif; background:#f8f9fa; margin:0; padding:20px; color:#222; }
              .card { max-width:520px; margin:0 auto; background:white; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden; }
              .header { background: linear-gradient(135deg, #1a1a1a, #333); color:white; padding:24px; text-align:center; }
              .header h1 { margin:0; font-size:22px; letter-spacing:1px; }
              .content { padding:28px; }
              .btn { display:inline-block; background:#1a1a1a; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:600; margin:16px 0; }
              .warning { background:#fff3cd; border-left:4px solid #ffc107; padding:12px; margin:16px 0; border-radius:4px; font-size:14px; }
              .footer { background:#f8f9fa; padding:18px 28px; font-size:13px; color:#666; }
            </style></head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>🏨 NOVA HOTEL</h1>
                  <p style="margin:8px 0 0; opacity:0.9;">Yêu cầu đặt lại mật khẩu</p>
                </div>
                <div class="content">
                  <p>Kính gửi quý khách,</p>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>

                  <p style="text-align:center;">
                    <a href="%s" class="btn">Đặt lại mật khẩu ngay</a>
                  </p>

                  <div class="warning">
                    <strong>Lưu ý quan trọng:</strong><br>
                    • Link chỉ có hiệu lực trong <strong>1 giờ</strong>.<br>
                    • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.<br>
                    • Không chia sẻ link này với bất kỳ ai.
                  </div>

                  <p>Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
                  <small style="word-break:break-all; color:#555;">%s</small></p>

                  <p>Nếu cần hỗ trợ, liên hệ <a href="mailto:%s">%s</a>.</p>
                </div>
                <div class="footer">
                  Trân trọng,<br>
                  <strong>Đội ngũ Nova Hotel</strong><br>
                  <small>Email này được gửi tự động. Vui lòng không trả lời trực tiếp.</small>
                </div>
              </div>
            </body></html>
            """,
            resetLink, resetLink, adminEmail, adminEmail
        );

        sendEmail(toEmail, subject, html, true);
    }

    private void sendEmail(String to, String subject, String body, boolean asHtml) {
        if (to == null || to.isBlank()) {
            log.warn("[Email] Bỏ qua gửi email vì thiếu địa chỉ người nhận. Subject={}", subject);
            return;
        }

        boolean canSendReal = mailEnabled && mailSender != null && fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("your-");

        if (!canSendReal) {
            // DEMO / fallback: log ra console (rất hữu ích khi dev/test)
            log.info("\n==================== [DEMO EMAIL - KHÔNG GỬI THẬT] ====================");
            log.info("To: {}", to);
            log.info("Subject: {}", subject);
            log.info("Body:\n{}", body);
            log.info("==================================================================\n");
            return;
        }

        try {
            if (asHtml) {
                MimeMessage mime = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mime, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(body, true);  // true = HTML
                mailSender.send(mime);
            } else {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail);
                msg.setTo(to);
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
            }
            log.info("[Email] Đã gửi thành công email tới {} - {}", to, subject);
        } catch (Exception ex) {
            log.error("[Email] Gửi thất bại tới {}: {}", to, ex.getMessage(), ex);
            // Fallback log
            log.info("[Email FALLBACK] To: {} | Subject: {} | Body: {}", to, subject, body);
        }
    }
}
