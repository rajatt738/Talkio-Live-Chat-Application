import { useEffect, useState, useRef } from "react";
import socket from "../socket";
import { getAvatarColor } from "../App";
import "./Chat.css";
import API from "../services/api";
import {
  Video, Phone, MoreVertical, Paperclip, Smile, Send,
  Mic, ArrowLeft, X, Trash2, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ───────────────────────────────────────────────
const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "😭", "😡", "🤔", "😴", "🥳",
  "👍", "👎", "❤️", "🔥", "✅", "🎉", "🙏", "💯", "😢", "😮",
  "🤣", "😇", "🤩", "😏", "🥺", "😤", "🤯", "😱", "🤗", "😜",
  "👏", "💪", "🤝", "✌️", "🫶", "😅", "🙈", "💀", "👀", "🎊",
];

// ── Helpers ──────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const groupByDate = (msgs) => {
  const groups = {};
  msgs.forEach((msg) => {
    const d = msg.createdAt ? new Date(msg.createdAt) : new Date();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else
      label = d.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
};

// ── Component ────────────────────────────────────────────────
export default function Chat({ userId, receiverId, onBack, isMobile }) {
  const [message, setMessage]         = useState("");
  const [messages, setMessages]       = useState([]);
  const [isOnline, setIsOnline]       = useState(false);
  const [isTyping, setIsTyping]       = useState(false);
  const [hoveredMsg, setHoveredMsg]   = useState(null);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const bottomRef      = useRef(null);
  const typingTimeout  = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Fetch History ──────────────────────────────────────────
  useEffect(() => {
    if (!userId || !receiverId) return;
    API.get(`/${userId}/${receiverId}`)
      .then((res) => { if (Array.isArray(res.data)) setMessages(res.data); })
      .catch((err) => console.error("History error:", err));
  }, [userId, receiverId]);

  // ── Socket Events ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    socket.on("online:users", (users) => setIsOnline(users.includes(receiverId)));

    const handleReceive = (msg) => {
      const mine =
        (msg.sender === userId && msg.receiver === receiverId) ||
        (msg.sender === receiverId && msg.receiver === userId);
      if (!mine) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTyping = ({ sender }) => {
      if (sender !== receiverId) return;
      setIsTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deleted: true, content: "", imageUrl: "" } : m
        )
      );
    };

    socket.on("receive:private", handleReceive);
    socket.on("user:typing", handleTyping);
    socket.on("message:deleted", handleDeleted);

    return () => {
      socket.off("receive:private", handleReceive);
      socket.off("online:users");
      socket.off("user:typing", handleTyping);
      socket.off("message:deleted", handleDeleted);
    };
  }, [userId, receiverId]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Close emoji picker on outside click ────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        !e.target.closest("#emoji-picker") &&
        !e.target.closest("#emoji-btn")
      ) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ────────────────────────────────────────────────
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send:private", {
      sender: userId,
      receiver: receiverId,
      content: message,
      messageType: "text",
    });
    setMessage("");
    setShowEmoji(false);
  };

  const sendImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res  = await API.post("/upload", formData);
      const data = res.data;
      if (data.imageUrl) {
        socket.emit("send:private", {
          sender: userId,
          receiver: receiverId,
          content: "",
          messageType: "image",
          imageUrl: data.imageUrl,
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { sender: userId, receiver: receiverId });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = (msgId) => {
    socket.emit("delete:message", { messageId: msgId, sender: userId, receiver: receiverId });
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msgId ? { ...m, deleted: true, content: "", imageUrl: "" } : m
      )
    );
  };

  // ── Derived state ──────────────────────────────────────────
  const grouped       = groupByDate(messages);
  const receiverColor = getAvatarColor(receiverId);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="chat-wrapper">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-info">
          {isMobile && (
            <button onClick={onBack} className="chat-back-btn">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="chat-header-avatar" style={{ background: receiverColor }}>
            {receiverId[0]?.toUpperCase()}
          </div>
          <div>
            <div className="chat-header-name">{receiverId}</div>
            <div
              className="chat-status"
              style={{ color: isOnline ? "var(--color-status-online)" : "var(--color-text-secondary)" }}
            >
              {isTyping ? (
                "typing…"
              ) : isOnline ? (
                <>
                  <span className="chat-status-dot" style={{ background: "var(--color-status-online)" }} />
                  Online
                </>
              ) : (
                "Offline"
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="btn-icon"><Video size={20} /></button>
          <button className="btn-icon"><Phone size={20} /></button>
          <button className="btn-icon"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* ── Message Area ───────────────────────────────────── */}
      <div className="chat-message-area">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <div className="w-24 h-24 mb-6 rounded-full bg-bg-elevated flex items-center justify-center text-primary border border-border-subtle shadow-xl">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Start the conversation</h3>
            <p className="text-text-secondary text-sm">
              Send a message to start chatting with {receiverId}.
            </p>
          </div>
        )}

        {/* Grouped messages */}
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-separator">
              <span className="date-label">{date}</span>
            </div>

            {msgs.map((msg, i) => {
              const isSelf = msg.sender === userId;
              return (
                <motion.div
                  key={msg._id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`msg-wrapper ${isSelf ? "msg-wrapper-self" : "msg-wrapper-other"}`}
                  onMouseEnter={() => setHoveredMsg(msg._id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {/* Receiver avatar */}
                  {!isSelf && (
                    <div className="msg-avatar" style={{ background: receiverColor }}>
                      {receiverId[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="msg-content">
                    {/* Delete button (own messages) */}
                    {isSelf && !msg.deleted && hoveredMsg === msg._id && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="msg-delete-btn"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* Bubble */}
                    {msg.deleted ? (
                      <div className="bubble-base bubble-deleted">
                        🚫 Message deleted
                      </div>
                    ) : msg.messageType === "image" ? (
                      <div className={`bubble-base ${isSelf ? "bubble-self" : "bubble-other"}`} style={{ padding: 6 }}>
                        <img
                          src={`http://localhost:5000${msg.imageUrl}`}
                          alt="sent"
                          className="msg-image"
                          onClick={() => setLightboxImg(`http://localhost:5000${msg.imageUrl}`)}
                        />
                      </div>
                    ) : (
                      <div className={`bubble-base ${isSelf ? "bubble-self" : "bubble-other"}`}>
                        {msg.content}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className="msg-timestamp"
                      style={{ justifyContent: isSelf ? "flex-end" : "flex-start" }}
                    >
                      {formatTime(msg.createdAt)}
                      {isSelf && !msg.deleted && (
                        <span style={{ color: "var(--color-accent-blue)", marginLeft: 2 }}>✓✓</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="typing-indicator"
          >
            <div className="msg-avatar" style={{ background: receiverColor }}>
              {receiverId[0]?.toUpperCase()}
            </div>
            <div className="bubble-base bubble-other" style={{ padding: "14px 18px" }}>
              <div className="typing-dots">
                <span className="typing-dot" style={{ animationDelay: "0s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Image Preview Bar ───────────────────────────────── */}
      {imagePreview && (
        <div className="image-preview-bar">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-subtle bg-bg-base flex-shrink-0">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-semibold truncate">{imageFile?.name}</div>
            <div className="text-xs text-text-secondary mt-1">Ready to send</div>
          </div>
          <button
            onClick={() => { setImagePreview(null); setImageFile(null); }}
            className="image-preview-cancel-btn"
          >
            <X size={18} />
          </button>
          <button onClick={sendImage} disabled={uploading} className="image-preview-send-btn">
            {uploading ? "Sending…" : "Send Image"}
          </button>
        </div>
      )}

      {/* ── Emoji Picker ────────────────────────────────────── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            id="emoji-picker"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{ opacity: 0, scale: 0.9,    y: 10 }}
            transition={{ duration: 0.15 }}
            className="emoji-picker"
          >
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMessage((p) => p + emoji)}
                className="emoji-btn"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ──────────────────────────────────────── */}
      <div className="chat-input-area">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button onClick={() => fileInputRef.current.click()} className="btn-icon" title="Attach Image">
          <Paperclip size={20} />
        </button>

        <div className="chat-input-wrapper">
          <button id="emoji-btn" onClick={() => setShowEmoji((p) => !p)} className="btn-icon w-9 h-9">
            <Smile size={20} />
          </button>
          <input
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="chat-input"
          />
          <button className="btn-icon w-9 h-9" title="Voice Message">
            <Mic size={20} />
          </button>
        </div>

        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="chat-send-btn"
        >
          <Send size={18} className={message.trim() ? "ml-1" : ""} />
        </button>
      </div>

      {/* ── Image Lightbox ──────────────────────────────────── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox"
            onClick={() => setLightboxImg(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImg}
              alt="full"
              className="lightbox-img"
            />
            <button
              className="lightbox-close-btn"
              onClick={() => setLightboxImg(null)}
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
