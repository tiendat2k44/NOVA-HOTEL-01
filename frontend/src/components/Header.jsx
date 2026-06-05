import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/roles';
import { useToast } from '../context/ToastContext';

const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

export default function Header() {
  const { user, isLoggedIn, isAdmin, isReceptionist, isStaff, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi hệ thống', 'warning');
    navigate('/');
  };

  return (
    <header className="navbar navbar-expand-lg navbar-luxury fixed-top shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand brand-mark" to="/">
          NOVA HOTEL
        </NavLink>
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#novaNavbar"
          aria-controls="novaNavbar"
          aria-expanded="false"
          aria-label="Mở menu"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <nav className="collapse navbar-collapse" id="novaNavbar">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink className={navClass} to="/" end>
                Trang chủ
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navClass} to="/rooms">
                Phòng
              </NavLink>
            </li>
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <NavLink className={navClass} to="/my-bookings">
                    Đặt của tôi
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navClass} to="/profile">
                    Hồ sơ
                  </NavLink>
                </li>
              </>
            )}
            {(isAdmin || isReceptionist || isStaff) && (
              <li className="nav-item">
                <NavLink className={navClass} to="/admin">
                  Quản trị
                </NavLink>
              </li>
            )}
          </ul>
          <div className="ms-lg-3 d-flex gap-2 mt-3 mt-lg-0 align-items-lg-center">
            {isLoggedIn ? (
              <div className="d-flex align-items-center gap-2">
                <div className="text-end">
                  <div className="fw-semibold" style={{ fontSize: '0.92rem', color: '#1a1a1a' }}>
                    {user?.fullName || user?.name || 'Người dùng'}
                  </div>
                  <span
                    className="badge rounded-pill px-2 py-0"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: (isAdmin || isReceptionist || isStaff) ? '#d4af37' : '#e5e5e5',
                      color: (isAdmin || isReceptionist || isStaff) ? '#1a1a1a' : '#333'
                    }}
                  >
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
                <button
                  className="btn-luxury btn-sm"
                  type="button"
                  onClick={handleLogout}
                  style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: 999 }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2 align-items-center">
                <NavLink className="btn-luxury btn-luxury-outline btn-sm" to="/login">
                  Đăng nhập
                </NavLink>
                <NavLink className="btn-luxury btn-luxury-primary btn-sm" to="/register">
                  Đăng ký
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}