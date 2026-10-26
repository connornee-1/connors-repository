import {useState} from 'react';
import {asset, base, disclaimer, links} from '../content';
import {scrollToHash} from '../lib/scroll';
const nav = [['#menu','The food'], ['#bowl-finder','Find your bowl'], ['#community','The good stuff'], ['#visit','Find us']];
export function Header() {
  const [open,setOpen]=useState(false);
  return <><a className="skip-link" href="#main">Skip to content</a><div className="education-banner">{disclaimer}</div>
  <header className="header"><a className="brand" href="#top" aria-label="Mecha Fairfield back to top" onClick={e=>{e.preventDefault();scrollToHash('#top');setOpen(false);}}><img src={asset('logo.png')} width="46" height="46" alt="Mecha Noodle Bar logo" /><span>MECHA<span className="brand-small">NOODLE BAR · FAIRFIELD</span></span></a>
    <button className="menu-toggle" type="button" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="primary-nav" onClick={()=>setOpen(!open)}>{open?'Close −':'Menu +'}</button>
    <nav id="primary-nav" aria-label="Main navigation" className={open?'nav is-open':'nav'}>{nav.map(([hash,label])=><a key={hash} href={hash} onClick={e=>{e.preventDefault();scrollToHash(hash);setOpen(false);}}>{label}</a>)}<a className="nav-cta" href={links.directions} target="_blank" rel="noreferrer">Get directions ↗</a></nav>
  </header></>;
}
export function Footer() {
  return <footer className="footer"><div className="footer-top"><a className="brand" href="#top" onClick={e=>{e.preventDefault();scrollToHash('#top');}}><span>MECHA<span className="brand-small">FAIRFIELD, CONNECTICUT</span></span></a><div className="social-links"><a href={links.instagram} target="_blank" rel="noreferrer">Instagram ↗</a><a href={links.facebook} target="_blank" rel="noreferrer">Facebook ↗</a><a href={links.official} target="_blank" rel="noreferrer">Official website ↗</a></div></div><p className="footer-word" aria-hidden="true">GOOD NOODS.</p><div className="footer-bottom"><p>Independent student project · MKTG 2241 · Fairfield University</p><a href={`${base}personal/`}>Connor’s personal website ↗</a></div><details className="credits"><summary>Project sources and image credits</summary><p>Client context: supplied Mecha Noodle Bar Client Brief and Mecha Campaign Plan by Connor, JP and Mason. Logo: supplied client materials. Food photos: Mecha Noodle Bar official dish pages. Additional artwork: Mecha’s official homepage and menu. Restaurant details and links: <a href={links.locations}>official locations</a>, <a href={links.menu}>official menu</a> and <a href={links.official}>official website</a>. Check the official menu for availability and allergens. Reviewed October 26, 2026.</p></details></footer>;
}
