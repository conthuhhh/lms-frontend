import { useState, useEffect } from 'react';
import { courseAPI, userAPI } from '../../api/axios';
import './AdminCourseManagement.css';

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseRes, studentRes] = await Promise.all([
        courseAPI.getAdmin(),
        userAPI.getAll(),
      ]);
      setCourses(courseRes.data);
      setStudents(studentRes.data.filter((u) => u.role === 'student'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openManage = async (course) => {
    setSelectedCourse(course);
    const currentIds = course.enrolledStudents?.map((s) => s._id || s) || [];
    setSelectedStudentIds(currentIds);
    setPendingIds(currentIds);
    setSearchStudent('');
    setMessage('');
    setActiveTab('manage');
  };

  const goBack = () => {
    setSelectedCourse(null);
    setPendingIds([]);
    setActiveTab('courses');
  };

  const handleDeleteCourse = async (c) => {
    const msg = `Xóa khóa học "${c.title}"?\nSinh viên và bài giảng trong khóa sẽ mất — thao tác không hoàn tác.`;
    if (!window.confirm(msg)) return;
    setDeletingId(c._id);
    setMessage('');
    try {
      await courseAPI.delete(c._id);
      setCourses((prev) => prev.filter((x) => x._id !== c._id));
      if (selectedCourse?._id === c._id) goBack();
      setMessage('Đã xóa khóa học.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Xóa thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStudent = (id) => {
    setPendingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const hasChanges = () => {
    const curr = new Set(selectedStudentIds);
    const pend = new Set(pendingIds);
    if (curr.size !== pend.size) return true;
    return !pendingIds.every((id) => curr.has(id));
  };

  const getDiff = () => {
    const curr = new Set(selectedStudentIds);
    const pend = new Set(pendingIds);
    const toAdd = pendingIds.filter((id) => !curr.has(id));
    const toRemove = selectedStudentIds.filter((id) => !pend.has(id));
    return { toAdd, toRemove };
  };

  const handleSave = async () => {
    if (!hasChanges()) return;
    setSaving(true);
    setMessage('');
    try {
      const { toAdd, toRemove } = getDiff();

      let savedCourse = selectedCourse;

      if (toAdd.length > 0) {
        const res = await courseAPI.manageStudents(selectedCourse._id, toAdd, 'assign');
        savedCourse = res.data;
      }

      if (toRemove.length > 0) {
        const res = await courseAPI.manageStudents(selectedCourse._id, toRemove, 'remove');
        savedCourse = res.data;
      }

      const enrolledIds = savedCourse.enrolledStudents.map((s) => s._id || s);
      setSelectedStudentIds(enrolledIds);
      setPendingIds(enrolledIds);
      setSelectedCourse(savedCourse);
      setCourses((prev) =>
        prev.map((c) => (c._id === selectedCourse._id ? savedCourse : c))
      );

      const parts = [];
      if (toAdd.length) parts.push(`thêm ${toAdd.length} SV`);
      if (toRemove.length) parts.push(`xóa ${toRemove.length} SV`);
      setMessage(`Đã lưu: ${parts.join(', ')}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = students.filter(
    (s) => !pendingIds.includes(s._id) &&
      (searchStudent === '' ||
        s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.email.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  const enrolledInCourse = students.filter((s) => pendingIds.includes(s._id));

  if (loading) return <div className="loading">Đang tải...</div>;

  const togglePublish = async (c, e) => {
    e.stopPropagation();
    if (!window.confirm(c.isPublished
      ? `Hủy xuất bản "${c.title}"? Khóa sẽ ẩn khỏi trang Khóa học.`
      : `Xuất bản "${c.title}"? Khóa sẽ hiện trên trang Khóa học.`)) return;
    try {
      const res = await courseAPI.update(c._id, { isPublished: !c.isPublished });
      setCourses((prev) => prev.map((x) => x._id === c._id ? res.data : x));
      if (selectedCourse?._id === c._id) setSelectedCourse(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  return (
    <div className="admin-course-mgmt">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1>Quản lý Khóa học & Phân lớp Sinh viên</h1>
        <p style={{ color: '#666', marginTop: '0.35rem' }}>
          Gán sinh viên vào khóa học, xem sĩ số từng lớp.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={activeTab === 'manage' ? goBack : undefined}
        >
          Danh sách khóa học
        </button>
        <button
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          disabled={!selectedCourse}
        >
          Phân lớp {selectedCourse ? `— ${selectedCourse.title.slice(0, 40)}${selectedCourse.title.length > 40 ? '…' : ''}` : '…'}
        </button>
      </div>

      {/* ===== TAB 1: Danh sách khóa học ===== */}
      {activeTab === 'courses' && (
        <div className="courses-table-wrap">
          {courses.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Chưa có khóa học nào.</p>
          ) : (
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th>Ngành</th>
                  <th>Kì / Năm</th>
                  <th>Sĩ số</th>
                  <th>Trạng thái</th>
                  <th colSpan={3}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const category = c.subjectTemplate?.category || c.instructor?.subjectCategory || '—';
                  return (
                    <tr key={c._id}>
                      <td>
                        <strong>{c.title}</strong>
                        <div style={{ fontSize: '0.82rem', color: '#888' }}>{c.subject}</div>
                      </td>
                      <td>{c.instructor?.name || '—'}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{
                          fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                          background: '#eff6ff', color: '#1d4ed8', fontWeight: 600,
                        }}>
                          {category}
                        </span>
                      </td>
                      <td>
                        HK{c.semester}
                        {c.academicYear ? ` (${c.academicYear})` : ''}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: c.enrolledStudents?.length >= c.maxStudents ? '#dc2626' : '#15803d',
                        }}>
                          {c.enrolledStudents?.length || 0}
                        </span>
                        {' / '}{c.maxStudents}
                      </td>
                      <td>
                        {c.isPublished
                          ? <span className="badge-active">Xuất bản</span>
                          : <span className="badge-off">Nháp</span>}
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => openManage(c)}>
                          Phân lớp SV
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={c.isPublished ? 'btn-publish-off' : 'btn-publish-on'}
                          onClick={(e) => togglePublish(c, e)}
                          title={c.isPublished ? 'Hủy xuất bản' : 'Xuất bản ngay'}
                        >
                          {c.isPublished ? '🔒 Gỡ xuất bản' : '✅ Xuất bản'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          disabled={deletingId === c._id}
                          onClick={() => handleDeleteCourse(c)}
                          title="Xóa khóa học"
                        >
                          {deletingId === c._id ? '…' : 'Xóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== TAB 2: Phân lớp sinh viên ===== */}
      {activeTab === 'manage' && selectedCourse && (
        <div className="manage-panel">
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedCourse.title}</h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Sĩ số hiện tại: <strong>{selectedStudentIds.length} / {selectedCourse.maxStudents}</strong>
                  {hasChanges() && (
                    <span style={{ marginLeft: '1rem', color: '#b45309', fontWeight: 600 }}>
                      (thay đổi: {pendingIds.length})
                    </span>
                  )}
                  {' — '}GV: {selectedCourse.instructor?.name}
                </p>
              </div>
              <button
                className="btn-back-sm"
                onClick={goBack}
                disabled={saving}
              >
                ← Quay lại danh sách
              </button>
            </div>
          </div>

          {message && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              marginBottom: '1rem',
              background: message.includes('thất bại') || message.includes('Lưu thất bại') ? '#fee2e2' : '#dcfce7',
              color: message.includes('thất bại') || message.includes('Lưu thất bại') ? '#dc2626' : '#15803d',
              fontSize: '0.9rem',
            }}>
              {message}
            </div>
          )}

          <div className="manage-grid">
            {/* Cột trái: sinh viên đã chọn */}
            <div className="manage-col">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#333' }}>
                Sinh viên trong lớp ({enrolledInCourse.length})
              </h3>
              {enrolledInCourse.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.88rem' }}>Chưa có sinh viên nào.</p>
              ) : (
                <ul className="student-list">
                  {enrolledInCourse.map((s) => (
                    <li key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span>
                        <strong>{s.name}</strong>
                        <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: '0.5rem' }}>{s.email}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStudent(s._id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem' }}
                        title="Bỏ khỏi lớp"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cột phải: thêm sinh viên */}
            <div className="manage-col">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#333' }}>Thêm sinh viên</h3>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: '0.75rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {availableToAdd.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '0.88rem' }}>Không tìm thấy sinh viên.</p>
                ) : (
                  <ul className="student-list">
                    {availableToAdd.map((s) => (
                      <li key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                          type="checkbox"
                          checked={pendingIds.includes(s._id)}
                          onChange={() => toggleStudent(s._id)}
                          id={`st-${s._id}`}
                        />
                        <label htmlFor={`st-${s._id}`} style={{ flex: 1, cursor: 'pointer' }}>
                          <strong>{s.name}</strong>
                          <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: '0.5rem' }}>{s.email}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Thanh Lưu cố định phía dưới */}
          <div className="save-bar">
            <div style={{ fontSize: '0.88rem', color: '#666' }}>
              {hasChanges() ? (
                <span>Đã chọn <strong>{pendingIds.length}</strong> SV — nhấn <strong>Lưu</strong> để xác nhận.</span>
              ) : (
                <span>Không có thay đổi.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {hasChanges() && (
                <button
                  className="btn-reset-sm"
                  onClick={() => setPendingIds([...selectedStudentIds])}
                  disabled={saving}
                >
                  Hủy thay đổi
                </button>
              )}
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
