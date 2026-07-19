/**
 * Bull Prime Premium — Painel Administrativo
 * Gerencia autenticação, CRUD e toda a lógica do admin.
 * Autor: Iago Oliveira
 */

/* ============================================
   INICIALIZAÇÃO SUPABASE (self-contained)
   ============================================ */
const ADMIN_SUPABASE_URL = 'https://vtkinxncxptlqspdzsbi.supabase.co';
const ADMIN_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a2lueG5jeHB0bHFzcGR6c2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg4NjgsImV4cCI6MjA5OTk3NDg2OH0.tuUwIBLFjKz3o0gQVHU1lZDDUNq1-_N80Ds2_lOA8Kw';

let adminSupabase = null;

function getAdminClient() {
    if (adminSupabase) return adminSupabase;
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        adminSupabase = window.supabase.createClient(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_KEY);
    } else {
        console.error('[Admin] Supabase CDN não encontrado.');
    }
    return adminSupabase;
}

/* ============================================
   ESTADO GLOBAL
   ============================================ */
let currentUser = null;
let currentTable = '';
let currentConfigKey = '';
let tableData = [];
let editingId = null;
let deleteTargetId = null;

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
function showToast(message, type = 'success') {
    // Remove toast antigo
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/* ============================================
   AUTENTICAÇÃO
   ============================================ */
async function checkAuth() {
    const db = getAdminClient();
    if (!db) return;

    const { data: { session }, error } = await db.auth.getSession();
    const isLoginPage = window.location.pathname.includes('login.html');

    if (session) {
        currentUser = session.user;
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        } else {
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) userEmailEl.textContent = currentUser.email;
            initDashboard();
        }
    } else {
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const errorMsg = document.getElementById('errorMsg');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Entrando...';
            if (errorMsg) errorMsg.style.display = 'none';

            try {
                const db = getAdminClient();
                const { data, error } = await db.auth.signInWithPassword({ email, password });

                if (error) throw error;
                window.location.href = 'dashboard.html';
            } catch (error) {
                if (errorMsg) {
                    errorMsg.textContent = 'Credenciais inválidas. Tente novamente.';
                    errorMsg.style.display = 'block';
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            const db = getAdminClient();
            await db.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // Inicializa autenticação
    checkAuth();
});

/* ============================================
   DASHBOARD INIT
   ============================================ */
async function initDashboard() {
    setupSidebar();
    setupModals();
    await loadDashboardStats();
}

/* ============================================
   SIDEBAR NAVIGATION
   ============================================ */
function setupSidebar() {
    const navItems = document.querySelectorAll('[data-target]');
    const panes = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            panes.forEach(p => p.classList.remove('active'));

            const target = item.getAttribute('data-target');
            if (target === 'dashboard') {
                const dashPane = document.getElementById('pane-dashboard');
                if (dashPane) dashPane.classList.add('active');
                loadDashboardStats();
            } else {
                const genericPane = document.getElementById('pane-generic');
                if (genericPane) genericPane.classList.add('active');
                loadTableData(target);
            }
        });
    });

    // Botão Adicionar
    const btnAdd = document.getElementById('btn-generic-add');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => openModal());
    }
}

/* ============================================
   DASHBOARD STATS
   ============================================ */
async function loadDashboardStats() {
    const db = getAdminClient();
    if (!db) return;

    try {
        const [contentsRes, linesRes, unitsRes, messagesRes] = await Promise.all([
            db.from('site_content').select('*', { count: 'exact', head: true }),
            db.from('product_lines').select('*', { count: 'exact', head: true }).eq('is_active', true),
            db.from('units').select('*', { count: 'exact', head: true }),
            db.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false)
        ]);

        const setCount = (id, count) => {
            const el = document.getElementById(id);
            if (el) el.textContent = count || 0;
        };

        setCount('stat-contents', contentsRes.count);
        setCount('stat-lines', linesRes.count);
        setCount('stat-units', unitsRes.count);
        setCount('stat-messages', messagesRes.count);

        // Carrega mensagens recentes
        await loadRecentMessages();
    } catch (e) {
        console.error('[Admin] Erro ao carregar stats:', e);
    }
}

async function loadRecentMessages() {
    const db = getAdminClient();
    if (!db) return;

    try {
        const { data, error } = await db
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const container = document.getElementById('recent-messages');
        if (!container || !data) return;

        if (data.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-muted);">Nenhuma mensagem recebida.</p>';
            return;
        }

        container.innerHTML = data.map(msg => `
            <div style="padding: 1rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: var(--color-text);">${msg.name || 'Sem nome'}</strong>
                    <span style="color: var(--color-text-muted); font-size: 0.85rem;"> — ${msg.subject || 'Sem assunto'}</span>
                    <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.3rem;">${(msg.message || '').substring(0, 80)}${(msg.message || '').length > 80 ? '...' : ''}</p>
                </div>
                <span class="badge ${msg.is_read ? 'badge--active' : 'badge--unread'}">${msg.is_read ? 'Lida' : 'Nova'}</span>
            </div>
        `).join('');
    } catch (e) {
        console.error('[Admin] Erro ao carregar mensagens:', e);
    }
}

/* ============================================
   TABLE CONFIGS
   ============================================ */
const tableConfigs = {
    site_content: {
        title: 'Conteúdo do Site',
        tableName: 'site_content',
        fields: [
            { key: 'section', label: 'Seção', type: 'text' },
            { key: 'content_key', label: 'Chave', type: 'text' },
            { key: 'content_value', label: 'Valor', type: 'textarea' },
            { key: 'page', label: 'Página', type: 'text' },
            { key: 'sort_order', label: 'Ordem', type: 'number' }
        ],
        columns: ['section', 'content_key', 'content_value', 'page']
    },
    hero_slides: {
        title: 'Hero Banner',
        tableName: 'hero_slides',
        fields: [
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'subtitle', label: 'Subtítulo', type: 'text' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
            { key: 'image_url', label: 'URL da Imagem', type: 'text' },
            { key: 'cta_text', label: 'Texto do CTA', type: 'text' },
            { key: 'cta_link', label: 'Link do CTA', type: 'text' },
            { key: 'sort_order', label: 'Ordem', type: 'number' },
            { key: 'is_active', label: 'Ativo', type: 'checkbox' }
        ],
        columns: ['title', 'subtitle', 'is_active']
    },
    product_lines: {
        title: 'Linhas de Produtos',
        tableName: 'product_lines',
        fields: [
            { key: 'name', label: 'Nome', type: 'text' },
            { key: 'slug', label: 'Slug', type: 'text' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
            { key: 'image_url', label: 'URL da Imagem', type: 'text' },
            { key: 'sort_order', label: 'Ordem', type: 'number' },
            { key: 'is_active', label: 'Ativo', type: 'checkbox' }
        ],
        columns: ['name', 'slug', 'is_active']
    },
    cuts: {
        title: 'Cortes',
        tableName: 'cuts',
        fields: [
            { key: 'name', label: 'Nome', type: 'text' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
            { key: 'image_url', label: 'URL da Imagem', type: 'text' },
            { key: 'price_range', label: 'Faixa de Preço', type: 'text' },
            { key: 'weight', label: 'Peso', type: 'text' },
            { key: 'is_featured', label: 'Destaque', type: 'checkbox' },
            { key: 'is_active', label: 'Ativo', type: 'checkbox' },
            { key: 'sort_order', label: 'Ordem', type: 'number' }
        ],
        columns: ['name', 'price_range', 'is_featured', 'is_active']
    },
    units: {
        title: 'Unidades',
        tableName: 'units',
        fields: [
            { key: 'name', label: 'Nome', type: 'text' },
            { key: 'slug', label: 'Slug', type: 'text' },
            { key: 'address', label: 'Endereço', type: 'textarea' },
            { key: 'hours', label: 'Horário de Funcionamento', type: 'textarea' },
            { key: 'phone', label: 'Telefone', type: 'text' },
            { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
            { key: 'email', label: 'E-mail', type: 'text' },
            { key: 'image_url', label: 'URL da Imagem', type: 'text' },
            { key: 'maps_url', label: 'URL do Google Maps', type: 'text' },
            { key: 'sort_order', label: 'Ordem', type: 'number' },
            { key: 'is_active', label: 'Ativo', type: 'checkbox' }
        ],
        columns: ['name', 'address', 'is_active']
    },
    events: {
        title: 'Eventos',
        tableName: 'events',
        fields: [
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
            { key: 'image_url', label: 'URL da Imagem', type: 'text' },
            { key: 'date', label: 'Data', type: 'date' },
            { key: 'sort_order', label: 'Ordem', type: 'number' },
            { key: 'is_active', label: 'Ativo', type: 'checkbox' }
        ],
        columns: ['title', 'date', 'is_active']
    },
    messages: {
        title: 'Mensagens',
        tableName: 'contact_submissions',
        fields: [
            { key: 'name', label: 'Nome', type: 'text', readonly: true },
            { key: 'email', label: 'E-mail', type: 'text', readonly: true },
            { key: 'phone', label: 'Telefone', type: 'text', readonly: true },
            { key: 'subject', label: 'Assunto', type: 'text', readonly: true },
            { key: 'message', label: 'Mensagem', type: 'textarea', readonly: true },
            { key: 'is_read', label: 'Lida', type: 'checkbox' }
        ],
        columns: ['name', 'email', 'subject', 'is_read']
    },
    settings: {
        title: 'Configurações',
        tableName: 'site_settings',
        fields: [
            { key: 'setting_key', label: 'Chave', type: 'text' },
            { key: 'setting_value', label: 'Valor', type: 'textarea' },
            { key: 'setting_type', label: 'Tipo', type: 'text' }
        ],
        columns: ['setting_key', 'setting_value']
    }
};

/* ============================================
   CARREGAR DADOS DA TABELA
   ============================================ */
async function loadTableData(configKey) {
    const db = getAdminClient();
    if (!db) return;

    currentConfigKey = configKey;
    const config = tableConfigs[configKey];
    if (!config) return;

    currentTable = config.tableName;

    const titleEl = document.getElementById('generic-title');
    if (titleEl) titleEl.textContent = config.title;

    try {
        const orderCol = config.fields.find(f => f.key === 'sort_order') ? 'sort_order' : 'created_at';
        const { data, error } = await db
            .from(currentTable)
            .select('*')
            .order(orderCol, { ascending: orderCol === 'sort_order' });

        if (error) throw error;
        tableData = data || [];
        renderTable(config);
    } catch (e) {
        showToast('Erro ao carregar dados: ' + e.message, 'error');
        console.error('[Admin] Erro:', e);
    }
}

/* ============================================
   RENDERIZAR TABELA
   ============================================ */
function renderTable(config) {
    const thead = document.getElementById('generic-thead');
    const tbody = document.getElementById('generic-tbody');
    if (!thead || !tbody) return;

    // Header
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    config.columns.forEach(col => {
        const th = document.createElement('th');
        const field = config.fields.find(f => f.key === col);
        th.textContent = field ? field.label : col;
        headerRow.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = 'Ações';
    thActions.style.textAlign = 'right';
    headerRow.appendChild(thActions);
    thead.appendChild(headerRow);

    // Body
    tbody.innerHTML = '';

    if (tableData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = config.columns.length + 1;
        td.textContent = 'Nenhum registro encontrado.';
        td.style.textAlign = 'center';
        td.style.color = 'var(--color-text-muted)';
        td.style.padding = '2rem';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    tableData.forEach(row => {
        const tr = document.createElement('tr');

        config.columns.forEach(col => {
            const td = document.createElement('td');
            let val = row[col];

            if (typeof val === 'boolean') {
                td.innerHTML = `<span class="badge ${val ? 'badge--active' : 'badge--inactive'}">${val ? 'Sim' : 'Não'}</span>`;
            } else {
                const text = val !== null && val !== undefined ? String(val) : '';
                td.textContent = text.length > 60 ? text.substring(0, 60) + '...' : text;
            }
            tr.appendChild(td);
        });

        // Ações
        const tdActions = document.createElement('td');
        tdActions.style.textAlign = 'right';
        tdActions.style.whiteSpace = 'nowrap';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'admin-btn';
        btnEdit.textContent = '✏️ Editar';
        btnEdit.addEventListener('click', () => openModal(row));

        const btnDel = document.createElement('button');
        btnDel.className = 'admin-btn admin-btn--danger';
        btnDel.textContent = '🗑️ Excluir';
        btnDel.style.marginLeft = '0.5rem';
        btnDel.addEventListener('click', () => confirmDelete(row.id));

        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDel);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

/* ============================================
   MODAL SYSTEM
   ============================================ */
function setupModals() {
    const genericModal = document.getElementById('genericModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('genericForm');

    if (!genericModal) return;

    const closeModal = () => genericModal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Fechar ao clicar no fundo
    genericModal.addEventListener('click', (e) => {
        if (e.target === genericModal) closeModal();
    });

    // Form submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveModalData();
        });
    }

    // Confirm delete modal
    const confModal = document.getElementById('confirmModal');
    const cancelConfirm = document.getElementById('cancelConfirm');
    const confirmBtn = document.getElementById('confirmActionBtn');

    if (cancelConfirm) {
        cancelConfirm.addEventListener('click', () => confModal.classList.remove('active'));
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!deleteTargetId) return;
            const db = getAdminClient();

            try {
                const { error } = await db.from(currentTable).delete().eq('id', deleteTargetId);
                if (error) throw error;

                showToast('Registro excluído com sucesso!');
                confModal.classList.remove('active');
                deleteTargetId = null;
                await loadTableData(currentConfigKey);
            } catch (e) {
                showToast('Erro ao excluir: ' + e.message, 'error');
            }
        });
    }
}

function openModal(row = null) {
    editingId = row ? row.id : null;
    const config = tableConfigs[currentConfigKey];
    if (!config) return;

    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const content = document.getElementById('modalFormContent');

    if (!modal || !content) return;

    modalTitle.textContent = row ? `Editar ${config.title}` : `Novo ${config.title}`;
    content.innerHTML = '';

    config.fields.forEach(f => {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.htmlFor = `field_${f.key}`;
        label.textContent = f.label;

        let input;
        if (f.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'form-textarea';
            input.rows = 3;
        } else if (f.type === 'checkbox') {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '0.8rem';

            const toggle = document.createElement('label');
            toggle.className = 'toggle-switch';

            input = document.createElement('input');
            input.type = 'checkbox';

            const slider = document.createElement('span');
            slider.className = 'slider';

            toggle.appendChild(input);
            toggle.appendChild(slider);
            wrapper.appendChild(label);
            wrapper.appendChild(toggle);

            input.id = `field_${f.key}`;
            if (f.readonly) input.disabled = true;

            if (row && row[f.key] !== undefined) {
                input.checked = !!row[f.key];
            }

            content.appendChild(wrapper);
            return;
        } else {
            input = document.createElement('input');
            input.type = f.type || 'text';
            input.className = 'form-input';
        }

        input.id = `field_${f.key}`;
        if (f.readonly) input.disabled = true;

        if (row && row[f.key] !== undefined && row[f.key] !== null) {
            input.value = row[f.key];
        }

        group.appendChild(label);
        group.appendChild(input);
        content.appendChild(group);
    });

    modal.classList.add('active');
}

async function saveModalData() {
    const db = getAdminClient();
    if (!db) return;

    const config = tableConfigs[currentConfigKey];
    if (!config) return;

    const formData = {};
    config.fields.forEach(f => {
        if (f.readonly && !editingId) return; // Não enviar campos readonly em criação
        const input = document.getElementById(`field_${f.key}`);
        if (!input) return;

        if (f.type === 'checkbox') {
            formData[f.key] = input.checked;
        } else if (f.type === 'number') {
            formData[f.key] = input.value ? parseInt(input.value) : 0;
        } else {
            formData[f.key] = input.value;
        }
    });

    try {
        if (editingId) {
            // Remover campos readonly do update para mensagens
            if (currentConfigKey === 'messages') {
                config.fields.forEach(f => {
                    if (f.readonly) delete formData[f.key];
                });
            }
            const { error } = await db.from(currentTable).update(formData).eq('id', editingId);
            if (error) throw error;
            showToast('Atualizado com sucesso!');
        } else {
            const { error } = await db.from(currentTable).insert([formData]);
            if (error) throw error;
            showToast('Criado com sucesso!');
        }

        document.getElementById('genericModal').classList.remove('active');
        await loadTableData(currentConfigKey);
    } catch (e) {
        showToast('Erro ao salvar: ' + e.message, 'error');
        console.error('[Admin] Erro ao salvar:', e);
    }
}

function confirmDelete(id) {
    deleteTargetId = id;
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.add('active');
}
