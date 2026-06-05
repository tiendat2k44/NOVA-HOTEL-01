/**
 * Xuất hóa đơn / biên nhận thanh toán VietQR
 * Mở cửa sổ mới, hiển thị đẹp và cho phép in / lưu PDF
 * 
 * Bao gồm mã QR VietQR (nhúng base64) để khách hàng có thể quét chuyển khoản trực tiếp từ hóa đơn.
 */
export async function exportVietQRInvoice(booking, qrInfo) {
  if (!booking || !qrInfo) {
    alert('Không đủ thông tin để xuất hóa đơn');
    return;
  }

  const bookingCode = booking.bookingCode || booking.bookingId || 'N/A';
  const guestName = booking.guestName || booking.contactName || 'Khách hàng';
  const roomName = booking.roomName || '—';
  const baseTotal = Number(booking.total || booking.totalPrice || qrInfo.amount || 0);

  const checkIn = booking.checkIn || booking.checkInDate;
  const checkOut = booking.checkOut || booking.checkOutDate;

  // Tính số đêm
  const getNights = (start, end) => {
    if (!start || !end) return 1;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 1);
    } catch {
      return 1;
    }
  };

  const nights = getNights(checkIn, checkOut);

  // Tính phí dịch vụ và thuế (thực tế dự án khách sạn Việt Nam)
  const roomCharge = baseTotal;
  const serviceFeeRate = 0.10; // Phụ phí dịch vụ 10%
  const vatRate = 0.10;        // Thuế GTGT 10%

  const serviceFee = Math.round(roomCharge * serviceFeeRate);
  const vatAmount = Math.round((roomCharge + serviceFee) * vatRate);
  const grandTotal = roomCharge + serviceFee + vatAmount;

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('vi-VN');
    } catch {
      return d;
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  };

  const now = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN');

  // Embed QR code image as base64 data URL (reliable for print/PDF, works offline)
  let qrImageSrc = '';
  if (qrInfo && qrInfo.qrUrl) {
    try {
      const resp = await fetch(qrInfo.qrUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        qrImageSrc = await new Promise((resolve) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result);
          fr.readAsDataURL(blob);
        });
      } else {
        qrImageSrc = qrInfo.qrUrl;
      }
    } catch (e) {
      console.warn('[exportVietQRInvoice] Không thể nhúng QR base64 (CORS?), fallback URL trực tiếp:', e);
      qrImageSrc = qrInfo.qrUrl;
    }
  }

  // Thông tin khách sạn (thực tế)
  const hotelInfo = {
    name: 'NOVA HOTEL',
    address: '456 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh, Việt Nam',
    phone: '(028) 3939 1234',
    email: 'reservation@novahotel.vn',
    website: 'www.novahotel.vn',
    taxCode: '0301234567',
    representative: 'Ông Nguyễn Văn A - Giám đốc'
  };

  // Số tiền bằng chữ (đơn giản)
  const amountInWords = (num) => {
    const n = Math.round(num);
    return `${n.toLocaleString('vi-VN')} đồng chẵn`;
  };

  const invoiceHTML = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn - ${bookingCode} | ${hotelInfo.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Roboto+Mono:wght@400;500&amp;display=swap');
        
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8f9fa;
          color: #1f2937;
          line-height: 1.45;
          font-size: 14px;
        }
        .invoice-container {
          max-width: 820px;
          margin: 0 auto;
          background: white;
          border: 1px solid #d1d5db;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
        }
        
        /* Header */
        .hotel-header {
          padding: 20px 28px;
          border-bottom: 3px solid #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .hotel-info h1 {
          margin: 0 0 4px;
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.5px;
        }
        .hotel-info .address {
          font-size: 12.5px;
          color: #4b5563;
          line-height: 1.3;
        }
        .hotel-info .contact {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .invoice-meta {
          text-align: right;
          min-width: 220px;
        }
        .invoice-meta .title {
          font-size: 18px;
          font-weight: 800;
          color: #c8102e;
          margin-bottom: 2px;
        }
        .invoice-meta .subtitle {
          font-size: 12px;
          color: #6b7280;
        }
        .invoice-meta .code {
          margin-top: 8px;
          font-family: 'Roboto Mono', monospace;
          font-size: 13px;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .content {
          padding: 24px 28px;
        }

        /* Customer & Info */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .info-block h4 {
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          margin: 0 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-block .value {
          font-weight: 600;
          margin-bottom: 3px;
        }

        /* Main Service Table */
        .service-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 13.5px;
        }
        .service-table th {
          background: #1a1a1a;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 12.5px;
        }
        .service-table th:last-child,
        .service-table td:last-child {
          text-align: right;
        }
        .service-table td {
          padding: 9px 8px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .service-table .total-row {
          font-weight: 700;
          background: #f8fafc;
        }
        .service-table .grand-total {
          font-size: 16px;
          font-weight: 800;
          color: #c8102e;
        }

        .fee-note {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        /* VietQR Payment Section */
        .payment-section {
          margin-top: 20px;
          border: 2px solid #1a1a1a;
          border-radius: 8px;
          padding: 14px 18px;
          background: #fafafa;
        }
        .payment-section h4 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .payment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 18px;
          font-size: 13.5px;
        }
        .payment-details .label {
          color: #6b7280;
          font-size: 12.5px;
        }
        .payment-details .value {
          font-weight: 700;
          color: #111827;
        }
        .payment-details .full-width {
          grid-column: 1 / -1;
        }
        .payment-details .description {
          font-family: 'Roboto Mono', monospace;
          background: white;
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          word-break: break-all;
        }

        .amount-words {
          margin-top: 12px;
          font-style: italic;
          color: #374151;
          font-size: 13px;
        }

        .footer {
          padding: 16px 28px;
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          color: #4b5563;
        }
        .signature {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          font-size: 12.5px;
        }
        .signature .col {
          text-align: center;
          width: 45%;
        }
        .signature .col .line {
          border-top: 1px solid #111827;
          margin-top: 40px;
          padding-top: 4px;
          font-weight: 600;
        }

        .print-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #1a1a1a;
          color: white;
          border: none;
          padding: 11px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          z-index: 9999;
        }
        .print-btn:hover {
          background: #111827;
        }

        @media print {
          body { background: white; padding: 10px; }
          .invoice-container { box-shadow: none; border: 1px solid #ccc; }
          .print-btn { display: none !important; }
          .service-table th { background: #1a1a1a !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Hotel Header -->
        <div class="hotel-header">
          <div class="hotel-info">
            <h1>${hotelInfo.name}</h1>
            <div class="address">${hotelInfo.address}</div>
            <div class="contact">
              ĐT: ${hotelInfo.phone} &nbsp;|&nbsp; Email: ${hotelInfo.email}<br>
              MST: ${hotelInfo.taxCode} &nbsp;|&nbsp; ${hotelInfo.website}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="title">HÓA ĐƠN<br>GIÁ TRỊ GIA TĂNG</div>
            <div class="subtitle">Biên nhận thanh toán dịch vụ lưu trú</div>
            <div class="code">Số: ${bookingCode}</div>
            <div style="margin-top:6px; font-size:12.5px;">Ngày lập: ${now}</div>
          </div>
        </div>

        <div class="content">
          <!-- Customer Info -->
          <div class="two-col">
            <div class="info-block">
              <h4>Đơn vị mua hàng</h4>
              <div class="value">${guestName}</div>
              <div>Điện thoại: ${booking.contactPhone || '—'}</div>
              <div>Email: ${booking.contactEmail || '—'}</div>
            </div>
            <div class="info-block">
              <h4>Thông tin đơn đặt phòng</h4>
              <div>Mã đơn: <strong>${bookingCode}</strong></div>
              <div>Phòng: <strong>${roomName}</strong></div>
              <div>Thời gian: ${formatDate(checkIn)} → ${formatDate(checkOut)} (${nights} đêm)</div>
            </div>
          </div>

          <!-- Service Table -->
          <table class="service-table">
            <thead>
              <tr>
                <th style="width:40px">STT</th>
                <th>Nội dung dịch vụ</th>
                <th style="width:90px; text-align:center">Số lượng</th>
                <th style="width:120px; text-align:right">Đơn giá</th>
                <th style="width:130px; text-align:right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Tiền phòng ${roomName} (${nights} đêm)</td>
                <td style="text-align:center">${nights}</td>
                <td style="text-align:right">${formatCurrency(Math.round(roomCharge / nights))}</td>
                <td style="text-align:right">${formatCurrency(roomCharge)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Phụ phí dịch vụ (10%)</td>
                <td style="text-align:center">1</td>
                <td style="text-align:right">${formatCurrency(serviceFee)}</td>
                <td style="text-align:right">${formatCurrency(serviceFee)}</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Thuế GTGT (10%)</td>
                <td style="text-align:center">1</td>
                <td style="text-align:right">${formatCurrency(vatAmount)}</td>
                <td style="text-align:right">${formatCurrency(vatAmount)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="4" style="text-align:right; font-weight:700">TỔNG CỘNG</td>
                <td class="grand-total">${formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-words">
            <strong>Số tiền bằng chữ:</strong> ${amountInWords(grandTotal)}
          </div>

          <!-- VietQR Payment + QR Code for transfer -->
          <div class="payment-section">
            <h4 style="margin-bottom:12px;">
              THÔNG TIN THANH TOÁN VIETQR — QUÉT MÃ ĐỂ CHUYỂN KHOẢN
            </h4>

            <div style="display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap;">
              <!-- QR Image (embedded base64 for print reliability) -->
              <div style="flex-shrink:0; text-align:center; background:#fff; padding:6px; border:2px solid #1a1a1a; border-radius:8px;">
                ${qrImageSrc ? `<img src="${qrImageSrc}" alt="Mã QR VietQR thanh toán" style="width:148px; height:148px; display:block; border-radius:4px;" />` : ''}
                <div style="margin-top:4px; font-size:10.5px; font-weight:700; color:#1a1a1a; letter-spacing:0.3px;">QUÉT QR</div>
              </div>

              <!-- Bank details -->
              <div style="flex:1; min-width:240px;">
                <div class="payment-details">
                  <div>
                    <div class="label">Ngân hàng</div>
                    <div class="value">${qrInfo.bankName || ''} ${qrInfo.bankBin ? '(' + qrInfo.bankBin + ')' : ''}</div>
                  </div>
                  <div>
                    <div class="label">Số tài khoản</div>
                    <div class="value">${qrInfo.accountNo}</div>
                  </div>
                  <div>
                    <div class="label">Chủ tài khoản</div>
                    <div class="value">${qrInfo.accountName}</div>
                  </div>
                  <div>
                    <div class="label">Số tiền cần chuyển</div>
                    <div class="value" style="color:#c8102e; font-size:15px; font-weight:800;">${formatCurrency(qrInfo.amount || grandTotal)}</div>
                  </div>
                  <div class="full-width">
                    <div class="label">Nội dung chuyển khoản (BẮT BUỘC)</div>
                    <div class="description">${qrInfo.description}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-top:10px; font-size:12.5px; color:#166534; font-weight:600; background:#f0fdf4; padding:6px 10px; border-radius:4px;">
              Quét mã QR VietQR bằng ứng dụng ngân hàng (Mobile Banking) để chuyển khoản nhanh.<br>
              <strong>Nội dung CK phải chính xác</strong> để hệ thống tự động đối chiếu. Giữ hóa đơn này làm biên nhận.
            </div>
          </div>
        </div>

        <!-- Footer + Signature -->
        <div class="footer">
          <div>
            <strong>Cảm ơn quý khách đã lựa chọn Nova Hotel!</strong><br>
            Mọi thắc mắc xin liên hệ: ${hotelInfo.phone} - ${hotelInfo.email}
          </div>
          <div style="text-align: right; font-size: 11.5px;">
            Đây là hóa đơn điện tử.<br>
            Mã hóa đơn: ${bookingCode}
          </div>
        </div>

        <div class="signature" style="padding: 0 28px 20px;">
          <div class="col">
            <div>ĐẠI DIỆN KHÁCH HÀNG</div>
            <div class="line">(Ký và ghi rõ họ tên)</div>
          </div>
          <div class="col">
            <div>NGƯỜI LẬP HÓA ĐƠN</div>
            <div class="line">${hotelInfo.representative}</div>
          </div>
        </div>
      </div>

      <button onclick="window.print()" class="print-btn">
        🖨️ In hóa đơn / Lưu thành PDF
      </button>

      <script>
        setTimeout(() => window.focus(), 250);
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
}
