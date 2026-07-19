/**
 * Bull Prime Premium - Componente Header (Navbar Flutuante Cinematográfica)
 */

const renderHeader = async () => {
  // Renderiza a base imediatamente
  const headerContainer = document.getElementById('header');
  if (!headerContainer) return;

  const headerHTML = `
    <div class="navbar-wrapper">
      <nav class="navbar">
          <a href="/index.html" class="navbar-brand" style="display: flex; align-items: center;">
              <img src="/public/logo.png" alt="Bull Prime" style="height: 45px; width: auto; transition: transform 0.4s ease, filter 0.4s ease;" onmouseover="this.style.transform='scale(1.05)'; this.style.filter='drop-shadow(0 0 15px rgba(210, 150, 127, 0.4))';" onmouseout="this.style.transform='scale(1)'; this.style.filter='none';">
          </a>
          
          <div class="nav-links" id="mainNavLinks">
              <a href="/index.html" class="nav-link" data-path="/">HOME</a>
              <a href="/src/pages/blog.html" class="nav-link" data-path="/blog.html">BLOG</a>
              <a href="/src/pages/contato.html" class="nav-link" data-path="/contato.html">CONTATO</a>
              <a href="/src/pages/sobre.html" class="nav-link dropdown" data-path="/sobre.html">A BULLPRIME <small>v</small></a>
              <a href="/src/pages/cardapio.html" class="nav-link dropdown" data-path="/cardapio.html">CARNES <small>v</small></a>
              <a href="/src/pages/eventos.html" class="nav-link dropdown" data-path="/eventos.html">EXPERIÊNCIAS <small>v</small></a>
          </div>
          <div class="nav-reserva">
              <a href="/src/pages/contato.html" class="btn-nav">RESERVAR</a>
          </div>

          <button class="hamburger" aria-label="Menu" aria-expanded="false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
          </button>
      </nav>
    </div>
  `;

  headerContainer.innerHTML = headerHTML;

  // Destaca o link ativo
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  
  const highlightLinks = () => {
      const links = headerContainer.querySelectorAll('.nav-link');
      links.forEach(link => {
          const linkPath = link.getAttribute('data-path');
          if (linkPath && (currentPath.endsWith(linkPath) || (currentPath.endsWith('/') && linkPath === '/'))) {
              link.classList.add('active');
          }
      });
  };
  highlightLinks();

  // Mobile Menu Toggle
  const hamburger = headerContainer.querySelector('.hamburger');
  const navLinks = headerContainer.querySelector('#mainNavLinks');
  
  hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('active');
      
      if (!isExpanded) {
          hamburger.innerHTML = `
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>`;
      } else {
          hamburger.innerHTML = `
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>`;
      }
  });

  // Carregar páginas customizadas dinamicamente
  try {
      const CACHE_KEY = 'bp_nav_pages';
      let customPages = [];
      const cached = localStorage.getItem(CACHE_KEY);
      
      if (cached) {
          customPages = JSON.parse(cached);
      } else if (window.supabase) {
          // Precisamos instanciar o Supabase localmente para garantir o fetch caso o db.js não esteja pronto
          const SUPABASE_URL = 'https://vtkinxncxptlqspdzsbi.supabase.co';
          const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a2lueG5jeHB0bHFzcGR6c2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg4NjgsImV4cCI6MjA5OTk3NDg2OH0.tuUwIBLFjKz3o0gQVHU1lZDDUNq1-_N80Ds2_lOA8Kw';
          const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          
          const { data, error } = await sb
              .from('pages')
              .select('title, slug')
              .eq('status', 'published')
              .eq('is_system', false)
              .order('created_at', { ascending: true });
              
          if (!error && data) {
              customPages = data;
              localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          }
      }

      if (customPages && customPages.length > 0) {
          customPages.forEach(page => {
              const link = document.createElement('a');
              
              // Resolve correct relative path depending on where we are
              let basePath = '/src/pages/dynamic.html';
              if (currentPath.includes('/pages/')) {
                  basePath = 'dynamic.html';
              } else if (currentPath.includes('/admin/')) {
                  basePath = '../dynamic.html';
              }
              
              const fullUrl = `${basePath}?page=${page.slug}`;
              link.href = fullUrl;
              link.className = 'nav-link';
              link.textContent = page.title.toUpperCase();
              
              // Se estivermos na página atual
              if (currentSearch.includes(`page=${page.slug}`)) {
                  link.classList.add('active');
              }
              
              navLinks.appendChild(link);
          });
      }
  } catch (err) {
      console.warn("Could not load dynamic navigation links", err);
  }
};

document.addEventListener('DOMContentLoaded', renderHeader);
