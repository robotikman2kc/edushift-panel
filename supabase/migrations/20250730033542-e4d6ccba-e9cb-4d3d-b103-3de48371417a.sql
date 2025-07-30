-- Create table for guru (teachers)
CREATE TABLE public.guru (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_guru TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  mata_pelajaran TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telepon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;

-- Create policies for guru access (accessible to all authenticated users for now)
CREATE POLICY "Guru data is viewable by authenticated users" 
ON public.guru 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Guru data can be inserted by authenticated users" 
ON public.guru 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Guru data can be updated by authenticated users" 
ON public.guru 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Guru data can be deleted by authenticated users" 
ON public.guru 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_guru_updated_at
    BEFORE UPDATE ON public.guru
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.guru (nama_guru, nip, mata_pelajaran, email, telepon) VALUES
('Dr. Ahmad Wijaya', '196501011990031001', 'Matematika', 'ahmad.wijaya@sekolah.edu', '081234567890'),
('Siti Nurhaliza, S.Pd', '197203152005012002', 'Bahasa Indonesia', 'siti.nurhaliza@sekolah.edu', '081234567891'),
('Budi Santoso, M.Pd', '198506102010011003', 'Fisika', 'budi.santoso@sekolah.edu', '081234567892'),
('Rina Kusuma, S.Si', '199012282015032004', 'Kimia', 'rina.kusuma@sekolah.edu', '081234567893'),
('Dedi Prasetyo, S.Pd', '196808141994031005', 'Sejarah', 'dedi.prasetyo@sekolah.edu', '081234567894');