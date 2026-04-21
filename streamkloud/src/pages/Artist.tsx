import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Song, Artist as ArtistType } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Play, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/usePlayerStore';

export function Artist() {
  const { name } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const { setQueue, setCurrentSong } = usePlayerStore();

  useEffect(() => {
    if (!name) return;

    // Fetch artist details
    const artistsRef = collection(db, 'artists');
    const artistQuery = query(artistsRef, where('name', '==', name));
    const unsubscribeArtist = onSnapshot(artistQuery, (snapshot) => {
      if (!snapshot.empty) {
        setArtist({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ArtistType);
      }
    });

    const q = query(collection(db, 'songs'), where('artist', '==', name));
    const unsubscribeSongs = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setSongs(fetchedSongs);
    });

    return () => {
      unsubscribeArtist();
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
          <div className="w-48 h-48 lg:w-72 lg:h-72 rounded-full bg-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 border-4 border-zinc-900">
            {artist?.imageUrl ? (
              <img 
                src={artist.imageUrl || 'https://picsum.photos/seed/artist/200/200'} 
                alt={artist.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <User className="w-24 h-24 lg:w-32 lg:h-32 text-zinc-600" />
            )}
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-x-2 mb-2">
              <span className="text-xs lg:text-sm font-bold text-orange-500 uppercase tracking-widest">Verified Artist</span>
              {artist?.isVerified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
            </div>
            <h1 className="text-4xl lg:text-8xl font-black text-white mb-6 lg:mb-8 tracking-tighter">{name}</h1>
            {artist?.bio && <p className="text-zinc-400 max-w-2xl mb-8">{artist.bio}</p>}
            <div className="flex items-center gap-x-3 lg:gap-x-4">
              <Button 
                onClick={handlePlayAll}
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-6 lg:px-10 h-10 lg:h-14 gap-x-2 text-sm lg:text-lg transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 lg:w-6 lg:h-6 fill-black" />
                Play All
              </Button>
              <Button variant="outline" className="border-zinc-800 text-white rounded-full px-6 lg:px-10 h-10 lg:h-14 text-sm lg:text-lg hover:bg-zinc-900">
                Follow
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Songs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
