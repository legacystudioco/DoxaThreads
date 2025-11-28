-- Add updated_at column to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create an update trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists (to avoid errors)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Create trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing orders with created_at value
UPDATE public.orders 
SET updated_at = created_at 
WHERE updated_at IS NULL;
