"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight CSS-only confetti burst. Renders ~40 colored pieces
 * that fall and rotate, then self-destructs after 3 seconds.
 */
export default function ConfettiEffect() {
  const [pieces, setPieces] = useState<
    { id: number; left: number; color: string; delay: number; size: number; duration: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
      "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
    ];
    const generated = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.6,
      size: 6 + Math.random() * 6,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setPieces(generated);

    // Self-destruct after animation
    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
