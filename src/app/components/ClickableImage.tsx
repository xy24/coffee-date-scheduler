'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface ClickableImageProps {
  onImageClick: () => void;
}

export default function ClickableImage({ onImageClick }: ClickableImageProps) {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Add continuous floating animation
  useEffect(() => {
    if (imageRef.current) {
      // Create a repeating floating animation
      gsap.to(imageRef.current, {
        y: -10,
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    }
  }, []);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get click position relative to the image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add a new heart
    const newHeart = { id: Date.now(), x, y };
    setHearts(prev => [...prev, newHeart]);
    
    // Call the parent's click handler
    onImageClick();
    
    // Add bouncy animation to the image
    if (imageRef.current) {
      // Kill the floating animation temporarily
      gsap.killTweensOf(imageRef.current, "y");
      
      // Reset y position to avoid jumps
      gsap.set(imageRef.current, { y: 0 });
      
      // Do the bounce animation
      gsap.to(imageRef.current, {
        scale: 1.1,
        duration: 0.2,
        ease: "power1.out",
        onComplete: () => {
          gsap.to(imageRef.current, {
            scale: 0.95,
            duration: 0.2,
            ease: "power1.in",
            onComplete: () => {
              gsap.to(imageRef.current, {
                scale: 1.05,
                duration: 0.15,
                ease: "power1.out",
                onComplete: () => {
                  gsap.to(imageRef.current, {
                    scale: 1,
                    duration: 0.15,
                    ease: "power1.in",
                    onComplete: () => {
                      // Restart the floating animation
                      gsap.to(imageRef.current, {
                        y: -10,
                        duration: 1.5,
                        ease: "sine.inOut",
                        repeat: -1,
                        yoyo: true
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  };
  
  // Remove hearts after animation
  useEffect(() => {
    if (hearts.length > 0) {
      const timer = setTimeout(() => {
        setHearts(prev => prev.slice(1));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hearts]);
  
  return (
    <div className="relative inline-block cursor-pointer" onClick={handleClick} ref={imageRef}>
      <Image
        src="/images/coffee.png"
        alt="约时间"
        width={200}
        height={200}
        className="mx-auto cursor-pointer"
        id="coffee-banner"
      />
      
      {/* Hearts animation */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute pointer-events-none"
          style={{
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            animation: 'float-up 1s ease-out forwards',
          }}
        >
          ❤️
        </div>
      ))}
      
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: scale(0.5) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(1.5) translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 