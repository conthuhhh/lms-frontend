import { useState, useEffect } from 'react';
import { userAPI } from '../../api/axios';
import './UsersManagement.css';

const CATEGORIES = ['CNTT', 'Ngôn ngữ', 'Kinh tế', 'Kỹ thuật', 'Sư phạm', 'Y dược', 'Luật', 'Marketing', 'Thiết kế', 'Khác'];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    subjectCategory: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'student',
      subjectCategory: u.subjectCategory || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editingId && !formData.password.trim()) {
      setError('Mật khẩu là bắt buộc khi tạo mới.');
      return;
    }

    try {
      if (editingId) {
        const { password, ...updatePayload } = formData;
        await userAPI.update(editingId, updatePayload);
        setShowModal(false);
        setEditingId(null);
        resetForm();
      } else {
        await userAPI.create(formData);
        setShowModal(false);
        resetForm();
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'student', subjectCategory: '' });
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
      } catch (err) {
        alert('Xóa thất bại');
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-admin',
      instructor: 'badge-instructor',
      student: 'badge-student'
    };
    return badges[role] || 'badge-student';
  };

  const getRoleName = (role) => {
    const names = {
      admin: 'Quản trị',
      instructor: 'Giảng viên',
      student: 'Học sinh'
    };
    return names[role] || role;
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="users-management">
      <div className="users-header">
        <h1>Quản lý Người dùng</h1>
        <button className="btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}>
          + Thêm Người dùng
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngành</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${getRoleBadge(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: user.subjectCategory ? '#1d4ed8' : '#9ca3af' }}>
                  {user.subjectCategory || (user.role === 'instructor' ? '— Chưa gán' : '—')}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button className="btn-edit" onClick={() => openEdit(user)} style={{ marginRight: '0.5rem' }}>
                    Sửa
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(user._id)}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Sửa Người dùng' : 'Thêm Người dùng Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu {editingId ? '(bỏ trống nếu không đổi)' : ''}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, subjectCategory: e.target.value !== 'instructor' ? '' : formData.subjectCategory })}
                >
                  <option value="student">Học sinh</option>
                  <option value="instructor">Giảng viên</option>
                  <option value="admin">Quản trị</option>
                </select>
              </div>
              {formData.role === 'instructor' && (
                <div className="form-group">
                  <label>Ngành giảng viên *</label>
                  <select
                    value={formData.subjectCategory}
                    onChange={(e) => setFormData({ ...formData, subjectCategory: e.target.value })}
                    required
                  >
                    <option value="">— Chọn ngành —</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                    Giảng viên chỉ được tạo khóa học thuộc ngành này.
                  </small>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
