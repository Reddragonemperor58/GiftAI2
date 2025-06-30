import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrencyForLocation, formatCurrency } from '@/lib/currency';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GiftRequest {
  occasion: string;
  age: number;
  gender: string;
  personality: string;
  budget: number;
  geography: string;
}

interface GiftSuggestion {
  name: string;
  description: string;
  reason: string;
  shopping_links: {
    platform: string;
    url: string;
    price_range: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GiftRequest = await request.json();
    const { occasion, age, gender, personality, budget, geography } = body;

    // Validate required fields
    if (!occasion || !age || !gender || !personality || !budget || !geography) {
      return NextResponse.json(
        { error: 'Missing required fields: occasion, age, gender, personality, budget, geography' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get currency info for the location
    const currencyInfo = getCurrencyForLocation(geography);
    const formattedBudget = formatCurrency(budget, currencyInfo);

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    });

    // Construct the prompt with enhanced shopping platform guidance
    const prompt = `You are GiftAI, a world-class gift-giving expert with years of experience helping people find the perfect gifts. You have an exceptional understanding of what makes a gift meaningful and appropriate for different occasions, personalities, and budgets. Your expertise spans across all demographics and interests.

Your task is to analyze the recipient's details and suggest thoughtful, practical gift ideas that will genuinely delight them. Consider their personality traits, age appropriateness, gender preferences (while avoiding stereotypes), the occasion's significance, budget constraints, and their geographic location for shopping availability.

Based on the following details, suggest exactly 3 perfect gift ideas:

Occasion: ${occasion}
Age: ${age}
Gender: ${gender}
Personality: ${personality}
Budget: ${formattedBudget} (${currencyInfo.code})
Location: ${geography}

CRITICAL REQUIREMENTS FOR AGE-APPROPRIATE TARGETING:

1. AGE-SPECIFIC SEARCH TERMS: Use age-appropriate keywords in search terms:
   - For ages 18-25: Include "young adult", "college", "university", "teen", "youth"
   - For ages 26-35: Include "adult", "professional", "millennial"
   - For ages 36-50: Include "adult", "mature", "professional"
   - For ages 51+: Include "adult", "senior", "mature"

2. AVOID CHILD-RELATED TERMS: Never use "kids", "children", "baby", "toddler" for recipients over 16

3. GENDER-APPROPRIATE TERMS: Use "men", "women", "adult" instead of "boys", "girls" for recipients over 16

CRITICAL REQUIREMENTS FOR SHOPPING LINKS AND PRICING:

1. PRICE ACCURACY: The price ranges you provide MUST be realistic and achievable on the platforms you suggest. Research typical market prices for similar items.

2. SPECIFIC SEARCH TERMS: Use very specific, targeted search terms that will actually find the product you're suggesting. Include:
   - Age-appropriate descriptors (adult, professional, etc.)
   - Brand names when relevant
   - Specific product categories
   - Key features or specifications
   - Price filters when possible

3. BUDGET ALIGNMENT: Each gift should cost between 70-100% of the stated budget (${formattedBudget}). If suggesting multiple items as a bundle, the total should fit the budget.

${getEnhancedShoppingPlatformGuidance(geography, currencyInfo, budget, age, gender)}

IMPORTANT: You must respond ONLY with a valid JSON array containing exactly 3 gift suggestions. Each object must have exactly these four fields:
- "name": A concise, specific gift name (include brand if relevant)
- "description": A detailed description of the gift (2-3 sentences)
- "reason": An explanation of why this gift is perfect for this person (2-3 sentences)
- "shopping_links": An array of 2-3 shopping platform objects, each with:
  - "platform": The name of the shopping platform
  - "url": A properly filtered search URL that will show relevant results in the right price range
  - "price_range": Realistic price range for this specific item in the local currency

Do not include any other text, explanations, or formatting outside of the JSON array. The response must be valid JSON that can be parsed directly.

Example format:
[
  {
    "name": "Specific Brand/Product Name",
    "description": "Detailed description of the gift and what it includes.",
    "reason": "Why this gift is perfect for this specific person based on their details.",
    "shopping_links": [
      {
        "platform": "Amazon",
        "url": "https://amazon.com/s?k=specific+adult+product+terms&rh=p_36%3A2000-3000",
        "price_range": "${currencyInfo.symbol}20-30"
      }
    ]
  }
]`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();
    
    if (!aiResponse) {
      throw new Error('No response received from Gemini');
    }

    // Parse and validate the AI response
    let giftSuggestions: GiftSuggestion[];
    try {
      // Clean the response in case there are any markdown code blocks
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      giftSuggestions = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!Array.isArray(giftSuggestions)) {
        throw new Error('Response is not an array');
      }
      
      // Ensure we have exactly 3 suggestions
      if (giftSuggestions.length !== 3) {
        throw new Error(`Expected 3 gift suggestions, got ${giftSuggestions.length}`);
      }
      
      // Validate each gift suggestion has required fields
      for (const gift of giftSuggestions) {
        if (!gift.name || !gift.description || !gift.reason || !gift.shopping_links) {
          throw new Error('Invalid gift suggestion structure');
        }
        
        // Validate shopping links structure
        if (!Array.isArray(gift.shopping_links) || gift.shopping_links.length === 0) {
          throw new Error('Invalid shopping links structure');
        }
        
        for (const link of gift.shopping_links) {
          if (!link.platform || !link.url || !link.price_range) {
            throw new Error('Invalid shopping link structure');
          }
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Gemini Response:', aiResponse);
      
      // Return a fallback response
      return NextResponse.json(
        { error: 'Failed to generate valid gift suggestions. Please try again.' },
        { status: 500 }
      );
    }

    // Return the parsed gift suggestions
    return NextResponse.json(giftSuggestions, { status: 200 });

  } catch (error) {
    console.error('Error in generate-gift API:', error);
    
    // Handle specific Gemini errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Gemini API configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.includes('SAFETY')) {
        return NextResponse.json(
          { error: 'Content filtered by safety settings. Please try different inputs.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

function getEnhancedShoppingPlatformGuidance(geography: string, currencyInfo: { symbol: string; code: string }, budget: number, age: number, gender: string): string {
  const location = geography.toLowerCase();
  const budgetInCents = Math.round(budget * 100); // For price filters
  const minPrice = Math.round(budget * 0.7);
  const maxPrice = Math.round(budget * 1.1);
  
  // Age-appropriate search term guidance
  let ageTerms = '';
  if (age >= 18 && age <= 25) {
    ageTerms = 'young adult, college, university, teen, youth';
  } else if (age >= 26 && age <= 35) {
    ageTerms = 'adult, professional, millennial';
  } else if (age >= 36 && age <= 50) {
    ageTerms = 'adult, mature, professional';
  } else if (age > 50) {
    ageTerms = 'adult, senior, mature';
  } else {
    ageTerms = 'adult';
  }

  // Gender-appropriate terms (avoid "boys"/"girls" for adults)
  const genderTerm = gender.toLowerCase().includes('female') || gender.toLowerCase().includes('woman') ? 'women' : 
                    gender.toLowerCase().includes('male') || gender.toLowerCase().includes('man') ? 'men' : 'adult';
  
  if (location.includes('us') || location.includes('united states') || location.includes('america') || 
      /^\d{5}(-\d{4})?$/.test(geography)) {
    return `For shopping links, use these verified US platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries. NEVER use "kids", "children", "boys", "girls" for recipients over 16.

- "Amazon": Use URL format "https://amazon.com/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  Example: "https://amazon.com/s?k=bluetooth+wireless+headphones+${genderTerm}+adult&rh=p_36%3A2000-5000" (for $20-50 range)
  
- "Target": Use URL format "https://target.com/s?searchTerm=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&facetedValue=price%3A${minPrice}-${maxPrice}"
  Example: "https://target.com/s?searchTerm=coffee+maker+adult&facetedValue=price%3A30-60"
  
- "Walmart": Use URL format "https://walmart.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&min_price=${minPrice}&max_price=${maxPrice}"
  Example: "https://walmart.com/search?q=wireless+earbuds+${genderTerm}+adult&min_price=25&max_price=50"
  
- "Best Buy": Use URL format "https://bestbuy.com/site/searchpage.jsp?st=SPECIFIC_SEARCH_TERMS+adult&qp=currentprice_facet%3DPrice~${minPrice}%20to%20${maxPrice}"

CRITICAL: Replace SPECIFIC_SEARCH_TERMS with exact product keywords + age-appropriate terms. Price ranges in USD (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  if (location.includes('uk') || location.includes('united kingdom') || location.includes('britain') ||
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(geography)) {
    return `For shopping links, use these verified UK platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries. NEVER use "kids", "children", "boys", "girls" for recipients over 16.

- "Amazon UK": Use URL format "https://amazon.co.uk/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  Example: "https://amazon.co.uk/s?k=bluetooth+speaker+${genderTerm}+adult&rh=p_36%3A2000-4000" (for £20-40 range)
  
- "John Lewis": Use URL format "https://johnlewis.com/search?search-term=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"
  
- "Argos": Use URL format "https://argos.co.uk/search/SPECIFIC_SEARCH_TERMS+${genderTerm}+adult/?clickOrigin=searchbar"
  
- "Currys": Use URL format "https://currys.co.uk/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"

Price ranges in GBP (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  if (location.includes('canada') || /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i.test(geography)) {
    return `For shopping links, use these verified Canadian platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries.

- "Amazon Canada": Use URL format "https://amazon.ca/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  
- "Best Buy Canada": Use URL format "https://bestbuy.ca/en-ca/search?search=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"
  
- "Canadian Tire": Use URL format "https://canadiantire.ca/en/search-results.html?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"
  
- "The Bay": Use URL format "https://thebay.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"

Price ranges in CAD (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  if (location.includes('australia') || /^[0-9]{4}$/.test(geography)) {
    return `For shopping links, use these verified Australian platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries.

- "Amazon Australia": Use URL format "https://amazon.com.au/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  
- "JB Hi-Fi": Use URL format "https://jbhifi.com.au/search?query=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"
  
- "Harvey Norman": Use URL format "https://harveynorman.com.au/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"
  
- "Kmart Australia": Use URL format "https://kmart.com.au/search/?searchTerm=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult"

Price ranges in AUD (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  if (location.includes('india') || /^[0-9]{6}$/.test(geography)) {
    return `For shopping links, use these verified Indian platforms with WORKING URL FORMATS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries. Use specific Hindi/English product terms.

- "Amazon India": Use URL format "https://amazon.in/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  Example: "https://amazon.in/s?k=wireless+bluetooth+headphones+${genderTerm}+adult&rh=p_36%3A150000-300000" (for ₹1500-3000 range)
  
- "Flipkart": Use URL format "https://flipkart.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&p%5B%5D=facets.price_range.from%3D${minPrice}&p%5B%5D=facets.price_range.to%3D${maxPrice}"
  Example: "https://flipkart.com/search?q=bluetooth+speaker+${genderTerm}+adult&p%5B%5D=facets.price_range.from%3D2000&p%5B%5D=facets.price_range.to%3D5000"
  
- "Myntra": Use URL format "https://myntra.com/${genderTerm}?q=SPECIFIC_SEARCH_TERMS" (for fashion/lifestyle items)
  Example: "https://myntra.com/${genderTerm}?q=handbag" 
  Note: Users need to manually apply price filters on Myntra. Suggest products that typically fall within the budget range.
  
- "Nykaa": Use URL format "https://nykaa.com/search/result/?q=SPECIFIC_SEARCH_TERMS+${genderTerm}" (for beauty/wellness items)
  Example: "https://nykaa.com/search/result/?q=skincare+${genderTerm}"
  Note: Users need to manually apply price filters on Nykaa. Suggest products that typically fall within the budget range.

IMPORTANT: For Myntra and Nykaa, price filtering must be done manually on the site. Focus on specific product categories that match the budget range and mention this in the price_range field.

Price ranges in INR (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }

  if (location.includes('germany') || location.includes('deutschland')) {
    return `For shopping links, use these verified German platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries.

- "Amazon Germany": Use URL format "https://amazon.de/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+erwachsene&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  
- "Otto": Use URL format "https://otto.de/suche/SPECIFIC_SEARCH_TERMS+${genderTerm}+erwachsene/"
  
- "MediaMarkt": Use URL format "https://mediamarkt.de/de/search.html?query=SPECIFIC_SEARCH_TERMS+${genderTerm}"
  
- "Zalando": Use URL format "https://zalando.de/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}"

Price ranges in EUR (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }

  if (location.includes('france')) {
    return `For shopping links, use these verified French platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries.

- "Amazon France": Use URL format "https://amazon.fr/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adulte&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  
- "Fnac": Use URL format "https://fnac.com/SearchResult/ResultList.aspx?Search=SPECIFIC_SEARCH_TERMS+${genderTerm}+adulte"
  
- "Cdiscount": Use URL format "https://cdiscount.com/search/10/SPECIFIC_SEARCH_TERMS+${genderTerm}+adulte.html"
  
- "La Redoute": Use URL format "https://laredoute.fr/search?keyword=SPECIFIC_SEARCH_TERMS+${genderTerm}+adulte"

Price ranges in EUR (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  // Default international guidance
  return `For shopping links, use these verified international platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries. NEVER use "kids", "children", "boys", "girls" for recipients over 16.

- "Amazon": Use URL format "https://amazon.com/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
  Example: "https://amazon.com/s?k=wireless+bluetooth+earbuds+${genderTerm}+adult&rh=p_36%3A2500-5000" (for $25-50 range)
  
- "eBay": Use URL format "https://ebay.com/sch/i.html?_nkw=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&_udlo=${minPrice}&_udhi=${maxPrice}"
  Example: "https://ebay.com/sch/i.html?_nkw=vintage+leather+wallet+${genderTerm}+adult&_udlo=30&_udhi=60"
  
- "Etsy": Use URL format "https://etsy.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&min=${minPrice}&max=${maxPrice}"
  Example: "https://etsy.com/search?q=personalized+coffee+mug+${genderTerm}+adult&min=15&max=35"

CRITICAL: Use very specific search terms that will find the exact type of product you're suggesting. Price ranges in ${currencyInfo.code} (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
}