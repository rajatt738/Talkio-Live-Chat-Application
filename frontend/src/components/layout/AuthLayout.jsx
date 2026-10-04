import React from "react";
import { MessageSquare, Shield, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary font-sans">
      {/* Left Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-bg-sidebar flex-col justify-center p-12 overflow-hidden border-r border-border-subtle">
        {/* Background ambient effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-pink/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent-pink shadow-lg shadow-primary/30">
              <MessageSquare size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Talkio</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Real-time · Secure · Private
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 text-white">
              Private conversations that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-pink">feel real.</span>
            </h1>
            <p className="text-text-secondary text-base xl:text-lg mb-10 leading-relaxed">
              Talkio is a modern real-time messaging platform built for meaningful conversations without compromises.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue mt-1">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Real-time Chat</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Instant and reliable messaging with your team and friends without any delays.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mt-1">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Your Privacy Matters</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Secure conversations with industry-standard encryption and data protection.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-pink/10 flex items-center justify-center text-accent-pink mt-1">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Anytime, Anywhere</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Stay connected across all your devices with real-time sync capabilities.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Auth Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto min-h-screen">
        {/* Mobile ambient effects */}
        <div className="absolute inset-0 bg-bg-base lg:hidden z-[-1]" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none lg:hidden z-[-1]" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] my-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
