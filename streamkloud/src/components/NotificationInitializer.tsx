import { useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export function NotificationInitializer() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;

    const checkAndInitialize = async () => {
      // Check if user already has notifications to avoid duplicates on every reload
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Welcome notification
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Welcome to StreamKloud! 🎵',
          message: 'Start exploring millions of tracks and create your first playlist.',
          type: 'system',
          isRead: false,
          createdAt: serverTimestamp()
        });

        // Subscription notification
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Free Trial Activated',
          message: 'Your 10-day free trial is now active. Enjoy unlimited streaming!',
          type: 'subscription',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    };

    checkAndInitialize();
  }, [user]);

  return null;
}
