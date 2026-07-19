-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DROP EXISTING TABLES (Limpeza para reinstalação)
-- ==========================================
DROP TABLE IF EXISTS section_items CASCADE;
DROP TABLE IF EXISTS page_sections CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;

DROP TABLE IF EXISTS site_content CASCADE;
DROP TABLE IF EXISTS hero_slides CASCADE;
DROP TABLE IF EXISTS product_lines CASCADE;
DROP TABLE IF EXISTS cuts CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;

-- ==========================================
-- 2. CREATE EXISTING TABLES (Mantendo estrutura)
-- ==========================================

-- Table: site_content
CREATE TABLE site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section VARCHAR(100) NOT NULL,
  content_key VARCHAR(100) NOT NULL,
  content_value TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text',
  page VARCHAR(50) DEFAULT 'home',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, content_key, page)
);

-- Table: hero_slides
CREATE TABLE hero_slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text VARCHAR(100),
  cta_link VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  page VARCHAR(50) DEFAULT 'home', -- NOVA COLUNA ADICIONADA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: product_lines  
CREATE TABLE product_lines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cuts (individual meat cuts)
CREATE TABLE cuts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  line_id UUID REFERENCES product_lines(id) ON DELETE SET NULL,
  price_range VARCHAR(50),
  weight VARCHAR(50),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: units (restaurant locations)
CREATE TABLE units (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  hours TEXT NOT NULL,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(100),
  image_url TEXT,
  maps_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: events
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  date DATE,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: site_settings
CREATE TABLE site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contact_submissions
CREATE TABLE contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. CREATE NEW TABLES
-- ==========================================

-- Table: pages
CREATE TABLE pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: page_sections
CREATE TABLE page_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title VARCHAR(255),
  config JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: section_items
CREATE TABLE section_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID REFERENCES page_sections(id) ON DELETE CASCADE,
  content_type TEXT,
  content_value TEXT,
  image_url TEXT,
  link_url TEXT,
  alt_text TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: media_library
CREATE TABLE media_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  alt_text TEXT,
  width INT,
  height INT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: blog_posts
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  author TEXT DEFAULT 'Bull Prime',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. TRIGGER FUNCTION PARA UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas existentes e novas (onde for aplicável)
CREATE TRIGGER update_site_content_modtime BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hero_slides_modtime BEFORE UPDATE ON hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_lines_modtime BEFORE UPDATE ON product_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cuts_modtime BEFORE UPDATE ON cuts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_modtime BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_modtime BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_modtime BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_modtime BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_page_sections_modtime BEFORE UPDATE ON page_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_section_items_modtime BEFORE UPDATE ON section_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_modtime BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX idx_page_sections_sort_order ON page_sections(sort_order);
CREATE INDEX idx_section_items_section_id ON section_items(section_id);
CREATE INDEX idx_section_items_sort_order ON section_items(sort_order);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_product_lines_slug ON product_lines(slug);
CREATE INDEX idx_units_slug ON units(slug);

-- ==========================================
-- 5. RLS POLICIES E SEGURANÇA
-- ==========================================
-- Habilitar RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read policies (visitantes podem ler conteúdo ativo/publicado)
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read hero_slides" ON hero_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Public read product_lines" ON product_lines FOR SELECT USING (is_active = true);
CREATE POLICY "Public read cuts" ON cuts FOR SELECT USING (is_active = true);
CREATE POLICY "Public read units" ON units FOR SELECT USING (is_active = true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read pages" ON pages FOR SELECT USING (status = 'published');
CREATE POLICY "Public read page_sections" ON page_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read section_items" ON section_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public read blog_posts" ON blog_posts FOR SELECT USING (status = 'published');

-- Public insert para contato
CREATE POLICY "Public insert contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admin write policies (apenas usuários autenticados podem modificar)
CREATE POLICY "Admin write site_content" ON site_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write hero_slides" ON hero_slides FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write product_lines" ON product_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write cuts" ON cuts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write units" ON units FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write events" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read/write contact" ON contact_submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write pages" ON pages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write page_sections" ON page_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write section_items" ON section_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all media_library" ON media_library FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write blog_posts" ON blog_posts FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- 6. STORAGE BUCKET: 'media'
-- ==========================================
-- Criação do bucket caso não exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies do Storage (usando table storage.objects do supabase)
CREATE POLICY "Public read media objects" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Auth insert media objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update media objects" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete media objects" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');


-- ==========================================
-- 7. SEED DATA
-- ==========================================

-- Inserir páginas do sistema
INSERT INTO pages (title, slug, status, is_system) VALUES 
('Home', 'home', 'published', true),
('Sobre', 'sobre', 'published', true),
('Cardápio', 'cardapio', 'published', true),
('Unidades', 'unidades', 'published', true),
('Eventos', 'eventos', 'published', true),
('Contato', 'contato', 'published', true),
('Blog', 'blog', 'published', true);

-- Inserir configurações do site
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('site_name', 'Bull Prime'),
('contact_email', 'contato@bullprime.com.br'),
('contact_phone', '(41) 3030-4446'),
('instagram', 'https://instagram.com/bullprime'),
('facebook', 'https://facebook.com/bullprime');

-- Inserir o conteúdo base existente
INSERT INTO site_content (section, content_key, content_value, page) VALUES
('hero', 'label', 'A Experiência Definitiva em Carnes Nobres', 'home'),
('hero', 'title', 'Referência em', 'home'),
('hero', 'title_highlight', 'WAGYU & DRY AGED', 'home'),
('hero', 'description', 'Um espaço completo com as melhores carnes do mundo. Cortes nobres dos melhores frigoríficos, com a melhor qualidade em Curitiba e Joinville.', 'home'),
('hero', 'cta_primary', 'Conheça a Bull Prime', 'home'),
('hero', 'cta_secondary', 'Ver catálogo', 'home'),
('differentials', 'label', 'Excelência em cada detalhe', 'home'),
('differentials', 'title', 'Diferenciais Bull Prime', 'home'),
('differentials', 'wagyu_title', 'WAGYU', 'home'),
('differentials', 'wagyu_desc', 'O corte mais nobre do mundo na sua mesa.', 'home'),
('differentials', 'dryaged_title', 'DRY AGED', 'home'),
('differentials', 'dryaged_desc', 'A arte da maturação a seco no padrão Bull Prime', 'home'),
('differentials', 'events_title', 'EVENTOS', 'home'),
('differentials', 'events_desc', 'Transforme o seu evento em uma verdadeira experiência.', 'home'),
('differentials', 'experiences_title', 'EXPERIÊNCIAS', 'home'),
('differentials', 'experiences_desc', 'Brasa, técnica e pratos inesquecíveis.', 'home'),
('gastronomy', 'label', 'Experiência Gastronômica', 'home'),
('gastronomy', 'title', 'Restaurantes de Carne Premium em Curitiba', 'home'),
('gastronomy', 'description', 'A Bull Prime reúne o melhor da gastronomia em carnes nobres, como Wagyu, Angus, Dry Aged e Cordeiro, em ambientes sofisticados e aconchegantes. Steakhouse, parrilla e açougue premium em um só lugar. Encontre a unidade mais próxima e venha viver essa experiência!', 'home'),
('gastronomy', 'cta', 'Encontre a unidade mais próxima', 'home'),
('about', 'label', 'Carnes Nobres Premium em Curitiba e Joinville', 'home'),
('about', 'description', 'A Bull Prime é referência em carnes nobres em Curitiba e Joinville. Do açougue premium a steakhouse com parrilla argentina, reunimos Wagyu, Angus, Dry Aged e Cordeiro num único espaço pensado para quem não abre mão de qualidade. Aqui você encontra os melhores cortes do mundo.', 'home'),
('about', 'cta_primary', 'Conheça a Bull Prime', 'home'),
('about', 'cta_secondary', 'Ver catálogo', 'home'),
('cuts', 'label', 'Cortes Nobres Premium', 'home'),
('cuts', 'description', 'Conheça nossa seleção exclusiva dos melhores e mais raros cortes e carnes do mundo.', 'home'),
('lines', 'label', 'Seleção Bull Prime', 'home'),
('lines', 'title', 'Linhas Premium', 'home'),
('lines', 'description', 'Da linha dia a dia, até o corte mais exclusivo, cada linha carrega o mesmo compromisso: qualidade sem concessão. Escolha a sua e descubra por que a Bull Prime é referência em carnes nobres.', 'home'),
('units', 'label', 'Experiências Bull Prime', 'home'),
('units', 'title', 'Conheça nossas unidades', 'home'),
('units', 'description', 'Contamos com 04 unidades em Curitiba e 01 em Joinville. Cada uma com sua personalidade, sua atmosfera e sua razão pra você voltar. Ambientes sofisticados com parrilla argentina, cortes nobres e atendimento que faz a diferença. Explore cada unidade e descubra qual experiência combina mais com você.', 'home');

-- Inserir linhas de produtos
INSERT INTO product_lines (name, slug, description, image_url, sort_order) VALUES
('Linha Black Series', 'black-series', 'Os cortes mais exclusivos e premium da Bull Prime.', 'public/06.blackseries.heic', 1),
('Linha 1906 Angus Beef', '1906-angus', 'Angus de qualidade superior, tradição desde 1906.', 'public/07.1906.heic', 2),
('Linha Dia a Dia', 'dia-a-dia', 'Qualidade premium para o seu dia a dia.', 'public/08.diadia.jpg', 3),
('Cordeiro do Canan', 'cordeiro', 'Cordeiro premium de origem controlada.', 'public/09.cordeiro.jpg', 4),
('Dry Aged', 'dry-aged', 'A arte da maturação a seco.', 'public/02.dryaged.png', 5),
('Wagyu', 'wagyu', 'O corte mais nobre do mundo.', 'public/01.wagyu.jpg', 6);

-- Inserir unidades
INSERT INTO units (name, slug, address, hours, phone, sort_order) VALUES
('Bull Prime Cabral', 'cabral', 'R. dos Funcionários, 1100 - Cabral, Curitiba - PR, 80035-050', 'Seg a Sab: das 09hr às 21hr | Domingo das 09hr às 15hr', '(41) 99965-0093', 1),
('Bull Prime Ecoville', 'ecoville', 'R. Prof. Pedro Viriato Parigot de Souza, 1562 - Mossunguê, Curitiba - PR, 81200-100', 'Seg a Sab: das 09hr às 21hr | Domingo das 09hr às 15hr', '(41) 3026-2446', 2),
('Bull Prime Pátio Batel', 'patio-batel', 'Av. do Batel, 1868 - 316 - Batel, Curitiba - PR, 80420-090', 'Seg a Sab: das 12hr às 22hr | Domingo das 12hr às 20hr', '(41) 3030-4446', 3),
('Bull Prime Silva Jardim', 'silva-jardim', 'Av. Silva Jardim, 3813 - Seminário, Curitiba - PR, 80240-021', 'Seg a Sex: das 09hr às 21hr | Sábado das 09hr às 22hr | Domingo das 09hr às 16hr', '(41) 3030-4446', 4),
('Bull Prime Garten Shopping | Joinville', 'garten-joinville', 'Av. Rolf Wiest, 333 - Zona Industrial Norte, Joinville - SC, 89219-710', 'Seg a Sab: das 11hr às 22hr | Domingo das 10hr às 22hr', '(41) 3030-4446', 5);


-- Comando para Criação de Usuário Admin (apenas referência)
-- Em ambientes Supabase de produção, a criação de usuários requer hash nas senhas.
-- Um exemplo funcional via pgcrypto (útil em dev local):
-- INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
-- VALUES (
--   uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@bullprime.com.br',
--   crypt('senha_temporaria123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''
-- );
