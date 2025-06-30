
-- Create the properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL UNIQUE,
  location_info TEXT,
  lifestyle JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on property_id for faster lookups
CREATE INDEX idx_properties_property_id ON public.properties(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (since this is property listing data)
CREATE POLICY "Allow public read access to properties" 
  ON public.properties 
  FOR SELECT 
  TO public
  USING (true);

-- Create policy to allow authenticated users to insert/update properties
CREATE POLICY "Allow authenticated users to manage properties" 
  ON public.properties 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);
