import { useEffect, useState } from "react";
import socket from "./socket";
import styles from "./App.module.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

export const getAvatarColor = (name) => {
  const colors = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #3b82f6, #06b6d4)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #f97316, #eab308)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #14b8a6, #6366f1)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [receiverInput, setReceiverInput] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("user:online", user.username);

    socket.on("receive:private", (msg) => {
      if (msg.receiver === user.username && msg.sender !== receiverId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1,
        }));
        setRecentChats((prev) => {
          if (prev.includes(msg.sender)) return prev;
          return [msg.sender, ...prev].slice(0, 8);
        });
      }
    });

    return () => {
      socket.off("receive:private");
      socket.disconnect();
    };
  }, [user, receiverId]);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();
    setUser(null);
    setChatStarted(false);
    setReceiverId("");
    setRecentChats([]);
    setUnreadCounts({});
  };

  const startChat = (name) => {
    const trimmed = (name || receiverInput).trim();
    if (!trimmed) return;
    if (trimmed === user.username) {
      alert("You cannot chat with yourself!");
      return;
    }
    setReceiverId(trimmed);
    setChatStarted(true);
    setUnreadCounts((prev) => ({ ...prev, [trimmed]: 0 }));
    setRecentChats((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [trimmed, ...prev].slice(0, 8);
    });
    setReceiverInput("");
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return (
      <div className={styles.authBg}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>
            <span style={{ fontSize: 36 }}>🔥</span>
            <h1 className={styles.authTitle}>Talkio</h1>
            <p className={styles.authSubtitle}>Real-time private messaging</p>
          </div>
          {showRegister ? (
            <>
              <Register />
              <p className={styles.switchText}>
                Already have an account?{" "}
                <span
                  className={styles.switchLink}
                  onClick={() => setShowRegister(false)}
                >
                  Login
                </span>
              </p>
            </>
          ) : (
            <>
              <Login onLogin={handleLogin} />
              <p className={styles.switchText}>
                Don't have an account?{" "}
                <span
                  className={styles.switchLink}
                  onClick={() => setShowRegister(true)}
                >
                  Register
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appLayout}>
      {isMobile && (
        <div className={styles.mobileTopBar}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={styles.menuBtn}
          >
            ☰
          </button>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
            🔥 Talkio
          </span>
          <div
            className={styles.userAvatar} style={{ width: 32, height: 32, fontSize: 13, background: getAvatarColor(user.username) }}
          >
            {user.username[0]?.toUpperCase()}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {(!isMobile || isMobileMenuOpen) && (
          <div
            className={`${styles.sidebar} ${isMobile ? styles.sidebarMobile : ""}`}
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarLogo}>🔥 Talkio</div>
              <div className={styles.userInfo}>
                <div
                  className={styles.userAvatar} style={{ background: getAvatarColor(user.username) }}
                >
                  {user.username[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}
                  >
                    {user.username}
                  </div>
                  <div style={{ fontSize: 11, color: "#4ade80" }}>● Active</div>
                </div>
                <button
                  onClick={handleLogout}
                  className={styles.logoutBtn}
                  title="Logout"
                >
                  ⏻
                </button>
              </div>
            </div>

            <div className={styles.newChatSection}>
              <div className={styles.sectionLabel}>NEW CHAT</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  placeholder="Enter username..."
                  value={receiverInput}
                  onChange={(e) => setReceiverInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                  className={styles.sidebarInput}
                />
                <button onClick={() => startChat()} className={styles.startBtn}>
                  →
                </button>
              </div>
            </div>

            {recentChats.length > 0 && (
              <div style={{ padding: "0 16px", flex: 1, overflowY: "auto" }}>
                <div className={styles.sectionLabel}>RECENT</div>
                {recentChats.map((name) => (
                  <div
                    key={name}
                    onClick={() => startChat(name)}
                    className={styles.recentItem} style={{ background: receiverId === name && chatStarted ? "#334155" : "transparent" }}
                  >
                    <div
                      className={styles.recentAvatar} style={{ background: getAvatarColor(name) }}
                    >
                      {name[0]?.toUpperCase()}
                    </div>
                    <span style={{ color: "#cbd5e1", fontSize: 14, flex: 1 }}>
                      {name}
                    </span>
                    {unreadCounts[name] > 0 && (
                      <span className={styles.badge}>{unreadCounts[name]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isMobile && isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className={styles.overlay}
          />
        )}

        <div className={styles.mainArea}>
          {!chatStarted ? (
            <div className={styles.welcomeScreen}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
              <h2 style={{ color: "#1e293b", fontWeight: 700 }}>
                Welcome, {user.username}!
              </h2>
              <p style={{ color: "#94a3b8" }}>
                Search a username on the left to start chatting
              </p>
            </div>
          ) : (
            <Chat
              userId={user.username}
              receiverId={receiverId}
              onBack={() => {
                setChatStarted(false);
                setReceiverId("");
              }}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
