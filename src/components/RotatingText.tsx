"use client";

import { useEffect, useState } from "react";

const WORDS = ["interviews", "callbacks", "your dream job", "noticed"];
const INTERVAL = 3000;

export default function RotatingText() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 400); // match fade-out duration
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span
        className={`inline-block bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent transition-all duration-400 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0"
        }`}
      >
        {WORDS[index]}
      </span>
    </span>
  );
}
