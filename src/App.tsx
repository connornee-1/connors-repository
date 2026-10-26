import {useEffect} from 'react';
import {Atelier} from './components/Atelier';
import {Footer, Header} from './components/Chrome';
import {Details} from './components/Details';
import {Enquire} from './components/Enquire';
import {Specs} from './components/Specs';
import {Unveil} from './components/Unveil';
import {useReducedMotion} from './hooks/useReducedMotion';
import {startScroll} from './lib/scroll';
export default function App() {
  const reduced = useReducedMotion();
  useEffect(() => startScroll(reduced), [reduced]);
  return <><Header /><main id="main"><Unveil /><Details /><Specs /><Atelier /><Enquire /></main><Footer /><div aria-hidden="true" className="grain-overlay" /></>;
}
