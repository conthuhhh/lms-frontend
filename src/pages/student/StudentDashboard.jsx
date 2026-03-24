import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../../api/axios';
import '../Dashboard.css';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await courseAPI.getAll();
        setCourses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Học sinh</h1>
        <p>Danh sách khóa học được gán cho bạn.</p>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <p style={{ color: '#999' }}>Đang tải...</p>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ color: '#666', margin: '0 0 0.5rem' }}>Bạn chưa được gán vào khóa học nào.</p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Liên hệ quản trị viên để được phân lớp.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {courses.map((course) => (
              <div key={course._id} style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{course.title}</h3>
                <div className="course-badges">
                  <span className="badge badge-subject">{course.subject}</span>
                  <span className="badge badge-class">{course.className}</span>
                  <span className="badge badge-semester">
                    HK{course.semester}{course.academicYear ? ` (${course.academicYear})` : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  GV: {course.instructor?.name || '—'}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  {course.lessons?.length > 0
                    ? `${course.lessons.length} bài giảng`
                    : 'Chưa có bài giảng'}
                </p>
                {course.assignments?.length > 0 && (
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
                    📚 {course.assignments.length} bài tập
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <Link to={`/courses/${course._id}`} className="card-btn" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '0.4rem' }}>
                    Bài giảng
                  </Link>
                  {course.assignments?.length > 0 && (
                    <Link to={`/student/course/${course._id}/assignments`} className="card-btn" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '0.4rem', background: '#2563eb', color: 'white' }}>
                      Bài tập
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
