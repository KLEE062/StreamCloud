import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  songIds: string[];
  isPublic: boolean;
  createdAt: any;
}

export function usePlaylists() {
  const [user] = useAuthState(auth);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    const path = 'playlists';
    const q = query(
      collection(db, path),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPlaylists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Playlist[];
      
      setPlaylists(newPlaylists);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createPlaylist = async (name: string, isPublic: boolean = false) => {
    if (!user) return;
    const path = 'playlists';
    try {
      await addDoc(collection(db, path), {
        name,
        ownerId: user.uid,
        songIds: [],
        isPublic,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    const path = `playlists/${playlistId}`;
    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        songIds: arrayUnion(songId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const path = `playlists/${playlistId}`;
    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        songIds: arrayRemove(songId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    const path = `playlists/${playlistId}`;
    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return {
    playlists,
    loading,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    deletePlaylist
  };
}
