"use client";

import { useEffect, useState, useRef } from "react";

const WORDS = ["interviews", "callbacks", "hired", "noticed"];
const TYPE_SPEED = 80; // ms per character typing
const DELETE_SPEED = 50; // ms per character deleting
const PAUSE_AFTER_TYPE = 2000; // pause when word is fully typed
const PAUSE_AFTER_DELETE = 400; // pause before typing next word

export default function RotatingText() {
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const wordIndex = useRef(0);

  useEffect(() => {
    const currentWord = WORDS[wordIndex.current];

    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Typing
      if (displayed.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayed(currentWord.slice(0, displayed.length + 1));
        }, TYPE_SPEED);
      } else {
        // Word fully typed — pause then start deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_AFTER_TYPE);
      }
    } else {
      // Deleting
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        // Fully deleted — move to next word
        wordIndex.current = (wordIndex.current + 1) % WORDS.length;
        setIsDeleting(false);
        timeout = setTimeout(() => {
          // small pause before next word starts typing
        }, PAUSE_AFTER_DELETE);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting]);

  return (
    <span className="inline-block align-bottom">
      <span className="inline bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
        {displayed}
      </span>
      <span className="animate-blink ml-[1px] inline-block h-[1em] w-[2px] translate-y-[2px] bg-primary align-baseline" />
    </span>
  );
}
