import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Song, Playlist } from '@/types';
import { SongCard } from '@/components/SongCard';
import { ListMusic, Music2, Plus, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuthModal } from '@/store/useAuthModal';

export function Library() {
  const [user] = useAuthState(auth);
  const { open } = useAuthModal();
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const { playlists, createPlaylist } = usePlaylists();
  const [activeTab, setActiveTab] = useState<'playlists' | 'uploads'>('playlists');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'songs'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setUserSongs(songs);
    });

    return () => unsubscribe();
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
        <Layers className="w-20 h-20 text-zinc-800 mb-6" />
        <h1 className="text-3xl font-black text-white mb-4">Your Library</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Log in to see your playlists, liked songs, and uploaded tracks.
        </p>
        <Button 
          onClick={() => open('login')}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-8 h-12"
        >
          Log In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-x-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white">Library</h1>
          </div>
          <div className="flex bg-zinc-900 rounded-full p-1">
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'playlists' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'uploads' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Uploads
            </button>
          </div>
        </div>

        {activeTab === 'playlists' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Playlists</h2>
              <Button 
                onClick={handleCreatePlaylist}
                variant="outline" 
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full gap-x-2"
              >
                <Plus className="w-4 h-4" />
                New Playlist
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className="group bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-square mb-4 shadow-2xl overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
                    <ListMusic className="w-12 h-12 text-zinc-700 group-hover:text-orange-500/40 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <span className="font-bold text-white truncate">{playlist.name}</span>
                    <span className="text-zinc-400 text-sm truncate">{playlist.songIds.length} songs</span>
                  </div>
                </Link>
              ))}

              {playlists.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-3xl">
                  <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                  <p>You haven't created any playlists yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Uploads</h2>
              <Link to="/upload">
                <Button 
                  variant="outline" 
                  className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full gap-x-2"
                >
                  <Plus className="w-4 h-4" />
                  Upload Song
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {userSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}

              {userSongs.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-3xl">
                  <Music2 className="w-12 h-12 mb-4 opacity-20" />
                  <p>You haven't uploaded any songs yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
