import React, { useEffect, useState } from "react";
import socket from "./socket";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AuthLayout from "./components/layout/AuthLayout";
import { MessageSquare, Users, UserCircle, Settings, LogOut, Search, PlusSquare, Filter, AlignJustify } from "lucide-react";
import { motion } from "framer-motion";

export const getAvatarColor = (name) => {
  const colors = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #3b82f6, #06b6d4)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #f97316, #eab308)",
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
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
      <AuthLayout>
        {showRegister ? (
          <Register onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </AuthLayout>
    );
  }

  const filteredChats = recentChats.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-bg-base text-text-primary overflow-hidden font-sans">
      
      {/* 1. Primary Narrow Sidebar */}
      {(!isMobile || isMobileMenuOpen) && (
        <div className={`w-[240px] lg:w-[80px] lg:flex-col bg-bg-sidebar flex flex-col justify-between border-r border-border-subtle z-40 transition-all duration-300 ${isMobile ? 'fixed inset-y-0 left-0' : 'relative'}`}>
          <div className="flex flex-col items-center py-6 gap-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <MessageSquare size={20} className="text-white" />
            </div>
            
            <div className="flex lg:flex-col w-full px-4 lg:px-0 gap-2 lg:items-center">
              <NavButton icon={<MessageSquare size={22} />} label="Chats" active={activeTab === "chats"} onClick={() => setActiveTab("chats")} />
              <NavButton icon={<Users size={22} />} label="Groups" active={activeTab === "groups"} onClick={() => setActiveTab("groups")} />
              <NavButton icon={<UserCircle size={22} />} label="Contacts" active={activeTab === "contacts"} onClick={() => setActiveTab("contacts")} />
              <NavButton icon={<Settings size={22} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
            </div>
          </div>

          <div className="py-6 flex flex-col items-center gap-4">
            <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={22} />
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg" style={{ background: getAvatarColor(user.username) }}>
              {user.username[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-30" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 2. Secondary Sidebar (Conversation List) */}
      {(!isMobile || (!chatStarted && !isMobileMenuOpen)) && (
        <div className="w-full lg:w-[320px] xl:w-[360px] bg-bg-card flex flex-col border-r border-border-subtle flex-shrink-0 z-20">
          
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Chats</h2>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-white transition-colors">
                  <Filter size={18} />
                </button>
                <button className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors">
                  <PlusSquare size={18} />
                </button>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-bg-elevated text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-6 text-sm font-semibold border-b border-border-subtle pb-4">
              <button className="text-white relative">
                All
                <span className="absolute -bottom-4 left-0 w-full h-[2px] bg-primary rounded-full"></span>
              </button>
              <button className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
                Unread
                {Object.values(unreadCounts).some(c => c > 0) && (
                  <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">New</span>
                )}
              </button>
              <button className="text-text-secondary hover:text-text-primary transition-colors">Favorites</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {/* New Chat Quick Input */}
            <div className="mb-4 p-2">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-2">Start New Chat</div>
              <div className="flex gap-2">
                <input
                  placeholder="Enter username"
                  value={receiverInput}
                  onChange={(e) => setReceiverInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated text-sm focus:outline-none border border-transparent focus:border-primary/30"
                />
                <button onClick={() => startChat()} className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition-colors">
                  Chat
                </button>
              </div>
            </div>

            <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-4 mt-6">Recent</div>
            
            {filteredChats.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-sm">
                {searchQuery ? "No chats found." : "No recent chats."}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChats.map((name) => (
                  <div
                    key={name}
                    onClick={() => startChat(name)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${receiverId === name && chatStarted ? 'bg-bg-elevated border-l-2 border-primary' : 'hover:bg-bg-elevated/50 border-l-2 border-transparent'}`}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: getAvatarColor(name) }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-semibold text-white truncate text-[15px]">{name}</h4>
                        <span className="text-[11px] text-text-secondary flex-shrink-0 ml-2">Recent</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">Click to open conversation</p>
                    </div>
                    {unreadCounts[name] > 0 && (
                      <div className="w-5 h-5 rounded-full bg-accent-pink text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-lg shadow-accent-pink/20">
                        {unreadCounts[name]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Chat Area */}
      <div className={`flex-1 bg-bg-base relative flex flex-col ${isMobile && !chatStarted ? 'hidden' : 'flex'}`}>
        {isMobile && chatStarted && (
          <button onClick={() => setChatStarted(false)} className="absolute top-4 left-4 z-50 w-10 h-10 bg-bg-elevated rounded-full flex items-center justify-center text-white shadow-lg">
            ←
          </button>
        )}
        
        {isMobile && !chatStarted && (
           <div className="absolute top-4 left-4 z-50">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-white">
               <AlignJustify size={24} />
             </button>
           </div>
        )}

        {!chatStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="flex flex-col items-center">
              {/* Logo ring */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 blur-xl scale-125" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-indigo-400/20">
                  <MessageSquare size={40} className="text-white" />
                </div>
              </div>
              {/* Brand name */}
              <div className="text-xs font-bold tracking-[0.25em] text-indigo-400 uppercase mb-2">Talkio</div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Hey, {user.username}! 👋</h2>
              <p className="text-text-secondary max-w-xs mx-auto leading-relaxed text-sm mb-6">
                Pick a conversation from the left or search for a user to start a new chat.
              </p>
              {/* Online status pill */}
              <div className="flex items-center gap-2 bg-bg-card border border-border-subtle rounded-full px-4 py-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-text-secondary">You're online and ready to chat</span>
              </div>
            </motion.div>
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
  );
}

// Helper component for Navigation Button
const NavButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative group flex lg:justify-center items-center gap-4 lg:gap-0 w-full lg:w-12 h-12 lg:rounded-xl transition-all duration-200 px-6 lg:px-0
      ${active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-white'}
    `}
  >
    {icon}
    {/* Label on mobile, Tooltip on Desktop */}
    <span className="lg:hidden font-medium">{label}</span>
    <div className="hidden lg:block absolute left-14 bg-bg-elevated text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {label}
    </div>
    {/* Active indicator bar */}
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}
  </button>
);

export default App;
