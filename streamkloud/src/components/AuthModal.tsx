import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  auth, 
  db,
  loginWithGoogle, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { Mail, Chrome, Loader2, Eye, EyeOff } from 'lucide-react';

import { useAuthModal } from '@/store/useAuthModal';

export function AuthModal() {
  const { isOpen, close, mode, setMode } = useAuthModal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Create user document with 10-day free trial
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 10);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName,
          email,
          role: 'user',
          createdAt: new Date().toISOString(),
          subscription: {
            plan: 'trial',
            status: 'active',
            expiryDate: expiryDate.toISOString()
          }
        });

        // Register in custom backend as well
        const regResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: displayName, email, password })
        });
        const regData = await regResponse.json();
        if (regData.token) {
          localStorage.setItem('token', regData.token);
        }

        // Send verification code
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        setMode('verify');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Also login to custom backend to get token
        try {
          const logResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const logData = await logResponse.json();
          if (logData.token) {
            localStorage.setItem('token', logData.token);
          }
        } catch (err) {
          console.error('Backend login failed:', err);
        }

        close();
        if (userCredential.user.email === 'rickylemar0@gmail.com') {
          navigate('/admin');
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password signup is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: verificationToken })
      });
      const data = await response.json();
      if (data.success) {
        close();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err: any) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await loginWithGoogle();
      
      // Check if user document exists, if not create with trial
      const userRef = doc(db, 'users', userCredential.user.uid);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 10);
      
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        role: 'user',
        createdAt: new Date().toISOString(),
        subscription: {
          plan: 'trial',
          status: 'active',
          expiryDate: expiryDate.toISOString()
        }
      }, { merge: true });

      close();
      if (userCredential.user.email === 'rickylemar0@gmail.com') {
        navigate('/admin');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error message
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google login is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(err.message || 'An error occurred during Google login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[400px] p-6 lg:p-8">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-white text-center">
            {mode === 'login' ? 'Welcome Back' : mode === 'verify' ? 'Verify Email' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-center">
            {mode === 'login' 
              ? 'Log in to access your library and playlists' 
              : mode === 'verify'
              ? `We've sent a 6-digit code to ${email}`
              : 'Join StreamKloud to start your music journey'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {mode === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-zinc-400">Verification Code</Label>
                <Input 
                  id="token" 
                  placeholder="123456" 
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="bg-zinc-900 border-zinc-800 text-white h-14 text-center text-2xl tracking-[1em] font-bold rounded-xl focus-visible:ring-orange-500"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}

              <Button 
                type="submit" 
                disabled={loading || verificationToken.length !== 6}
                className="w-full h-12 bg-warm-gradient text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
              </Button>

              <button
                type="button"
                onClick={() => fetch('/api/auth/send-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                })}
                className="w-full text-zinc-500 hover:text-white text-sm transition-colors"
              >
                Didn't receive a code? Resend
              </button>
            </form>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800 rounded-xl gap-x-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-400">Display Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-orange-500"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-orange-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs text-center">{error}</p>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-warm-gradient text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    mode === 'login' ? 'Log In' : 'Sign Up'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="text-center text-sm">
          <span className="text-zinc-500">
            {mode === 'login' ? "Don't have an account? " : mode === 'verify' ? "Entered wrong email? " : "Already have an account? "}
          </span>
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-orange-500 font-bold hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : mode === 'verify' ? 'Back to Login' : 'Log In'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
