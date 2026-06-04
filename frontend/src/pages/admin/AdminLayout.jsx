import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;

  return (
    <div className="d-flex flex-column flex-lg-row" style={{ minHeight: 'calc(100vh - 86px)' }}>
      {/* Sidebar (dark luxury admin sidebar) */}
      <aside
        className="sidebar-admin d-flex flex-column p-3 p-lg-4"
        style={{ width: '100%', maxWidth: '260px', flexShrink: 0 }}
      >
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-building-fill" style={{ fontSize: '1.75rem', color: 'var(--nova-gold)' }} />
            <div>
              <div className="fw-bold" style={{ color: 'white', letterSpacing: '1px', fontSize: '1.05rem' }}>
                NOVA HOTEL
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', marginTop: '-2px' }}>
                QUẢN TRỊ
              </div>
            </div>
          </div>
        </div>

        <nav className="nav flex-column mb-auto">
          <NavLink to="/admin" end className={navLinkClass}>
            <i className="bi bi-speedometer2" /> Dashboard
          </NavLink>
          <NavLink to="/admin/rooms" className={navLinkClass}>
            <i className="bi bi-door-open" /> Phòng
          </NavLink>
          <NavLink to="/admin/bookings" className={navLinkClass}>
            <i className="bi bi-calendar-check" /> Đặt phòng
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            <i className="bi bi-people-fill" /> Người dùng
          </NavLink>
          <NavLink to="/admin/revenue" className={navLinkClass}>
            <i className="bi bi-graph-up-arrow" /> Doanh thu
          </NavLink>
        </nav>

        <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="px-1 mb-2" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', lineHeight: 1.2 }}>
            {user?.fullName || user?.email || 'Admin'}
            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Administrator</div>
          </div>

          <button
            onClick={logout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px'
            }}
          >
            <i className="bi bi-box-arrow-right" /> Đăng xuất
          </button>

          <NavLink
            to="/"
            className="d-flex align-items-center justify-content-center small gap-1"
            style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
          >
            <i className="bi bi-arrow-left" /> Về trang chủ
          </NavLink>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-grow-1 p-3 p-md-4" style={{ background: 'var(--nova-bg)', minWidth: 0 }}>
        <div className="container-fluid">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
