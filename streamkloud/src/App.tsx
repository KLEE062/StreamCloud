import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { NotificationInitializer } from './components/NotificationInitializer';
import { SongPopulator } from './components/SongPopulator';
import { Toaster } from 'sonner';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Upload } from './pages/Upload';
import { Artist } from './pages/Artist';
import { Album } from './pages/Album';
import { Playlist } from './pages/Playlist';
import { Albums } from './pages/Albums';
import { Genre } from './pages/Genre';
import { Subscription } from './pages/Subscription';
import { Library } from './pages/Library';
import { Admin } from './pages/Admin';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden">
      {!isAdminPage && <Sidebar />}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!isAdminPage && <Header />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/artist/:name" element={<Artist />} />
          <Route path="/album/:name" element={<Album />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/genre/:name" element={<Genre />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/library" element={<Library />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdminPage && <Player />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
      <AuthModal />
      <ProfileModal />
      <NotificationInitializer />
      <SongPopulator />
      <Toaster position="top-center" richColors />
    </Router>
  );
}
