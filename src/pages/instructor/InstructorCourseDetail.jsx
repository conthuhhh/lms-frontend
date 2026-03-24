import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, uploadAPI } from '../../api/axios';
import ChatBox from '../../components/ChatBox';

const emptyLesson = { title: '', description: '', content: '', videoUrl: '', duration: '', materials: [] };
const emptyAssignment = { title: '', description: '', content: '', dueDate: '', maxScore: 10, attachments: [] };

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getMimeIcon(mimetype) {
  if (!mimetype) return '📎';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return '📊';
  if (mimetype.includes('image')) return '🖼️';
  if (mimetype.includes('video')) return '🎬';
  if (mimetype.includes('text')) return '📃';
  if (mimetype.includes('zip')) return '📦';
  return '📎';
}

export default function InstructorCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const lessonFileInputRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lessons');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonSelectedFiles, setLessonSelectedFiles] = useState([]);
  const [existingMaterials, setExistingMaterials] = useState([]);
  const [gradingStudent, setGradingStudent] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeComment, setGradeComment] = useState('');
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [subGradeScore, setSubGradeScore] = useState('');
  const [subGradeComment, setSubGradeComment] = useState('');

  const loadCourse = async () => {
    try {
      const res = await courseAPI.getById(id);
      setCourse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourse(); }, [id]);

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  // File upload bài giảng
  const handleLessonFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'application/zip', 'application/x-zip-compressed',
    ];
    const invalid = files.find((f) => !allowedTypes.includes(f.type));
    if (invalid) { showMsg(`File "${invalid.name}" có định dạng không được hỗ trợ.`); return; }
    const over50MB = files.find((f) => f.size > 50 * 1024 * 1024);
    if (over50MB) { showMsg(`File "${over50MB.name}" vượt quá 50MB.`); return; }
    setLessonSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeLessonFile = (idx) => setLessonSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadLessonFiles = async () => {
    if (lessonSelectedFiles.length === 0) return [];
    setUploadingFiles(true);
    try {
      const res = await uploadAPI.uploadFiles(id, lessonSelectedFiles);
      setLessonSelectedFiles([]);
      return res.data.files;
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi tải file lên.');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  };

  // File upload bài tập
  const handleAssignmentFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'application/zip', 'application/x-zip-compressed',
    ];
    const invalid = files.find((f) => !allowedTypes.includes(f.type));
    if (invalid) { showMsg(`File "${invalid.name}" có định dạng không được hỗ trợ.`); return; }
    const over50MB = files.find((f) => f.size > 50 * 1024 * 1024);
    if (over50MB) { showMsg(`File "${over50MB.name}" vượt quá 50MB.`); return; }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeSelectedFile = (idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadAssignmentFiles = async () => {
    if (selectedFiles.length === 0) return [];
    setUploadingFiles(true);
    try {
      const res = await uploadAPI.uploadFiles(id, selectedFiles);
      setSelectedFiles([]);
      return res.data.files;
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi tải file lên.');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  };

  // Lessons
  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonForm(emptyLesson);
    setLessonSelectedFiles([]);
    setExistingMaterials([]);
    setShowLessonForm(true);
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson._id);
    setLessonForm({ ...lesson, materials: lesson.materials || [] });
    setLessonSelectedFiles([]);
    setExistingMaterials(lesson.materials || []);
    setShowLessonForm(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) return showMsg('Vui lòng nhập tiêu đề bài giảng.');
    setSaving(true);
    try {
      let allMaterials = [...existingMaterials];
      if (lessonSelectedFiles.length > 0) {
        const newFiles = await uploadLessonFiles();
        allMaterials = [...allMaterials, ...newFiles];
      }
      const payload = { ...lessonForm, materials: allMaterials };
      const res = editingLesson
        ? await courseAPI.updateLesson(id, editingLesson, payload)
        : await courseAPI.addLesson(id, payload);
      setCourse(res.data);
      setShowLessonForm(false);
      showMsg(editingLesson ? 'Đã cập nhật bài giảng.' : 'Đã thêm bài giảng.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi lưu bài giảng.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Xóa bài giảng này?')) return;
    try {
      const res = await courseAPI.deleteLesson(id, lessonId);
      setCourse(res.data);
      showMsg('Đã xóa bài giảng.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi xóa.');
    }
  };

  // Assignments
  const openAddAssignment = () => {
    setEditingAssignment(null);
    setAssignmentForm(emptyAssignment);
    setSelectedFiles([]);
    setExistingAttachments([]);
    setShowAssignmentForm(true);
  };

  const openEditAssignment = (assignment) => {
    setEditingAssignment(assignment._id);
    setAssignmentForm({
      ...assignment,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
    });
    setSelectedFiles([]);
    setExistingAttachments(assignment.attachments || []);
    setShowAssignmentForm(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.title.trim()) return showMsg('Vui lòng nhập tiêu đề bài tập.');
    setSaving(true);
    try {
      let allAttachments = [...existingAttachments];
      if (selectedFiles.length > 0) {
        const newFiles = await uploadAssignmentFiles();
        allAttachments = [...allAttachments, ...newFiles];
      }
      const payload = {
        ...assignmentForm,
        dueDate: assignmentForm.dueDate ? new Date(assignmentForm.dueDate).toISOString() : null,
        attachments: allAttachments,
      };
      const res = editingAssignment
        ? await courseAPI.updateAssignment(id, editingAssignment, payload)
        : await courseAPI.addAssignment(id, payload);
      setCourse(res.data);
      setShowAssignmentForm(false);
      showMsg(editingAssignment ? 'Đã cập nhật bài tập.' : 'Đã thêm bài tập.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi lưu bài tập.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Xóa bài tập này? Tất cả bài nộp sẽ bị xóa.')) return;
    try {
      const res = await courseAPI.deleteAssignment(id, assignmentId);
      setCourse(res.data);
      showMsg('Đã xóa bài tập.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi xóa.');
    }
  };

  // Submission grading
  const openGradeSubmission = (submission) => {
    setGradingSubmission(submission);
    setSubGradeScore(submission.score || '');
    setSubGradeComment(submission.instructorComment || '');
  };

  const handleSaveSubmissionGrade = async () => {
    if (!gradingSubmission) return;
    setSaving(true);
    try {
      const res = await courseAPI.gradeSubmission(
        id, gradingSubmission._id, subGradeScore, subGradeComment
      );
      setCourse(res.data);
      setGradingSubmission(null);
      showMsg('Đã lưu điểm bài nộp.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const openGrade = (student) => {
    const existing = course.grades?.find(
      (g) => (g.student?._id || g.student) === (student._id || student)
    );
    setGradingStudent(student);
    setGradeScore(existing?.score || '');
    setGradeComment(existing?.comment || '');
  };

  const handleSaveGrade = async () => {
    if (!gradingStudent) return;
    setSaving(true);
    try {
      const res = await courseAPI.grade(
        id, gradingStudent._id || gradingStudent, gradeScore, gradeComment
      );
      setCourse(res.data);
      setGradingStudent(null);
      showMsg('Đã lưu điểm.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi lưu điểm.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  if (!course) return <div style={{ padding: '2rem', textAlign: 'center' }}>Không tìm thấy khóa học.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/instructor')} className="btn btn-secondary" style={{ marginBottom: '0.75rem' }}>
          ← Quay lại dashboard
        </button>
        <h1 style={{ fontSize: '1.3rem', margin: 0 }}>{course.title}</h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {course.subject} — HK{course.semester}{course.academicYear ? ` (${course.academicYear})` : ''} —
          SV: <strong>{course.enrolledStudents?.length || 0}</strong> / {course.maxStudents}
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '0.65rem 1rem', borderRadius: 8, marginBottom: '1rem',
          background: msg.includes('Lỗi') || msg.includes('lỗi') ? '#fee2e2' : '#dcfce7',
          color: msg.includes('Lỗi') || msg.includes('lỗi') ? '#dc2626' : '#15803d',
          fontSize: '0.9rem',
        }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {['lessons', 'assignments', 'students'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.65rem 1.25rem', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#4a90d9' : 'transparent'}`,
              marginBottom: -2, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
              color: activeTab === tab ? '#4a90d9' : '#666',
            }}
          >
            {tab === 'lessons' ? `Bài giảng (${course.lessons?.length || 0})`
              : tab === 'assignments' ? `Bài tập (${course.assignments?.length || 0})`
              : `Sinh viên (${course.enrolledStudents?.length || 0})`}
          </button>
        ))}
      </div>

      {/* ===== TAB BÀI GIẢNG ===== */}
      {activeTab === 'lessons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Danh sách bài giảng</h2>
            <button onClick={openAddLesson} style={{
              padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #4a90d9, #357abd)',
              color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem',
            }}>
              + Thêm bài giảng
            </button>
          </div>

          {showLessonForm && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
                {editingLesson ? 'Sửa bài giảng' : 'Thêm bài giảng mới'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Tiêu đề *</label>
                  <input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Thời lượng</label>
                  <input value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    placeholder="VD: 45 phút"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Mô tả</label>
                <input value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Link video (YouTube / Vimeo / MP4)</label>
                <input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Nội dung bài giảng (HTML / văn bản)</label>
                <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
                    Tài liệu đính kèm <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '0.3rem' }}>(tối đa 5 file, 50MB/file)</span>
                  </label>
                  <button type="button" onClick={() => lessonFileInputRef.current?.click()} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: '1px solid #4a90d9',
                    background: '#eff6ff', color: '#1d4ed8', fontSize: '0.82rem', cursor: 'pointer',
                  }}>
                    + Chọn file
                  </button>
                </div>
                <input ref={lessonFileInputRef} type="file" multiple onChange={handleLessonFileSelect} style={{ display: 'none' }} />
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', color: '#9ca3af' }}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, MP4, ZIP</p>

                {existingMaterials.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>File hiện có:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {existingMaterials.map((mat, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 6, background: '#f0fdf4', color: '#15803d', fontSize: '0.78rem', border: '1px solid #bbf7d0' }}>
                          {getMimeIcon(mat.mimetype)} {mat.name}
                          <button type="button" onClick={() => setExistingMaterials((p) => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {lessonSelectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {lessonSelectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.85rem' }}>{getMimeIcon(file.type)}</span>
                        <span style={{ flex: 1, fontSize: '0.82rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatBytes(file.size)}</span>
                        <button type="button" onClick={() => removeLessonFile(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowLessonForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Hủy</button>
                <button onClick={handleSaveLesson} disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: 6, border: 'none', background: '#4a90d9', color: 'white', cursor: 'pointer' }}>
                  {saving ? 'Đang lưu...' : 'Lưu bài giảng'}
                </button>
              </div>
            </div>
          )}

          {course.lessons?.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 10 }}>
              Chưa có bài giảng nào. Bấm "Thêm bài giảng" để bắt đầu.
            </p>
          ) : (
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              {[...course.lessons].sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => (
                <div key={lesson._id} style={{ padding: '1rem 1.25rem', borderBottom: idx < course.lessons.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0369a1', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{lesson.title}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEditLesson(lesson)} style={{ background: 'none', border: 'none', color: '#4a90d9', cursor: 'pointer', fontSize: '0.85rem' }}>Sửa</button>
                        <button onClick={() => handleDeleteLesson(lesson._id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}>Xóa</button>
                      </div>
                    </div>
                    {lesson.description && <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.88rem' }}>{lesson.description}</p>}
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {lesson.videoUrl && <span style={{ fontSize: '0.82rem', color: '#4a90d9' }}>▶ Video</span>}
                      {lesson.duration && <span style={{ fontSize: '0.82rem', color: '#999' }}>⏱ {lesson.duration}</span>}
                      {lesson.materials?.length > 0 && <span style={{ fontSize: '0.82rem', color: '#4a90d9' }}>📄 {lesson.materials.length} tài liệu</span>}
                    </div>
                    {lesson.materials?.length > 0 && (
                      <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {lesson.materials.map((mat, mi) => (
                          <a key={mi} href={`http://localhost:5000${mat.url}`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                            {getMimeIcon(mat.mimetype)} {mat.name}
                            {mat.size ? <span style={{ color: '#93c5fd' }}>({formatBytes(mat.size)})</span> : null}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB BÀI TẬP ===== */}
      {activeTab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Danh sách bài tập</h2>
            <button onClick={openAddAssignment} style={{
              padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #4a90d9, #357abd)',
              color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem',
            }}>
              + Thêm bài tập
            </button>
          </div>

          {showAssignmentForm && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
                {editingAssignment ? 'Sửa bài tập' : 'Thêm bài tập mới'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Tiêu đề *</label>
                  <input value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Điểm tối đa</label>
                  <input type="number" value={assignmentForm.maxScore} onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Hạn nộp</label>
                  <input type="datetime-local" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Mô tả</label>
                <input value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '0.25rem' }}>Nội dung chi tiết</label>
                <textarea value={assignmentForm.content} onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
                  rows={4} placeholder="Nội dung bài tập, yêu cầu, v.v."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
                    Tài liệu đính kèm <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '0.3rem' }}>(tối đa 5 file, 50MB/file)</span>
                  </label>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: '1px solid #4a90d9',
                    background: '#eff6ff', color: '#1d4ed8', fontSize: '0.82rem', cursor: 'pointer',
                  }}>
                    + Chọn file
                  </button>
                </div>
                <input ref={fileInputRef} type="file" multiple onChange={handleAssignmentFileSelect} style={{ display: 'none' }} />
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', color: '#9ca3af' }}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, MP4, ZIP</p>

                {existingAttachments.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>File hiện có:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {existingAttachments.map((att, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 6, background: '#f0fdf4', color: '#15803d', fontSize: '0.78rem', border: '1px solid #bbf7d0' }}>
                          {getMimeIcon(att.mimetype)} {att.name}
                          <button type="button" onClick={() => setExistingAttachments((p) => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.85rem' }}>{getMimeIcon(file.type)}</span>
                        <span style={{ flex: 1, fontSize: '0.82rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatBytes(file.size)}</span>
                        <button type="button" onClick={() => removeSelectedFile(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAssignmentForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Hủy</button>
                <button type="button" onClick={handleSaveAssignment} disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: 6, border: 'none', background: '#4a90d9', color: 'white', cursor: 'pointer' }}>
                  {saving ? 'Đang lưu...' : 'Lưu bài tập'}
                </button>
              </div>
            </div>
          )}

          {course.assignments?.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 10 }}>
              Chưa có bài tập nào. Bấm "Thêm bài tập" để bắt đầu.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...course.assignments].sort((a, b) => (a.order || 0) - (b.order || 0)).map((assignment) => {
                const submissions = course.submissions?.filter(
                  (s) => (s.assignmentId._id || s.assignmentId) === assignment._id
                ) || [];
                const submitted = submissions.length;
                const graded = submissions.filter((s) => s.status === 'graded').length;
                return (
                  <div key={assignment._id} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{assignment.title}</h3>
                          {assignment.description && (
                            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.88rem' }}>{assignment.description}</p>
                          )}
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', color: '#6b7280', background: '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                              Thang điểm: {assignment.maxScore}
                            </span>
                            {assignment.dueDate && (
                              <span style={{ fontSize: '0.82rem', color: '#92400e', background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                                Hạn: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
                              </span>
                            )}
                            <span style={{ fontSize: '0.82rem', color: '#4a90d9', background: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                              {submitted}/{course.enrolledStudents?.length || 0} nộp
                            </span>
                            {graded > 0 && (
                              <span style={{ fontSize: '0.82rem', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                                {graded} đã chấm
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openEditAssignment(assignment)} style={{ background: 'none', border: 'none', color: '#4a90d9', cursor: 'pointer', fontSize: '0.85rem' }}>Sửa</button>
                          <button onClick={() => handleDeleteAssignment(assignment._id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}>Xóa</button>
                        </div>
                      </div>
                    </div>

                    {submissions.length > 0 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.75rem 1.25rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>Bài nộp ({submissions.length})</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>Sinh viên</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>Trạng thái</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>Điểm</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>File / Nội dung</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>Nhận xét GV</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0' }} />
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((sub) => (
                              <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.4rem 0.5rem' }}>
                                  <strong>{sub.student?.name || '—'}</strong>
                                  <div style={{ color: '#888', fontSize: '0.78rem' }}>{sub.student?.email}</div>
                                  {sub.submittedAt && (
                                    <div style={{
                                      color: sub.isLate ? '#dc2626' : '#888',
                                      fontSize: '0.75rem',
                                      fontWeight: sub.isLate ? 600 : 400,
                                    }}>
                                      {sub.isLate ? '⏰ ' : '⏱ '}{formatDate(sub.submittedAt)}
                                      {sub.isLate && (
                                        <span style={{ marginLeft: '0.3rem', background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: '0.05rem 0.3rem', fontSize: '0.7rem', fontWeight: 700 }}>TRỄ</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.4rem 0.5rem' }}>
                                  <span style={{
                                    fontSize: '0.78rem', padding: '0.1rem 0.4rem', borderRadius: 4,
                                    background: sub.status === 'graded' ? '#dcfce7' : '#fef3c7',
                                    color: sub.status === 'graded' ? '#15803d' : '#92400e',
                                  }}>
                                    {sub.status === 'graded' ? 'Đã chấm' : 'Chưa chấm'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 600, color: sub.score ? '#15803d' : '#dc2626' }}>
                                  {sub.score || <span style={{ fontSize: '0.78rem', fontWeight: 400 }}>—</span>}
                                </td>
                                <td style={{ padding: '0.4rem 0.5rem', maxWidth: 200 }}>
                                  {sub.attachments?.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: sub.content ? '0.3rem' : 0 }}>
                                      {sub.attachments.map((att, i) => (
                                        <a key={i} href={`http://localhost:5000${att.url}`} target="_blank" rel="noreferrer"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#1d4ed8', fontSize: '0.78rem', textDecoration: 'none' }}>
                                          {getMimeIcon(att.mimetype)} {att.name}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  {sub.content && (
                                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.5, maxHeight: '2.5em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      💬 {sub.content.substring(0, 80)}{sub.content.length > 80 ? '…' : ''}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.4rem 0.5rem', maxWidth: 160 }}>
                                  {sub.instructorComment ? (
                                    <div style={{ fontSize: '0.78rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '0.25rem 0.4rem', lineHeight: 1.5 }}>
                                      {sub.instructorComment}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => openGradeSubmission(sub)}
                                    style={{
                                      padding: '0.25rem 0.7rem',
                                      background: sub.status === 'graded' ? '#dcfce7' : '#e0f2fe',
                                      color: sub.status === 'graded' ? '#15803d' : '#0369a1',
                                      border: 'none', borderRadius: 6, cursor: 'pointer',
                                      fontSize: '0.8rem', fontWeight: sub.status === 'graded' ? 600 : 400,
                                    }}
                                  >
                                    {sub.status === 'graded' ? '✏️ Sửa điểm' : '📝 Chấm điểm'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB SINH VIÊN & ĐIỂM ===== */}
      {activeTab === 'students' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Danh sách sinh viên &amp; điểm</h2>
            <span style={{ color: '#666', fontSize: '0.88rem' }}>
              {course.grades?.filter((g) => g.score).length || 0} / {course.enrolledStudents?.length || 0} đã chấm
            </span>
          </div>

          {course.enrolledStudents?.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 10 }}>
              Chưa có sinh viên. Admin sẽ gán sinh viên vào khóa học này.
            </p>
          ) : (
            <div>
              {gradingStudent && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
                    Chấm điểm — <strong>{gradingStudent.name}</strong>
                    <span style={{ fontWeight: 400, color: '#999', fontSize: '0.88rem', marginLeft: '0.5rem' }}>{gradingStudent.email}</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Điểm tổng kết <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input value={gradeScore} onChange={(e) => setGradeScore(e.target.value)}
                        placeholder="VD: 8.5, A, Đạt"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Nhận xét <span style={{ color: '#94a3b8', fontWeight: 400 }}>(hiển thị với sinh viên)</span>
                      </label>
                      <textarea value={gradeComment} onChange={(e) => setGradeComment(e.target.value)}
                        rows={3}
                        placeholder="Nhận xét về quá trình học tập của sinh viên trong lớp…"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', color: '#334155', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setGradingStudent(null)} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSaveGrade} disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: 6, border: 'none', background: '#4a90d9', color: 'white', cursor: 'pointer' }}>
                      {saving ? 'Đang lưu...' : 'Lưu điểm'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', width: 40 }}>STT</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0' }}>Sinh viên</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', width: 100 }}>Điểm</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0' }}>Nhận xét</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', width: 80 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {course.enrolledStudents.map((student, idx) => {
                      const grade = course.grades?.find(
                        (g) => (g.student?._id || g.student) === (student._id || student)
                      );
                      return (
                        <tr key={student._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.7rem 1rem' }}>{idx + 1}</td>
                          <td>
                            <strong>{student.name}</strong>
                            <div style={{ color: '#888', fontSize: '0.82rem' }}>{student.email}</div>
                          </td>
                          <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 600, color: grade?.score ? '#15803d' : '#dc2626' }}>
                            {grade?.score || <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 400 }}>Chưa chấm</span>}
                          </td>
                          <td style={{ padding: '0.7rem 1rem', color: '#555', fontSize: '0.88rem' }}>
                            {grade?.comment || '—'}
                          </td>
                          <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => openGrade(student)}
                              style={{ padding: '0.3rem 0.75rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}
                            >
                              {grade?.score ? 'Sửa điểm' : 'Chấm điểm'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL CHẤM ĐIỂM BÀI NỘP ===== */}
      {gradingSubmission && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid #f1f5f9',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>📝 Chấm điểm bài nộp</h2>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#666' }}>
                  <strong>{gradingSubmission.student?.name}</strong> — {gradingSubmission.student?.email}
                </p>
                {gradingSubmission.isLate && (
                  <span style={{
                    marginTop: '0.35rem', display: 'inline-block',
                    fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                    background: '#fee2e2', color: '#dc2626', fontWeight: 700,
                  }}>
                    ⏰ Nộp trễ — {formatDate(gradingSubmission.submittedAt)}
                  </span>
                )}
              </div>
              <button onClick={() => setGradingSubmission(null)} style={{
                background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem',
              }}>✕</button>
            </div>

            <div style={{ padding: '1.25rem 1.75rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bài nộp của sinh viên
              </p>
              {gradingSubmission.content ? (
                <div style={{
                  padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155',
                  lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
                }}>
                  {gradingSubmission.content}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                  Không có nội dung văn bản.
                </p>
              )}

              {gradingSubmission.attachments?.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                    File đính kèm ({gradingSubmission.attachments.length}):
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {gradingSubmission.attachments.map((att, i) => (
                      <a key={i} href={`http://localhost:5000${att.url}`} target="_blank" rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.8rem', borderRadius: 8,
                          background: '#eff6ff', color: '#1d4ed8', fontSize: '0.85rem',
                          textDecoration: 'none', border: '1px solid #bfdbfe', fontWeight: 500,
                        }}>
                        {getMimeIcon(att.mimetype)} {att.name}
                        {att.size ? <span style={{ color: '#93c5fd', fontSize: '0.75rem' }}>({(att.size / 1024).toFixed(0)}KB)</span> : null}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '1.25rem 1.75rem 1.5rem', borderTop: '1px solid #f1f5f9',
              background: '#fafafa',
            }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Điểm &amp; Nhận xét
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Điểm <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number" min="0" max={assignmentForm.maxScore || 10}
                    value={subGradeScore}
                    onChange={(e) => setSubGradeScore(e.target.value)}
                    placeholder={`0 – ${assignmentForm.maxScore || 10}`}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                    Thang điểm: {assignmentForm.maxScore || 10}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Nhận xét <span style={{ color: '#94a3b8', fontWeight: 400 }}>(hiển thị với sinh viên)</span>
                  </label>
                  <textarea
                    value={subGradeComment}
                    onChange={(e) => setSubGradeComment(e.target.value)}
                    rows={3}
                    placeholder="Nhận xét về bài làm của sinh viên (VD: Bài làm tốt, cần bổ sung phần…)"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button onClick={() => setGradingSubmission(null)} style={{
                  padding: '0.55rem 1.25rem', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                }}>
                  Hủy
                </button>
                <button onClick={handleSaveSubmissionGrade} disabled={saving} style={{
                  padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none',
                  background: saving ? '#93c5fd' : '#4a90d9',
                  color: 'white', cursor: saving ? 'wait' : 'pointer',
                  fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  {saving ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Đang lưu…
                    </>
                  ) : '💾 Lưu điểm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {course && (
        <ChatBox courseId={course._id} courseName={course.title} />
      )}
    </div>
  );
}
