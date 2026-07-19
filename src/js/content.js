/**
 * BullPrimeContent — Carregador de Conteúdo Dinâmico
 * 
 * Este módulo conecta o site público ao Supabase, carregando conteúdo
 * dinâmico do banco de dados. Se não houver dados, mantém o HTML original.
 * 
 * Atributos suportados:
 *   data-content="section.content_key"  → Substitui texto/HTML do elemento
 *   data-bg="section.content_key"       → Substitui background-image do elemento
 *   data-img="section.content_key"      → Substitui src de uma tag <img>
 */

const CACHE_PREFIX = 'bp_content_';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos

const BullPrimeContent = {

    /**
     * Detecta a página atual a partir da URL
     */
    detectPage: () => {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path === '/' || path === '') return 'home';
        if (path.includes('sobre')) return 'sobre';
        if (path.includes('cardapio')) return 'cardapio';
        if (path.includes('unidades')) return 'unidades';
        if (path.includes('eventos')) return 'eventos';
        if (path.includes('contato')) return 'contato';
        if (path.includes('blog')) return 'blog';
        return 'home';
    },

    /**
     * Inicializa o carregamento de conteúdo
     */
    init: async () => {
        console.log('BullPrimeContent: Iniciando carregador dinâmico...');

        // Precisa do BullPrimeDB (supabase.js) carregado antes
        if (!window.BullPrimeDB) {
            console.warn('BullPrimeContent: BullPrimeDB não encontrado. Conteúdo estático será mantido.');
            return;
        }

        try {
            await BullPrimeContent.loadAllContent();
            await BullPrimeContent.loadDynamicLists();
            console.log('BullPrimeContent: Carregamento concluído com sucesso.');
        } catch (err) {
            console.error('BullPrimeContent: Erro no carregamento. Conteúdo estático mantido.', err);
        }
    },

    /**
     * Carrega todo o conteúdo dinâmico da página
     */
    loadAllContent: async () => {
        const page = BullPrimeContent.detectPage();
        console.log(`BullPrimeContent: Página detectada: "${page}"`);

        // Coleta todos os elementos marcados
        const textElements = document.querySelectorAll('[data-content]');
        const bgElements = document.querySelectorAll('[data-bg]');
        const imgElements = document.querySelectorAll('[data-img]');

        const totalElements = textElements.length + bgElements.length + imgElements.length;
        if (totalElements === 0) {
            console.log('BullPrimeContent: Nenhum elemento data-content/data-bg/data-img encontrado.');
            return;
        }

        console.log(`BullPrimeContent: ${totalElements} elementos dinâmicos encontrados.`);

        // Extrai todas as seções únicas necessárias
        const sectionsNeeded = new Set();
        const collectSections = (elements, attr) => {
            elements.forEach(el => {
                const val = el.getAttribute(attr);
                if (val && val.includes('.')) {
                    sectionsNeeded.add(val.split('.')[0]);
                }
            });
        };
        collectSections(textElements, 'data-content');
        collectSections(bgElements, 'data-bg');
        collectSections(imgElements, 'data-img');

        // Busca dados de cada seção (com cache)
        const contentMap = {};
        let loadedCount = 0;

        for (const section of sectionsNeeded) {
            const sectionData = await BullPrimeContent.fetchSection(section, page);
            if (sectionData && sectionData.length > 0) {
                sectionData.forEach(item => {
                    const mapKey = `${item.section}.${item.content_key}`;
                    contentMap[mapKey] = item;
                    loadedCount++;
                });
            }
        }

        console.log(`BullPrimeContent: ${loadedCount} registros carregados do banco.`);

        // Aplica conteúdo de texto/HTML
        textElements.forEach(el => {
            const key = el.getAttribute('data-content');
            const item = contentMap[key];
            if (item && item.content_value) {
                el.innerHTML = item.content_value;
            }
            // Se não encontrar → mantém o HTML original (fallback)
        });

        // Aplica background-image
        bgElements.forEach(el => {
            const key = el.getAttribute('data-bg');
            const item = contentMap[key];
            if (item && item.content_value) {
                el.style.backgroundImage = `url('${item.content_value}')`;
            }
        });

        // Aplica src de imagens
        imgElements.forEach(el => {
            const key = el.getAttribute('data-img');
            const item = contentMap[key];
            if (item && item.content_value) {
                el.src = item.content_value;
                if (item.content_value) {
                    el.alt = el.alt || 'Bull Prime';
                }
            }
        });
    },

    /**
     * Busca dados de uma seção do Supabase (com cache localStorage)
     */
    fetchSection: async (section, page = 'home') => {
        const cacheKey = `${CACHE_PREFIX}${page}_${section}`;

        // Tenta ler do cache primeiro
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_EXPIRATION_MS) {
                    console.log(`BullPrimeContent: Seção "${section}" carregada do cache.`);
                    return parsed.data;
                }
            }
        } catch (e) {
            // Cache corrompido, ignora
        }

        // Busca do Supabase
        try {
            const data = await window.BullPrimeDB.getContent(section, page);

            // Salva no cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));

            return data;
        } catch (error) {
            console.warn(`BullPrimeContent: Erro ao buscar seção "${section}". Usando fallback.`, error);

            // Se falhar, tenta usar cache antigo como último recurso
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached).data;
            } catch (e) { /* ignora */ }

            return null;
        }
    },

    /**
     * Força atualização de conteúdo (limpa cache)
     */
    refresh: async () => {
        console.log('BullPrimeContent: Forçando atualização (limpando cache)...');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        await BullPrimeContent.loadAllContent();
    },

    loadDynamicLists: async () => {
        const page = BullPrimeContent.detectPage();
        
        try {
            if (page === 'blog') {
                const { data } = await window.BullPrimeDB.supabase.from('blog_posts').select('*').eq('status', 'published').order('created_at', { ascending: false });
                if (data && data.length > 0) {
                    const grid = document.querySelector('.editorial-grid');
                    if (grid) {
                        grid.innerHTML = data.map((post, idx) => {
                            const isMain = idx === 0;
                            const link = \`blog-post.html?slug=\${post.slug}\`;
                            return \`
                            <div class="\${isMain ? 'ed-span-12' : 'ed-span-6'} masonry-card reveal-blur" style="min-height: \${isMain ? '550px' : '450px'}; box-shadow: 0 \${isMain ? '40px 80px' : '30px 60px'} rgba(0,0,0,\${isMain ? '0.8' : '0.6'}); border-radius: 12px; overflow: hidden; opacity: 1; transform: none;">
                                <div class="masonry-bg" style="background-image: url('\${post.cover_image || '../../public/08.diadia.jpg'}'); \${isMain ? 'left: 0; top: 0; bottom: 0; right: 0; width: 65%; mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);' : 'left: 0; top: 0; right: 0; width: 100%; height: 60%; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);'}"></div>
                                <div class="masonry-overlay" style="\${isMain ? 'background: linear-gradient(to right, rgba(5,4,3,1) 35%, transparent 100%);' : 'background: linear-gradient(to top, rgba(5,4,3,1) 45%, transparent 100%);'}"></div>
                                
                                <div class="masonry-content" style="position: absolute; \${isMain ? 'left: 0; top: 0; bottom: 0; max-width: 50%; padding: 4rem; display: flex; flex-direction: column; justify-content: center;' : 'bottom: 0; width: 100%; padding: 3rem; padding-top: 0; text-align: left;'}">
                                    <span class="section-label" style="color: \${isMain ? 'rgba(255,255,255,0.3)' : 'var(--color-accent)'}; margin-bottom: 1rem;">\${post.tags && post.tags.length > 0 ? post.tags[0] : 'ARTIGO'}</span>
                                    <h3 class="masonry-title" style="font-size: \${isMain ? '3rem' : '2rem'}; \${isMain ? 'color: #fff; margin-bottom: 1.5rem;' : ''}">\${post.title}</h3>
                                    <p class="masonry-desc" style="margin-bottom: \${isMain ? '3rem' : '2rem'}; \${isMain ? 'font-size: 1.1rem; line-height: 1.8;' : ''}">\${post.excerpt || ''}</p>
                                    \${isMain 
                                        ? \`<div><a href="\${link}" class="btn-outline" style="border-color: var(--color-accent); color: var(--color-accent);">LER ARTIGO COMPLETO</a></div>\`
                                        : \`<a href="\${link}" style="color: var(--color-accent); text-decoration: none; font-family: 'Lato'; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid var(--color-accent); padding-bottom: 5px;">Ler Artigo &rarr;</a>\`
                                    }
                                </div>
                            </div>
                            \`;
                        }).join('');
                    }
                }
            } else if (page === 'unidades') {
                const { data } = await window.BullPrimeDB.supabase.from('units').select('*').eq('is_active', true).order('sort_order', { ascending: true });
                if (data && data.length > 0) {
                    const grid = document.querySelector('.units-grid');
                    if (grid) {
                        grid.innerHTML = data.map(unit => \`
                            <div class="unit-card reveal-blur" style="opacity:1; transform:none;">
                                <div class="unit-image" style="background-image: url('\${unit.image_url || '../../public/background-02.jpg'}');"></div>
                                <div class="unit-info">
                                    <h3>\${unit.name}</h3>
                                    <p class="unit-address">\${unit.address}</p>
                                    <div class="unit-details">
                                        <p><i class="fas fa-clock"></i> \${unit.hours}</p>
                                        <p><i class="fas fa-phone"></i> \${unit.phone}</p>
                                    </div>
                                    <div class="unit-actions" style="display:flex; gap:1rem; margin-top:2rem;">
                                        \${unit.maps_url ? \`<a href="\${unit.maps_url}" target="_blank" class="btn-outline" style="flex:1; text-align:center;">Ver no Mapa</a>\` : ''}
                                        \${unit.whatsapp ? \`<a href="https://wa.me/\${unit.whatsapp.replace(/\\D/g,'')}" target="_blank" class="btn-primary" style="flex:1; text-align:center; padding: 0.8rem;">Reservar</a>\` : ''}
                                    </div>
                                </div>
                            </div>
                        \`).join('');
                    }
                }
            } else if (page === 'eventos') {
                const { data } = await window.BullPrimeDB.supabase.from('events').select('*').eq('is_active', true).order('date', { ascending: true });
                if (data && data.length > 0) {
                    const grid = document.querySelector('.events-grid') || document.querySelector('.editorial-grid'); // fallback to editorial grid
                    if (grid) {
                        grid.innerHTML = data.map(ev => \`
                            <div class="ed-span-6 masonry-card reveal-blur" style="min-height: 400px; border-radius: 12px; overflow: hidden; opacity: 1; transform: none;">
                                <div class="masonry-bg" style="background-image: url('\${ev.image_url || '../../public/background-03.jpg'}'); left: 0; top: 0; right: 0; width: 100%; height: 60%; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);"></div>
                                <div class="masonry-overlay" style="background: linear-gradient(to top, rgba(5,4,3,1) 45%, transparent 100%);"></div>
                                <div class="masonry-content" style="position: absolute; bottom: 0; width: 100%; padding: 3rem; padding-top: 0; text-align: left;">
                                    <span class="section-label" style="color: var(--color-accent); margin-bottom: 1rem;">\${new Date(ev.date).toLocaleDateString('pt-BR')}</span>
                                    <h3 class="masonry-title" style="font-size: 2rem;">\${ev.title}</h3>
                                    <p class="masonry-desc" style="margin-bottom: 2rem;">\${ev.description || ''}</p>
                                </div>
                            </div>
                        \`).join('');
                    }
                }
            }
        } catch (e) {
            console.error("Erro ao carregar listas dinâmicas:", e);
        }
    }
};

// Exporta globalmente
window.BullPrimeContent = BullPrimeContent;

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BullPrimeContent.init());
} else {
    BullPrimeContent.init();
}
