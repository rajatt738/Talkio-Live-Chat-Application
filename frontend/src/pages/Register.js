import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import API from "../services/api";

export default function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bg-card/80 backdrop-blur-2xl border border-border-subtle rounded-3xl p-10 w-full shadow-2xl text-center">
        <div className="flex justify-center mb-6 text-status-online">
          <CheckCircle2 size={64} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Account created!</h3>
        <p className="text-text-secondary text-sm mb-8">
          Your account has been successfully created. You can now log in with your credentials.
        </p>
        <button
          onClick={onSwitchToLogin}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-pink text-white font-bold text-[15px] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg-card/80 backdrop-blur-2xl border border-border-subtle rounded-3xl p-8 sm:p-10 w-full shadow-2xl relative">
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <span className="text-3xl">🔥</span>
        <span className="text-xl font-black tracking-tight text-white">Talkio</span>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create account</h2>
        <p className="text-text-secondary text-sm">Join Talkio and start chatting today.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">Username</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <User size={18} />
            </div>
            <input
              placeholder="Choose a username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle bg-bg-elevated/50 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle bg-bg-elevated/50 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-border-subtle bg-bg-elevated/50 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary via-[#8A71F6] to-accent-pink text-white font-bold text-[15px] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-border-subtle text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
          Login
        </button>
      </div>
    </div>
  );
}
