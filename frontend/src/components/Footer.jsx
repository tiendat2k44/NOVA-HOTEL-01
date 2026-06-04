export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="luxury-footer section-pad">
      <div className="container">
        <div className="row g-4 align-items-center">
          <div className="col-lg-6">
            <div className="brand-mark mb-3">NOVA HOTEL</div>
            <p className="text-muted-soft mb-0">
              Hệ thống quản lý khách sạn — React frontend kết nối Spring Boot REST API.
            </p>
          </div>
          <div className="col-lg-6 text-lg-end">
            <small className="text-muted-soft">© {year} Nova Hotel. All rights reserved.</small>
          </div>
        </div>
      </div>
    </footer>
  );
}