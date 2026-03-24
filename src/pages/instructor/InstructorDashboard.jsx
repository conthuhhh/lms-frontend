import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../api/axios';
import '../Dashboard.css';

const BUCKET_COLORS = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#d97706',
  D: '#dc2626',
  F: '#7f1d1d',
  'Chưa chấm': '#94a3b8',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}`, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginTop: '0.2rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}

function GradeBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ width: 90, fontWeight: 600, fontSize: '0.83rem', color: '#374151' }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 16, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s' }} />
      </div>
      <span style={{ width: 40, fontSize: '0.8rem', color: '#6b7280', textAlign: 'right' }}>{count}</span>
    </div>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await courseAPI.getAll();
        const mine = res.data.filter(
          (c) => c.instructor?._id === user?.id || c.instructor === user?.id
        );
        setMyCourses(mine);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (showStats && !stats) {
      courseAPI.getStats()
        .then((r) => setStats(r.data))
        .catch(console.error);
    }
  }, [showStats]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Giảng viên</h1>
        <p>Xin chào, {user?.name}!</p>
      </div>

      {/* ── Thống kê điểm chất lượng ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#475569' }}>Thống kê điểm &amp; chất lượng học tập</h2>
          <button
            onClick={() => setShowStats((v) => !v)}
            style={{
              padding: '0.5rem 1.1rem',
              background: showStats ? '#e2e8f0' : 'linear-gradient(135deg, #4a90d9, #357abd)',
              color: showStats ? '#374151' : '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            {showStats ? 'Ẩn thống kê' : 'Xem thống kê'}
          </button>
        </div>

        {showStats && (
          !stats ? (
            <p style={{ color: '#9ca3af' }}>Đang tải dữ liệu…</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <StatCard label="Khóa học" value={stats.totalCourses} sub="đang phụ trách" color="#4a90d9" />
                <StatCard label="Sinh viên" value={stats.totalStudents} sub="đã ghi danh" color="#7c3aed" />
                <StatCard label="Điểm TB" value={stats.averageScore} sub="(thang 10)" color={stats.averageScore >= 7 ? '#16a34a' : stats.averageScore >= 5 ? '#d97706' : '#dc2626'} />
                <StatCard label="Tỷ lệ đạt" value={stats.passRate ? stats.passRate + '%' : null} sub='≥ D (5.5 thang 10)' color={stats.passRate >= 75 ? '#16a34a' : stats.passRate >= 50 ? '#d97706' : '#dc2626'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Biểu đồ phân bố điểm */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#374151' }}>
                    Phân bố điểm ({stats.gradedCount} đã chấm / {stats.ungradedCount} chưa chấm)
                  </h3>
                  {stats.gradedCount > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {Object.entries(stats.gradeBuckets)
                        .filter(([, v]) => v > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count]) => (
                          <GradeBar
                            key={label}
                            label={label}
                            count={count}
                            total={stats.gradedCount + stats.ungradedCount}
                            color={BUCKET_COLORS[label] || '#6b7280'}
                          />
                        ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Chưa có điểm nào được chấm.</p>
                  )}
                </div>

                {/* Top khóa học */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#374151' }}>Top khóa học điểm cao</h3>
                  {stats.topCourses && stats.topCourses.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <th style={{ textAlign: 'left', padding: '0.3rem 0', color: '#9ca3af', width: 20 }}>#</th>
                          <th style={{ textAlign: 'left', padding: '0.3rem 0', color: '#9ca3af' }}>Khóa học</th>
                          <th style={{ textAlign: 'right', padding: '0.3rem 0', color: '#9ca3af' }}>Điểm TB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topCourses.map((c, i) => (
                          <tr key={c._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td style={{ padding: '0.4rem 0', color: '#9ca3af' }}>{i + 1}</td>
                            <td style={{ padding: '0.4rem 0', color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                            <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{c.average}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Chưa có điểm nào để xếp hạng.</p>
                  )}
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* ── Danh sách khóa học ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#475569' }}>Khóa học của tôi ({myCourses.length})</h2>
        <Link to="/instructor/create" className="card-btn">+ Tạo khóa học</Link>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>Đang tải…</p>
      ) : myCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#666', margin: '0 0 1rem' }}>Bạn chưa tạo khóa học nào.</p>
          <Link to="/instructor/create" className="card-btn">Tạo khóa học đầu tiên</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {myCourses.map((course) => (
            <div key={course._id} style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', flex: 1, color: '#1e293b' }}>{course.title}</h3>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: course.isPublished ? '#dcfce7' : '#fef3c7', color: course.isPublished ? '#15803d' : '#b45309', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem' }}>
                  {course.isPublished ? 'Xuất bản' : 'Nháp'}
                </span>
              </div>
              <div className="course-badges">
                <span className="badge badge-semester">
                  HK{course.semester}{course.academicYear ? ` (${course.academicYear})` : ''}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                SV: <strong>{course.enrolledStudents?.length || 0}</strong> / {course.maxStudents} —
                {course.lessons?.length > 0 ? ` ${course.lessons.length} bài giảng` : ' Chưa có bài giảng'}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <Link to={`/instructor/course/${course._id}`} className="card-btn" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Quản lý lớp
                </Link>
                <Link to={`/courses/${course._id}`} className="card-btn" style={{ background: '#f1f5f9', color: '#475569', flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Xem
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
