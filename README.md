# GiftAI 🎁

An AI-powered gift recommendation platform that helps you find the perfect gifts for any occasion using advanced AI technology.

## Features

- **AI-Powered Recommendations**: Get personalized gift suggestions based on recipient details
- **Multi-Currency Support**: Automatic currency detection based on location
- **Interactive Chat**: Refine recommendations through natural conversation
- **User Accounts**: Save searches and favorite gifts
- **Global Shopping Links**: Direct links to purchase gifts from popular retailers
- **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini AI
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GiftAI.git
cd GiftAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your actual API keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

5. Set up the database:
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations` folder
   - Enable Row Level Security (RLS)

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Setup

The project uses Supabase with the following tables:

- `user_profiles` - User account information
- `gift_searches` - Saved gift search criteria
- `gift_suggestions` - AI-generated gift recommendations
- `user_favorites` - User's favorited gifts

All migrations are included in the `supabase/migrations` folder.

## API Keys Setup

### Supabase
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon public key

### Google Gemini AI
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Copy the API key

## Deployment

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Environment Variables for Production
Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Features Overview

### Gift Search
- Occasion-based recommendations
- Age and gender targeting
- Personality-based matching
- Budget-conscious suggestions
- Location-aware shopping links

### AI Chat Refinement
- Natural language interaction
- Real-time suggestion updates
- Context-aware responses
- Suggested prompts

### User Management
- Secure authentication
- Search history
- Favorite gifts
- Profile management

### Global Support
- Multi-currency pricing
- Location-based shopping links
- International shipping considerations
- Regional gift preferences

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.

## Acknowledgments

- Google Gemini AI for powerful gift recommendations
- Supabase for backend infrastructure
- shadcn/ui for beautiful UI components
- The open-source community for amazing tools and libraries