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
