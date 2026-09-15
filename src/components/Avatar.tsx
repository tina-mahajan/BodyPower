import { useState } from "react";

const COLORS = [
  "bg-primary/20 text-primary",
  "bg-blue-dim text-blue",
  "bg-green-dim text-green",
  "bg-amber-dim text-amber",
  "bg-red-dim text-red",
];

export default function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [imgError, setImgError] = useState(false);

  const idx = name ? name.charCodeAt(0) % COLORS.length : 0;
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "BP";

  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";
  const fullSrc = src ? (src.startsWith("http") || src.startsWith("data:") ? src : `${API_BASE}${src}`) : undefined;

  if (fullSrc && !imgError) {
    return (
      <img
        src={fullSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeMap[size]} rounded-full object-cover border border-border2 flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${COLORS[idx]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
