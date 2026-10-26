import {useEffect, useRef} from 'react';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {clamp} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * A band of huge outlined lettering between sections. It drifts on its own,
 * surges with the scroll — faster the harder you scroll, backwards when you
 * scroll up — and leans into the motion (a skew that springs back), like
 * type on a panning camera.
 */
export function Marquee({text}: {text: string}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    let x = 0;
    let lastY = window.scrollY;
    let lastTime = 0;
    let v = 0;
    let dir = -1;
    return onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (dy) dir = dy > 0 ? -1 : 1;
      v += (dy / Math.max(dt, 0.001) - v) * 0.1;
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track || reducedRef.current) return;
      const r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      x += dir * (40 + Math.min(Math.abs(v), 3000) * 0.4) * dt;
      const half = track.scrollWidth / 2;
      if (half > 0) x = ((x % half) - half) % half;
      const skew = clamp(-v / 250, -12, 12);
      track.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew}deg)`;
    });
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="relative overflow-hidden bg-ink py-8 md:py-14">
      <div ref={trackRef} className="flex w-max will-change-transform">
        {[0, 1].map((k) => (
          <span
            key={k}
            className="wide pr-[0.4em] font-display text-[clamp(4rem,13vw,13rem)] leading-none font-extralight whitespace-nowrap text-transparent uppercase"
            style={{WebkitTextStroke: '1px rgb(201 163 106 / 0.55)'}}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
