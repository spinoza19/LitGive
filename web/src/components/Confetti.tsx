"use client";

import { useEffect, useState } from "react";

// Tiny confetti without dependencies — pure CSS-animated dots.
export function Confetti({ duration = 3000 }: { duration?: number }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), duration);
    return () => clearTimeout(t);
  }, [duration]);
  if (!alive) return null;

  const pieces = Array.from({ length: 60 }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const dur = 1.5 + Math.random() * 1.5;
    const colors = ["#cdb380", "#2c4070", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 6;
    return (
      <span
        key={i}
        className="absolute top-0 rounded-sm"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 1.6}px`,
          background: color,
          animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
          transform: "translateY(-20px) rotate(0deg)",
          opacity: 0.95,
        }}
      />
    );
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
