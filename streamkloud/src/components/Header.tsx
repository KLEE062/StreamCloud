import { useState } from 'react';
import { Bell, LogOut, Search } from 'lucide-react';
import { auth, logout } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { AuthModal } from './AuthModal';
import { ProfileModal } from './ProfileModal';
import { Logo } from './Logo';
import { Link } from 'react-router-dom';

import { useAuthModal } from '@/store/useAuthModal';
import { useProfileModal } from '@/store/useProfileModal';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const [user] = useAuthState(auth);
  const { open: openAuth } = useAuthModal();
  const { open: openProfile } = useProfileModal();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 lg:h-20 bg-transparent flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shrink-0">
      <div className="hidden lg:flex flex-1 max-w-2xl relative group">
        <Input 
          placeholder="Search songs, artists..." 
          className="bg-zinc-900/50 border-zinc-800/50 h-12 pl-6 pr-12 rounded-full text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 transition-all duration-300 group-hover:bg-zinc-900"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </div>

      <Link to="/" className="lg:hidden group">
        <Logo className="scale-75 origin-left" />
      </Link>

      <div className="flex items-center gap-x-3 lg:gap-x-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-zinc-400 hover:text-white transition-colors p-2"
          >
            <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-[10px] font-bold text-black flex items-center justify-center rounded-full border border-zinc-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => {
                          markAsRead(notification.id);
                          // Optional: navigate if notification has a link
                        }}
                        className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer relative ${!notification.isRead ? 'bg-orange-500/5' : ''}`}
                      >
                        {!notification.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                        )}
                        <div className="flex flex-col gap-y-1">
                          <p className={`text-sm ${notification.isRead ? 'text-zinc-300' : 'text-white font-medium'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-1">
                            {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-x-2 lg:gap-x-4">
            <Avatar 
              className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-orange-500/20 cursor-pointer hover:border-orange-500/50 transition-colors"
              onClick={openProfile}
            >
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="bg-orange-500 text-black font-bold text-xs lg:text-base">
                {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MA'}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="outline" 
              onClick={logout}
              className="h-8 lg:h-10 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg lg:rounded-xl gap-x-1 lg:gap-x-2 px-3 lg:px-4 text-xs lg:text-sm font-medium"
            >
              <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-x-2 lg:gap-x-4">
            <Button 
              variant="ghost" 
              onClick={() => openAuth('signup')}
              className="text-zinc-100 hover:text-white hover:bg-zinc-900 rounded-full px-4 lg:px-6 h-8 lg:h-10 text-xs lg:text-sm font-medium"
            >
              Sign up
            </Button>
            <Button 
              onClick={() => openAuth('login')}
              className="bg-warm-gradient text-zinc-950 font-black rounded-full px-4 lg:px-8 h-8 lg:h-10 text-xs lg:text-sm shadow-lg shadow-orange-500/20"
            >
              Log in
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
