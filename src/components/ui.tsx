import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Btn({ variant = "primary", size = "md", fullWidth, children, className = "", ...props }: BtnProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 gap-2";
  const variants = {
    primary: "bg-primary text-white hover:bg-orange-500",
    secondary: "bg-card2 text-text2 hover:bg-border2",
    ghost: "bg-transparent text-text2 hover:bg-card2",
    danger: "bg-red-dim text-red hover:bg-red/20",
    outline: "border border-border2 text-text2 hover:bg-card2 bg-transparent",
  };
  const sizes = {
    sm: "text-sm px-3 py-2",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-5 py-3.5",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border p-4 ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card2 text-text2 hover:bg-border2 transition-colors flex-shrink-0">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      )}
      <h1 className="font-display text-xl font-bold text-text tracking-wide flex-1">{title}</h1>
      {right}
    </div>
  );
}

export function Input({
  label, error, ...props
}: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-text2 uppercase tracking-wider">{label}</label>}
      <input
        className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors w-full"
        {...props}
      />
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}

export function Select({
  label, error, children, ...props
}: { label?: string; error?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-text2 uppercase tracking-wider">{label}</label>}
      <select
        className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:border-primary/60 transition-colors w-full appearance-none"
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">{children}</p>;
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <p className="text-text2 font-semibold text-base mb-1">{title}</p>
      {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border2 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-text tracking-wide">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-muted hover:text-text">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function SuccessModal({ open, onClose, title, message }: { open: boolean; onClose: () => void; title: string; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-green/30 rounded-3xl w-full max-w-xs p-8 text-center">
        <div className="w-16 h-16 bg-green-dim rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
        <h3 className="font-display text-xl font-bold text-text mb-2">{title}</h3>
        <p className="text-text2 text-sm mb-6">{message}</p>
        <Btn onClick={onClose} fullWidth>Done</Btn>
      </div>
    </div>
  );
}
