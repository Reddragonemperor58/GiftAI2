/*
  # Add shopping_links column to gift_suggestions table

  1. Changes
    - Add `shopping_links` column to `gift_suggestions` table to store shopping platform information
    - This column will store JSON data with platform, URL, and price range information

  2. Notes
    - Column uses JSONB type for efficient storage and querying
    - Default value is an empty array
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_suggestions' AND column_name = 'shopping_links'
  ) THEN
    ALTER TABLE gift_suggestions ADD COLUMN shopping_links jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;