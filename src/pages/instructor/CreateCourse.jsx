import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectAPI, metaAPI, courseAPI } from '../../api/axios';
import '../Dashboard.css';

function CreateCourse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [classSlot, setClassSlot] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [subRes, metaRes] = await Promise.all([
          subjectAPI.getAll(false),
          metaAPI.getNextSemester(),
        ]);
        if (cancelled) return;
        setSubjects(subRes.data);
        if (subRes.data.length > 0) setSelectedSubjectId(subRes.data[0]._id);
        setSemester(metaRes.data.semester);
        setAcademicYear(metaRes.data.academicYear);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Không tải được danh sách môn hoặc kì học mặc định.');
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedSubjectId) return setError('Vui lòng chọn môn học.');
    const sub = selectedSubject;
    const slot = Number(String(classSlot).replace(/\s/g, ''));
    if (!classSlot || Number.isNaN(slot) || slot < 1 || slot > sub.numberOfClasses) {
      return setError(`Số lớp phải từ 1 đến ${sub.numberOfClasses}.`);
    }
    const sem = String(semester).trim();
    if (!['1', '2', '3'].includes(sem)) return setError('Kì học nhập 1, 2 hoặc 3.');
    if (!description.trim()) return setError('Vui lòng nhập mô tả khóa học.');
    if (!academicYear.trim()) return setError('Vui lòng nhập năm học (VD: 2025-2026).');

    setLoading(true);
    try {
      await courseAPI.create({
        subjectId: selectedSubjectId,
        classSlot: slot,
        description: description.trim(),
        isPublished,
        semester: sem,
        academicYear: academicYear.trim(),
      });
      navigate('/instructor');
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo khóa học thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSubjects) {
    return (
      <div className="dashboard-container">
        <p className="loading">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tạo khóa học</h1>
        <p>
          Giảng viên: <strong>{user?.name}</strong>
          {user?.subjectCategory && (
            <span style={{ color: '#1d4ed8', marginLeft: '0.5rem' }}>
              — Ngành: <strong>{user.subjectCategory}</strong>
            </span>
          )}
        </p>
      </div>

      <div className="dashboard-content">
        {subjects.length === 0 ? (
          <div className="create-course-empty">
            <p>
              {!user?.subjectCategory
                ? 'Tài khoản của bạn chưa được gán ngành. Liên hệ quản trị viên để được gán ngành và thêm môn học thuộc ngành đó.'
                : 'Không có môn học nào thuộc ngành của bạn. Liên hệ quản trị viên để thêm môn học cho ngành "' + user.subjectCategory + '".'}
            </p>
            <button type="button" className="btn-cancel" onClick={() => navigate('/instructor')}>
              Quay lại
            </button>
          </div>
        ) : (
          <form className="create-course-form create-course-form-pro" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            {/* Danh sách môn theo ngành */}
            <div className="form-group">
              <label>Môn học *</label>
              <p className="field-hint">
                Chỉ hiển thị môn thuộc ngành <strong style={{ color: '#1d4ed8' }}>{user?.subjectCategory || 'của bạn'}</strong>.
              </p>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setClassSlot('');
                }}
                required
              >
                <option value="">— Chọn môn học —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (tối đa {s.maxStudents} SV, {s.numberOfClasses} lớp)
                  </option>
                ))}
              </select>
            </div>

            {selectedSubject && (
              <div className="subject-readonly-panel">
                <h4>Thông tin môn đã chọn</h4>
                <ul>
                  <li><strong>Ngành:</strong> {selectedSubject.category}</li>
                  <li><strong>Số sinh viên tối đa / lớp:</strong> {selectedSubject.maxStudents}</li>
                  <li><strong>Số lớp có thể mở:</strong> {selectedSubject.numberOfClasses}</li>
                  <li><strong>Thời lượng buổi dạy:</strong> {selectedSubject.sessionDuration}</li>
                </ul>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Số thứ tự lớp *</label>
                {selectedSubject && (
                  <p className="field-hint">Tối đa lớp {selectedSubject.numberOfClasses} theo cấu hình môn</p>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={classSlot}
                  onChange={(e) => setClassSlot(e.target.value)}
                  placeholder="VD: 1"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label>Kì học *</label>
                <p className="field-hint">Nhập 1, 2 hoặc 3 — mặc định đã điền theo kì tiếp theo.</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="1, 2 hoặc 3"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Năm học *</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label>Tên khóa học (tự tạo khi lưu)</label>
              <p className="field-hint preview-title">
                {selectedSubject && classSlot
                  ? selectedSubject.name + ` — Lớp ${classSlot}/${selectedSubject.numberOfClasses} — HK${semester || '…'} (${academicYear || '…'})`
                  : '—'}
              </p>
            </div>

            <div className="form-group">
              <label>Mô tả nội dung / lịch học *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Mô tả chi tiết nội dung, yêu cầu, lịch học dự kiến…"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                Xuất bản ngay (sinh viên có thể xem sau khi được admin gán vào lớp)
              </label>
            </div>
            {!isPublished && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.88rem', color: '#713f12', marginBottom: '0.5rem' }}>
                <strong>⚠️ Lưu ý:</strong> Khóa học sẽ ở chế độ <strong>Nháp</strong> — không hiện trên trang Khóa học. Admin vào <strong>Quản lý khóa học → Xuất bản</strong> để hiển thị, hoặc bật checkbox này trước khi tạo.
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/instructor')}>
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo khóa học'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateCourse;
