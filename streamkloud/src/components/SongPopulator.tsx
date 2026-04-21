import { useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const ADMIN_EMAIL = 'rickylemar0@gmail.com';

const SONGS = [
  {
    title: "Nana",
    artist: "Joshua Baraka",
    album: "Single",
    duration: 180,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Pon Mi",
    artist: "Beenie Gunter",
    album: "Single",
    duration: 210,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Dancehall",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Sitya Loss",
    artist: "Eddy Kenzo",
    album: "Sitya Loss",
    duration: 230,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Nakyuka",
    artist: "Sheebah Karungi",
    album: "Single",
    duration: 200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253344-99a429996293?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afropop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Kwata Bulungi",
    artist: "Spice Diana",
    album: "Single",
    duration: 190,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afropop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Love You Everyday",
    artist: "Bebe Cool",
    album: "Single",
    duration: 240,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Reggae",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Wale Wale",
    artist: "Jose Chameleone",
    album: "Single",
    duration: 250,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afro-beat",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Buligita",
    artist: "Fik Fameica",
    album: "Single",
    duration: 185,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afro-rap",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Last Last",
    artist: "Burna Boy",
    album: "Love, Damini",
    duration: 172,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Essence",
    artist: "Wizkid",
    album: "Made In Lagos",
    duration: 248,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1420161907993-e298aa95c479?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Free Mind",
    artist: "Tems",
    album: "For Broken Ears",
    duration: 247,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "R&B",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Yope Remix",
    artist: "Diamond Platnumz",
    album: "Single",
    duration: 300,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Bongo Flava",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Unavailable",
    artist: "Davido",
    album: "Timeless",
    duration: 170,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Water",
    artist: "Tyla",
    album: "Tyla",
    duration: 200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Amapiano",
    ownerId: "system",
    plays: 0
  },
  {
    title: "God's Plan",
    artist: "Drake",
    album: "Scorpion",
    duration: 198,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Hip Hop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: 200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Synth-pop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Anti-Hero",
    artist: "Taylor Swift",
    album: "Midnights",
    duration: 200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Pop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "HUMBLE.",
    artist: "Kendrick Lamar",
    album: "DAMN.",
    duration: 177,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253344-99a429996293?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Hip Hop",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Joro",
    artist: "Wizkid",
    album: "Single",
    duration: 260,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  },
  {
    title: "Ye",
    artist: "Burna Boy",
    album: "Outside",
    duration: 231,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400&h=400",
    genre: "Afrobeats",
    ownerId: "system",
    plays: 0
  }
];

export function SongPopulator() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    const populate = async () => {
      const q = query(collection(db, 'songs'), where('ownerId', '==', 'system'), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log("Populating songs...");
        for (const song of SONGS) {
          await addDoc(collection(db, 'songs'), {
            ...song,
            createdAt: new Date().toISOString()
          });
        }
        console.log("Songs populated!");
      }
    };
    populate();
  }, []);

  return null;
}
