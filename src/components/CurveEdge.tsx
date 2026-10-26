import {useEffect, useRef} from 'react';
import {clamp, easeOutCubic} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * The top edge of a section, lifted like the dust sheet. While the section
 * rises into view its top bulges upward into the section above in a soft
 * curve, then flattens as it settles — every change of section is a curve
 * in, not a hard line. `color` is this section's own background; a brass
 * hairline traces the crest.
 */
export function CurveEdge({color}: {color: string}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let last = -1;
    return onFrame(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -40 || r.top > vh + 40) return;
      // 1 while the edge is low on screen, easing to 0 by the top third.
      const k = easeOutCubic(clamp((r.top - vh * 0.25) / (vh * 0.65)));
      if (Math.abs(k - last) < 0.001) return;
      last = k;
      // Quadratic control point: -100 puts the crest at the top of the box.
      const c = 100 - k * 200;
      fillRef.current!.setAttribute('d', `M0 100.5 Q50 ${c} 100 100.5 Z`);
      lineRef.current!.setAttribute('d', `M0 100 Q50 ${c} 100 100`);
      lineRef.current!.style.opacity = String(k * 0.7);
    });
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[12vh] -translate-y-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path ref={fillRef} d="M0 100.5 Q50 -100 100 100.5 Z" fill={color} />
        <path ref={lineRef} d="M0 100 Q50 -100 100 100" fill="none" stroke="var(--color-brass)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
