/**
 * Bull Prime Admin — Sidebar Toggle & Common Functions
 * Inclua este script em TODAS as páginas admin.
 */

(function() {
  // Injeta o botão toggle e o overlay na página
  function initSidebar() {
    const layout = document.querySelector('.admin-layout');
    if (!layout) return;

    // Cria o botão toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

    // Cria o overlay (para fechar no mobile ao clicar fora)
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';

    document.body.appendChild(toggleBtn);
    layout.appendChild(overlay);

    // Recupera estado salvo
    const savedState = localStorage.getItem('bp-admin-sidebar');
    if (savedState === 'collapsed') {
      layout.classList.add('sidebar-collapsed');
    }

    // No mobile, começa colapsado
    if (window.innerWidth <= 768) {
      layout.classList.add('sidebar-collapsed');
    }

    // Toggle click
    toggleBtn.addEventListener('click', () => {
      layout.classList.toggle('sidebar-collapsed');
      const isCollapsed = layout.classList.contains('sidebar-collapsed');
      localStorage.setItem('bp-admin-sidebar', isCollapsed ? 'collapsed' : 'open');
      
      // Controla overlay no mobile
      if (!isCollapsed && window.innerWidth <= 768) {
        overlay.classList.add('active');
      } else {
        overlay.classList.remove('active');
      }

      // Atualiza ícone
      if (isCollapsed) {
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      } else {
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      }
    });

    // Fechar sidebar ao clicar no overlay
    overlay.addEventListener('click', () => {
      layout.classList.add('sidebar-collapsed');
      overlay.classList.remove('active');
      localStorage.setItem('bp-admin-sidebar', 'collapsed');
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    });

    // Fechar ao clicar em links da sidebar (no mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          layout.classList.add('sidebar-collapsed');
          overlay.classList.remove('active');
        }
      });
    });
  }

  // Init quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();
