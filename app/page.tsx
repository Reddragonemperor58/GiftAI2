'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Gift, Sparkles, Loader2, LogIn, MapPin, Globe, Menu, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { UserMenu } from '@/components/UserMenu';
import { ChatSidebar } from '@/components/ChatSidebar';
import { getCurrencyForLocation, formatCurrency, getSuggestedBudgets } from '@/lib/currency';
import { type GiftSearchWithSuggestions } from '@/lib/gifts';

interface FormData {
  occasion: string;
  age: string; // Keep as string to avoid parsing issues
  gender: string;
  personality: string;
  budget: string; // Keep as string to avoid parsing issues
  // Location fields
  locationType: 'pincode' | 'city';
  pincode: string;
  city: string;
  state: string;
  country: string;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    occasion: '',
    age: '',
    gender: '',
    personality: '',
    budget: '',
    locationType: 'pincode',
    pincode: '',
    city: '',
    state: '',
    country: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [currencyInfo, setCurrencyInfo] = useState({ symbol: '$', code: 'USD', name: 'US Dollar' });
  const [suggestedBudgets, setSuggestedBudgets] = useState<number[]>([25, 50, 100, 200, 500]);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Chat sidebar state
  const [showChatSidebar, setShowChatSidebar] = useState(false);

  // Update currency when location changes
  useEffect(() => {
    const locationString = getLocationString();
    if (locationString) {
      const newCurrencyInfo = getCurrencyForLocation(locationString);
      setCurrencyInfo(newCurrencyInfo);
      setSuggestedBudgets(getSuggestedBudgets(newCurrencyInfo.code));
      
      // Reset budget when currency changes to avoid confusion
      if (formData.budget) {
        setFormData(prev => ({ ...prev, budget: '' }));
      }
    }
  }, [formData.locationType, formData.pincode, formData.city, formData.state, formData.country]);

  const getLocationString = (): string => {
    if (formData.locationType === 'pincode') {
      return formData.pincode.trim();
    } else {
      const parts = [formData.city, formData.state, formData.country].filter(part => part.trim());
      return parts.join(', ');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationTypeChange = (value: 'pincode' | 'city') => {
    setFormData(prev => ({
      ...prev,
      locationType: value,
      // Clear the other location fields when switching
      pincode: value === 'pincode' ? prev.pincode : '',
      city: value === 'city' ? prev.city : '',
      state: value === 'city' ? prev.state : '',
      country: value === 'city' ? prev.country : '',
    }));
  };

  const handleBudgetSuggestionClick = (amount: number) => {
    setFormData(prev => ({ ...prev, budget: amount.toString() }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const locationString = getLocationString();
    if (!locationString) {
      setLoading(false);
      return;
    }

    // Validate and convert form data
    const ageNum = parseInt(formData.age);
    const budgetNum = parseInt(formData.budget);

    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      alert('Please enter a valid age between 1 and 120');
      setLoading(false);
      return;
    }

    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert('Please enter a valid budget amount');
      setLoading(false);
      return;
    }

    // Create URL params for the results page with proper validation
    const params = new URLSearchParams({
      occasion: formData.occasion.trim(),
      age: ageNum.toString(), // Ensure it's properly converted
      gender: formData.gender.trim(),
      geography: locationString,
      personality: formData.personality.trim(),
      budget: budgetNum.toString(), // Ensure it's properly converted
      currency: currencyInfo.code,
    });

    console.log('Form submission data:', {
      occasion: formData.occasion.trim(),
      age: ageNum,
      gender: formData.gender.trim(),
      geography: locationString,
      personality: formData.personality.trim(),
      budget: budgetNum,
      currency: currencyInfo.code,
    });

    // Navigate to results page with form data
    router.push(`/results?${params.toString()}`);
  };

  const isLocationValid = (): boolean => {
    if (formData.locationType === 'pincode') {
      return formData.pincode.trim().length > 0;
    } else {
      return formData.city.trim().length > 0 && formData.country.trim().length > 0;
    }
  };

  const isFormValid = (): boolean => {
    const ageNum = parseInt(formData.age);
    const budgetNum = parseInt(formData.budget);
    
    return (
      formData.occasion.trim().length > 0 &&
      !isNaN(ageNum) && ageNum > 0 && ageNum <= 120 &&
      formData.gender.trim().length > 0 &&
      formData.personality.trim().length > 0 &&
      !isNaN(budgetNum) && budgetNum > 0 &&
      isLocationValid()
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Loading...</p>
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
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${showChatSidebar ? 'ml-80' : 'ml-0'}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with Auth */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  GiftAI
                </h1>
              </div>
              <div className="flex justify-end">
                {user ? (
                  <UserMenu 
                    onViewHistory={() => setShowChatSidebar(true)}
                    onViewFavorites={() => setShowChatSidebar(true)}
                  />
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover the perfect gift with AI-powered recommendations tailored to your recipient's personality and your budget.
            </p>
            {user && (
              <p className="text-sm text-purple-600 mt-2">
                Welcome back! Your searches will be saved automatically.
              </p>
            )}
          </div>

          {/* Main Form Card */}
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Tell us about your recipient
              </CardTitle>
              <CardDescription className="text-gray-600">
                The more details you provide, the better our AI can personalize the recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="occasion" className="text-sm font-medium text-gray-700">
                      Occasion
                    </Label>
                    <Input
                      id="occasion"
                      type="text"
                      placeholder="e.g., Birthday, Anniversary, Christmas"
                      value={formData.occasion}
                      onChange={(e) => handleInputChange('occasion', e.target.value)}
                      className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                    />
                    {formData.age && (isNaN(parseInt(formData.age)) || parseInt(formData.age) <= 0 || parseInt(formData.age) > 120) && (
                      <p className="text-xs text-red-600">Please enter a valid age between 1 and 120</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Gender
                    </Label>
                    <Input
                      id="gender"
                      type="text"
                      placeholder="e.g., Male, Female, Non-binary"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                    />
                  </div>
                </div>

                {/* Enhanced Location Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    Location Details
                  </Label>
                  
                  <RadioGroup
                    value={formData.locationType}
                    onValueChange={(value: 'pincode' | 'city') => handleLocationTypeChange(value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pincode" id="pincode" />
                      <Label htmlFor="pincode" className="text-sm font-medium cursor-pointer">
                        Pincode/Postal Code
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="city" id="city" />
                      <Label htmlFor="city" className="text-sm font-medium cursor-pointer">
                        City, State, Country
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.locationType === 'pincode' ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter your pincode/postal code (e.g., 10001, SW1A 1AA, M5V 3A8)"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                      />
                      <div className="text-xs text-purple-600 mt-1">
                        <p><strong>Examples:</strong> 10001 (US), SW1A 1AA (UK), M5V 3A8 (Canada), 400001 (India)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city-input" className="text-sm font-medium text-gray-700">
                          City *
                        </Label>
                        <Input
                          id="city-input"
                          type="text"
                          placeholder="e.g., New York, London, Mumbai"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state-input" className="text-sm font-medium text-gray-700">
                          State/Province
                        </Label>
                        <Input
                          id="state-input"
                          type="text"
                          placeholder="e.g., NY, California, Maharashtra"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country-input" className="text-sm font-medium text-gray-700">
                          Country *
                        </Label>
                        <Input
                          id="country-input"
                          type="text"
                          placeholder="e.g., USA, United Kingdom, India"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Why we need your location:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Get accurate pricing in your local currency</li>
                          <li>• Find relevant shopping links and stores in your area</li>
                          <li>• Ensure gift availability and delivery options</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personality" className="text-sm font-medium text-gray-700">
                    Personality & Interests
                  </Label>
                  <Textarea
                    id="personality"
                    placeholder="Describe their personality, hobbies, and interests... e.g., loves hiking, coffee enthusiast, tech-savvy, enjoys reading mystery novels"
                    value={formData.personality}
                    onChange={(e) => handleInputChange('personality', e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:border-purple-400 focus:ring-purple-400 resize-none"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="budget" className="text-sm font-medium text-gray-700">
                      Budget
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {currencyInfo.name} ({currencyInfo.code})
                    </Badge>
                  </div>
                  <Input
                    id="budget"
                    type="number"
                    placeholder={`${currencyInfo.symbol}100`}
                    min="1"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                    required
                  />
                  {formData.budget && (isNaN(parseInt(formData.budget)) || parseInt(formData.budget) <= 0) && (
                    <p className="text-xs text-red-600">Please enter a valid budget amount</p>
                  )}
                  {isLocationValid() && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <p className="text-xs text-gray-600 w-full mb-1">Quick select:</p>
                      {suggestedBudgets.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handleBudgetSuggestionClick(amount)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            formData.budget === amount.toString()
                              ? 'bg-purple-100 border-purple-300 text-purple-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200'
                          }`}
                        >
                          {formatCurrency(amount, currencyInfo)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Finding Perfect Gifts...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Find Perfect Gifts
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card className="text-center py-12 border-dashed border-2 border-gray-200 bg-gray-50/50">
            <CardContent>
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">
                Ready to find the perfect gift?
              </h3>
              <p className="text-gray-400">
                Fill out the form above and let our AI work its magic!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}