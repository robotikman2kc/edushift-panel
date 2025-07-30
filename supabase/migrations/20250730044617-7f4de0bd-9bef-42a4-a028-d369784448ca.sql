-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'guru');

-- Create users table for application users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'guru',
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users data is viewable by authenticated users" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users data can be inserted by authenticated users" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Users data can be updated by authenticated users" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users data can be deleted by authenticated users" 
ON public.users 
FOR DELETE 
TO authenticated
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();