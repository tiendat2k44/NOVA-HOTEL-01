package com.novahotel.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

/**
 * VietQRService - Tạo link QR VietQR (img.vietqr.io) cho thanh toán chuyển khoản.
 * Chuẩn VietQR phổ biến tại Việt Nam (không cần API key cho basic usage).
 *
 * Sử dụng: /api/bookings/{id}/payment-qr trả về qrUrl + thông tin ngân hàng.
 */
@Service
public class VietQRService {

    @Value("${hotel.bank.bin:970436}")
    private String bankBin;

    @Value("${hotel.bank.account-no:123456788805}")
    private String accountNo;

    @Value("${hotel.bank.account-name:DAO TIEN DAT}")
    private String accountName;

    @Value("${hotel.bank.name:TECHCOMBANK}")
    private String bankName;

    @Value("${hotel.bank.qr-template:compact2}")
    private String qrTemplate;

    // Danh sách ngân hàng phổ biến hỗ trợ VietQR (có thể mở rộng)
    private static final Map<String, BankConfig> SUPPORTED_BANKS = new LinkedHashMap<>();
    static {
        SUPPORTED_BANKS.put("VCB", new BankConfig("970436", "VIETCOMBANK"));
        SUPPORTED_BANKS.put("MB",  new BankConfig("970422", "MB BANK"));
        SUPPORTED_BANKS.put("TCB", new BankConfig("970407", "TECHCOMBANK"));
        SUPPORTED_BANKS.put("ACB", new BankConfig("970416", "ACB"));
        SUPPORTED_BANKS.put("VPB", new BankConfig("970432", "VPBANK"));
        SUPPORTED_BANKS.put("BIDV", new BankConfig("970418", "BIDV"));
    }

    private record BankConfig(String bin, String displayName) {}

    /**
     * Trả về danh sách ngân hàng hỗ trợ (cho frontend chọn).
     */
    public List<Map<String, String>> getSupportedBanks() {
        List<Map<String, String>> list = new ArrayList<>();
        SUPPORTED_BANKS.forEach((key, cfg) -> {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("key", key);
            m.put("bin", cfg.bin());
            m.put("name", cfg.displayName());
            list.add(m);
        });
        return list;
    }

    /**
     * Tạo thông tin thanh toán + URL ảnh QR VietQR cho 1 booking.
     * Hỗ trợ chọn ngân hàng (mặc định dùng cấu hình chính).
     */
    public PaymentQRInfo generateForBooking(String bookingCode, double amountVnd, String guestName) {
        return generateForBooking(bookingCode, amountVnd, guestName, null);
    }

    public PaymentQRInfo generateForBooking(String bookingCode, double amountVnd, String guestName, String bankKey) {
        String description = buildTransferDescription(bookingCode, guestName);

        // Chọn ngân hàng (ưu tiên bankKey từ client, fallback về cấu hình chính)
        String useBin = bankBin;
        String useAccountNo = accountNo;
        String useAccountName = accountName;
        String useBankName = bankName;

        if (bankKey != null && SUPPORTED_BANKS.containsKey(bankKey.toUpperCase())) {
            BankConfig cfg = SUPPORTED_BANKS.get(bankKey.toUpperCase());
            useBin = cfg.bin();
            useBankName = cfg.displayName();
            // Lưu ý: accountNo / accountName vẫn dùng của khách sạn (cùng 1 tài khoản)
        }

        // Encode an toàn cho URL
        String encodedDesc = UriUtils.encode(description, StandardCharsets.UTF_8);
        String encodedName = UriUtils.encode(useAccountName, StandardCharsets.UTF_8);

        // URL ảnh QR theo chuẩn vietqr.io
        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%d&addInfo=%s&accountName=%s",
                useBin,
                useAccountNo,
                qrTemplate,
                Math.round(amountVnd),
                encodedDesc,
                encodedName
        );

        PaymentQRInfo info = new PaymentQRInfo();
        info.setQrUrl(qrUrl);
        info.setBankBin(useBin);
        info.setAccountNo(useAccountNo);
        info.setAccountName(useAccountName);
        info.setBankName(useBankName);
        info.setAmount(Math.round(amountVnd));
        info.setDescription(description);
        info.setBookingCode(bookingCode);
        info.setSelectedBankKey(bankKey != null ? bankKey.toUpperCase() : "DEFAULT");
        info.setInstructions("Quét mã QR bằng app ngân hàng (MB, Vietcombank, Techcombank, VNPAY, ...). " +
                "Số tiền và nội dung chuyển khoản đã được điền sẵn. Sau khi chuyển, đơn sẽ được admin xác nhận trong 5-30 phút.");
        return info;
    }

    private String buildTransferDescription(String bookingCode, String guestName) {
        String base = "NovaHotel " + bookingCode;
        if (guestName != null && !guestName.isBlank()) {
            // Giữ ngắn gọn, ngân hàng thường giới hạn ~50-70 ký tự cho addInfo
            String shortName = guestName.length() > 20 ? guestName.substring(0, 18) + ".." : guestName;
            base += " " + shortName;
        }
        return base;
    }

    /**
     * DTO trả về cho frontend.
     */
    public static class PaymentQRInfo {
        private String qrUrl;
        private String bankBin;
        private String accountNo;
        private String accountName;
        private String bankName;
        private long amount;                 // Tổng số tiền khách phải chuyển (bao gồm phụ phí QR nếu có)
        private long roomAmount;             // Tiền phòng gốc
        private long surchargeAmount;        // Phụ phí QR code
        private String description;
        private String bookingCode;
        private String instructions;
        private String selectedBankKey;   // key ngân hàng khách chọn (VCB, MB...)

        // Thông tin khách hàng / booking (bổ sung cho frontend)
        private String guestName;
        private String customerName;
        private String contactEmail;
        private String contactPhone;
        private String roomName;
        private String roomNumber;
        private String transferContent;
        private long totalPrice;

        // getters/setters
        public String getQrUrl() { return qrUrl; }
        public void setQrUrl(String qrUrl) { this.qrUrl = qrUrl; }

        public String getBankBin() { return bankBin; }
        public void setBankBin(String bankBin) { this.bankBin = bankBin; }

        public String getAccountNo() { return accountNo; }
        public void setAccountNo(String accountNo) { this.accountNo = accountNo; }

        public String getAccountName() { return accountName; }
        public void setAccountName(String accountName) { this.accountName = accountName; }

        public String getBankName() { return bankName; }
        public void setBankName(String bankName) { this.bankName = bankName; }

        public long getAmount() { return amount; }
        public void setAmount(long amount) { this.amount = amount; }

        public long getRoomAmount() { return roomAmount; }
        public void setRoomAmount(long roomAmount) { this.roomAmount = roomAmount; }

        public long getSurchargeAmount() { return surchargeAmount; }
        public void setSurchargeAmount(long surchargeAmount) { this.surchargeAmount = surchargeAmount; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getBookingCode() { return bookingCode; }
        public void setBookingCode(String bookingCode) { this.bookingCode = bookingCode; }

        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }

        public String getSelectedBankKey() { return selectedBankKey; }
        public void setSelectedBankKey(String selectedBankKey) { this.selectedBankKey = selectedBankKey; }

        public String getGuestName() { return guestName; }
        public void setGuestName(String guestName) { this.guestName = guestName; }

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

        public String getContactPhone() { return contactPhone; }
        public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }

        public String getRoomNumber() { return roomNumber; }
        public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

        public String getTransferContent() { return transferContent; }
        public void setTransferContent(String transferContent) { this.transferContent = transferContent; }

        public long getTotalPrice() { return totalPrice; }
        public void setTotalPrice(long totalPrice) { this.totalPrice = totalPrice; }
    }
}
