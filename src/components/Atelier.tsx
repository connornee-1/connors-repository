import {useEffect,useRef} from 'react';
import {asset,links} from '../content';
import {useReveals} from '../hooks/useReveals';
import {clamp,smoothstep} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {Marquee} from './Marquee';
export function Atelier(){
 const ref=useReveals<HTMLElement>();const sheet=useRef<HTMLDivElement>(null),fig=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();
 useEffect(()=>onFrame(()=>{if(!fig.current||!sheet.current)return;const r=fig.current.getBoundingClientRect();const k=reduced?1:smoothstep(clamp((innerHeight-r.top)/(innerHeight*0.85)));sheet.current.style.transform=`translateX(${k*110}%) rotate(${k*6}deg)`;sheet.current.style.opacity=String(1-clamp((k-0.75)*4));}),[reduced]);
 return <section ref={ref} id="community" className="community"><Marquee text="GOOD FOOD · GOOD COMPANY · FAIRFIELD · "/><div className="community-grid section-pad"><div ref={fig} className="community-photo"><img src={asset('hero.webp')} alt="Mecha’s blue-and-white artwork featuring noodles, bao, chopsticks and the message good friends, good vibes, good times." width="1500" height="971" loading="lazy"/><div ref={sheet} className="community-sheet" aria-hidden="true">GOOD<br/>THINGS<br/>TOGETHER. <span>↗</span></div></div><div className="community-copy" data-reveal><p className="eyebrow orange">03 / MORE THAN A MEAL</p><h2>LOCAL BOWLS.<br/><em>Local good.</em></h2><p>Mecha brings Asian comfort food to the neighborhood with a mission to serve its communities and give back.</p><p>Bring a friend from campus. Catch up after class. Make a weekday dinner part of your routine.</p><a className="text-link" href={links.official} target="_blank" rel="noreferrer">Meet the real Mecha ↗</a></div></div></section>;
}
