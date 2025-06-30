'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, DollarSign, User, Heart, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserGiftSearches, deleteGiftSearch, toggleGiftFavorite, type GiftSearchWithSuggestions } from '@/lib/gifts';
import { format } from 'date-fns';

interface GiftHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch?: (search: GiftSearchWithSuggestions) => void;
}

export function GiftHistory({ isOpen, onClose, onSelectSearch }: GiftHistoryProps) {
  const { user } = useAuth();
  const [searches, setSearches] = useState<GiftSearchWithSuggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<GiftSearchWithSuggestions | null>(null);

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

  const handleDeleteSearch = async (searchId: string) => {
    try {
      await deleteGiftSearch(searchId);
      setSearches(prev => prev.filter(search => search.id !== searchId));
      if (selectedSearch?.id === searchId) {
        setSelectedSearch(null);
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const handleToggleFavorite = async (suggestionId: string, currentStatus: boolean) => {
    try {
      await toggleGiftFavorite(suggestionId, !currentStatus);
      
      // Update local state
      setSearches(prev => prev.map(search => ({
        ...search,
        gift_suggestions: search.gift_suggestions.map(suggestion =>
          suggestion.id === suggestionId
            ? { ...suggestion, is_favorited: !currentStatus }
            : suggestion
        )
      })));

      if (selectedSearch) {
        setSelectedSearch(prev => prev ? {
          ...prev,
          gift_suggestions: prev.gift_suggestions.map(suggestion =>
            suggestion.id === suggestionId
              ? { ...suggestion, is_favorited: !currentStatus }
              : suggestion
          )
        } : null);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSelectSearchItem = (search: GiftSearchWithSuggestions) => {
    if (onSelectSearch) {
      onSelectSearch(search);
      onClose();
    } else {
      setSelectedSearch(search);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Gift History
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading your gift history...</div>
              </div>
            ) : searches.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No gift searches yet</div>
                <div className="text-sm text-gray-400">
                  Start by creating your first gift search!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {searches.map((search) => (
                  <Card key={search.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectSearchItem(search)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{search.occasion}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(search.created_at), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {search.gender}, {search.age} years old
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${search.budget}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSearch(search);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSearch(search.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Personality:</strong> {search.personality}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {search.gift_suggestions.length} suggestions
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {search.gift_suggestions.filter(s => s.is_favorited).length} favorited
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detailed View Modal */}
      <Dialog open={!!selectedSearch} onOpenChange={() => setSelectedSearch(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedSearch?.occasion} - Gift Suggestions
            </DialogTitle>
          </DialogHeader>

          {selectedSearch && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Search Details */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Age:</span> {selectedSearch.age}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {selectedSearch.gender}
                      </div>
                      <div>
                        <span className="font-medium">Budget:</span> ${selectedSearch.budget}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {format(new Date(selectedSearch.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium">Personality:</span>
                      <p className="text-gray-600 mt-1">{selectedSearch.personality}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Gift Suggestions */}
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                  {selectedSearch.gift_suggestions.map((gift, index) => (
                    <Card key={gift.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">
                            {gift.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(gift.id, gift.is_favorited)}
                              className={gift.is_favorited ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                            >
                              <Heart className={`h-4 w-4 ${gift.is_favorited ? 'fill-current' : ''}`} />
                            </Button>
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-purple-600">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {gift.description}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Why it's perfect</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {gift.reason}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}