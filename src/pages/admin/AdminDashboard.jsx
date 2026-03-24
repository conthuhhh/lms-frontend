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
    <div className="dashboard-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value ?? '—'}</div>
      <h3 style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: '#374151' }}>{label}</h3>
      {sub && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

function GradeBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ width: 80, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 18, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s' }} />
      </div>
      <span style={{ width: 44, fontSize: '0.82rem', color: '#6b7280', textAlign: 'right' }}>{count}</span>
    </div>
  );
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (showStats && !stats) {
      courseAPI.getStats()
        .then((r) => setStats(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [showStats]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Quản trị viên</h1>
        <p>Xin chào, {user?.name}!</p>
      </div>

      {/* ── Thống kê điểm chất lượng ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#475569' }}>Thống kê điểm &amp; chất lượng học tập</h2>
          <button
            className="card-btn"
            onClick={() => setShowStats((v) => !v)}
          >
            {showStats ? 'Ẩn thống kê' : 'Xem thống kê'}
          </button>
        </div>

        {showStats && (
          loading ? (
            <p style={{ color: '#9ca3af' }}>Đang tải dữ liệu…</p>
          ) : !stats ? (
            <p style={{ color: '#ef4444' }}>Không tải được dữ liệu thống kê.</p>
          ) : (
            <>
              <div className="dashboard-cards" style={{ marginBottom: '1.5rem' }}>
                <StatCard label="Khóa học" value={stats.totalCourses} sub="đang hoạt động" color="#4a90d9" />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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
                          <th style={{ textAlign: 'left', padding: '0.3rem 0', color: '#9ca3af' }}>#</th>
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

      {/* ── Thẻ quản lý hệ thống ── */}
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Quản lý Người dùng</h3>
            <p>Thêm, sửa, xóa tài khoản học sinh và giảng viên</p>
            <Link to="/admin/users" className="card-btn">Quản lý</Link>
          </div>

          <div className="dashboard-card">
            <h3>Quản lý môn học</h3>
            <p>Cấu hình tên môn, sĩ số, số lớp, thời lượng buổi dạy — giảng viên nhập tên môn khi tạo khóa</p>
            <Link to="/admin/subjects" className="card-btn">Quản lý môn học</Link>
          </div>

          <div className="dashboard-card">
            <h3>Phân lớp Sinh viên</h3>
            <p>Gán sinh viên vào khóa học, xem sĩ số từng lớp</p>
            <Link to="/admin/courses" className="card-btn">Phân lớp SV</Link>
          </div>

          <div className="dashboard-card">
            <h3>Xem khóa học</h3>
            <p>Duyệt tất cả khóa học trên hệ thống</p>
            <Link to="/courses" className="card-btn">Xem khóa học</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
