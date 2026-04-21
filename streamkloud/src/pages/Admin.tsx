import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, User, Disc, Plus, Loader2, ArrowLeft, LogOut, Search, Trash2, ExternalLink, LayoutDashboard, TrendingUp } from 'lucide-react';
import { Artist, Album, Song } from '@/types';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '@/lib/firebase';
import { toast } from 'sonner';

export function Admin() {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Artist Form
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistImage, setArtistImage] = useState<File | null>(null);

  // Album Form
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtistId, setAlbumArtistId] = useState('');
  const [albumCover, setAlbumCover] = useState<File | null>(null);
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear());

  // Song Form
  const [songTitle, setSongTitle] = useState('');
  const [songArtistId, setSongArtistId] = useState('');
  const [songAlbumId, setSongAlbumId] = useState('');
  const [songAudio, setSongAudio] = useState<File | null>(null);
  const [songCover, setSongCover] = useState<File | null>(null);
  const [songGenre, setSongGenre] = useState('');

  const isAdmin = user?.email === 'rickylemar0@gmail.com' || user?.uid === 'FXwiaCqvnVNPpfZ91VCZ0GxN0tE2';

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin detected, fetching data...');
      console.log('Storage Bucket:', storage.app.options.storageBucket);
      fetchArtists();
      fetchAlbums();
      fetchSongs();
    }
  }, [isAdmin]);

  const fetchSongs = async () => {
    try {
      const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const q = query(collection(db, 'artists'), orderBy('name'));
      const snapshot = await getDocs(q);
      setArtists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)));
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const q = query(collection(db, 'albums'), orderBy('title'));
      const snapshot = await getDocs(q);
      setAlbums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading('Initializing upload...');
    
    try {
      let imageUrl = '';
      if (artistImage) {
        console.log('Uploading Artist Image:', {
          name: artistImage.name,
          size: `${(artistImage.size / 1024).toFixed(2)} KB`,
          type: artistImage.type
        });
        if (artistImage.size > 5 * 1024 * 1024) {
          toast.error('Artist image too large (max 5MB)');
          setLoading(false);
          return;
        }

        toast.loading(`Uploading image: ${artistImage.name}...`, { id: toastId });
        const imageRef = ref(storage, `artists/${Date.now()}_${artistImage.name}`);
        
        // Small file optimization: Use Base64 for files under 500KB
        if (artistImage.size < 500 * 1024) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(artistImage);
          });
          
          const base64String = await base64Promise;
          await uploadString(imageRef, base64String, 'data_url');
        } else {
          await uploadBytes(imageRef, artistImage, { contentType: artistImage.type });
        }
        
        imageUrl = await getDownloadURL(imageRef);
      }

      toast.loading('Finalizing artist profile...', { id: toastId });
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: artistName,
          bio: artistBio,
          imageUrl,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add artist');
      }

      setArtistName('');
      setArtistBio('');
      setArtistImage(null);
      fetchArtists();
      toast.success('Artist added successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Add Artist Error:', error);
      const isStorageError = error.code && error.code.startsWith('storage/');
      const errorSource = isStorageError ? 'Storage' : 'Firestore';
      toast.error(`${errorSource} Error: ${error.message || 'Permission denied'}`, { id: toastId });
      if (!isStorageError) {
        handleFirestoreError(error, OperationType.CREATE, 'artists');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading('Initializing album upload...');
    
    try {
      let coverUrl = '';
      if (albumCover) {
        console.log('Uploading Album Cover:', {
          name: albumCover.name,
          size: `${(albumCover.size / 1024).toFixed(2)} KB`,
          type: albumCover.type
        });
        if (albumCover.size > 5 * 1024 * 1024) {
          toast.error('Album cover too large (max 5MB)');
          setLoading(false);
          return;
        }

        toast.loading(`Uploading cover: ${albumCover.name}...`, { id: toastId });
        const coverRef = ref(storage, `albums/${Date.now()}_${albumCover.name}`);
        
        if (albumCover.size < 500 * 1024) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(albumCover);
          });
          const base64String = await base64Promise;
          await uploadString(coverRef, base64String, 'data_url');
        } else {
          await uploadBytes(coverRef, albumCover, { contentType: albumCover.type });
        }
        
        coverUrl = await getDownloadURL(coverRef);
      }

      const artist = artists.find(a => a.id === albumArtistId);

      toast.loading('Saving album to database...', { id: toastId });
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: albumTitle,
          artist: artist?.name || 'Unknown',
          artistId: albumArtistId,
          coverUrl,
          releaseYear: albumYear,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add album');
      }

      setAlbumTitle('');
      setAlbumCover(null);
      fetchAlbums();
      toast.success('Album added successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Add Album Error:', error);
      const isStorageError = error.code && error.code.startsWith('storage/');
      const errorSource = isStorageError ? 'Storage' : 'Firestore';
      toast.error(`${errorSource} Error: ${error.message || 'Permission denied'}`, { id: toastId });
      if (!isStorageError) {
        handleFirestoreError(error, OperationType.CREATE, 'albums');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!songAudio) {
      toast.error('Please select an audio file');
      return;
    }
    if (!songArtistId) {
      toast.error('Please select an artist');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Initializing song upload...');
    
    try {
      console.log('Uploading Song Audio:', {
        name: songAudio.name,
        size: `${(songAudio.size / 1024 / 1024).toFixed(2)} MB`,
        type: songAudio.type
      });
      if (songAudio.size > 20 * 1024 * 1024) {
        toast.error('Audio file too large (max 20MB)');
        setLoading(false);
        return;
      }

      toast.loading(`Uploading audio: ${songAudio.name}...`, { id: toastId });
      const audioRef = ref(storage, `songs/${Date.now()}_${songAudio.name}`);
      
      const audioUploadTask = uploadBytesResumable(audioRef, songAudio, { contentType: songAudio.type });
      
      const audioUrl = await new Promise<string>((resolve, reject) => {
        audioUploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Uploading audio: ${Math.round(progress)}%`, { id: toastId });
          }, 
          (error) => {
            console.error('Song Audio Upload Error:', error);
            reject(new Error(`Audio upload failed: ${error.message}`));
          }, 
          async () => {
            const url = await getDownloadURL(audioUploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      let coverUrl = '';
      if (songCover) {
        console.log('Uploading Song Cover:', {
          name: songCover.name,
          size: `${(songCover.size / 1024).toFixed(2)} KB`,
          type: songCover.type
        });
        if (songCover.size > 5 * 1024 * 1024) {
          toast.error('Song cover too large (max 5MB)');
          setLoading(false);
          return;
        }

        toast.loading(`Uploading cover: ${songCover.name}...`, { id: toastId });
        const coverRef = ref(storage, `covers/${Date.now()}_${songCover.name}`);
        
        if (songCover.size < 500 * 1024) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(songCover);
          });
          const base64String = await base64Promise;
          await uploadString(coverRef, base64String, 'data_url');
        } else {
          await uploadBytes(coverRef, songCover, { contentType: songCover.type });
        }
        
        coverUrl = await getDownloadURL(coverRef);
      } else if (songAlbumId) {
        const album = albums.find(a => a.id === songAlbumId);
        coverUrl = album?.coverUrl || '';
      }

      const artist = artists.find(a => a.id === songArtistId);
      const album = albums.find(a => a.id === songAlbumId);

      toast.loading('Processing audio metadata...', { id: toastId });
      // Get duration with timeout
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.src = audioUrl;
        const timeout = setTimeout(() => {
          console.warn('Audio metadata load timed out');
          resolve(0);
        }, 10000);

        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve(audio.duration);
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          resolve(0);
        };
      });

      toast.loading('Saving song to database...', { id: toastId });
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: songTitle,
          artist: artist?.name || 'Unknown',
          url: audioUrl,
          coverImage: coverUrl,
          duration,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add song');
      }

      setSongTitle('');
      setSongAudio(null);
      setSongCover(null);
      fetchSongs();
      toast.success('Song added successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Add Song Error:', error);
      const isStorageError = error.code && error.code.startsWith('storage/');
      const errorSource = isStorageError ? 'Storage' : 'Firestore';
      toast.error(`${errorSource} Error: ${error.message || 'Permission denied'}`, { id: toastId });
      if (!isStorageError) {
        handleFirestoreError(error, OperationType.CREATE, 'songs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success('Item deleted successfully');
      if (collectionName === 'artists') fetchArtists();
      if (collectionName === 'albums') fetchAlbums();
      if (collectionName === 'songs') fetchSongs();
    } catch (error: any) {
      toast.error('Error deleting item: ' + error.message);
    }
  };

  const filteredArtists = artists.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAlbums = albums.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.artist.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()));

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">Access Denied</h1>
          <p className="text-zinc-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-x-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-x-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search everything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-xl"
              />
            </div>
            <Link to="/">
              <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white rounded-xl gap-x-2">
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-xl gap-x-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="dashboard" className="gap-x-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-x-2">
              <User className="w-4 h-4" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-x-2">
              <Disc className="w-4 h-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="songs" className="gap-x-2">
              <Music className="w-4 h-4" />
              Songs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Songs</CardTitle>
                  <Music className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{songs.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Artists</CardTitle>
                  <User className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{artists.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Albums</CardTitle>
                  <Disc className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{albums.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest additions to your library.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {songs.slice(0, 5).map(song => (
                    <div key={song.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-x-3">
                        <img 
                        src={song.coverUrl || 'https://picsum.photos/seed/song/200/200'} 
                        className="w-10 h-10 rounded object-cover" 
                        referrerPolicy="no-referrer" 
                        alt={song.title}
                      />
                        <div>
                          <p className="font-medium text-sm">{song.title}</p>
                          <p className="text-xs text-zinc-500">{song.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-600 uppercase font-bold">New Song</span>
                    </div>
                  ))}
                  {artists.slice(0, 2).map(artist => (
                    <div key={artist.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-x-3">
                      <img 
                        src={artist.imageUrl || 'https://picsum.photos/seed/artist/200/200'} 
                        className="w-10 h-10 rounded-full object-cover" 
                        referrerPolicy="no-referrer" 
                        alt={artist.name}
                      />
                        <div>
                          <p className="font-medium text-sm">{artist.name}</p>
                          <p className="text-xs text-zinc-500">Artist Profile</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-600 uppercase font-bold">New Artist</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artists">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Add New Artist</CardTitle>
                <CardDescription>Create a new verified artist profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddArtist} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input 
                      value={artistName} 
                      onChange={(e) => setArtistName(e.target.value)} 
                      className="bg-zinc-800 border-zinc-700" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Input 
                      value={artistBio} 
                      onChange={(e) => setArtistBio(e.target.value)} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Profile Image (JPG, PNG - Max 5MB)</Label>
                    <Input 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setArtistImage(e.target.files?.[0] || null)} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-orange-500 text-black hover:bg-orange-600">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Artist
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white">Existing Artists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArtists.map(artist => (
                  <div key={artist.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-x-4">
                      <img src={artist.imageUrl || 'https://picsum.photos/seed/artist/200/200'} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h3 className="font-bold text-white">{artist.name}</h3>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">{artist.bio}</p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon-sm" 
                      onClick={() => handleDelete('artists', artist.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filteredArtists.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No artists found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="albums">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Add New Album</CardTitle>
                <CardDescription>Create a new album for an artist.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAlbum} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Album Title</Label>
                    <Input 
                      value={albumTitle} 
                      onChange={(e) => setAlbumTitle(e.target.value)} 
                      className="bg-zinc-800 border-zinc-700" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Artist</Label>
                    <select 
                      value={albumArtistId} 
                      onChange={(e) => setAlbumArtistId(e.target.value)}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
                      required
                    >
                      <option value="">Select Artist</option>
                      {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Release Year</Label>
                    <Input 
                      type="number" 
                      value={albumYear} 
                      onChange={(e) => setAlbumYear(parseInt(e.target.value))} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Album Cover (JPG, PNG - Max 5MB)</Label>
                    <Input 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setAlbumCover(e.target.files?.[0] || null)} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-orange-500 text-black hover:bg-orange-600">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Album
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white">Existing Albums</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAlbums.map(album => (
                  <div key={album.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-x-4">
                      <img src={album.coverUrl || 'https://picsum.photos/seed/album/200/200'} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h3 className="font-bold text-white">{album.title}</h3>
                        <p className="text-xs text-zinc-500">{album.artist}</p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon-sm" 
                      onClick={() => handleDelete('albums', album.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filteredAlbums.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No albums found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="songs">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Add New Song</CardTitle>
                <CardDescription>Upload a new track to the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSong} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Song Title</Label>
                    <Input 
                      value={songTitle} 
                      onChange={(e) => setSongTitle(e.target.value)} 
                      className="bg-zinc-800 border-zinc-700" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Artist</Label>
                      <select 
                        value={songArtistId} 
                        onChange={(e) => setSongArtistId(e.target.value)}
                        className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
                        required
                      >
                        <option value="">Select Artist</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Album (Optional)</Label>
                      <select 
                        value={songAlbumId} 
                        onChange={(e) => setSongAlbumId(e.target.value)}
                        className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
                      >
                        <option value="">No Album</option>
                        {albums.filter(a => a.artistId === songArtistId).map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Input 
                      value={songGenre} 
                      onChange={(e) => setSongGenre(e.target.value)} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Audio File (MP3, WAV - Max 20MB)</Label>
                    <Input 
                      type="file" 
                      accept="audio/mpeg,audio/wav,audio/mp3"
                      onChange={(e) => setSongAudio(e.target.files?.[0] || null)} 
                      className="bg-zinc-800 border-zinc-700" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Cover (Optional - Max 5MB)</Label>
                    <Input 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setSongCover(e.target.files?.[0] || null)} 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-orange-500 text-black hover:bg-orange-600">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Song
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white">Existing Songs</h2>
              <div className="space-y-2">
                {filteredSongs.map(song => (
                  <div key={song.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-x-4">
                      <img src={song.coverUrl || 'https://picsum.photos/seed/song/200/200'} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h3 className="font-bold text-white text-sm">{song.title}</h3>
                        <p className="text-xs text-zinc-500">{song.artist} • {song.album || 'Single'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={song.audioUrl} target="_blank" rel="noreferrer" className="p-2 text-zinc-400 hover:text-white">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button 
                        variant="destructive" 
                        size="icon-sm" 
                        onClick={() => handleDelete('songs', song.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredSongs.length === 0 && (
                  <div className="py-12 text-center bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No songs found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
