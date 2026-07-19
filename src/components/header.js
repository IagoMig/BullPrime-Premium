/**
 * Bull Prime Premium - Componente Header (Navbar Flutuante Cinematográfica)
 */

const renderHeader = () => {
  const headerHTML = `
    <div class="navbar-wrapper">
      <nav class="navbar">
          <a href="/index.html" class="navbar-brand" style="display: flex; align-items: center;">
              <img src="/public/logo.png" alt="Bull Prime" style="height: 45px; width: auto; transition: transform 0.4s ease, filter 0.4s ease;" onmouseover="this.style.transform='scale(1.05)'; this.style.filter='drop-shadow(0 0 15px rgba(210, 150, 127, 0.4))';" onmouseout="this.style.transform='scale(1)'; this.style.filter='none';">
          </a>
          
          <div class="nav-links">
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

  const headerContainer = document.getElementById('header');
  if (headerContainer) {
      headerContainer.innerHTML = headerHTML;
      
      // Destaca o link ativo baseado na URL atual
      const currentPath = window.location.pathname;
      const links = headerContainer.querySelectorAll('.nav-link');
      
      links.forEach(link => {
          const linkPath = link.getAttribute('data-path');
          if (currentPath.endsWith(linkPath) || (currentPath.endsWith('/') && linkPath === '/')) {
              link.classList.add('active');
          }
      });

      // Mobile Menu Toggle
      const hamburger = headerContainer.querySelector('.hamburger');
      const navLinks = headerContainer.querySelector('.nav-links');
      
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
  }
};

document.addEventListener('DOMContentLoaded', renderHeader);
