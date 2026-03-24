import { useState, useEffect } from 'react';
import { subjectAPI } from '../../api/axios';
import './SubjectsManagement.css';

const CATEGORIES = ['CNTT', 'Ngôn ngữ', 'Kinh tế', 'Kỹ thuật', 'Sư phạm', 'Y dược', 'Luật', 'Marketing', 'Thiết kế', 'Khác'];

const emptyForm = {
  name: '',
  category: '',
  maxStudents: '',
  numberOfClasses: '',
  sessionDuration: '',
};

function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await subjectAPI.getAll(true);
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name || '',
      category: s.category || 'Khác',
      maxStudents: String(s.maxStudents ?? ''),
      numberOfClasses: String(s.numberOfClasses ?? ''),
      sessionDuration: s.sessionDuration || '',
      isActive: s.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const maxStudents = Number(String(form.maxStudents).replace(/\s/g, ''));
    const numberOfClasses = Number(String(form.numberOfClasses).replace(/\s/g, ''));

    if (!form.name.trim()) {
      setError('Vui lòng nhập tên môn học.');
      return;
    }
    if (!form.category) {
      setError('Vui lòng chọn ngành cho môn học.');
      return;
    }
    if (form.maxStudents === '' || Number.isNaN(maxStudents) || maxStudents < 1 || maxStudents > 200) {
      setError('Số SV tối đa / lớp phải từ 1 đến 200.');
      return;
    }
    if (form.numberOfClasses === '' || Number.isNaN(numberOfClasses) || numberOfClasses < 1 || numberOfClasses > 50) {
      setError('Số lớp mở phải từ 1 đến 50.');
      return;
    }
    if (!form.sessionDuration.trim()) {
      setError('Vui lòng nhập thời lượng buổi dạy.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      maxStudents,
      numberOfClasses,
      sessionDuration: form.sessionDuration.trim(),
    };
    if (editingId) payload.isActive = form.isActive;

    try {
      if (editingId) {
        await subjectAPI.update(editingId, payload);
      } else {
        await subjectAPI.create(payload);
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa môn học này?')) return;
    try {
      await subjectAPI.delete(id);
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Xóa thất bại';
      alert(msg);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="subjects-management">
      <div className="subjects-header">
        <h1>Quản lý môn học</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Thêm môn học
        </button>
      </div>
      <p className="subjects-hint">
        <strong>Môn học</strong> chỉ là danh mục (template). Để có mục trên trang <strong>Khóa học</strong>, giảng viên cùng ngành phải vào <strong>Dashboard → Tạo khóa học</strong>, chọn môn, điền thông tin và bật <strong>« Xuất bản ngay »</strong>.
        Nhập đầy đủ ngành, sĩ số, số lớp, thời lượng — GV chỉ thấy môn thuộc ngành của mình.
      </p>

      <div className="subjects-table-wrap">
        <table className="subjects-table">
          <thead>
            <tr>
              <th>Tên môn</th>
              <th>Ngành</th>
              <th>SV tối đa/lớp</th>
              <th>Số lớp</th>
              <th>Thời lượng buổi</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>
                  Chưa có môn học nào. Bấm "Thêm môn học" để bắt đầu.
                </td>
              </tr>
            ) : (
              subjects.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                      background: '#eff6ff', color: '#1d4ed8', fontWeight: 600,
                    }}>
                      {s.category || '—'}
                    </span>
                  </td>
                  <td>{s.maxStudents}</td>
                  <td>{s.numberOfClasses}</td>
                  <td>{s.sessionDuration}</td>
                  <td>
                    {s.isActive
                      ? <span className="badge-active">Đang dùng</span>
                      : <span className="badge-off">Tắt</span>}
                  </td>
                  <td className="actions">
                    <button type="button" className="btn-edit" onClick={() => openEdit(s)}>
                      Sửa
                    </button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete(s._id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Sửa môn học' : 'Thêm môn học'}</h2>
            {error && <div className="error-alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên môn học *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Toán cao cấp"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngành *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">— Chọn ngành —</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>SV tối đa / lớp *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.maxStudents}
                    onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                    placeholder="VD: 30"
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số lớp mở *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.numberOfClasses}
                    onChange={(e) => setForm({ ...form, numberOfClasses: e.target.value })}
                    placeholder="VD: 3"
                    autoComplete="off"
                    required
                  />
                  <small>Giảng viên nhập số lớp tương ứng khi tạo khóa</small>
                </div>
              </div>
              <div className="form-group">
                <label>Thời lượng buổi dạy *</label>
                <input
                  type="text"
                  value={form.sessionDuration}
                  onChange={(e) => setForm({ ...form, sessionDuration: e.target.value })}
                  placeholder="VD: 90 phút — 12 tuần"
                  autoComplete="off"
                  required
                />
              </div>
              {editingId && (
                <div className="form-group checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Cho phép giảng viên dùng môn này
                  </label>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectsManagement;
