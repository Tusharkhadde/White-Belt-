import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

export default function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    })), []
  );

  const shootingStars = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 30}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 10 + 5,
    })), []
  );

  useGSAP(() => {
    const ctx = gsap.context(() => {
      stars.forEach((s) => {
        gsap.to(`.star-${s.id}`, {
          opacity: 0.9,
          duration: s.duration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: s.delay,
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, { dependencies: [], scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className={`star-${s.id} absolute rounded-full bg-white`}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: 0.15,
          }}
        />
      ))}
      {shootingStars.map((s) => (
        <div
          key={`shoot-${s.id}`}
          className="absolute size-0.5 rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            animation: `shoot 3s linear infinite`,
            animationDelay: `${s.delay}s`,
          }}
        >
          <div className="absolute top-0 right-0 w-16 h-px bg-gradient-to-l from-transparent to-white/60 translate-x-full" />
        </div>
      ))}
    </div>
  );
}
