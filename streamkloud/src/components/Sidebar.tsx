import React from 'react';
import { Home, Music, Diamond, Layers, Disc, Plus, ListMusic, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { usePlaylists } from '@/hooks/usePlaylists';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Music, label: 'Discover', path: '/search' },
  { icon: Diamond, label: 'Pro Plans', path: '/subscription' },
  { icon: Layers, label: 'Library', path: '/library' },
];

import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuthModal } from '@/store/useAuthModal';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const { open } = useAuthModal();
  const [subscription, setSubscription] = useState<any>(null);
  const { playlists, createPlaylist } = usePlaylists();

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setSubscription(doc.data().subscription);
        }
      });
      return () => unsubscribe();
    } else {
      setSubscription(null);
    }
  }, [user]);

  const handleAuthLink = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      open('login');
    }
  };

  const handleCreatePlaylist = () => {
    if (!user) {
      open('login');
      return;
    }
    const name = prompt('Enter playlist name:');
    if (name) {
      createPlaylist(name);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-full bg-black text-zinc-400 w-72 p-8 gap-y-12 border-r border-zinc-900 shrink-0">
        <Link to="/" className="group">
          <Logo />
        </Link>

        <nav className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">Menu</p>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (item.label === 'Library') handleAuthLink(e, item.path);
                  }}
                  className={cn(
                    "flex items-center gap-x-6 font-medium transition-all duration-300 px-4 py-3 rounded-xl group",
                    isActive 
                      ? "bg-warm-gradient text-black shadow-lg shadow-orange-500/20" 
                      : "hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "w-7 h-7 transition-colors",
                    isActive ? "text-black" : "group-hover:text-white"
                  )} />
                  <span className="text-lg">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-2 pt-6">
            <div className="flex items-center justify-between px-4 mb-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Playlists</p>
              <button 
                onClick={handleCreatePlaylist}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Create Playlist"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1">
              {playlists.map((playlist) => {
                const isActive = location.pathname === `/playlist/${playlist.id}`;
                return (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className={cn(
                      "flex items-center gap-x-4 px-4 py-2 hover:text-white transition-colors group truncate",
                      isActive ? "text-orange-500" : ""
                    )}
                  >
                    <ListMusic className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-orange-500" : "group-hover:text-orange-500 transition-colors"
                    )} />
                    <span className="text-sm font-medium truncate">{playlist.name}</span>
                  </Link>
                );
              })}
              
              {playlists.length === 0 && user && (
                <p className="px-4 text-xs text-zinc-600 italic">No playlists yet</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-6">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">Your Library</p>
            {user?.email === 'rickylemar0@gmail.com' && (
              <Link 
                to="/admin" 
                className={cn(
                  "flex items-center gap-x-6 px-4 py-3 hover:text-white transition-colors group",
                  location.pathname === '/admin' ? "text-orange-500" : ""
                )}
              >
                <Settings className="w-7 h-7 group-hover:text-orange-500 transition-colors" />
                <span className="text-lg font-bold">Admin Panel</span>
              </Link>
            )}
            <Link 
              to="/albums" 
              onClick={(e) => handleAuthLink(e, '/albums')}
              className="flex items-center gap-x-6 px-4 py-3 hover:text-white transition-colors group"
            >
              <Disc className="w-7 h-7 group-hover:text-orange-500 transition-colors" />
              <span className="text-lg">Albums</span>
            </Link>
            <Link 
              to="/upload" 
              onClick={(e) => handleAuthLink(e, '/upload')}
              className="flex items-center gap-x-6 px-4 py-3 hover:text-white transition-colors group"
            >
              <Layers className="w-7 h-7 group-hover:text-orange-500 transition-colors" />
              <span className="text-lg">Upload Music</span>
            </Link>
          </div>

          {user && subscription && (
            <div className="mt-auto pt-8 border-t border-zinc-900">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Plan</span>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                    subscription.plan === 'trial' ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {subscription.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Status</span>
                  <span className="text-xs text-white font-medium">{subscription.status}</span>
                </div>
                {subscription.expiryDate && (
                  <p className="text-[10px] text-zinc-600 mt-2">
                    Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 z-50 px-4">
        <nav className="flex items-center justify-around h-full max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.label === 'Library') handleAuthLink(e, item.path);
                }}
                className={cn(
                  "flex flex-col items-center gap-y-1 transition-colors relative py-2",
                  isActive ? "text-white" : "text-zinc-500"
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6",
                  isActive && "text-orange-500"
                )} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
