-- Add mata_pelajaran_id column to kehadiran table
ALTER TABLE public.kehadiran 
ADD COLUMN mata_pelajaran_id UUID;

-- Add comment to describe the column
COMMENT ON COLUMN public.kehadiran.mata_pelajaran_id IS 'Reference to mata_pelajaran table for subject-specific attendance';