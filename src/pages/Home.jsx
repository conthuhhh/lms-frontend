import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api/axios';
import { levelBadgeClass } from '../utils/courseDisplay';
import './Home.css';

function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  /* Navbar trong suốt + hero full chiều cao — chỉ trên trang chủ */
  useEffect(() => {
    document.body.classList.add('page-home');
    return () => document.body.classList.remove('page-home');
  }, []);

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const featured = courses.slice(0, 6);

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-inner">
          <span className="hero-badge">Hệ thống LMS</span>
          <h1>Học mọi lúc, mọi nơi</h1>
          <p className="hero-lead">
            Khám phá khóa học chất lượng, theo dõi tiến độ và phát triển kỹ năng cùng
            nền tảng quản lý học tập.
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="hero-cta">
              Xem khóa học
            </Link>
            <Link to="/login" className="hero-cta-secondary">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <section className="featured-courses">
        <div className="section-head">
          <h2>Khóa học nổi bật</h2>
          <p>Một vài khóa học đang có trên hệ thống — bấm để xem chi tiết.</p>
        </div>

        {loading ? (
          <p className="loading-hint">Đang tải danh sách khóa học…</p>
        ) : featured.length === 0 ? (
          <div className="empty-courses">
            <p>Chưa có khóa học nào. Hãy quay lại sau hoặc liên hệ quản trị viên.</p>
            <Link to="/courses" className="hero-cta">
              Đến trang khóa học
            </Link>
          </div>
        ) : (
          <div className="course-grid">
            {featured.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="placeholder-thumbnail">Chưa có ảnh</div>
                  )}
                </div>
                <h3>{course.title}</h3>
                <p>
                  {course.description
                    ? `${course.description.substring(0, 100)}${course.description.length > 100 ? '…' : ''}`
                    : 'Xem chi tiết khóa học.'}
                </p>
                <div className="course-meta">
                  <span className={levelBadgeClass(course.level)}>
                    {course.level?.trim() || '—'}
                  </span>
                </div>
                <Link to={`/courses/${course._id}`} className="btn btn-secondary">
                  Chi tiết
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
