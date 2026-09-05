import Hero from '../components/sections/Hero';
import Ticker from '../components/sections/Ticker';
import Work from '../components/sections/Work';
import Stats from '../components/sections/Stats';
import Services from '../components/sections/Services';
import Tech from '../components/sections/Tech';
import Process from '../components/sections/Process';
import About from '../components/sections/About';
import Contact from '../components/sections/Contact';

/**
 * The whole site is one scrolling page. Section order is deliberate:
 * proof (Work) comes before the pitch (Services), because a visitor
 * decides whether to keep reading based on what has already been built.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <Work />
      <Stats />
      <Services />
      <Tech />
      <Process />
      <About />
      <Contact />
    </>
  );
}
