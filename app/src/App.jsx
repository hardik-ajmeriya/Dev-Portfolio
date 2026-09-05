import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* First thing in the tab order: lets a keyboard or screen-reader user
          jump the navigation instead of tabbing through it on every visit.
          WCAG 2.4.1. Invisible until focused. */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Cursor />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-grow">
        <Home />
      </main>
      <Footer />
    </div>
  );
}
