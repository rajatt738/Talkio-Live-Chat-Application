import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, MessageSquare } from "lucide-react";
import API from "../services/api";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm]               = useState({ email: "", password: "" });
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Mobile brand mark (hidden on lg — shown in AuthLayout hero) */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent-pink">
          <MessageSquare size={16} className="text-white" />
        </div>
        <span className="text-xl font-black tracking-tight text-white">Talkio</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h2>
        <p className="text-text-secondary text-sm">Log in to continue to your account.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
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
              placeholder="Enter your password"
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

        {/* Forgot password */}
        <div className="flex justify-end pt-1">
          <button type="button" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Login →"}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-6 border-t border-border-subtle text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <button onClick={onSwitchToRegister} className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
          Create account
        </button>
      </div>
    </div>
  );
}
