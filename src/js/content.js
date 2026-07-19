/**
 * BullPrimeContent
 * Módulo responsável por carregar e gerenciar o conteúdo dinâmico do site a partir do Supabase.
 */

const CACHE_PREFIX = 'bp_content_';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos

const BullPrimeContent = {
    // Inicializa o carregamento de conteúdo ao carregar o DOM
    init: async () => {
        console.log('Iniciando o carregador de conteúdo Bull Prime...');
        
        // Aguarda que o BullPrimeDB esteja disponível (caso não esteja usando ES modules)
        if (!window.BullPrimeDB) {
            console.error('BullPrimeDB não encontrado. Certifique-se de carregar supabase.js antes.');
            return;
        }
        
        await BullPrimeContent.loadAllDataContentElements();
    },

    // Procura todos os elementos com data-content e carrega seus valores
    loadAllDataContentElements: async () => {
        return; // Desativado para usar o texto hardcoded do layout premium
        const elements = document.querySelectorAll('[data-content]');
        
        if (elements.length === 0) return;

        // Extrai todas as seções necessárias para evitar requisições repetidas
        const sectionsToFetch = new Set();
        elements.forEach(el => {
            const path = el.getAttribute('data-content').split('.');
            if (path.length >= 2) {
                sectionsToFetch.add(path[0]);
            }
        });

        // Para cada seção, buscamos o conteúdo (com cache)
        const contentMap = {}; // Estrutura: { 'home.hero': { 'title': '...', ... } }
        
        for (const section of sectionsToFetch) {
            // Assumimos 'home' como página padrão
            const page = 'home';
            const cacheKey = `${page}.${section}`;
            
            // Busca os dados dessa seção/página
            const sectionData = await BullPrimeContent.getSectionData(section, page);
            
            if (sectionData && sectionData.length > 0) {
                contentMap[cacheKey] = {};
                sectionData.forEach(item => {
                    contentMap[cacheKey][item.content_key] = item.content_value;
                });
            }
        }

        // Aplica o conteúdo nos elementos
        elements.forEach(el => {
            const path = el.getAttribute('data-content').split('.');
            if (path.length < 2) return;

            const section = path[0];
            const key = path[1];
            const page = path.length > 2 ? path[2] : 'home';
            const cacheKey = `${page}.${section}`;

            // Se achou o conteúdo para essa chave, substitui
            if (contentMap[cacheKey] && contentMap[cacheKey][key] !== undefined) {
                el.innerHTML = contentMap[cacheKey][key];
            } else {
                console.warn(`Conteúdo não encontrado para data-content="${el.getAttribute('data-content')}". Mantendo conteúdo original (fallback).`);
            }
        });
    },

    // Retorna os dados de uma seção, verificando o cache primeiro
    getSectionData: async (section, page = 'home') => {
        const cacheKey = `${CACHE_PREFIX}${page}_${section}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Verifica se o cache expirou
                if (Date.now() - parsed.timestamp < CACHE_EXPIRATION_MS) {
                    console.log(`Carregando seção "${section}" do cache.`);
                    return parsed.data;
                }
            } catch (e) {
                console.error('Erro ao analisar cache:', e);
            }
        }

        // Se não tiver no cache ou tiver expirado, busca do Supabase
        console.log(`Buscando seção "${section}" do Supabase...`);
        try {
            const data = await window.BullPrimeDB.getContent(section, page);
            
            // Salva no cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
            
            return data;
        } catch (error) {
            console.error(`Erro ao buscar seção "${section}":`, error);
            // Se falhar e tivermos cache (mesmo expirado), retorna o cache como fallback de segurança
            if (cachedData) {
                return JSON.parse(cachedData).data;
            }
            return null;
        }
    },

    // Expõe método para carregar todo conteúdo de uma seção específica
    loadSectionContent: async (section, page = 'home') => {
        return await BullPrimeContent.getSectionData(section, page);
    },

    // Limpa o cache e força o recarregamento dos elementos com data-content
    refreshContent: async () => {
        console.log('Forçando atualização de conteúdo (limpando cache)...');
        
        // Remove apenas itens do nosso cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });

        // Recarrega o conteúdo na página
        await BullPrimeContent.loadAllDataContentElements();
    }
};

// Exporta globalmente
window.BullPrimeContent = BullPrimeContent;

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BullPrimeContent.init());
} else {
    // Se o DOM já estiver carregado (como num script defer), inicializa direto
    BullPrimeContent.init();
}

