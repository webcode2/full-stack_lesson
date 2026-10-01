/**
 * Nova AI - Core Interactive Engine & Dynamic UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initNavbarScroll();
  initSpotlightCards();
  initPlayground();
  initPricingToggle();
  initFaqAccordion();
  initModalAndForms();
  initToast();
  initMobileMenu();
  initBackToTop();
});

/* ==========================================================================
   1. Ambient Floating Particle Canvas
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = Math.min(Math.floor(window.innerWidth / 20), 60);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   2. Navbar Scroll, Progress Indicator & 3D Tilt
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scroll-progress');

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / docHeight) * 100;

    if (scrollProgress) {
      scrollProgress.style.width = `${scrolled}%`;
    }

    if (navbar) {
      if (scrollTop > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });
}

/* ==========================================================================
   3. Interactive Spotlight Hover Effect on Cards
   ========================================================================== */
function initSpotlightCards() {
  const cards = document.querySelectorAll('.spotlight-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* ==========================================================================
   4. Interactive Code Playground & Simulation Engine
   ========================================================================== */
const playgroundPresets = {
  api: {
    filename: 'stripe_webhook.ts',
    time: '0.38s',
    tokens: 312,
    code: `import { StripeService, Database } from '@nova/runtime';

export async function handleWebhookEvent(event: Stripe.Event) {
  const db = await Database.connect();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.users.upgradeTier({
        customerId: session.customer,
        plan: 'enterprise_pro_yearly',
        status: 'active'
      });
      
      await NovaNotifier.emit('event:provision_complete', {
        userId: session.metadata.userId,
        timestamp: Date.now()
      });
      break;
    }
  }
  return { received: true, latencyMs: 24 };
}`
  },
  auth: {
    filename: 'passkey_auth.ts',
    time: '0.29s',
    tokens: 284,
    code: `import { WebAuthnServer, EnclaveCrypto } from '@nova/security';

export async function verifyAssertion(response: AuthenticatorAssertionResponse) {
  const clientData = EnclaveCrypto.parseClientDataJSON(response.clientDataJSON);
  
  const isValid = await WebAuthnServer.verifySignature({
    credentialId: response.id,
    signature: response.signature,
    authenticatorData: response.authenticatorData,
    origin: 'https://app.novacloud.ai'
  });

  if (!isValid) throw new SecurityException('Biometric signature mismatch');
  return { authenticated: true, role: 'engineer:admin' };
}`
  },
  refactor: {
    filename: 'query_optimizer.sql',
    time: '0.41s',
    tokens: 420,
    code: `-- Nova Autonomous SQL Optimization Engine
-- BEFORE: Latency 840ms (Full Table Scan)
-- AFTER:  Latency 14ms (Covering Composite Index)

EXPLAIN ANALYZE
SELECT 
  o.order_id, 
  o.total_cents, 
  u.email,
  ARRAY_AGG(i.sku) AS items
FROM orders o
INNER JOIN users u ON u.id = o.user_id
INNER JOIN line_items i ON i.order_id = o.order_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND o.status = 'fulfilled'
GROUP BY o.order_id, o.total_cents, u.email
ORDER BY o.created_at DESC
LIMIT 50;`
  },
  docker: {
    filename: 'Dockerfile.optimized',
    time: '0.34s',
    tokens: 260,
    code: `# Multi-stage lean production Docker build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
RUN npm run build && npm prune --production

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nonroot:nonroot
EXPOSE 8080
ENV NODE_ENV=production
CMD ["dist/server.js"]`
  }
};

function initPlayground() {
  const codeEl = document.getElementById('playground-code');
  const filenameEl = document.getElementById('playground-filename');
  const thinkingTextEl = document.getElementById('agent-thinking-text');
  const presetBtns = document.querySelectorAll('.demo-preset-btn');
  const copyBtn = document.getElementById('playground-copy');

  if (!codeEl) return;

  function loadPreset(key) {
    const data = playgroundPresets[key];
    if (!data) return;

    if (filenameEl) filenameEl.textContent = data.filename;
    if (thinkingTextEl) thinkingTextEl.textContent = `Agent generated in ${data.time}`;

    codeEl.textContent = data.code;
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.getAttribute('data-preset');
      loadPreset(presetKey);
    });
  });

  // Copy code handler
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = codeEl.textContent;
      navigator.clipboard.writeText(code).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="ri-check-line" style="color:#10b981;"></i> <span>Copied!</span>`;
        showToast('Code copied to clipboard!');
        setTimeout(() => {
          copyBtn.innerHTML = original;
        }, 2000);
      });
    });
  }

  // Load initial preset
  loadPreset('api');
}

/* ==========================================================================
   5. Pricing Billing Toggle (Monthly vs Annual)
   ========================================================================== */
function initPricingToggle() {
  const switchBtn = document.getElementById('billing-switch');
  const monthlyLabel = document.getElementById('monthly-label');
  const annualLabel = document.getElementById('annual-label');
  const priceAmounts = document.querySelectorAll('.plan-price .amount');

  if (!switchBtn) return;

  let isAnnual = false;

  function updatePrices() {
    priceAmounts.forEach(amountEl => {
      const monthlyVal = amountEl.getAttribute('data-monthly');
      const annualVal = amountEl.getAttribute('data-annual');
      amountEl.textContent = isAnnual ? annualVal : monthlyVal;
    });

    if (isAnnual) {
      switchBtn.classList.add('active');
      annualLabel.style.color = '#ffffff';
      monthlyLabel.style.color = 'var(--text-secondary)';
    } else {
      switchBtn.classList.remove('active');
      monthlyLabel.style.color = '#ffffff';
      annualLabel.style.color = 'var(--text-secondary)';
    }
  }

  switchBtn.addEventListener('click', () => {
    isAnnual = !isAnnual;
    updatePrices();
  });
}

/* ==========================================================================
   6. FAQ Accordion Interaction
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all others
      items.forEach(other => {
        other.classList.remove('active');
        const btn = other.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   7. Modal Dialogs & Lead Capture
   ========================================================================== */
function initModalAndForms() {
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close');
  const triggerBtns = [
    document.getElementById('header-cta-btn'),
    document.getElementById('hero-get-started'),
    document.getElementById('login-btn'),
    document.getElementById('drawer-login-btn'),
    document.getElementById('drawer-cta-btn'),
    ...document.querySelectorAll('.plan-btn')
  ];

  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalForm = document.getElementById('modal-form');

  function openModal(title, subtitle) {
    if (title && modalTitle) modalTitle.textContent = title;
    if (subtitle && modalSubtitle) modalSubtitle.textContent = subtitle;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  triggerBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const plan = btn.getAttribute('data-plan');
      if (plan) {
        openModal(`Deploy Nova ${plan}`, `Start your 14-day unrestricted trial of the ${plan} plan.`);
      } else if (btn.id.includes('login')) {
        openModal('Sign In to Nova AI', 'Access your autonomous development workspace.');
      } else {
        openModal('Get Started with Nova AI', 'Deploy your first autonomous team agent in 60 seconds.');
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Modal form submit
  if (modalForm) {
    modalForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('modal-name')?.value;
      closeModal();
      showToast(`Welcome aboard, ${name || 'builder'}! Setting up your workspace...`);
      modalForm.reset();
    });
  }

  // Hero interactive demo button
  const heroDemoBtn = document.getElementById('hero-watch-demo');
  if (heroDemoBtn) {
    heroDemoBtn.addEventListener('click', () => {
      const playground = document.getElementById('playground');
      if (playground) {
        playground.scrollIntoView({ behavior: 'smooth' });
        showToast('Exploring the Live Agent Engine!');
      }
    });
  }

  // Footer CTA submit
  const ctaSubmitBtn = document.getElementById('cta-submit-btn');
  const ctaEmailInput = document.getElementById('cta-email-input');
  if (ctaSubmitBtn && ctaEmailInput) {
    ctaSubmitBtn.addEventListener('click', () => {
      const email = ctaEmailInput.value.trim();
      if (email && email.includes('@')) {
        showToast('Invite sent! Check your inbox for workspace access.');
        ctaEmailInput.value = '';
      } else {
        showToast('Please enter a valid work email.');
      }
    });
  }
}

/* ==========================================================================
   8. Toast Notification System
   ========================================================================== */
function initToast() {
  // Container already created in HTML
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="ri-checkbox-circle-fill toast-icon"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

/* ==========================================================================
   9. Mobile Menu Drawer
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
    const icon = toggle.querySelector('i');
    if (icon) {
      if (drawer.classList.contains('open')) {
        icon.className = 'ri-close-line';
      } else {
        icon.className = 'ri-menu-4-line';
      }
    }
  });

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'ri-menu-4-line';
    });
  });
}

/* ==========================================================================
   10. Back to Top Button
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
