CREATE TABLE IF NOT EXISTS navbar_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir links padrão
INSERT INTO navbar_links (label, url, sort_order) VALUES
('SOBRE NÓS', '/src/pages/sobre.html', 1),
('BULL PRIME', '/src/pages/cardapio.html', 2),
('UNIDADES', '/src/pages/unidades.html', 3),
('EVENTOS E CURSOS', '/src/pages/eventos.html', 4),
('CONTATO', '/src/pages/contato.html', 5);
