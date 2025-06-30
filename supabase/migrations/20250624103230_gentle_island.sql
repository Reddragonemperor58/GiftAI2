/*
  # Add geography column to gift_searches table

  1. Changes
    - Add `geography` column to `gift_searches` table to store location information
    - This column will store pincode/postal code or region information for better gift recommendations

  2. Notes
    - Column is required (NOT NULL) for new records
    - Existing records will need to be updated if any exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_searches' AND column_name = 'geography'
  ) THEN
    ALTER TABLE gift_searches ADD COLUMN geography text NOT NULL DEFAULT '';
  END IF;
END $$;