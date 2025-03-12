'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ClickableImageProps {
  onImageClick: () => void;
}

export default function ClickableImage({ onImageClick }: ClickableImageProps) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Continuous bouncy animation
    gsap.to(imageRef.current, {
      y: -10,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }, []);

  const createHeart = (x: number, y: number) => {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'absolute';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = '24px';
    heart.style.pointerEvents = 'none';
    containerRef.current?.appendChild(heart);

    gsap.to(heart, {
      y: -100,
      x: gsap.utils.random(-50, 50),
      opacity: 0,
      duration: 1,
      ease: "power1.out",
      onComplete: () => heart.remove()
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create multiple hearts for a more fun effect
    for (let i = 0; i < 3; i++) {
      createHeart(x, y);
    }
    
    onImageClick();
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <Image
        ref={imageRef}
        src="/images/coffee.png"
        alt="约时间"
        width={200}
        height={200}
        className="mx-auto cursor-pointer"
        id="coffee-banner"
        onClick={handleClick}
      />
    </div>
  );
} 