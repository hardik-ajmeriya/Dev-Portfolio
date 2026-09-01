import { SpeedInsights } from '@vercel/speed-insights/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Cursor />
      <Navbar />
      <main className="flex-grow">
        <Home />
      </main>
      <Footer />
      <SpeedInsights />
    </div>
  );
}
