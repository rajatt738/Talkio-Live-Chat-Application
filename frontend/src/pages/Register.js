import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import API from "../services/api";

export default function Register({ onSwitchToLogin }) {
  const [form, setForm]               = useState({ username: "", email: "", password: "" });
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);
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

  /* ── Success state ─────────────────────────────────────── */
  if (success) {
    return (
      <div className="auth-card text-center">
        <div className="flex justify-center mb-6 text-status-online">
          <CheckCircle2 size={64} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Account created!</h3>
        <p className="text-text-secondary text-sm mb-8">
          Your account has been successfully created. You can now log in.
        </p>
        <button onClick={onSwitchToLogin} className="btn-primary">
          Go to Login
        </button>
      </div>
    );
  }

  /* ── Registration form ─────────────────────────────────── */
  return (
    <div className="auth-card">
      {/* Mobile brand mark */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent-pink">
          <MessageSquare size={16} className="text-white" />
        </div>
        <span className="text-xl font-black tracking-tight text-white">Talkio</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create account</h2>
        <p className="text-text-secondary text-sm">Join Talkio and start chatting today.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <label className="form-label">Username</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <User size={18} />
            </div>
            <input
              placeholder="Choose a username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input-field input-with-icon"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="form-label">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field input-with-icon"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="form-label">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field pl-11 pr-12"
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

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary mt-4">
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 pt-6 border-t border-border-subtle text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
          Login
        </button>
      </div>
    </div>
  );
}
