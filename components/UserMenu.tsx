'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
<<<<<<< HEAD
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  LogOut, 
  Heart, 
  History, 
  Settings, 
  Crown,
  HelpCircle,
  MessageSquare,
  Gift
} from 'lucide-react';
=======
import { User, LogOut, Heart, History, Settings } from 'lucide-react';
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

interface UserMenuProps {
  onViewHistory: () => void;
  onViewFavorites: () => void;
}

export function UserMenu({ onViewHistory, onViewFavorites }: UserMenuProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      // Force page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  const displayName = profile?.full_name || 'User';
  const displayEmail = profile?.email || user.email || '';

<<<<<<< HEAD
  // Calculate user level based on account age (mock implementation)
  const accountAge = user.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const userLevel = accountAge < 7 ? 'New' : accountAge < 30 ? 'Active' : 'Pro';
  const levelColor = userLevel === 'New' ? 'bg-blue-100 text-blue-700' : 
                    userLevel === 'Active' ? 'bg-green-100 text-green-700' : 
                    'bg-purple-100 text-purple-700';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-purple-50 transition-colors">
          <Avatar className="h-10 w-10 ring-2 ring-purple-100 hover:ring-purple-200 transition-all">
=======
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-purple-50">
          <Avatar className="h-10 w-10">
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
            <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
<<<<<<< HEAD
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              <Badge variant="secondary" className={`text-xs ${levelColor}`}>
                {userLevel === 'Pro' && <Crown className="h-3 w-3 mr-1" />}
                {userLevel}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Member since {new Date(user.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Quick Stats */}
        <div className="px-2 py-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-purple-50 rounded">
              <Gift className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <div className="font-medium">0</div>
              <div className="text-muted-foreground">Searches</div>
            </div>
            <div className="text-center p-2 bg-pink-50 rounded">
              <Heart className="h-4 w-4 mx-auto mb-1 text-pink-600" />
              <div className="font-medium">0</div>
              <div className="text-muted-foreground">Favorites</div>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
=======
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
        <DropdownMenuItem onClick={onViewHistory} className="cursor-pointer">
          <History className="mr-2 h-4 w-4" />
          <span>Gift History</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewFavorites} className="cursor-pointer">
          <Heart className="mr-2 h-4 w-4" />
          <span>Favorites</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
<<<<<<< HEAD
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Send Feedback</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
=======
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          disabled={loading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{loading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}