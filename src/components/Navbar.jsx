import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'instructor':
        return '/instructor';
      case 'student':
        return '/student';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          LMS System
        </Link>
        <ul className="nav-menu">
          <li>
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Trang chủ
            </Link>
          </li>
          <li>
            <Link
              to="/courses"
              className={`nav-link ${
                location.pathname === '/courses' ? 'active' : ''
              }`}
            >
              Khóa học
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to={getRoleLink()}
                  className={`nav-link ${
                    ['/admin', '/instructor', '/student'].includes(location.pathname)
                      ? 'active'
                      : ''
                  }`}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-user">
                <span className="user-name">
                  {user.name} ({user.role === 'admin' ? 'Quản trị' : user.role === 'instructor' ? 'Giảng viên' : 'Học sinh'})
                </span>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Đăng xuất
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Đăng nhập
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
