/*
  # GiftAI Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `gift_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `occasion` (text)
      - `age` (integer)
      - `gender` (text)
      - `personality` (text)
      - `budget` (integer)
      - `created_at` (timestamp)
    
    - `gift_suggestions`
      - `id` (uuid, primary key)
      - `search_id` (uuid, references gift_searches)
      - `name` (text)
      - `description` (text)
      - `reason` (text)
      - `is_favorited` (boolean)
      - `created_at` (timestamp)
    
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `suggestion_id` (uuid, references gift_suggestions)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own searches and favorites
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gift_searches table
CREATE TABLE IF NOT EXISTS gift_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  occasion text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  personality text NOT NULL,
  budget integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create gift_suggestions table
CREATE TABLE IF NOT EXISTS gift_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES gift_searches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  reason text NOT NULL,
  is_favorited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  suggestion_id uuid REFERENCES gift_suggestions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, suggestion_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for gift_searches
CREATE POLICY "Users can read own searches"
  ON gift_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own searches"
  ON gift_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches"
  ON gift_searches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
  ON gift_searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for gift_suggestions
CREATE POLICY "Users can read suggestions from own searches"
  ON gift_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gift_searches 
      WHERE gift_searches.id = gift_suggestions.search_id 
      AND gift_searches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create suggestions for own searches"
  ON gift_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gift_searches 
      WHERE gift_searches.id = gift_suggestions.search_id 
      AND gift_searches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update suggestions from own searches"
  ON gift_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gift_searches 
      WHERE gift_searches.id = gift_suggestions.search_id 
      AND gift_searches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete suggestions from own searches"
  ON gift_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gift_searches 
      WHERE gift_searches.id = gift_suggestions.search_id 
      AND gift_searches.user_id = auth.uid()
    )
  );

-- Create policies for user_favorites
CREATE POLICY "Users can read own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();