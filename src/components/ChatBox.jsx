import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../api/socket';
import { courseAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './ChatBox.css';

const ROLE_COLORS = {
  admin: '#7c3aed',
  instructor: '#2563eb',
  student: '#16a34a',
};

const ROLE_LABELS = {
  admin: 'Admin',
  instructor: 'GV',
  student: 'SV',
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, role }) {
  const color = ROLE_COLORS[role] || '#6b7280';
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="chat-avatar" style={{ background: color }}>
      {initial}
    </div>
  );
}

export default function ChatBox({ courseId, courseName }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages on mount or when chat opens
  const loadMessages = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await courseAPI.getMessages(courseId);
      setMessages(res.data);
    } catch (e) {
      console.error('Load messages error:', e);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    loadMessages();
  }, [isOpen, loadMessages, messages.length]);

  // Socket.io setup
  useEffect(() => {
    if (!isOpen || !courseId) return;

    // Connect socket if not connected
    if (!socket.connected) socket.connect();

    socket.emit('join_course', { courseId });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNewMessage = ({ courseId: cid, message }) => {
      if (cid !== courseId) return;
      setMessages((prev) => [...prev, message]);
    };

    const onMessagePinned = ({ courseId: cid, messageId, isPinned }) => {
      if (cid !== courseId) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
      );
    };

    const onMessageDeleted = ({ courseId: cid, messageId }) => {
      if (cid !== courseId) return;
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('message_pinned', onMessagePinned);
    socket.on('message_deleted', onMessageDeleted);

    return () => {
      socket.emit('leave_course', { courseId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('message_pinned', onMessagePinned);
      socket.off('message_deleted', onMessageDeleted);
    };
  }, [isOpen, courseId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !courseId) return;

    setInput('');
    try {
      const res = await courseAPI.sendMessage(courseId, content);
      // Message will be added by socket event; also add optimistically
      setMessages((prev) => {
        if (prev.find((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (e) {
      setInput(content); // restore on error
      console.error('Send message error:', e);
    }
  };

  const handlePin = async (msgId) => {
    try {
      await courseAPI.pinMessage(courseId, msgId);
    } catch (e) {
      console.error('Pin error:', e);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await courseAPI.deleteMessage(courseId, msgId);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const pinned = messages.filter((m) => m.isPinned);
  const normal = messages.filter((m) => !m.isPinned);

  const canManage = user?.role === 'admin' || user?.role === 'instructor';
  const canDelete = (msg) =>
    user?.role === 'admin' ||
    user?.role === 'instructor' ||
    msg.sender?._id === user?.id ||
    msg.sender === user?.id;

  return (
    <div className="chatbox-wrapper">
      {/* Floating button */}
      {!isOpen && (
        <button
          className="chatbox-toggle"
          onClick={() => setIsOpen(true)}
          title="Mở chat lớp học"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chatbox-badge" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="chatbox-panel">
          {/* Header */}
          <div className="chatbox-header">
            <div className="chatbox-header-left">
              <span className="chatbox-status" style={{ background: connected ? '#22c55e' : '#94a3b8' }} />
              <span className="chatbox-title">💬 {courseName || 'Chat lớp học'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="chatbox-icon-btn" onClick={loadMessages} title="Tải lại">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
              <button className="chatbox-close" onClick={() => setIsOpen(false)} title="Đóng">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbox-messages" ref={messagesRef}>
            {loading ? (
              <div className="chatbox-loading">Đang tải tin nhắn…</div>
            ) : messages.length === 0 ? (
              <div className="chatbox-empty">
                <span style={{ fontSize: '2rem' }}>💬</span>
                <p>Chưa có tin nhắn nào.</p>
                <p>Hãy là người đầu tiên nhắn!</p>
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <div className="chatbox-section-label">📌 Được ghim</div>
                )}
                {pinned.map((msg) => (
                  <MessageItem
                    key={msg._id}
                    msg={msg}
                    currentUserId={user?.id}
                    canManage={canManage}
                    canDelete={canDelete(msg)}
                    onPin={handlePin}
                    onDelete={handleDelete}
                  />
                ))}

                {pinned.length > 0 && normal.length > 0 && (
                  <div className="chatbox-section-label">Tin nhắn</div>
                )}
                {normal.map((msg) => (
                  <MessageItem
                    key={msg._id}
                    msg={msg}
                    currentUserId={user?.id}
                    canManage={canManage}
                    canDelete={canDelete(msg)}
                    onPin={handlePin}
                    onDelete={handleDelete}
                  />
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form className="chatbox-input-row" onSubmit={handleSend}>
            <input
              ref={inputRef}
              className="chatbox-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn…"
              maxLength={1000}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chatbox-send"
              disabled={!input.trim()}
              title="Gửi"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MessageItem({ msg, currentUserId, canManage, canDelete, onPin, onDelete }) {
  const senderId = msg.sender?._id || msg.sender;
  const isMine = senderId === currentUserId;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`chat-msg ${isMine ? 'chat-msg-mine' : 'chat-msg-other'}`}>
      {!isMine && <Avatar name={msg.senderName} role={msg.senderRole} />}
      <div className="chat-msg-body">
        {!isMine && (
          <div className="chat-msg-meta">
            <span className="chat-msg-name" style={{ color: ROLE_COLORS[msg.senderRole] || '#6b7280' }}>
              {msg.senderName}
            </span>
            <span className="chat-msg-role">· {ROLE_LABELS[msg.senderRole] || ''}</span>
          </div>
        )}
        <div className="chat-msg-content">
          {msg.isPinned && <span title="Được ghim">📌 </span>}
          {msg.content}
        </div>
        <div className="chat-msg-footer">
          <span className="chat-msg-time">{formatTime(msg.createdAt)}</span>
          {canManage && !isMine && (
            <button className="chat-msg-action" onClick={() => onPin(msg._id)} title="Ghim">
              📌
            </button>
          )}
          {canDelete && (
            <button
              className="chat-msg-action chat-msg-action-del"
              onClick={() => { onDelete(msg._id); setShowMenu(false); }}
              title="Xóa"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
