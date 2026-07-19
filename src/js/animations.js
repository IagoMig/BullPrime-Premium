/**
 * Bull Prime Premium - Módulo de Animações (Fase 3: Cinematografia)
 * Usa Lenis para smooth scroll e GSAP + ScrollTrigger para a Hero.
 */

const BullPrimeAnimations = (function() {
  
  let lenis;

  const loadDependencies = async () => {
    // Carrega Lenis, GSAP e ScrollTrigger dinamicamente para não precisar mexer em todos os HTMLs
    const scripts = [
      "https://unpkg.com/@studio-freight/lenis@1.0.39/dist/lenis.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
    ];

    for (const src of scripts) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
  };

  const initLenis = () => {
    lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva de easing muito suave
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  };

  const initGSAP = () => {
    gsap.registerPlugin(ScrollTrigger);

    // Conecta o GSAP com o Lenis
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time)=>{
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // --- ANIMAÇÃO DA HERO FIXA ---
    // A Hero fica parada (position fixed via css) enquanto o `.main-content` rola por cima.
    // Vamos fazer a hero perder foco, escurecer e diminuir a escala conforme o main-content sobe.
    const hero = document.querySelector('.hero');
    const heroWrapper = document.querySelector('.hero-wrapper');
    const mainContent = document.querySelector('.main-content');

    if (hero && heroWrapper && mainContent) {
      // Como a hero é fixed, não precisamos pinar no scrolltrigger.
      // Basta amarrar a animação ao scroll global da página até que o heroWrapper saia da tela.
      
      gsap.to(hero, {
        scrollTrigger: {
          trigger: heroWrapper,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        scale: 0.95,
        filter: "blur(15px)",
        opacity: 0.3, // Escurece brutalmente
        y: 50 // Dá uma leve descidinha
      });
    }

    // Reveals are now handled natively by initReveals() above

    // --- PARALLAX DE IMAGENS ---
    const edImages = document.querySelectorAll('.ed-item img, .cinematic-image img, .gastronomy-bg');
    edImages.forEach((img) => {
      gsap.to(img, {
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        },
        yPercent: 15, // Movimento muito sutil da imagem dentro do container
        ease: "none"
      });
    });
  };

  const initNavbarScroll = () => {
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    if (!navbarWrapper) return;

    // Atualiza a navbar baseado no scroll do Lenis ao invés do listener padrão
    lenis.on('scroll', (e) => {
      if (e.scroll > 80) {
        navbarWrapper.classList.add('scrolled');
      } else {
        navbarWrapper.classList.remove('scrolled');
      }
    });
  };

  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement);
        }
      });
    });
  };

  const initReveals = () => {
    const observerOptions = { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, entry.target.dataset.delay || 0);
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-blur, .reveal-scale');
    revealElements.forEach((el) => {
      observer.observe(el);
      // Failsafe: if it's in the hero, show it immediately
      if (el.closest('.hero')) {
        setTimeout(() => el.classList.add('visible'), parseInt(el.dataset.delay || 0) + 50);
      }
    });
  };

  const initPageTransitions = () => {
    // Inject the overlay into the body
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay is-active';
    document.body.appendChild(overlay);

    // Fade out overlay on page load
    requestAnimationFrame(() => {
      setTimeout(() => {
        overlay.classList.remove('is-active');
      }, 100); // Slight delay for smoothness
    });

    // Intercept clicks on links for smooth exit transition
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Ignore anchors, external links, mailto, tel, etc.
      if (!href || 
          href.startsWith('#') || 
          href.startsWith('mailto:') || 
          href.startsWith('tel:') || 
          link.getAttribute('target') === '_blank' ||
          href === '#') {
        return;
      }

      // Check if it's an internal link
      const isInternal = link.hostname === window.location.hostname || !href.startsWith('http');
      
      if (isInternal) {
        e.preventDefault();
        overlay.classList.add('is-active');
        
        // Wait for the transition to finish before navigating (increased to 1000ms for majesty)
        setTimeout(() => {
          window.location.href = href;
        }, 1000); 
      }
    });
  };

  const init = async () => {
    // 1. Inicia transição de entrada da página
    initPageTransitions();

    // 2. Inicializa os reveals imediatamente (Não depende de CDN)
    initReveals();

    // 3. Carrega dependências em background sem bloquear
    loadDependencies().then(() => {
      // 4. Inicializa sistemas avançados (Lenis/GSAP)
      initLenis();
      initGSAP();
      initNavbarScroll();
      initSmoothScroll();
    }).catch(err => {
      console.warn("GSAP/Lenis load failed, falling back to native scroll", err);
      // Fallback scroll behavior if CDNs are blocked
      initNavbarScrollNative();
    });
  };

  const initNavbarScrollNative = () => {
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    if (!navbarWrapper) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) navbarWrapper.classList.add('scrolled');
      else navbarWrapper.classList.remove('scrolled');
    }, {passive: true});
  };

  return {
    init,
    getLenis: () => lenis
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BullPrimeAnimations;
} else {
  window.BullPrimeAnimations = BullPrimeAnimations;
}

BullPrimeAnimations.init();
