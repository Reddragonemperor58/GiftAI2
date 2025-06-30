'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Heart, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  ChevronRight,
  Star,
  Gift,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserGiftSearches, deleteGiftSearch, type GiftSearchWithSuggestions } from '@/lib/gifts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch: (search: GiftSearchWithSuggestions) => void;
  currentSearchId?: string | null;
  className?: string;
}

export function ChatSidebar({ 
  isOpen, 
  onClose, 
  onSelectSearch, 
  currentSearchId,
  className 
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [searches, setSearches] = useState<GiftSearchWithSuggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  useEffect(() => {
    if (isOpen && user) {
      loadGiftSearches();
    }
  }, [isOpen, user]);

  const loadGiftSearches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserGiftSearches(user.id);
      setSearches(data);
    } catch (error) {
      console.error('Error loading gift searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGiftSearch(searchId);
      setSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const getFavoriteItems = () => {
    const favoriteItems: Array<{
      id: string;
      name: string;
      description: string;
      reason: string;
      searchId: string;
      searchOccasion: string;
      createdAt: string;
    }> = [];

    searches.forEach(search => {
      search.gift_suggestions.forEach(suggestion => {
        if (suggestion.is_favorited) {
          favoriteItems.push({
            id: suggestion.id,
            name: suggestion.name,
            description: suggestion.description,
            reason: suggestion.reason,
            searchId: search.id,
            searchOccasion: search.occasion,
            createdAt: suggestion.created_at,
          });
        }
      });
    });

    return favoriteItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const favoriteItems = getFavoriteItems();

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Gift History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'history'
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Searches</span>
              <Badge variant="secondary" className="text-xs">
                {searches.length}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'favorites'
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              <span>Favorites</span>
              <Badge variant="secondary" className="text-xs">
                {favoriteItems.length}
              </Badge>
            </div>
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 text-sm">Loading...</div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-3">
              {searches.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 text-sm mb-2">No searches yet</div>
                  <div className="text-xs text-gray-400">
                    Start by creating your first gift search!
                  </div>
                </div>
              ) : (
                searches.map((search) => (
                  <Card 
                    key={search.id} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border",
                      currentSearchId === search.id 
                        ? "border-purple-300 bg-purple-50 shadow-md" 
                        : "border-gray-200 hover:border-purple-200"
                    )}
                    onClick={() => onSelectSearch(search)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium text-gray-800 truncate">
                            {search.occasion}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(search.created_at), 'MMM d')}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {search.age}y {search.gender}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${search.budget}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteSearch(search.id, e)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {search.personality}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {search.gift_suggestions.length} suggestions
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="h-3 w-3" />
                          {search.gift_suggestions.filter(s => s.is_favorited).length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteItems.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 text-sm mb-2">No favorites yet</div>
                  <div className="text-xs text-gray-400">
                    Like some gift suggestions to see them here!
                  </div>
                </div>
              ) : (
                favoriteItems.map((item) => (
                  <Card key={item.id} className="border border-gray-200 hover:border-purple-200 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-gray-800 leading-tight">
                          {item.name}
                        </CardTitle>
                        <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0 ml-2" />
                      </div>
                      <CardDescription className="text-xs text-gray-600">
                        From: {item.searchOccasion} • {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </div>
                      <Separator className="my-2" />
                      <div className="text-xs text-gray-600 line-clamp-2">
                        <strong>Why it's perfect:</strong> {item.reason}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {user ? (
              <span>Signed in as {user.email}</span>
            ) : (
              <span>Sign in to save your searches</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}