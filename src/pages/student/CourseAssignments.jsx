import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, uploadAPI } from '../../api/axios';
import ChatBox from '../../components/ChatBox';

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

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default function CourseAssignments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => { loadCourse(); }, [id]);

  const loadCourse = async () => {
    try {
      const res = await courseAPI.getById(id);
      setCourse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được khóa học.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const getMySubmission = (assignmentId) => {
    if (!assignmentId) return undefined;
    const want = String(assignmentId);
    return course.submissions?.find((s) => {
      const aid = s.assignmentId?._id ?? s.assignmentId;
      return aid != null && String(aid) === want;
    });
  };

  const openSubmit = (assignment) => {
    const existing = getMySubmission(assignment._id);
    setSubmittingAssignment(assignment);
    setSubmitContent(existing?.content || '');
    setSelectedFiles([]);
    setExistingAttachments(existing?.attachments || []);
  };

  const handleFileSelect = (e) => {
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
    if (invalid) {
      showMsg(`File "${invalid.name}" có định dạng không được hỗ trợ.`);
      return;
    }
    const over50MB = files.find((f) => f.size > 50 * 1024 * 1024);
    if (over50MB) {
      showMsg(`File "${over50MB.name}" vượt quá 50MB.`);
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!submitContent.trim() && selectedFiles.length === 0) {
      showMsg('Vui lòng nhập nội dung hoặc đính kèm file.');
      return;
    }
    setSubmitting(true);
    setUploadProgress(true);
    try {
      let attachments = [...existingAttachments];
      if (selectedFiles.length > 0) {
        const uploadRes = await uploadAPI.uploadFiles(id, selectedFiles);
        attachments = [...attachments, ...uploadRes.data.files];
      }
      const res = await courseAPI.submitAssignment(
        id,
        submittingAssignment._id,
        submitContent.trim(),
        attachments
      );
      setCourse(res.data);
      setSubmittingAssignment(null);
      showMsg('Nộp bài thành công!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>{error}</div>;
  if (!course) return null;

  const assignments = [...(course.assignments || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: '#4a90d9', cursor: 'pointer',
          fontSize: '0.9rem', marginBottom: '0.75rem', padding: 0,
        }}>
          ← Quay lại khóa học
        </button>
        <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#1e293b' }}>Bài tập — {course.title}</h1>
        <p style={{ color: '#666', margin: '0.3rem 0 0', fontSize: '0.88rem' }}>
          {assignments.length} bài tập được giao
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

      {/* Danh sách bài tập */}
      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#999', fontSize: '1rem' }}>Chưa có bài tập nào được giao.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignments.map((assignment) => {
            const mySub = getMySubmission(assignment._id);
            const overdue = isOverdue(assignment.dueDate);
            const isSubmitted = !!mySub;

            return (
              <div key={assignment._id} style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: mySub?.status === 'graded' ? '2px solid #86efac' :
                        mySub ? '2px solid #93c5fd' : '1px solid #e2e8f0',
              }}>
                {/* Card header */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{assignment.title}</h2>
                        {isSubmitted && mySub && (
                          <span style={{
                            fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                            background: mySub.status === 'graded' ? '#dcfce7' : '#dbeafe',
                            color: mySub.status === 'graded' ? '#15803d' : '#1d4ed8',
                            fontWeight: 600,
                          }}>
                            {mySub.status === 'graded' ? `✓ Đã chấm: ${mySub.score}/${assignment.maxScore}` : '✓ Đã nộp'}
                          </span>
                        )}
                        {mySub?.isLate && (
                          <span style={{
                            fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                            background: '#fee2e2', color: '#dc2626', fontWeight: 700,
                          }}>
                            ⏰ Nộp trễ
                          </span>
                        )}
                        {overdue && !isSubmitted && (
                          <span style={{
                            fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                            background: '#fef3c7', color: '#92400e', fontWeight: 600,
                          }}>
                            ⚠ Quá hạn
                          </span>
                        )}
                      </div>

                      {assignment.description && (
                        <p style={{ margin: '0.4rem 0 0', color: '#666', fontSize: '0.88rem' }}>
                          {assignment.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#6b7280', background: '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                          Thang điểm: {assignment.maxScore}
                        </span>
                        {assignment.dueDate && (
                          <span style={{
                            fontSize: '0.82rem', padding: '0.15rem 0.5rem', borderRadius: 4,
                            background: overdue ? '#fef3c7' : '#f0fdf4',
                            color: overdue ? '#92400e' : '#15803d',
                            fontWeight: overdue ? 600 : 400,
                          }}>
                            {overdue ? '⏰ Hạn: ' : '📅 Hạn: '}{formatDate(assignment.dueDate)}
                          </span>
                        )}
                        {mySub?.submittedAt && (
                          <span style={{
                            fontSize: '0.82rem',
                            color: mySub?.isLate ? '#dc2626' : '#6b7280',
                            fontWeight: mySub?.isLate ? 600 : 400,
                          }}>
                            {mySub?.isLate ? '⏰ Nộp lúc: ' : '⏱ Nộp lúc: '}{formatDate(mySub.submittedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {mySub?.status === 'graded' ? (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', lineHeight: 1 }}>
                          {mySub.score}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                          / {assignment.maxScore}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Nội dung chi tiết */}
                  {assignment.content && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                      {assignment.content}
                    </div>
                  )}

                  {/* File đính kèm của bài tập */}
                  {assignment.attachments?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        Tài liệu bài tập:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {assignment.attachments.map((att, i) => (
                          <a key={i} href={`http://localhost:5000${att.url}`} target="_blank" rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.25rem 0.6rem', borderRadius: 6,
                              background: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem',
                              textDecoration: 'none', border: '1px solid #bfdbfe',
                            }}>
                            {getMimeIcon(att.mimetype)} {att.name}
                            {att.size ? <span style={{ color: '#93c5fd', fontSize: '0.72rem' }}>({formatBytes(att.size)})</span> : null}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File đã nộp */}
                  {isSubmitted && mySub?.attachments?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        File đã nộp:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {mySub?.attachments?.map((att, i) => (
                          <a key={i} href={`http://localhost:5000${att.url}`} target="_blank" rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.25rem 0.6rem', borderRadius: 6,
                              background: '#f0fdf4', color: '#15803d', fontSize: '0.8rem',
                              textDecoration: 'none', border: '1px solid #bbf7d0',
                            }}>
                            {getMimeIcon(att.mimetype)} {att.name}
                            {att.size ? <span style={{ color: '#86efac', fontSize: '0.72rem' }}>({formatBytes(att.size)})</span> : null}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nhận xét giảng viên */}
                  {mySub?.instructorComment && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#fefce8', borderRadius: 8, border: '1px solid #fef08a', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#92400e' }}>💬 Nhận xét giảng viên:</strong>
                      <span style={{ color: '#78350f', marginLeft: '0.3rem' }}>{mySub.instructorComment}</span>
                    </div>
                  )}

                  {/* Nút nộp bài */}
                  <button
                    onClick={() => openSubmit(assignment)}
                    style={{
                      marginTop: '0.75rem', padding: '0.45rem 1.1rem',
                      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                      background: mySub?.status === 'graded' ? '#f3f4f6' : '#2563eb',
                      color: mySub?.status === 'graded' ? '#6b7280' : 'white',
                      fontWeight: 500,
                    }}
                  >
                    {!mySub
                      ? '📤 Nộp bài'
                      : mySub.status === 'graded'
                        ? '📋 Xem lại bài nộp'
                        : '✏️ Nộp lại'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== FORM NỘP BÀI ===== */}
      {submittingAssignment && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 600,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Nộp bài tập</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#666' }}>{submittingAssignment.title}</p>
              </div>
              <button onClick={() => setSubmittingAssignment(null)} style={{
                background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem',
              }}>✕</button>
            </div>

            {/* Cảnh báo nộp trễ */}
            {(() => {
              const overdue = isOverdue(submittingAssignment.dueDate);
              return overdue ? (
                <div style={{
                  background: '#fff1f2',
                  border: '1.5px solid #fda4af',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  marginBottom: '1.1rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.65,
                  color: '#9f1239',
                }}>
                  <strong style={{ fontSize: '1rem' }}>⏰ Cảnh báo: bạn đang nộp trễ</strong>
                  <br />
                  Hạn nộp: <strong style={{ color: '#be123c' }}>{formatDate(submittingAssignment.dueDate)}</strong>.
                  Bài nộp của bạn sẽ được ghi nhận là <strong>nộp trễ</strong> và giảng viên sẽ thấy thời gian nộp thực tế.
                </div>
              ) : null;
            })()}

            {/* Preview nội dung cũ */}
            {existingAttachments.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>File đã nộp trước đó:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {existingAttachments.map((att, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.6rem', borderRadius: 6,
                      background: '#f0fdf4', color: '#15803d', fontSize: '0.8rem',
                      border: '1px solid #bbf7d0',
                    }}>
                      {getMimeIcon(att.mimetype)} {att.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nội dung văn bản */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                Nội dung bài làm
              </label>
              <textarea
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
                rows={5}
                placeholder="Nhập nội dung bài làm tại đây..."
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d1d5db',
                  fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Upload file */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  Đính kèm file
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '0.3rem' }}>(tối đa 5 file, 50MB/file)</span>
                </label>
                <button onClick={() => fileInputRef.current?.click()} style={{
                  padding: '0.35rem 0.85rem', borderRadius: 8, border: '1px solid #4a90d9',
                  background: '#eff6ff', color: '#1d4ed8', fontSize: '0.82rem', cursor: 'pointer',
                }}>
                  + Chọn file
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#9ca3af' }}>
                Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, MP4, ZIP
              </p>

              {selectedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.75rem', borderRadius: 8,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                    }}>
                      <span style={{ fontSize: '1rem' }}>{getMimeIcon(file.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatBytes(file.size)}</div>
                      </div>
                      <button onClick={() => removeFile(idx)} style={{
                        background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem',
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setSubmittingAssignment(null)} style={{
                padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontSize: '0.88rem',
              }}>
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none',
                  background: submitting ? '#93c5fd' : '#2563eb',
                  color: 'white', cursor: submitting ? 'wait' : 'pointer',
                  fontSize: '0.88rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {uploadProgress ? 'Đang tải file...' : 'Đang nộp...'}
                  </>
                ) : '📤 Nộp bài'}
              </button>
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
