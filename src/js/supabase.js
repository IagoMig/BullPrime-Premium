/**
 * Bull Prime Premium — Cliente Supabase
 * Gerencia toda a comunicação com o banco de dados Supabase.
 * Autor: Iago Oliveira
 */

// Configuração do Supabase
const SUPABASE_URL = 'https://vtkinxncxptlqspdzsbi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a2lueG5jeHB0bHFzcGR6c2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg4NjgsImV4cCI6MjA5OTk3NDg2OH0.tuUwIBLFjKz3o0gQVHU1lZDDUNq1-_N80Ds2_lOA8Kw';

// Inicializa o cliente Supabase via CDN global
let supabase = null;

function initSupabase() {
    if (supabase) return supabase;

    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.warn('[BullPrime] Supabase CDN não carregado. Operações de banco indisponíveis.');
        return null;
    }
    return supabase;
}

const BullPrimeDB = {

    /**
     * Inicializa a conexão (chamado automaticamente nas operações)
     */
    init: () => {
        return initSupabase();
    },

    /**
     * Obter conteúdo por seção e página
     */
    getContent: async (section, page = 'home') => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('site_content')
            .select('*')
            .eq('section', section)
            .eq('page', page)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[BullPrime] Erro ao buscar conteúdo:', error);
            return [];
        }
        return data;
    },

    /**
     * Obter um item de conteúdo específico pela chave
     */
    getContentByKey: async (section, key, page = 'home') => {
        const db = initSupabase();
        if (!db) return null;

        const { data, error } = await db
            .from('site_content')
            .select('*')
            .eq('section', section)
            .eq('content_key', key)
            .eq('page', page)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[BullPrime] Erro ao buscar conteúdo por chave:', error);
            }
            return null;
        }
        return data;
    },

    /**
     * Buscar slides do hero ativos
     */
    getHeroSlides: async () => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('hero_slides')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[BullPrime] Erro ao buscar hero slides:', error);
            return [];
        }
        return data;
    },

    /**
     * Buscar linhas de produtos ativas
     */
    getProductLines: async () => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('product_lines')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[BullPrime] Erro ao buscar linhas de produtos:', error);
            return [];
        }
        return data;
    },

    /**
     * Buscar cortes, com filtro opcional por linha
     */
    getCuts: async (lineId = null) => {
        const db = initSupabase();
        if (!db) return [];

        let query = db
            .from('cuts')
            .select('*, product_lines(name)')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (lineId) {
            query = query.eq('line_id', lineId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[BullPrime] Erro ao buscar cortes:', error);
            return [];
        }
        return data;
    },

    /**
     * Buscar unidades ativas
     */
    getUnits: async () => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('units')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[BullPrime] Erro ao buscar unidades:', error);
            return [];
        }
        return data;
    },

    /**
     * Buscar eventos ativos
     */
    getEvents: async () => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('date', { ascending: true });

        if (error) {
            console.error('[BullPrime] Erro ao buscar eventos:', error);
            return [];
        }
        return data;
    },

    /**
     * Buscar configurações do site
     */
    getSettings: async () => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from('site_settings')
            .select('*');

        if (error) {
            console.error('[BullPrime] Erro ao buscar configurações:', error);
            return [];
        }
        return data;
    },

    /**
     * Enviar formulário de contato
     */
    submitContact: async (contactData) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db
            .from('contact_submissions')
            .insert([contactData]);

        if (error) {
            console.error('[BullPrime] Erro ao enviar contato:', error);
            throw error;
        }
        return data;
    },

    /* ============================================
       AUTENTICAÇÃO (Admin)
       ============================================ */

    signIn: async (email, password) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('[BullPrime] Erro no login:', error);
            throw error;
        }
        return data;
    },

    signOut: async () => {
        const db = initSupabase();
        if (!db) return;

        const { error } = await db.auth.signOut();
        if (error) throw error;
    },

    getSession: async () => {
        const db = initSupabase();
        if (!db) return null;

        const { data, error } = await db.auth.getSession();
        if (error) {
            console.error('[BullPrime] Erro ao verificar sessão:', error);
            return null;
        }
        return data.session;
    },

    /* ============================================
       CRUD ADMIN
       ============================================ */

    updateContent: async (id, updateData) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db
            .from('site_content')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        return data;
    },

    upsertContent: async (section, key, value, page = 'home') => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db
            .from('site_content')
            .upsert({
                section,
                content_key: key,
                content_value: value,
                page
            }, { onConflict: 'section,content_key,page' });

        if (error) throw error;
        return data;
    },

    createItem: async (table, itemData) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db.from(table).insert([itemData]).select();
        if (error) throw error;
        return data;
    },

    updateItem: async (table, id, updateData) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { data, error } = await db.from(table).update(updateData).eq('id', id).select();
        if (error) throw error;
        return data;
    },

    deleteItem: async (table, id) => {
        const db = initSupabase();
        if (!db) throw new Error('Supabase não disponível');

        const { error } = await db.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    getAllItems: async (table, orderBy = 'created_at', ascending = false) => {
        const db = initSupabase();
        if (!db) return [];

        const { data, error } = await db
            .from(table)
            .select('*')
            .order(orderBy, { ascending });

        if (error) throw error;
        return data;
    },

    // Expor instância do cliente (para operações diretas)
    get client() {
        return initSupabase();
    }
};

// Disponibiliza globalmente
window.BullPrimeDB = BullPrimeDB;

// Inicializa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
