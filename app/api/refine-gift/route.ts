import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrencyForLocation, formatCurrency } from '@/lib/currency';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface FormData {
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RefineRequest {
  initialCriteria: FormData;
  initialSuggestions: GiftSuggestion[];
  chatHistory: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: RefineRequest = await request.json();
    const { initialCriteria, initialSuggestions, chatHistory } = body;

    // Validate required fields
    if (!initialCriteria || !initialSuggestions || !chatHistory) {
      return NextResponse.json(
        { error: 'Missing required fields: initialCriteria, initialSuggestions, chatHistory' },
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
    const currencyInfo = getCurrencyForLocation(initialCriteria.geography);
    const formattedBudget = formatCurrency(initialCriteria.budget, currencyInfo);

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2500,
      }
    });

    // Get the latest user message
    const latestMessage = chatHistory[chatHistory.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid chat history format' },
        { status: 400 }
      );
    }

    // Build chat history context
    const chatContext = chatHistory.slice(0, -1).map(msg => 
      `${msg.role === 'user' ? 'You' : 'Me'}: ${msg.content}`
    ).join('\n');

    // Analyze the user's intent to determine response mode
    const intentAnalysisPrompt = `Analyze this user message and determine if they want new gift suggestions or just have a question/discussion:

User message: "${latestMessage.content}"

Respond with ONLY one word:
- "REFINEMENT" if they want changes, modifications, new suggestions, alternatives, different options, budget changes, etc.
- "DISCUSSION" if they're asking questions, seeking clarification, or having a general conversation about the existing gifts.

Examples:
- "Make them more budget-friendly" → REFINEMENT
- "Can you suggest DIY alternatives?" → REFINEMENT  
- "I need something more personal" → REFINEMENT
- "What's special about the first gift?" → DISCUSSION
- "How do I use this?" → DISCUSSION
- "Tell me more about why you chose these" → DISCUSSION`;

    // First, determine the intent
    const intentResult = await model.generateContent(intentAnalysisPrompt);
    const intentResponse = await intentResult.response;
    const intent = intentResponse.text().trim().toUpperCase();

    console.log('=== INTENT ANALYSIS ===');
    console.log('User message:', latestMessage.content);
    console.log('Detected intent:', intent);

    if (intent === 'REFINEMENT') {
      // Generate new gift suggestions with enhanced shopping guidance
      const refinementPrompt = `You're my personal gift advisor, and I need your help refining some gift ideas! 

Here's what we're working with:
- **Occasion**: ${initialCriteria.occasion}
- **Recipient**: ${initialCriteria.gender}, ${initialCriteria.age} years old
- **Personality**: ${initialCriteria.personality}
- **Budget**: ${formattedBudget} (${currencyInfo.code})
- **Location**: ${initialCriteria.geography}

**Current suggestions we have:**
${initialSuggestions.map((gift, index) => 
  `${index + 1}. **${gift.name}**: ${gift.description}`
).join('\n')}

${chatContext ? `**Our conversation so far:**\n${chatContext}\n` : ''}

**Your latest request**: ${latestMessage.content}

Based on your feedback, I'll create 3 completely new gift suggestions that better match what you're looking for! 

CRITICAL REQUIREMENTS FOR AGE-APPROPRIATE TARGETING:

1. AGE-SPECIFIC SEARCH TERMS: Use age-appropriate keywords in search terms:
   - For ages 18-25: Include "young adult", "college", "university", "teen", "youth"
   - For ages 26-35: Include "adult", "professional", "millennial"
   - For ages 36-50: Include "adult", "mature", "professional"
   - For ages 51+: Include "adult", "senior", "mature"

2. AVOID CHILD-RELATED TERMS: Never use "kids", "children", "baby", "toddler" for recipients over 16

3. GENDER-APPROPRIATE TERMS: Use "men", "women", "adult" instead of "boys", "girls" for recipients over 16

CRITICAL REQUIREMENTS FOR NEW SUGGESTIONS:

1. PRICE ACCURACY: Each gift must realistically cost between 70-100% of the budget (${formattedBudget})
2. SPECIFIC SEARCH TERMS: Use exact product names, brands, and categories that will find real products
3. PROPER PRICE FILTERS: Include accurate price filter parameters in URLs

${getEnhancedShoppingPlatformGuidance(initialCriteria.geography, currencyInfo, initialCriteria.budget, initialCriteria.age, initialCriteria.gender)}

Please respond with ONLY a valid JSON array containing exactly 3 gift objects. Each must have:
- "name": Specific gift name (include brand if relevant)
- "description": Detailed description (2-3 sentences)
- "reason": Why it's perfect for this person (2-3 sentences)  
- "shopping_links": Array of 2-3 shopping options with "platform", "url" (with proper price filters), and "price_range"

No other text - just the JSON array!`;

      const result = await model.generateContent(refinementPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Try to parse as JSON
      try {
        const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedJson = JSON.parse(cleanedResponse);
        
        // Validate structure
        if (Array.isArray(parsedJson) && parsedJson.length === 3) {
          const isValid = parsedJson.every(gift => 
            gift.name && gift.description && gift.reason && 
            Array.isArray(gift.shopping_links) && gift.shopping_links.length > 0 &&
            gift.shopping_links.every((link: any) => link.platform && link.url && link.price_range)
          );
          
          if (isValid) {
            console.log('✅ Valid refinement JSON generated');
            return NextResponse.json(parsedJson, {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        console.log('❌ Invalid JSON structure, falling back to discussion mode');
      } catch (parseError) {
        console.log('❌ JSON parse failed, falling back to discussion mode');
      }
    }

    // Discussion mode - conversational response
    const discussionPrompt = `You're my friendly, knowledgeable gift advisor having a casual conversation! 

Here's our context:
- **Occasion**: ${initialCriteria.occasion}
- **Recipient**: ${initialCriteria.gender}, ${initialCriteria.age} years old  
- **Personality**: ${initialCriteria.personality}
- **Budget**: ${formattedBudget}
- **Location**: ${initialCriteria.geography}

**Current gift suggestions:**
${initialSuggestions.map((gift, index) => 
  `${index + 1}. **${gift.name}**: ${gift.description} (Perfect because: ${gift.reason})`
).join('\n')}

${chatContext ? `**Our chat so far:**\n${chatContext}\n` : ''}

**Your question**: ${latestMessage.content}

Respond in a warm, conversational way as if we're friends chatting about gifts. Be helpful, enthusiastic, and personal. Use natural language, contractions, and show genuine interest in helping them find the perfect gift. Keep it friendly but informative!

Don't use formal language or sound robotic. Think of how you'd talk to a close friend who asked for gift advice.

You can use markdown formatting for emphasis (*italic*, **bold**) and lists, but keep it natural and conversational.`;

    const result = await model.generateContent(discussionPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('✅ Discussion response generated');
    return new NextResponse(aiResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Error in refine-gift API:', error);
    
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
- "Target": Use URL format "https://target.com/s?searchTerm=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&facetedValue=price%3A${minPrice}-${maxPrice}"
- "Walmart": Use URL format "https://walmart.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&min_price=${minPrice}&max_price=${maxPrice}"
- "Best Buy": Use URL format "https://bestbuy.com/site/searchpage.jsp?st=SPECIFIC_SEARCH_TERMS+adult&qp=currentprice_facet%3DPrice~${minPrice}%20to%20${maxPrice}"

Price ranges in USD (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
  }
  
  if (location.includes('uk') || location.includes('united kingdom') || location.includes('britain') ||
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(geography)) {
    return `For shopping links, use these verified UK platforms with PROPER PRICE FILTERS and AGE-APPROPRIATE SEARCH TERMS:

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries.

- "Amazon UK": Use URL format "https://amazon.co.uk/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
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

CRITICAL: Always include age-appropriate terms (${ageTerms}) and gender terms (${genderTerm}) in search queries. Use specific product terms.

- "Amazon India": Use URL format "https://amazon.in/s?k=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&rh=p_36%3A${Math.round(minPrice * 100)}-${Math.round(maxPrice * 100)}"
- "Flipkart": Use URL format "https://flipkart.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&p%5B%5D=facets.price_range.from%3D${minPrice}&p%5B%5D=facets.price_range.to%3D${maxPrice}"
- "Myntra": Use URL format "https://myntra.com/${genderTerm}?q=SPECIFIC_SEARCH_TERMS" (for fashion/lifestyle items)
  Note: Users need to manually apply price filters on Myntra. Suggest products that typically fall within the budget range.
- "Nykaa": Use URL format "https://nykaa.com/search/result/?q=SPECIFIC_SEARCH_TERMS+${genderTerm}" (for beauty/wellness items)
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
- "eBay": Use URL format "https://ebay.com/sch/i.html?_nkw=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&_udlo=${minPrice}&_udhi=${maxPrice}"
- "Etsy": Use URL format "https://etsy.com/search?q=SPECIFIC_SEARCH_TERMS+${genderTerm}+adult&min=${minPrice}&max=${maxPrice}"

Price ranges in ${currencyInfo.code} (${currencyInfo.symbol}${minPrice}-${maxPrice})`;
}