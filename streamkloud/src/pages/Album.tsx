import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Song, Album as AlbumType } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Play, Disc, Calendar, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/usePlayerStore';

export function Album() {
  const { name } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const { setQueue, setCurrentSong } = usePlayerStore();

  useEffect(() => {
    if (!name) return;

    // Fetch album details
    const albumsRef = collection(db, 'albums');
    const albumQuery = query(albumsRef, where('title', '==', name));
    const unsubscribeAlbum = onSnapshot(albumQuery, (snapshot) => {
      if (!snapshot.empty) {
        setAlbum({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AlbumType);
      }
    });

    const q = query(collection(db, 'songs'), where('album', '==', name));
    const unsubscribeSongs = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setSongs(fetchedSongs);
    });

    return () => {
      unsubscribeAlbum();
      unsubscribeSongs();
    };
  }, [name]);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setQueue(songs);
      setCurrentSong(songs[0]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 lg:gap-10 mb-8 lg:mb-12">
          <div className="w-48 h-48 lg:w-72 lg:h-72 rounded-xl bg-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 border border-zinc-800/50">
            {album?.coverUrl || songs[0]?.coverUrl ? (
              <img 
                src={album?.coverUrl || songs[0]?.coverUrl} 
                alt={name}
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <Disc className="w-24 h-24 lg:w-32 lg:h-32 text-zinc-600" />
            )}
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-xs lg:text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Album</span>
            <h1 className="text-4xl lg:text-7xl font-black text-white mb-4 lg:mb-6 tracking-tighter">{name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-zinc-400 font-medium mb-8">
              <span className="text-white hover:underline cursor-pointer">{album?.artist || songs[0]?.artist}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <div className="flex items-center gap-x-1">
                <Calendar className="w-4 h-4" />
                <span>{album?.releaseYear || 'N/A'}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span>{songs.length} songs</span>
            </div>

            <div className="flex items-center gap-x-4">
              <Button 
                onClick={handlePlayAll}
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-8 lg:px-12 h-12 lg:h-14 gap-x-2 text-sm lg:text-lg transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 lg:w-6 lg:h-6 fill-black" />
                Play All
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Tracklist</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
          {songs.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
              <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No songs found in this album yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
