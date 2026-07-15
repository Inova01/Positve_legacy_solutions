/* ==========================================================================
   Positive Legacy Solutions LLC — main.js
   All site behavior (vanilla JS)
   ==========================================================================
   PLACEHOLDERS TO REPLACE:
   1. WEB3FORMS_ACCESS_KEY — get from https://web3forms.com (contact form)
   2. Email address — search "positivelegacysolutions@gmail.com" across pages
   3. Owner name — set OWNER_NAME below (single edit point)
   ========================================================================== */

/* ---- Single-edit business constants ---- */
const OWNER_NAME = "Etienne"; // TODO: confirm full spelling — edit here only
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"; // TODO: replace

document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initHeaderScroll();
  initMobileMenu();
  initScrollReveal(prefersReduced);
  initCounters();
  initProgressBars();
  initHeroSlider(prefersReduced);
  initTestimonials(prefersReduced);
  initHCarousel();
  initAccordions();
  initBackToTop();
  initContactForm();
  setYear();
});

/* ---------- Header shadow / shrink on scroll ---------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Mobile off-canvas menu ---------- */
function initMobileMenu() {
  const openBtn = document.getElementById('menuOpen');
  const closeBtn = document.getElementById('menuClose');
  const panel = document.getElementById('mobilePanel');
  const overlay = document.getElementById('mobileOverlay');
  if (!openBtn || !panel) return;

  const open = () => {
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
  };
  const close = () => {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
  };
  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay && overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Services accordion inside mobile menu
  const accToggle = document.getElementById('mobileServicesToggle');
  const accBody = document.getElementById('mobileServicesBody');
  if (accToggle && accBody) {
    accToggle.addEventListener('click', () => {
      const isOpen = accBody.style.maxHeight && accBody.style.maxHeight !== '0px';
      accBody.style.maxHeight = isOpen ? '0px' : accBody.scrollHeight + 'px';
      accToggle.querySelector('.acc-icon')?.classList.toggle('rotate-45', !isOpen);
    });
  }
  // Close when a link inside the panel is clicked
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal(prefersReduced) {
  const els = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

/* ---------- Animated counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const dur = 1800;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
}

/* ---------- Progress bars ---------- */
function initProgressBars() {
  const bars = document.querySelectorAll('.progress-fill');
  if (!bars.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.width = (e.target.dataset.value || '0') + '%'; io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => io.observe(b));
}

/* ---------- Hero slider ---------- */
function initHeroSlider(prefersReduced) {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;
  let idx = 0;
  const show = (n) => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  };
  document.getElementById('heroPrev')?.addEventListener('click', () => show(idx - 1));
  document.getElementById('heroNext')?.addEventListener('click', () => show(idx + 1));
  if (!prefersReduced) setInterval(() => show(idx + 1), 6500);
}

/* ---------- Testimonials slider ---------- */
function initTestimonials(prefersReduced) {
  const track = document.getElementById('testiTrack');
  if (!track) return;
  const cards = track.children;
  const total = cards.length;
  let idx = 0;
  let timer = null;
  const perView = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
  const go = (n) => {
    const pv = perView();
    const max = Math.max(0, total - pv);
    idx = Math.min(Math.max(n, 0), max);
    const cardW = 100 / pv;
    track.style.transform = `translateX(-${idx * cardW}%)`;
  };
  const next = () => { const pv = perView(); go(idx + 1 > total - pv ? 0 : idx + 1); };
  document.getElementById('testiNext')?.addEventListener('click', () => { next(); reset(); });
  document.getElementById('testiPrev')?.addEventListener('click', () => { go(idx - 1); reset(); });
  const start = () => { if (!prefersReduced) timer = setInterval(next, 6000); };
  const reset = () => { clearInterval(timer); start(); };
  track.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
  track.parentElement.addEventListener('mouseleave', start);
  window.addEventListener('resize', () => go(idx));
  go(0); start();
}

/* ---------- Horizontal drag carousel ---------- */
function initHCarousel() {
  document.querySelectorAll('.hcarousel').forEach(el => {
    let down = false, startX, scrollLeft;
    el.addEventListener('mousedown', (e) => { down = true; el.classList.add('dragging'); startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; });
    el.addEventListener('mouseleave', () => { down = false; el.classList.remove('dragging'); });
    el.addEventListener('mouseup', () => { down = false; el.classList.remove('dragging'); });
    el.addEventListener('mousemove', (e) => { if (!down) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; });
  });
}

/* ---------- Accordions (FAQ + service pages) ---------- */
function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach(group => {
    const items = group.querySelectorAll('.acc-item');
    items.forEach(item => {
      const head = item.querySelector('.acc-head');
      const body = item.querySelector('.acc-body');
      // expand any item pre-marked open on load
      if (item.classList.contains('open') && body) body.style.maxHeight = body.scrollHeight + 'px';
      head.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // only one open at a time within a group
        items.forEach(other => {
          other.classList.remove('open');
          const ob = other.querySelector('.acc-body');
          if (ob) ob.style.maxHeight = '0px';
        });
        if (!isOpen) {
          item.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  });
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Contact form (Web3Forms) ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const keyField = form.querySelector('input[name="access_key"]');
  if (keyField) keyField.value = WEB3FORMS_ACCESS_KEY;
  const status = document.getElementById('formStatus');
  const btn = form.querySelector('button[type="submit"]');
  const btnLabel = btn.querySelector('.btn-label');

  const setError = (field, show) => {
    field.classList.toggle('error', show);
    const msg = field.parentElement.querySelector('.field-error-msg');
    if (msg) msg.classList.toggle('show', show);
  };

  const validate = () => {
    let ok = true;
    form.querySelectorAll('[data-required]').forEach(f => {
      const empty = !f.value.trim();
      let invalid = empty;
      if (f.type === 'email' && f.value.trim()) invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value);
      setError(f, invalid);
      if (invalid) ok = false;
    });
    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // honeypot
    if (form.querySelector('input[name="botcheck"]').checked) return;
    if (!validate()) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'mt-4 text-sm text-red-600'; return; }

    btn.disabled = true;
    const original = btnLabel.textContent;
    btnLabel.textContent = 'Sending…';
    status.textContent = '';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await res.json();
      if (data.success) {
        form.reset();
        status.innerHTML = '✓ Thank you! Your message has been sent. The PLS Team will be in touch shortly.';
        status.className = 'mt-4 text-sm font-semibold text-green-700';
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      status.textContent = 'Sorry, something went wrong. Please call us at (904) 884-6854.';
      status.className = 'mt-4 text-sm text-red-600';
    } finally {
      btn.disabled = false;
      btnLabel.textContent = original;
    }
  });

  form.querySelectorAll('[data-required]').forEach(f => {
    f.addEventListener('blur', () => validate());
  });
}

/* ---------- Footer year ---------- */
function setYear() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}
