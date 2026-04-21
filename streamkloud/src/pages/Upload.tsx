import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, loginWithGoogle, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload as UploadIcon, Music, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Upload() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!audioFile || !title || !artist) {
      setError('Please fill in all required fields and select an audio file.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 0. Get Audio Duration
      const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
            URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
          };
        });
      };

      const duration = await getAudioDuration(audioFile);

      // 1. Upload Audio File
      const audioRef = ref(storage, `songs/${Date.now()}_${audioFile.name}`);
      const audioUploadTask = uploadBytesResumable(audioRef, audioFile);
      
      // 2. Upload Cover Image (if exists)
      let coverUrl = 'https://picsum.photos/seed/music/400/400';
      if (coverFile) {
        const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
        await uploadBytesResumable(coverRef, coverFile);
        coverUrl = await getDownloadURL(coverRef);
      }

      // Track audio upload progress
      audioUploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (err) => {
          console.error("Upload error:", err);
          setError("Failed to upload files. Please check your permissions.");
          setUploading(false);
          handleFirestoreError(err, OperationType.WRITE, `songs/${Date.now()}_${audioFile.name}`);
        },
        async () => {
          const audioUrl = await getDownloadURL(audioUploadTask.snapshot.ref);
          
          try {
            // 3. Save to Firestore
            await addDoc(collection(db, 'songs'), {
              title,
              artist,
              album,
              genre,
              audioUrl,
              coverUrl,
              duration,
              createdAt: serverTimestamp(),
              plays: 0,
              ownerId: user.uid
            });

            setSuccess(true);
            setUploading(false);
            setTimeout(() => navigate('/'), 2000);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'songs');
          }
        }
      );

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white gap-y-4">
        <p className="text-xl font-medium">Please log in to upload songs.</p>
        <Button 
          className="bg-orange-500 text-black hover:bg-orange-400 font-bold px-8"
          onClick={async () => {
            try {
              await loginWithGoogle();
            } catch (error: any) {
              if (error.code !== 'auth/popup-closed-by-user') {
                console.error('Login error:', error);
              }
            }
          }}
        >
          Log in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="p-4 lg:p-6">
            <CardTitle className="text-xl lg:text-2xl flex items-center gap-x-2">
              <UploadIcon className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500" />
              Upload New Song
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs lg:text-sm">
              Share your music with the StreamKloud community.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold">Upload Successful!</h3>
                <p className="text-zinc-400 mt-2">Your song has been added to the library. Redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Water" 
                      className="bg-zinc-800 border-zinc-700"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist *</Label>
                    <Input 
                      id="artist" 
                      placeholder="e.g. Tyla" 
                      className="bg-zinc-800 border-zinc-700"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="album">Album</Label>
                    <Input 
                      id="album" 
                      placeholder="e.g. Tyla (Self-titled)" 
                      className="bg-zinc-800 border-zinc-700"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input 
                      id="genre" 
                      placeholder="e.g. Amapiano" 
                      className="bg-zinc-800 border-zinc-700"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audio" className="flex items-center gap-x-2">
                      <Music className="w-4 h-4" />
                      Audio File (MP3/WAV) *
                    </Label>
                    <Input 
                      id="audio" 
                      type="file" 
                      accept="audio/*"
                      className="bg-zinc-800 border-zinc-700 cursor-pointer"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover" className="flex items-center gap-x-2">
                      <ImageIcon className="w-4 h-4" />
                      Cover Image (Optional)
                    </Label>
                    <Input 
                      id="cover" 
                      type="file" 
                      accept="image/*"
                      className="bg-zinc-800 border-zinc-700 cursor-pointer"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Uploading...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-zinc-800" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md flex items-center gap-x-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 text-black hover:bg-orange-400 font-bold py-6"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Song'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
