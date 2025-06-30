import { supabase } from './supabase';

export interface GiftSearch {
  id: string;
  user_id: string;
  occasion: string;
  age: number;
  gender: string;
  personality: string;
  budget: number;
  geography: string;
  created_at: string;
}

export interface GiftSuggestion {
  id: string;
  search_id: string;
  name: string;
  description: string;
  reason: string;
  shopping_links: {
    platform: string;
    url: string;
    price_range: string;
  }[];
  is_favorited: boolean;
  created_at: string;
}

export interface GiftSearchWithSuggestions extends GiftSearch {
  gift_suggestions: GiftSuggestion[];
}

// Interface for the data structure returned by Supabase join
interface UserFavoriteData {
  gift_suggestions: GiftSuggestion[] | null;
}

// Save a gift search
export async function saveGiftSearch(
  userId: string,
  searchData: {
    occasion: string;
    age: number;
    gender: string;
    personality: string;
    budget: number;
    geography: string;
  }
): Promise<GiftSearch> {
  try {
    const { data, error } = await supabase
      .from('gift_searches')
      .insert({
        user_id: userId,
        ...searchData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving gift search:', error);
    throw error;
  }
}

// Save gift suggestions
export async function saveGiftSuggestions(
  searchId: string,
  suggestions: Array<{
    name: string;
    description: string;
    reason: string;
    shopping_links?: {
      platform: string;
      url: string;
      price_range: string;
    }[];
  }>
): Promise<GiftSuggestion[]> {
  try {
    const suggestionsWithSearchId = suggestions.map(suggestion => ({
      search_id: searchId,
      name: suggestion.name,
      description: suggestion.description,
      reason: suggestion.reason,
      shopping_links: suggestion.shopping_links || [],
    }));

    const { data, error } = await supabase
      .from('gift_suggestions')
      .insert(suggestionsWithSearchId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving gift suggestions:', error);
    throw error;
  }
}

// Get user's gift searches with suggestions
export async function getUserGiftSearches(userId: string): Promise<GiftSearchWithSuggestions[]> {
  try {
    const { data, error } = await supabase
      .from('gift_searches')
      .select(`
        *,
        gift_suggestions (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user gift searches:', error);
    return [];
  }
}

// Get a specific gift search with suggestions
export async function getGiftSearch(searchId: string): Promise<GiftSearchWithSuggestions | null> {
  try {
    const { data, error } = await supabase
      .from('gift_searches')
      .select(`
        *,
        gift_suggestions (*)
      `)
      .eq('id', searchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting gift search:', error);
    return null;
  }
}

// Toggle favorite status of a gift suggestion
export async function toggleGiftFavorite(suggestionId: string, isFavorited: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('gift_suggestions')
      .update({ is_favorited: isFavorited })
      .eq('id', suggestionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling gift favorite:', error);
    throw error;
  }
}

// Add to user favorites
export async function addToFavorites(userId: string, suggestionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        suggestion_id: suggestionId,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

// Remove from user favorites
export async function removeFromFavorites(userId: string, suggestionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('suggestion_id', suggestionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

// Get user's favorite gift suggestions
export async function getUserFavorites(userId: string): Promise<GiftSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        gift_suggestions (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Cast data to the proper interface and filter out null values
    const typedData = data as UserFavoriteData[] | null;
    return typedData?.map(item => item.gift_suggestions?.[0]).filter((suggestion): suggestion is GiftSuggestion => suggestion !== null && suggestion !== undefined) || [];
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
}

// Delete a gift search and its suggestions
export async function deleteGiftSearch(searchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('gift_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting gift search:', error);
    throw error;
  }
}