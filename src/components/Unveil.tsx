import {useEffect, useRef, useState} from 'react';
import {asset, links} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {clamp, pinProgress} from '../lib/math';
import {onFrame, scrollToY} from '../lib/scroll';
/** Retains the original template's pinned reveal and single animation loop. */
export function Unveil() {
  const root=useRef<HTMLElement>(null),photo=useRef<HTMLImageElement>(null),lid=useRef<HTMLDivElement>(null),line=useRef<HTMLDivElement>(null);
  const [revealed,setRevealed]=useState(false);const reduced=useReducedMotion();
  useEffect(()=>onFrame(()=>{if(!root.current)return;const {p}=pinProgress(root.current);const k=clamp(p/0.62);if(photo.current)photo.current.style.transform=`scale(${reduced?1:1.1-k*0.1})`;if(lid.current){lid.current.style.transform=`translateY(${-k*106}%) rotate(${-k*8}deg)`;lid.current.style.opacity=String(1-clamp((k-0.65)/0.35));}if(line.current)line.current.style.transform=`scaleX(${p})`;}),[reduced]);
  const reveal=()=>{setRevealed(true);if(root.current)scrollToY(root.current.offsetTop+(root.current.offsetHeight-innerHeight)*0.7,false);};
  return <section ref={root} id="top" className="hero-pin" aria-label="Mecha Fairfield introduction"><div className="hero-stage"><div className="hero-copy"><p className="eyebrow orange">FAIRFIELD, CT / ASIAN COMFORT FOOD</p><h1>YOUR NEXT<br/>NOODLE<br/><em>obsession.</em></h1><p className="hero-body">Ramen. Pho. Good company.<br/> Make room for a better weekday at Mecha.</p><div className="hero-actions"><a className="button orange-button" href="#bowl-finder">Find your bowl <span>↘</span></a><a className="text-link" href={links.menu} target="_blank" rel="noreferrer">Official menu ↗</a></div><div className="hero-foot"><span>1215 POST ROAD</span><span>SLURPING ENCOURAGED ↓</span></div></div><div className="hero-visual"><img ref={photo} src={asset('ramen.webp')} alt="Mecha Tonkotsu ramen with pork, egg and corn, photographed on a bright orange table." fetchPriority="high" width="1004" height="1340" /><div ref={lid} className="bowl-lid" aria-hidden="true"><span>MECHA</span><div className="lid-rings">麺</div><p>GOOD THINGS<br/>ARE UNDER HERE.</p></div><button type="button" className="reveal-button" onClick={reveal}>{revealed?'KEEP SCROLLING ↓':'LIFT THE LID ↗'}</button><span className="photo-label">TONKOTSU 3.0 / MECHA NOODLE BAR</span></div><div className="reveal-progress" aria-hidden="true"><div ref={line}/></div></div></section>;
}
