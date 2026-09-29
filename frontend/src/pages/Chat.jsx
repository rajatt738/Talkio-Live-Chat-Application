import { useEffect, useState, useRef } from "react";
import socket from "../socket";
import { getAvatarColor } from "../App";
import styles from "./Chat.module.css";
import API from "../services/api";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "😭",
  "😡",
  "🤔",
  "😴",
  "🥳",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "✅",
  "🎉",
  "🙏",
  "💯",
  "😢",
  "😮",
  "🤣",
  "😇",
  "🤩",
  "😏",
  "🥺",
  "😤",
  "🤯",
  "😱",
  "🤗",
  "😜",
  "👏",
  "💪",
  "🤝",
  "✌️",
  "🫶",
  "😅",
  "🙈",
  "💀",
  "👀",
  "🎊",
];

export default function Chat({ userId, receiverId, onBack, isMobile }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId || !receiverId) return;
    API.get(`/${userId}/${receiverId}`)
      .then((res) => {
        if (Array.isArray(res.data)) setMessages(res.data);
      })
      .catch((err) => console.error("History error:", err));
  }, [userId, receiverId]);

  useEffect(() => {
    if (!userId) return;

    socket.on("online:users", (users) =>
      setIsOnline(users.includes(receiverId)),
    );

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
          m._id === messageId
            ? { ...m, deleted: true, content: "", imageUrl: "" }
            : m,
        ),
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = (e) => {
      if (
        !e.target.closest("#emoji-picker") &&
        !e.target.closest("#emoji-btn")
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      const res = await API.post("/upload", formData);
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
    socket.emit("delete:message", {
      messageId: msgId,
      sender: userId,
      receiver: receiverId,
    });
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msgId
          ? { ...m, deleted: true, content: "", imageUrl: "" }
          : m,
      ),
    );
  };

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
      else if (d.toDateString() === yesterday.toDateString())
        label = "Yesterday";
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

  const grouped = groupByDate(messages);
  const receiverColor = getAvatarColor(receiverId);
  const senderColor = getAvatarColor(userId);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {isMobile && (
          <button onClick={onBack} className={styles.backBtn}>
            ←
          </button>
        )}
        <div className={styles.headerAvatar} style={{ background: receiverColor }}>
          {receiverId[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.headerName}>{receiverId}</div>
          <div
            style={{ fontSize: 12, color: isOnline ? "#4ade80" : "#94a3b8" }}
          >
            {isTyping ? "✍️ typing..." : isOnline ? "● Online" : "● Offline"}
          </div>
        </div>
      </div>

      <div className={styles.messageArea}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>
              No messages yet. Say hi!
            </div>
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className={styles.dateSeparator}>
              <span className={styles.dateLabel}>{date}</span>
            </div>
            {msgs.map((msg, i) => {
              const isSelf = msg.sender === userId;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isSelf ? "flex-end" : "flex-start",
                    marginBottom: 6,
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                  onMouseEnter={() => setHoveredMsg(msg._id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {!isSelf && (
                    <div
                      className={styles.msgAvatar}
                      style={{ background: receiverColor }}
                    >
                      {receiverId[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ maxWidth: "65%", position: "relative" }}>
                    {isSelf && !msg.deleted && hoveredMsg === msg._id && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    )}
                    {msg.deleted ? (
                      <div
                        className={`${styles.bubble} ${styles.bubbleDeleted}`}
                      >
                        <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                          🚫 Message deleted
                        </span>
                      </div>
                    ) : msg.messageType === "image" ? (
                      <div
                        className={`${styles.bubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}
                        style={{ padding: 6 }}
                      >
                        <img
                          src={`http://localhost:5000${msg.imageUrl}`}
                          alt="sent"
                          onClick={() =>
                            setLightboxImg(
                              `http://localhost:5000${msg.imageUrl}`,
                            )
                          }
                          className={styles.msgImage}
                        />
                      </div>
                    ) : (
                      <div
                        className={`${styles.bubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}
                      >
                        {msg.content}
                      </div>
                    )}
                    <div
                      className={styles.timeStamp}
                      style={{ textAlign: isSelf ? "right" : "left" }}
                    >
                      {formatTime(msg.createdAt)}
                      {isSelf && !msg.deleted && (
                        <span style={{ marginLeft: 4, color: "#818cf8" }}>
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelf && (
                    <div
                      className={styles.msgAvatar}
                      style={{ background: senderColor }}
                    >
                      {userId[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {isTyping && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div className={styles.msgAvatar} style={{ background: receiverColor }}>
              {receiverId[0]?.toUpperCase()}
            </div>
            <div
              className={`${styles.bubble} ${styles.bubbleOther}`}
              style={{ padding: "12px 16px" }}
            >
              <div className={styles.typingDots}>
                <span className={styles.dot} style={{ animationDelay: "0s" }} />
                <span className={styles.dot} style={{ animationDelay: "0.2s" }} />
                <span className={styles.dot} style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {imagePreview && (
        <div className={styles.imagePreviewBar}>
          <img
            src={imagePreview}
            alt="preview"
            style={{ height: 80, borderRadius: 8, objectFit: "cover" }}
          />
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>
              Ready to send
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {imageFile?.name}
            </div>
          </div>
          <button
            onClick={() => {
              setImagePreview(null);
              setImageFile(null);
            }}
            className={styles.cancelPreviewBtn}
          >
            ✕
          </button>
          <button
            onClick={sendImage}
            disabled={uploading}
            className={styles.sendImageBtn}
          >
            {uploading ? "⏳" : "Send 📤"}
          </button>
        </div>
      )}

      {showEmoji && (
        <div id="emoji-picker" className={styles.emojiPicker}>
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setMessage((p) => p + emoji)}
              className={styles.emojiBtn}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputArea}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className={styles.iconBtn}
        >
          📎
        </button>
        <button
          id="emoji-btn"
          onClick={() => setShowEmoji((p) => !p)}
          className={styles.iconBtn}
        >
          😊
        </button>
        <input
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={styles.input}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className={styles.sendBtn} style={{ opacity: message.trim() ? 1 : 0.5, background: getAvatarColor(userId) }}
        >
          ➤
        </button>
      </div>

      {lightboxImg && (
        <div className={styles.lightbox} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="full" className={styles.lightboxImg} />
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>
    </div>
  );
}

