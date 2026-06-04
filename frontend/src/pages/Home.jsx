import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

export default function Home() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="row align-items-end g-4">
            <div className="col-lg-7">
              <Reveal>
                <span className="kicker">Minimalist Luxury</span>
                <h1 className="section-title mt-3">Trải nghiệm lưu trú tinh tế tại Nova Hotel</h1>
                <p className="section-subtitle ms-0">
                  Không gian lưu trú đẳng cấp, dịch vụ cá nhân hóa và quy trình đặt phòng tối giản, nhanh gọn.
                </p>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link className="btn-luxury btn-luxury-primary" to="/rooms">
                    Khám phá phòng
                  </Link>
                  <Link className="btn-luxury btn-luxury-outline" to="/login">
                    Đăng nhập
                  </Link>
                </div>
              </Reveal>
            </div>
            <div className="col-lg-5 text-lg-end">
              <Reveal delay={90}>
                <div className="badge-luxury bg-white text-dark">24/7 Concierge</div>
                <div className="badge-luxury bg-white text-dark ms-2">Premium Suites</div>
                <div className="content-banner light mt-4 text-start">
                  <small className="text-muted-soft d-block mb-2">Ưu đãi hôm nay</small>
                  <p className="mb-0">Giảm 15% cho khách đặt sớm và combo lưu trú 2 đêm trở lên.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-4">
            {[
              ['Phòng cao cấp', '120+', 'Suite, Deluxe, Family và Executive.'],
              ['Đánh giá', '4.9/5', 'Trải nghiệm nhất quán, dịch vụ tinh tế.'],
              ['Tỷ lệ quay lại', '68%', 'Khách hàng thân thiết và doanh nghiệp.']
            ].map(([title, value, sub], i) => (
              <div className="col-lg-4" key={title}>
                <Reveal delay={i * 90}>
                  <div className="stat-card h-100">
                    <div className="text-muted-soft small text-uppercase fw-semibold">{title}</div>
                    <h2 className="display-6 mb-0">{value}</h2>
                    <p className="text-muted-soft mt-2 mb-0">{sub}</p>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}