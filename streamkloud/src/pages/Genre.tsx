import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Song } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Music2 } from 'lucide-react';

export function Genre() {
  const { name } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (!name) return;
    const q = query(collection(db, 'songs'), where('genre', '==', name));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setSongs(fetchedSongs);
    });
    return () => unsubscribe();
  }, [name]);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-x-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Genre</span>
            <h1 className="text-3xl lg:text-4xl font-black text-white">{name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>

        {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Music2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No songs found in this genre yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
