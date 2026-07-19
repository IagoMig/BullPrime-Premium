/**
 * Bull Prime Premium - Componente de Rodapé (Footer)
 * Renderiza dinamicamente o rodapé do site.
 */

const renderFooter = () => {
  const footerContainer = document.getElementById('footer');
  if (!footerContainer) return;

  const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('BullPrime-PREMIUM/');
  
  const getPath = (filename) => {
    if (isRoot) {
      return filename === 'index.html' ? './index.html' : `./src/pages/${filename}`;
    } else {
      return filename === 'index.html' ? '../../index.html' : `./${filename}`;
    }
  };

  const currentYear = new Date().getFullYear();

  const footerHtml = `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-col">
            <a href="${getPath('index.html')}" class="navbar-brand" style="display: block; margin-bottom: 1.5rem;">
              <img src="/public/logo.png" alt="Bull Prime" style="height: 55px; width: auto; opacity: 0.9; transition: opacity 0.3s ease;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">
            </a>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">
              A verdadeira experiência das carnes mais nobres do mundo. Uma jornada inesquecível de sabor e exclusividade.
            </p>
          </div>
          
          <div class="footer-col">
            <h4>Institucional</h4>
            <ul>
              <li><a href="${getPath('sobre.html')}">Sobre nós</a></li>
              <li><a href="${getPath('unidades.html')}">Nossas Unidades</a></li>
              <li><a href="${getPath('eventos.html')}">Eventos</a></li>
              <li><a href="#">Trabalhe Conosco</a></li>
            </ul>
          </div>
          
          <div class="footer-col">
            <h4>Especialidades</h4>
            <ul>
              <li><a href="#">Kobe Beef (Wagyu)</a></li>
              <li><a href="#">Carnes Dry Aged</a></li>
              <li><a href="#">Angus Premium</a></li>
              <li><a href="#">Cordeiro Selecionado</a></li>
            </ul>
          </div>
          
          <div class="footer-col">
            <h4>Contato</h4>
            <ul>
              <li><a href="mailto:contato@bullprime.com">contato@bullprime.com</a></li>
              <li><a href="tel:+5511999999999">+55 41 3030-4446</a></li>
            </ul>
            <div class="footer-social-links">
              <span>Instagram</span>
              <span>Facebook</span>
              <span>YouTube</span>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom" style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 2rem;">
          <p style="color: rgba(255,255,255,0.4); font-size: 0.8rem; font-family: 'Lato', sans-serif;">Bull Prime &copy; ${currentYear}. Todos os direitos reservados.</p>
          
          <div class="footer-credits" style="text-align: right; font-family: 'Lato', sans-serif; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.3);">
            <p style="margin-bottom: 0.4rem;">Desenvolvido por <strong style="color: rgba(255,255,255,0.6); font-weight: 600;">Iago Oliveira</strong></p>
            <p style="margin-bottom: 0;">Marketing Digital: <strong style="color: rgba(255,255,255,0.6); font-weight: 600;">EG Mídia Digital</strong></p>
          </div>
        </div>
      </div>
    </footer>
  `;

  footerContainer.innerHTML = footerHtml;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderFooter);
} else {
  renderFooter();
}
