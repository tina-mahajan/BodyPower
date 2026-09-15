import { useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function SplashScreen() {
  const { navigate } = useApp();

  useEffect(() => {
    const t = setTimeout(() => navigate("login"), 2400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="w-56 h-56 bg-primary/10 rounded-full blur-2xl absolute" />
      </div>

      <div className="relative flex flex-col items-center gap-6 animate-[fadeIn_0.8s_ease_forwards]">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)]">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect x="4" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7"/>
              <rect x="40" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7"/>
              <rect x="14" y="16" width="24" height="20" rx="3" fill="white"/>
              <rect x="12" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9"/>
              <rect x="36" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9"/>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-display text-5xl font-extrabold text-text tracking-wider leading-none mb-2">
            BODY<span className="text-primary">POWER</span>
          </h1>
          <p className="text-text2 text-base tracking-[0.3em] uppercase font-medium">G Y M</p>
        </div>

        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-muted text-sm tracking-widest uppercase">Stronger Every Day</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-[pulse_1.2s_ease_infinite]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
