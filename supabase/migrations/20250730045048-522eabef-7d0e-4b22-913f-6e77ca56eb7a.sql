-- Insert sample users for authentication
INSERT INTO public.users (user_id, nama, email, role, status) VALUES
  ('5c2c0992-de2c-4a8f-8ea2-6e49b29b6614', 'Admin Sistem', 'admin@gmail.com', 'admin', 'Aktif'),
  (gen_random_uuid(), 'Guru Matematika', 'guru.matematika@sekolah.com', 'guru', 'Aktif'),
  (gen_random_uuid(), 'Guru Bahasa Indonesia', 'guru.bahasa@sekolah.com', 'guru', 'Aktif'),
  (gen_random_uuid(), 'Guru Fisika', 'guru.fisika@sekolah.com', 'guru', 'Aktif');