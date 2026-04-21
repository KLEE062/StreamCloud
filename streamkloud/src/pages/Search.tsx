import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Song, Artist, Album } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Search as SearchIcon, X, User, Disc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function Search() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'artist' | 'genre' | 'album'>('all');
  const { setQueue } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeSongs = onSnapshot(query(collection(db, 'songs')), (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });

    const unsubscribeArtists = onSnapshot(query(collection(db, 'artists')), (snapshot) => {
      setArtists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)));
    });

    const unsubscribeAlbums = onSnapshot(query(collection(db, 'albums')), (snapshot) => {
      setAlbums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));
    });

    return () => {
      unsubscribeSongs();
      unsubscribeArtists();
      unsubscribeAlbums();
    };
  }, []);

  const filteredSongs = songs.filter(song => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || 
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album?.toLowerCase().includes(q) ||
      song.genre?.toLowerCase().includes(q);
  });

  const filteredArtists = artists.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-6 lg:mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            className="bg-zinc-900 border-none h-10 lg:h-12 pl-12 pr-12 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-white rounded-full text-sm lg:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-x-2 lg:gap-x-3 mb-6 lg:mb-8 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          {(['all', 'artist', 'genre', 'album'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'secondary'}
              className={cn(
                "h-8 lg:h-10 text-xs lg:text-sm px-4 lg:px-6 rounded-full capitalize",
                activeFilter === filter ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'
              )}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter + 's'}
            </Button>
          ))}
        </div>

        {searchQuery ? (
          <div className="space-y-8">
            {(activeFilter === 'all' || activeFilter === 'artist') && filteredArtists.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {filteredArtists.map(artist => (
                    <div 
                      key={artist.id} 
                      className="bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all cursor-pointer text-center"
                      onClick={() => navigate(`/artist/${artist.name}`)}
                    >
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-zinc-800 mx-auto mb-4 overflow-hidden">
                        {artist.imageUrl ? (
                          <img 
                            src={artist.imageUrl || 'https://picsum.photos/seed/artist/200/200'} 
                            alt={artist.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <User className="w-full h-full p-6 text-zinc-600" />
                        )}
                      </div>
                      <span className="font-bold text-white block truncate">{artist.name}</span>
                      <span className="text-zinc-500 text-xs">Artist</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeFilter === 'all' || activeFilter === 'album') && filteredAlbums.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {filteredAlbums.map(album => (
                    <div 
                      key={album.id} 
                      className="bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/album/${album.title}`)}
                    >
                      <div className="aspect-square bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                        {album.coverUrl ? (
                          <img 
                            src={album.coverUrl || 'https://picsum.photos/seed/album/200/200'} 
                            alt={album.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Disc className="w-full h-full p-8 text-zinc-600" />
                        )}
                      </div>
                      <span className="font-bold text-white block truncate">{album.title}</span>
                      <span className="text-zinc-500 text-xs truncate block">{album.artist}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeFilter === 'all' || activeFilter === 'genre') && filteredSongs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Songs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {filteredSongs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {(activeFilter === 'all' || activeFilter === 'genre') && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4">
                <h2 className="col-span-full text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-4">Browse all</h2>
                {['Afrobeats', 'Amapiano', 'Hip-Hop', 'R&B', 'Jazz', 'Rock', 'Electronic', 'Classical'].map((genre, i) => (
                  <div 
                    key={genre}
                    className="aspect-square rounded-lg lg:rounded-xl p-3 lg:p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: `hsl(${i * 45}, 70%, 40%)` }}
                    onClick={() => {
                      setActiveFilter('genre');
                      setSearchQuery(genre);
                    }}
                  >
                    <span className="text-lg lg:text-2xl font-bold text-white">{genre}</span>
                    <img 
                      src={`https://picsum.photos/seed/${genre}/200/200`} 
                      className="absolute -right-4 -bottom-4 w-16 h-16 lg:w-24 lg:h-24 rotate-[25deg] shadow-xl"
                      alt={genre}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeFilter === 'artist' && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">All Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {artists.map(artist => (
                    <div 
                      key={artist.id} 
                      className="bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all cursor-pointer text-center"
                      onClick={() => navigate(`/artist/${artist.name}`)}
                    >
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-zinc-800 mx-auto mb-4 overflow-hidden">
                        {artist.imageUrl ? (
                          <img 
                            src={artist.imageUrl || 'https://picsum.photos/seed/artist/200/200'} 
                            alt={artist.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <User className="w-full h-full p-6 text-zinc-600" />
                        )}
                      </div>
                      <span className="font-bold text-white block truncate">{artist.name}</span>
                      <span className="text-zinc-500 text-xs">Artist</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeFilter === 'album' && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">All Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {albums.map(album => (
                    <div 
                      key={album.id} 
                      className="bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/album/${album.title}`)}
                    >
                      <div className="aspect-square bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                        {album.coverUrl ? (
                          <img 
                            src={album.coverUrl || 'https://picsum.photos/seed/album/200/200'} 
                            alt={album.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Disc className="w-full h-full p-8 text-zinc-600" />
                        )}
                      </div>
                      <span className="font-bold text-white block truncate">{album.title}</span>
                      <span className="text-zinc-500 text-xs truncate block">{album.artist}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {searchQuery && filteredSongs.length === 0 && filteredArtists.length === 0 && filteredAlbums.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <p className="text-xl font-medium">No results found for "{searchQuery}"</p>
            <p className="text-sm mt-2">Please make sure your words are spelled correctly, or use fewer or different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
