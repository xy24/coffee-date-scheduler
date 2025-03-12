'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';

interface AnimatedReactionButtonProps {
  onClick: () => void;
  emoji: string;
  label: string;
  count: number;
  className?: string;
}

export default function AnimatedReactionButton({
  onClick,
  emoji,
  label,
  count,
  className = ''
}: AnimatedReactionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const createFloatingEmoji = (x: number, y: number) => {
    const emojiEl = document.createElement('div');
    emojiEl.innerHTML = emoji;
    emojiEl.style.position = 'absolute';
    emojiEl.style.left = `${x}px`;
    emojiEl.style.top = `${y}px`;
    emojiEl.style.fontSize = '24px';
    emojiEl.style.pointerEvents = 'none';
    containerRef.current?.appendChild(emojiEl);

    gsap.to(emojiEl, {
      y: -60,
      x: gsap.utils.random(-30, 30),
      opacity: 0,
      duration: 0.8,
      ease: "power1.out",
      onComplete: () => emojiEl.remove()
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create multiple emojis for a fun effect
    for (let i = 0; i < 3; i++) {
      createFloatingEmoji(x, y);
    }
    
    // Add a quick scale animation to the button
    gsap.to(e.currentTarget, {
      scale: 1.1,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut"
    });
    
    onClick();
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={handleClick}
        className={`reaction-btn px-4 py-2 rounded-full ${className}`}
      >
        <span className="emoji">{emoji}{label}</span>
        <span className="count ml-2">{count}</span>
      </button>
    </div>
  );
} 