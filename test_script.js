
        const SUPABASE_URL = 'https://vtkinxncxptlqspdzsbi.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a2lueG5jeHB0bHFzcGR6c2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg4NjgsImV4cCI6MjA5OTk3NDg2OH0.tuUwIBLFjKz3o0gQVHU1lZDDUNq1-_N80Ds2_lOA8Kw';
        let supabase; try { if(window.supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); else alert("Erro de conexão ao carregar o sistema."); } catch(e) { console.error(e); }

        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = 'login.html';
            }
        }

        async function logout() {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        }

        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function generateSlug() {
            const title = document.getElementById('postTitle').value;
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            document.getElementById('postSlug').value = slug;
        }

        function openModal(post = null) {
            const modal = document.getElementById('postModal');
            document.getElementById('modalTitle').innerText = post ? 'Editar Post' : 'Novo Post';
            
            if (post) {
                document.getElementById('postId').value = post.id;
                document.getElementById('postTitle').value = post.title || '';
                document.getElementById('postSlug').value = post.slug || '';
                document.getElementById('postImage').value = post.cover_image || '';
                document.getElementById('postStatus').value = post.status || 'draft';
                document.getElementById('postAuthor').value = post.author || 'Bull Prime';
                document.getElementById('postTags').value = post.tags ? post.tags.join(', ') : '';
                document.getElementById('postExcerpt').value = post.excerpt || '';
                document.getElementById('postContent').value = post.content || '';
                document.getElementById('postFeatured').checked = post.is_featured || false;
            } else {
                document.getElementById('postForm').reset();
                document.getElementById('postId').value = '';
                document.getElementById('postAuthor').value = 'Bull Prime';
            }
            
            modal.classList.add('active');
        }

        function closeModal() {
            document.getElementById('postModal').classList.remove('active');
        }

        async function loadPosts() {
            const grid = document.getElementById('blogGrid');
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="loading-spinner"></div></div>';
            
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                showToast('Erro ao carregar posts: ' + error.message, 'error');
                grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Erro ao carregar dados.</div>';
                return;
            }

            if (!data || data.length === 0) {
                grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-folder-open"></i><p>Nenhum post encontrado.</p></div>';
                return;
            }

            grid.innerHTML = data.map(post => `
                <div class="admin-card blog-card" style="padding:0;">
                    <div class="blog-card-bg" style="background-image: url('${post.cover_image || '/public/placeholder.jpg'}')"></div>
                    <div class="blog-card-overlay"></div>
                    <div class="blog-actions">
                        <button class="btn-icon" style="background: rgba(0,0,0,0.5);" onclick="if(event) event.preventDefault(); previewPost(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(post)).replace(/'/g, "%27")}')))"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" style="background: rgba(0,0,0,0.5);" onclick="if(event) event.preventDefault(); openModal(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(post)).replace(/'/g, "%27")}')))"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" style="background: rgba(248,113,113,0.5); color: #f87171;" onclick="deletePost('${post.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="blog-card-content" style="padding: 1.5rem;">
                        <span class="badge ${post.status === 'published' ? 'success' : 'warning'}" style="margin-bottom: 0.5rem; display: inline-block;">${post.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                        ${post.is_featured ? '<span class="badge" style="background: var(--admin-accent); color: #fff; margin-bottom: 0.5rem; display: inline-block; margin-left: 0.5rem;"><i class="fas fa-star"></i></span>' : ''}
                        <h3 class="blog-card-title">${post.title}</h3>
                        <div class="blog-card-meta">
                            <span>${new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        async function savePost() {
            const id = document.getElementById('postId').value;
            const title = document.getElementById('postTitle').value;
            const slug = document.getElementById('postSlug').value;
            
            if (!title || !slug) {
                showToast('Título e Slug são obrigatórios', 'warning');
                return;
            }

            const postData = {
                title,
                slug,
                cover_image: document.getElementById('postImage').value,
                status: document.getElementById('postStatus').value,
                author: document.getElementById('postAuthor').value,
                tags: document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(t => t),
                excerpt: document.getElementById('postExcerpt').value,
                content: document.getElementById('postContent').value,
                is_featured: document.getElementById('postFeatured').checked
            };

            let error;
            if (id) {
                const res = await supabase.from('blog_posts').update(postData).eq('id', id);
                error = res.error;
            } else {
                const res = await supabase.from('blog_posts').insert([postData]);
                error = res.error;
            }

            if (error) {
                showToast('Erro ao salvar: ' + error.message, 'error');
            } else {
                showToast('Post salvo com sucesso!');
                closeModal();
                loadPosts();
            }
        }

        async function deletePost(id) {
            if (confirm('Tem certeza que deseja excluir este post?')) {
                const { error } = await supabase.from('blog_posts').delete().eq('id', id);
                if (error) {
                    showToast('Erro ao excluir: ' + error.message, 'error');
                } else {
                    showToast('Post excluído!');
                    loadPosts();
                }
            }
        }

        function previewPost(post) {
            document.getElementById('previewImg').src = post.cover_image || '/public/placeholder.jpg';
            document.getElementById('previewTitle').innerText = post.title;
            document.getElementById('previewAuthor').innerText = post.author || 'Bull Prime';
            document.getElementById('previewDate').innerText = new Date(post.created_at).toLocaleDateString('pt-BR');
            
            // Basic markdown/newline to HTML conversion for preview
            let contentHTML = (post.content || '').replace(/\n/g, '<br>');
            document.getElementById('previewContent').innerHTML = contentHTML;
            
            document.getElementById('previewModal').classList.add('active');
        }

        function closePreview() {
            document.getElementById('previewModal').classList.remove('active');
        }

        // Init
        checkAuth().then(loadPosts);
    