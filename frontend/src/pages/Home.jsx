import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiCall, unwrapList } from '../api/client';
import { toDisplayRoom } from '../utils/rooms';
import { formatCurrency } from '../utils/format';

export default function Home() {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingRooms(true);
      try {
        const res = await apiCall('/rooms?size=6', 'GET');
        const list = unwrapList(res).map(toDisplayRoom).slice(0, 3);
        if (list.length > 0) {
          setFeaturedRooms(list);
        } else {
          throw new Error('empty');
        }
      } catch (e) {
        setFeaturedRooms([
          { id: 'demo-1', code: 'DLX01', name: 'Deluxe Mountain View', type: 'Deluxe', price: 1850000, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', highlight: 'Ban công riêng, view núi' },
          { id: 'demo-2', code: 'STE01', name: 'Executive Suite', type: 'Suite', price: 3250000, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', highlight: 'Phòng khách riêng' },
          { id: 'demo-3', code: 'FAM01', name: 'Family Garden Villa', type: 'Family', price: 2450000, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', highlight: 'Sân vườn riêng' }
        ]);
      } finally {
        setLoadingRooms(false);
      }
    };
    load();
  }, []);

  const amenities = [
    { icon: 'bi-wifi', title: 'WiFi tốc độ cao', desc: 'Miễn phí toàn khuôn viên' },
    { icon: 'bi-cup-hot', title: 'Ăn sáng buffet', desc: 'Nhà hàng 5 sao' },
    { icon: 'bi-water', title: 'Hồ bơi vô cực', desc: 'View toàn cảnh thành phố' },
    { icon: 'bi-heart-pulse', title: 'Spa & Wellness', desc: 'Dịch vụ massage chuyên nghiệp' },
    { icon: 'bi-car-front', title: 'Đưa đón sân bay', desc: 'Miễn phí cho suite' },
    { icon: 'bi-shield-check', title: 'An ninh 24/7', desc: 'Concierge & bảo vệ' },
  ];

  const testimonials = [
    { name: 'Anh Minh & Chị Lan', role: 'Cặp đôi từ Hà Nội', quote: 'Kỳ nghỉ lãng mạn nhất từ trước đến nay. Dịch vụ cực kỳ chu đáo, phòng sạch sẽ và view đẹp mê hồn.', rating: 5 },
    { name: 'Chị Hương', role: 'Doanh nhân', quote: 'Tôi hay ở đây mỗi khi công tác TP.HCM. Luôn là lựa chọn số 1 vì sự yên tĩnh và chuyên nghiệp.', rating: 5 },
    { name: 'Gia đình anh Tuấn', role: 'Gia đình 4 người', quote: 'Villa gia đình rất thoải mái. Con cái vui vẻ, bố mẹ được nghỉ ngơi. Sẽ quay lại năm sau!', rating: 5 },
  ];

  return (
    <main>
      {/* HERO - Stunning real-world style */}
      <section className="page-hero" style={{ 
        background: 'linear-gradient(135deg, rgba(26,26,26,0.68) 0%, rgba(26,26,26,0.42) 100%), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80") center/cover no-repeat',
        minHeight: '92vh', display: 'flex', alignItems: 'center', color: 'white'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <Reveal>
                <div className="badge-luxury mb-3" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                  5★ LUXURY BOUTIQUE HOTEL
                </div>
                <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(2.6rem, 5.5vw, 4.65rem)', lineHeight: 1.05 }}>
                  Nơi sự tinh tế<br />gặp gỡ sự ấm áp
                </h1>
                <p className="section-subtitle ms-0" style={{ color: 'rgba(255,255,255,0.92)', maxWidth: 520 }}>
                  Khách sạn boutique cao cấp tại trung tâm TP. Hồ Chí Minh. Thiết kế tối giản, dịch vụ cá nhân hóa và trải nghiệm lưu trú đáng nhớ.
                </p>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link to="/rooms" className="btn-luxury btn-luxury-primary" style={{ paddingLeft: '32px', paddingRight: '32px' }}>Khám phá phòng &amp; Đặt ngay</Link>
                  <Link to="/login" className="btn-luxury btn-luxury-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}>Đăng nhập thành viên</Link>
                </div>
                <div className="d-flex gap-4 mt-5 small text-white-50">
                  <div>★ 4.9/5 từ 1.240 đánh giá</div><div>24/7 Concierge</div><div>Free cancellation 48h</div>
                </div>
              </Reveal>
            </div>

            <div className="col-lg-5 mt-5 mt-lg-0">
              <Reveal delay={120}>
                <div className="content-card" style={{ background: 'rgba(255,255,255,0.97)', color: '#222' }}>
                  <div className="small text-uppercase fw-semibold text-muted mb-2">Tìm phòng nhanh</div>
                  <div className="h5 mb-3">Sẵn sàng cho chuyến đi?</div>
                  <div className="row g-2">
                    <div className="col-6"><label className="form-label small text-muted">Nhận phòng</label><input type="date" className="form-control" defaultValue={new Date().toISOString().slice(0,10)} /></div>
                    <div className="col-6"><label className="form-label small text-muted">Trả phòng</label><input type="date" className="form-control" defaultValue={new Date(Date.now()+172800000).toISOString().slice(0,10)} /></div>
                  </div>
                  <Link to="/rooms" className="btn-luxury btn-luxury-primary w-100 mt-3">Tìm phòng trống ngay</Link>
                  <div className="text-center mt-2"><small className="text-muted">Hoặc <Link to="/rooms">xem tất cả phòng</Link></small></div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="section-pad bg-white">
        <div className="container">
          <div className="row g-4 text-center">
            {[{n:'4.9',l:'Đánh giá TB',s:'1.240+ review'},{n:'120+',l:'Phòng &amp; Suite',s:'6 hạng'},{n:'68%',l:'Khách quay lại',s:'Thân thiết'},{n:'24/7',l:'Dịch vụ',s:'Concierge'}].map((s,i)=>(
              <div className="col-6 col-lg-3" key={i}>
                <Reveal delay={i*55}><div className="stat-card h-100 py-3"><div className="display-5 fw-bold" style={{color:'var(--nova-ink)'}}>{s.n}</div><div className="fw-semibold mt-1">{s.l}</div><div className="text-muted-soft small mt-1">{s.s}</div></div></Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="section-pad">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div><span className="kicker">Nghỉ dưỡng cao cấp</span><h2 className="section-title mt-2 mb-1">Phòng &amp; Suite nổi bật</h2><p className="text-muted-soft mb-0">Lựa chọn từ những hạng phòng được yêu thích nhất.</p></div>
            <Link to="/rooms" className="btn-luxury btn-luxury-outline d-none d-md-inline-flex">Xem tất cả phòng →</Link>
          </div>
          <div className="row g-4">
            {loadingRooms ? [1,2,3].map(i => (<div className="col-lg-4 col-md-6" key={i}><div className="room-card h-100"><div className="room-media" style={{height:220,background:'#f3f4f6'}}/><div className="p-4"><div className="placeholder-glow"><span className="placeholder col-7"/></div></div></div></div>)) : featuredRooms.map((r,idx) => (
              <div className="col-lg-4 col-md-6" key={r.id||idx}>
                <Reveal delay={idx*70}>
                  <Link to={`/rooms/${r.id}`} className="room-card h-100 text-decoration-none d-block" style={{color:'inherit'}}>
                    <div className="room-media" style={{height:232,overflow:'hidden'}}><img src={r.image} alt={r.name} loading="lazy" /></div>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div><div className="room-chip mb-2">{r.type}</div><h3 className="h5 mb-1">{r.name}</h3><div className="text-muted-soft small">{r.code} • {r.capacity||2} khách</div></div>
                        <div className="text-end"><div className="fw-bold" style={{color:'#c8102e'}}>{formatCurrency(r.price)}</div><small className="text-muted-soft">/đêm</small></div>
                      </div>
                      <p className="text-muted-soft small mt-3 mb-0">{r.highlight || 'Không gian nghỉ dưỡng tinh tế với tiện nghi cao cấp.'}</p>
                      <div className="mt-3 small fw-semibold text-dark">Xem chi tiết →</div>
                    </div>
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
          <div className="text-center mt-3 d-md-none"><Link to="/rooms" className="btn-luxury btn-luxury-outline">Xem toàn bộ danh sách phòng</Link></div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="section-pad" style={{background:'#f8f7f4'}}>
        <div className="container">
          <div className="text-center mb-4"><span className="kicker">Trải nghiệm hoàn hảo</span><h2 className="section-title mt-2">Tiện nghi &amp; Dịch vụ</h2></div>
          <div className="row g-4">
            {amenities.map((a,i)=>(
              <div className="col-md-4 col-lg-2" key={i}>
                <Reveal delay={i*45}>
                  <div className="feature-card h-100 text-center">
                    <div style={{fontSize:'1.85rem',marginBottom:10,color:'var(--nova-ink)'}}><i className={`bi ${a.icon}`}/></div>
                    <div className="fw-semibold mb-1">{a.title}</div><div className="text-muted-soft small">{a.desc}</div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-pad">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4"><div><span className="kicker">Câu chuyện khách hàng</span><h2 className="section-title mt-2 mb-0">Khách hàng nói gì</h2></div></div>
          <div className="row g-4">
            {testimonials.map((t,i)=>(
              <div className="col-lg-4" key={i}>
                <Reveal delay={i*70}>
                  <div className="content-card h-100">
                    <div className="mb-3" style={{color:'#d4af37'}}>{'★'.repeat(t.rating)}</div>
                    <p className="fst-italic mb-4">“{t.quote}”</p>
                    <div><div className="fw-semibold">{t.name}</div><div className="text-muted-soft small">{t.role}</div></div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section-pad" style={{background:'var(--nova-ink)', color:'white'}}>
        <div className="container text-center">
          <Reveal>
            <h2 className="section-title" style={{color:'white'}}>Sẵn sàng cho kỳ nghỉ hoàn hảo?</h2>
            <p className="section-subtitle mx-auto" style={{maxWidth:540, color:'rgba(255,255,255,.72)'}}>Đặt phòng ngay hôm nay để nhận ưu đãi tốt nhất và trải nghiệm sự khác biệt thực sự.</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <Link to="/rooms" className="btn-luxury btn-luxury-primary">Đặt phòng ngay</Link>
              <Link to="/login" className="btn-luxury btn-luxury-outline" style={{color:'white', borderColor:'rgba(255,255,255,.5)'}}>Trở thành thành viên</Link>
            </div>
            <div className="mt-4 small text-white-50">Miễn phí hủy phòng trước 48 giờ • Giá tốt nhất đảm bảo</div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
