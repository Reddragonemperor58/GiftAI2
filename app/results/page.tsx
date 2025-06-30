'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, MessageCircle, Send, Loader2, ExternalLink, ShoppingCart, LogIn, Sparkles, Menu, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { ChatSidebar } from '@/components/ChatSidebar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { saveGiftSearch, saveGiftSuggestions, toggleGiftFavorite, getGiftSearch, type GiftSearchWithSuggestions } from '@/lib/gifts';
import { getCurrencyForLocation, formatCurrency, getLocationDisplayName } from '@/lib/currency';

interface ShoppingLink {
  platform: string;
  url: string;
  price_range: string;
}

interface GiftSuggestion {
  id?: string;
  name: string;
  description: string;
  reason: string;
  shopping_links: ShoppingLink[];
  is_favorited?: boolean;
}

interface FormData {
  occasion: string;
  age: number;
  gender: string;
  personality: string;
  budget: number;
  geography: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [results, setResults] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [currencyInfo, setCurrencyInfo] = useState({ symbol: '$', code: 'USD', name: 'US Dollar' });
  
  // Chat refinement states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Chat sidebar state
  const [showChatSidebar, setShowChatSidebar] = useState(false);

  // Dynamic suggested prompts based on context
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "Make these more budget-friendly",
    "I need something more personal",
    "What about eco-friendly options?",
    "Can you suggest DIY alternatives?"
  ]);

  useEffect(() => {
    // Get form data from URL params with better validation
    const occasion = searchParams.get('occasion');
    const ageParam = searchParams.get('age');
    const gender = searchParams.get('gender');
    const personality = searchParams.get('personality');
    const budgetParam = searchParams.get('budget');
    const geography = searchParams.get('geography');
    const currency = searchParams.get('currency');
    const searchId = searchParams.get('searchId'); // Check if loading existing search

    console.log('URL Parameters received:', {
      occasion,
      age: ageParam,
      gender,
      personality,
      budget: budgetParam,
      geography,
      currency,
      searchId
    });

    if (!occasion || !ageParam || !gender || !personality || !budgetParam || !geography) {
      console.error('Missing required parameters, redirecting to home');
      router.push('/');
      return;
    }

    // Parse and validate age and budget
    const age = parseInt(ageParam, 10);
    const budget = parseInt(budgetParam, 10);

    if (isNaN(age) || age <= 0 || age > 120) {
      console.error('Invalid age parameter:', ageParam);
      router.push('/');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      console.error('Invalid budget parameter:', budgetParam);
      router.push('/');
      return;
    }

    const data: FormData = {
      occasion: occasion.trim(),
      age: age,
      gender: gender.trim(),
      personality: personality.trim(),
      budget: budget,
      geography: geography.trim(),
    };

    console.log('Parsed form data:', data);
    setFormData(data);
    
    // Set currency info
    const currencyData = currency ? 
      { symbol: getCurrencyForLocation(geography).symbol, code: currency, name: getCurrencyForLocation(geography).name } :
      getCurrencyForLocation(geography);
    setCurrencyInfo(currencyData);
    
    // If searchId is provided, load existing search, otherwise generate new
    if (searchId) {
      loadExistingSearch(searchId);
    } else {
      generateGifts(data);
    }
  }, [searchParams, router]);

  // Update suggested prompts based on context
  useEffect(() => {
    if (formData && results.length > 0) {
      updateSuggestedPrompts();
    }
  }, [formData, results, messages]);

  const loadExistingSearch = async (searchId: string) => {
    setLoading(true);
    setError('');
    
    try {
      const existingSearch = await getGiftSearch(searchId);
      if (existingSearch) {
        setResults(existingSearch.gift_suggestions);
        setCurrentSearchId(existingSearch.id);
        console.log('Loaded existing search:', existingSearch);
      } else {
        // If search not found, generate new gifts
        if (formData) {
          generateGifts(formData);
        }
      }
    } catch (err) {
      console.error('Error loading existing search:', err);
      // Fallback to generating new gifts
      if (formData) {
        generateGifts(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestedPrompts = () => {
    if (!formData) return;

    const contextualPrompts = [];
    
    // Budget-related prompts
    if (formData.budget > 100) {
      contextualPrompts.push("Show me more budget-friendly options");
      contextualPrompts.push("What can I get for half this budget?");
    } else {
      contextualPrompts.push("I can spend a bit more, show me premium options");
    }

    // Occasion-specific prompts
    if (formData.occasion.toLowerCase().includes('birthday')) {
      contextualPrompts.push("Make these more birthday-themed");
      contextualPrompts.push("What about experience gifts for birthdays?");
    } else if (formData.occasion.toLowerCase().includes('anniversary')) {
      contextualPrompts.push("I want something more romantic");
      contextualPrompts.push("Show me personalized anniversary gifts");
    } else if (formData.occasion.toLowerCase().includes('christmas')) {
      contextualPrompts.push("Make these more festive and Christmas-themed");
      contextualPrompts.push("What about stocking stuffers instead?");
    }

    // Age-specific prompts
    if (formData.age < 18) {
      contextualPrompts.push("Make these more age-appropriate for teens");
      contextualPrompts.push("What about educational gifts?");
    } else if (formData.age > 60) {
      contextualPrompts.push("Show me more practical gifts for seniors");
      contextualPrompts.push("What about comfort and wellness gifts?");
    }

    // Personality-based prompts
    if (formData.personality.toLowerCase().includes('tech')) {
      contextualPrompts.push("Focus more on the latest tech gadgets");
      contextualPrompts.push("What about smart home devices?");
    }
    if (formData.personality.toLowerCase().includes('book') || formData.personality.toLowerCase().includes('read')) {
      contextualPrompts.push("Show me more book-related gifts");
      contextualPrompts.push("What about literary-themed presents?");
    }
    if (formData.personality.toLowerCase().includes('cook') || formData.personality.toLowerCase().includes('food')) {
      contextualPrompts.push("Focus on cooking and kitchen gifts");
      contextualPrompts.push("What about gourmet food experiences?");
    }

    // General helpful prompts
    contextualPrompts.push("Tell me more about the first gift");
    contextualPrompts.push("Which gift would you personally recommend?");
    contextualPrompts.push("Can you explain why these are good choices?");
    contextualPrompts.push("I need something that can be delivered quickly");
    contextualPrompts.push("Show me eco-friendly alternatives");
    contextualPrompts.push("What about DIY or handmade options?");

    // Randomly select 4-6 prompts to avoid overwhelming the user
    const shuffled = contextualPrompts.sort(() => 0.5 - Math.random());
    setSuggestedPrompts(shuffled.slice(0, Math.min(6, shuffled.length)));
  };

  const generateGifts = async (data: FormData) => {
    setLoading(true);
    setError('');
    setResults([]);
    setMessages([]);
    setCurrentSearchId(null);

    console.log('Sending data to API:', data);

    try {
      const response = await fetch('/api/generate-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate gift suggestions');
      }

      const giftSuggestions = await response.json();
      console.log('Received gift suggestions:', giftSuggestions);
      setResults(giftSuggestions);

      // Save to database if user is authenticated
      if (user) {
        try {
          const savedSearch = await saveGiftSearch(user.id, data);
          const savedSuggestions = await saveGiftSuggestions(savedSearch.id, giftSuggestions);
          
          // Update results with database IDs
          setResults(savedSuggestions);
          setCurrentSearchId(savedSearch.id);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Continue with the results even if saving fails
        }
      }
    } catch (err) {
      console.error('Error generating gifts:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || !formData) return;

    // No authentication gates - allow unlimited chat interactions
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/refine-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialCriteria: formData,
          initialSuggestions: results,
          chatHistory: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refinement request');
      }

      const contentType = response.headers.get('content-type');
      console.log('=== CHAT RESPONSE PROCESSING ===');
      console.log('Response content type:', contentType);
      
      if (contentType?.includes('application/json')) {
        // This should be a refinement with new suggestions
        let responseData;
        try {
          responseData = await response.json();
          console.log('✅ JSON response received - updating gift suggestions');
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          throw new Error('Invalid response format');
        }
        
        // Process the new suggestions
        const processedSuggestions = responseData.map((gift: any) => ({
          ...gift,
          shopping_links: gift.shopping_links || []
        }));
        
        setResults(processedSuggestions);
        
        // Save new suggestions if user is authenticated and we have a search ID
        if (user && currentSearchId) {
          try {
            const savedSuggestions = await saveGiftSuggestions(currentSearchId, processedSuggestions);
            setResults(savedSuggestions);
          } catch (dbError) {
            console.error('Error saving refined suggestions:', dbError);
          }
        }
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Perfect! I\'ve updated your gift suggestions based on what you\'re looking for. Check out the new recommendations above - I think you\'ll love these options!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // This is a conversational response
        const textResponse = await response.text();
        console.log('✅ Conversational response received');
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: textResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Update suggested prompts after each interaction
      setTimeout(() => {
        updateSuggestedPrompts();
      }, 500);

    } catch (err) {
      console.error('❌ Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Oops! I ran into a little hiccup there. Mind trying that again? I\'m here to help! 😊',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleToggleFavorite = async (suggestionId: string, currentStatus: boolean) => {
    if (!user || !suggestionId) {
      setShowAuthModal(true);
      return;
    }

    try {
      await toggleGiftFavorite(suggestionId, !currentStatus);
      
      // Update local state
      setResults(prev => prev.map(gift =>
        gift.id === suggestionId
          ? { ...gift, is_favorited: !currentStatus }
          : gift
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBackToForm = () => {
    router.push('/');
  };

  const handleSelectSearch = (search: GiftSearchWithSuggestions) => {
    // Navigate to results page with the selected search data
    const params = new URLSearchParams({
      occasion: search.occasion,
      age: search.age.toString(),
      gender: search.gender,
      geography: search.geography,
      personality: search.personality,
      budget: search.budget.toString(),
      currency: getCurrencyForLocation(search.geography).code,
      searchId: search.id, // Include search ID to load existing data
    });

    router.push(`/results?${params.toString()}`);
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    setChatInput(prompt);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    
    // If user just authenticated and we have form data, save the current search
    if (formData && results.length > 0) {
      saveCurrentSearchAfterAuth();
    }
  };

  const saveCurrentSearchAfterAuth = async () => {
    if (!user || !formData) return;
    
    try {
      const savedSearch = await saveGiftSearch(user.id, formData);
      const savedSuggestions = await saveGiftSuggestions(savedSearch.id, results);
      
      setResults(savedSuggestions);
      setCurrentSearchId(savedSearch.id);
    } catch (error) {
      console.error('Error saving search after auth:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Finding Perfect Gifts...</h2>
          <p className="text-gray-600">Our AI is curating personalized recommendations for you</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <div className="text-red-600">
                <h2 className="text-2xl font-semibold mb-2">Oops! Something went wrong</h2>
                <p className="mb-4">{error}</p>
                <Button onClick={handleBackToForm} className="bg-purple-500 hover:bg-purple-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={showChatSidebar}
        onClose={() => setShowChatSidebar(false)}
        onSelectSearch={handleSelectSearch}
        currentSearchId={currentSearchId}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${showChatSidebar ? 'ml-80' : 'ml-0'}`}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBackToForm}
                variant="outline"
                className="flex items-center gap-2 hover:bg-purple-50"
              >
                <ArrowLeft className="h-4 w-4" />
                New Search
              </Button>
              
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChatSidebar(!showChatSidebar)}
                  className="flex items-center gap-2"
                >
                  <Menu className="h-4 w-4" />
                  <History className="h-4 w-4" />
                  History
                </Button>
              )}
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Perfect Gifts
              </h1>
              {formData && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-gray-600">
                    For {formData.gender}, {formData.age} years old • {formData.occasion} • {getLocationDisplayName(formData.geography)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(formData.budget, currencyInfo)} budget
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="w-24" /> {/* Spacer for centering */}
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {results.map((gift, index) => (
                  <Card key={gift.id || index} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-800 leading-tight">
                          {gift.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {gift.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(gift.id!, gift.is_favorited || false)}
                              className={gift.is_favorited ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                            >
                              <Heart className={`h-4 w-4 ${gift.is_favorited ? 'fill-current' : ''}`} />
                            </Button>
                          )}
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {gift.description}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Why it's perfect</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {gift.reason}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-purple-500" />
                          Where to buy
                        </h4>
                        <div className="space-y-2">
                          {gift.shopping_links && gift.shopping_links.length > 0 ? (
                            gift.shopping_links.map((link, linkIndex) => (
                              <div key={linkIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">{link.platform}</div>
                                  <div className="text-xs text-gray-600">{link.price_range}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(link.url, '_blank')}
                                  className="ml-2 h-8 px-3 text-xs hover:bg-purple-50 hover:border-purple-300"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Shop
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Shopping links will be available for new suggestions
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Chat Refinement Section - No Authentication Gates */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                    <MessageCircle className="h-6 w-6 text-purple-500" />
                    Let's Perfect These Gifts
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Chat with me to adjust the recommendations or ask any questions about the gifts!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messages.length > 0 && (
                    <div className="mb-6 max-h-80 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="text-sm leading-relaxed">
                              {message.role === 'user' ? (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              ) : (
                                <MarkdownRenderer 
                                  content={message.content} 
                                  className={`prose-sm ${message.role === 'assistant' ? 'prose-gray' : ''}`}
                                />
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Let me think about that...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleChatSubmit} className="flex gap-3">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything or request changes... like 'Make them more budget-friendly' or 'Tell me more about the first gift'"
                      className="flex-1 h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      disabled={isChatLoading}
                    />
                    <Button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="h-11 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>

                  {/* Dynamic Suggested Prompts */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <p className="text-sm text-gray-600 w-full mb-2">
                      {messages.length === 0 ? "Try asking me:" : "You might also want to ask:"}
                    </p>
                    {suggestedPrompts.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPromptClick(suggestion)}
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
                        disabled={isChatLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}