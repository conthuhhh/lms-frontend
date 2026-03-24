import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  /** '' = tất cả môn */
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    loadCourses();
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

  const subjectOptions = useMemo(() => {
    const names = [...new Set(courses.map((c) => c.subject).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b, 'vi'));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!filterSubject) return courses;
    return courses.filter((c) => c.subject === filterSubject);
  }, [courses, filterSubject]);

  return (
    <div className="courses-page" style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Danh sách Khóa học</h1>
        {!loading && courses.length > 0 && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: '#475569' }}>
            <span>Lọc theo môn học</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                minWidth: 220,
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Tất cả môn</option>
              {subjectOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Đang tải khóa học...</div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', maxWidth: 640, margin: '0 auto' }}>
          <p style={{ color: '#0f172a', margin: '0 0 0.75rem', fontWeight: 600, fontSize: '1.05rem' }}>
            Chưa có khóa học nào được xuất bản.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.65, margin: '0 0 1rem', textAlign: 'left' }}>
            Trang này chỉ hiển thị <strong>khóa học</strong> (lớp cụ thể theo kì, giảng viên…), không phải danh sách <strong>môn học</strong> trong Quản trị.
            <br /><br />
            <strong>Môn học</strong> (Quản trị → Quản lý môn học) là danh mục để giảng viên chọn khi tạo khóa. Sau khi tạo khóa, cần bật <strong>« Xuất bản ngay »</strong> thì khóa mới xuất hiện ở đây.
          </p>
          {user?.role === 'instructor' && (
            <Link
              to="/instructor/create"
              className="btn btn-primary"
              style={{ display: 'inline-block', padding: '0.55rem 1.25rem', fontSize: '0.9rem', borderRadius: 8, textDecoration: 'none' }}
            >
              Tạo khóa học từ môn đã cấu hình
            </Link>
          )}
          {user?.role === 'admin' && (
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
              Admin không tự tạo khóa trên trang này — hãy yêu cầu <strong>giảng viên đúng ngành</strong> đăng nhập và tạo khóa, hoặc xem{' '}
              <Link to="/admin/courses" style={{ color: '#2563eb', fontWeight: 600 }}>Phân lớp / khóa học</Link>.
            </p>
          )}
          {!user && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.75rem 0 0' }}>
              Đăng nhập bằng tài khoản giảng viên để tạo khóa học.
            </p>
          )}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Không có khóa học nào khớp bộ lọc. <button type="button" style={{ marginLeft: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterSubject('')}>Xóa lọc</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredCourses.map((course) => (
            <div key={course._id} style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{course.title}</h3>

              <div className="course-badges">
                <span className="badge badge-subject">{course.subject}</span>
                <span className="badge badge-class">{course.className}</span>
                <span className="badge badge-semester">
                  HK{course.semester}{course.academicYear ? ` (${course.academicYear})` : ''}
                </span>
              </div>

              <p className="instructor" style={{ fontSize: '0.88rem', color: '#666', margin: 0 }}>
                GV: {course.instructor?.name || '—'}
              </p>

              <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0', flex: 1 }}>
                {course.description?.substring(0, 90)}{course.description?.length > 90 ? '…' : ''}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', color: '#666' }}>
                  {course.lessons?.length || 0} bài giảng
                </span>
                <Link to={`/courses/${course._id}`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: 6 }}>
                  Xem khóa học
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;
