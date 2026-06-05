import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../utils/roles';

export default function AdminLayout() {
  const { user, isAdmin, isReceptionist, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;

  const roleLabel = getRoleLabel(user?.role);

  const getInitials = (str) => {
    if (!str) return '?';
    return str
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };



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
            <div style={{ flex: 1 }}>
              <div className="fw-bold" style={{ color: 'white', letterSpacing: '1px', fontSize: '1.05rem' }}>
                NOVA HOTEL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', marginTop: '-1px' }}>
                  {isReceptionist ? 'LỄ TÂN' : 'QUẢN TRỊ'}
                </div>
                <span style={{
                  fontSize: '0.55rem',
                  background: 'rgba(212,175,55,0.15)',
                  color: 'var(--nova-gold)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  v2.1
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="nav flex-column mb-auto">
          <NavLink to="/admin" end className={navLinkClass}>
            <i className="bi bi-speedometer2" /> Dashboard
          </NavLink>
          <NavLink to="/admin/bookings" className={navLinkClass}>
            <i className="bi bi-calendar-check" /> Đặt phòng
          </NavLink>

          {/* Chỉ admin full mới thấy các mục quản lý sâu */}
          {isAdmin && (
            <>
              <NavLink to="/admin/rooms" className={navLinkClass}>
                <i className="bi bi-door-open" /> Phòng
              </NavLink>
              <NavLink to="/admin/users" className={navLinkClass}>
                <i className="bi bi-people-fill" /> Người dùng
              </NavLink>
              <NavLink to="/admin/revenue" className={navLinkClass}>
                <i className="bi bi-graph-up-arrow" /> Doanh thu
              </NavLink>
            </>
          )}

          {/* Lễ tân chỉ thấy Đặt phòng (để xác nhận) */}
          {isReceptionist && (
            <div className="px-1 mt-2" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
              (Chế độ Lễ tân - chỉ xác nhận booking)
            </div>
          )}
        </nav>

        <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {/* User info header - realistic admin panel style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isReceptionist 
                  ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' 
                  : 'linear-gradient(135deg, var(--nova-gold), #c5a25f)',
                color: isReceptionist ? 'white' : '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '700',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title={user?.fullName || user?.email}
            >
              {getInitials(user?.fullName || user?.email)}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.fullName || user?.email || 'Nhân viên'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'rgba(255,255,255,0.65)',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontWeight: '500'
                  }}
                >
                  {roleLabel}
                </span>
                <span style={{ color: isReceptionist ? '#60a5fa' : '#4ade80', fontSize: '9px', lineHeight: 1 }}>●</span>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)' }}>Online</span>
              </div>

              {user?.email && (
                <div
                  style={{
                    fontSize: '0.58rem',
                    color: 'rgba(255,255,255,0.45)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '1px'
                  }}
                >
                  {user.email}
                </div>
              )}
            </div>
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

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="d-flex align-items-center justify-content-center small gap-1"
            style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
            title="Mở trang chủ khách sạn ở tab mới"
          >
            <i className="bi bi-box-arrow-up-right" /> Xem trang chủ
          </a>
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
