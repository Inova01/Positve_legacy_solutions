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
  initTeamSlider();
  initTeamShare();
  initClientStories(prefersReduced);
  initBlog();
  initNewsletterForm();
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

/* ---------- Team slider ---------- */
function initTeamSlider() {
  const track = document.getElementById('teamTrack');
  if (!track) return;
  const total = track.children.length;
  let idx = 0;
  const perView = () => (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1);
  const go = (n) => {
    const pv = perView();
    const max = Math.max(0, total - pv);
    idx = Math.min(Math.max(n, 0), max);
    track.style.transform = `translateX(-${idx * (100 / pv)}%)`;
  };
  document.getElementById('teamNext')?.addEventListener('click', () => {
    const pv = perView();
    go(idx + 1 > total - pv ? 0 : idx + 1);
  });
  document.getElementById('teamPrev')?.addEventListener('click', () => go(idx - 1));
  window.addEventListener('resize', () => go(idx));
  go(0);
}

/* ---------- Team share expand (tap support) ---------- */
function initTeamShare() {
  document.querySelectorAll('.team-share-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const share = btn.closest('.team-share');
      const isOpen = share.classList.contains('open');
      document.querySelectorAll('.team-share.open').forEach(s => s.classList.remove('open'));
      if (!isOpen) share.classList.add('open');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.team-share')) {
      document.querySelectorAll('.team-share.open').forEach(s => s.classList.remove('open'));
    }
  });
}

/* ---------- Client stories rotator ---------- */
function initClientStories(prefersReduced) {
  const section = document.getElementById('clientStories');
  if (!section) return;
  const stories = [
    {
      photo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
      quote: '"They handled my family\'s immigration paperwork with so much patience and care. Everything was explained in Kreyòl and I never felt lost. We are forever grateful to the PLS Team."',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      name: 'Marie L.', role: 'Immigration Client'
    },
    {
      photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      quote: '"We bought our first home in Jacksonville with PLS guiding every step. They negotiated hard for us and made a stressful process feel calm and clear. We could not recommend them more."',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      name: 'David R.', role: 'Real Estate Client'
    },
    {
      photo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
      quote: '"My taxes were always confusing until I found PLS. They found deductions I never knew about and filed everything on time. Honest, professional and truly caring people."',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
      name: 'Sandra P.', role: 'Tax Client'
    }
  ];
  const photo = document.getElementById('storyPhoto');
  const quote = document.getElementById('storyQuote');
  const avatar = document.getElementById('storyAvatar');
  const name = document.getElementById('storyName');
  const role = document.getElementById('storyRole');
  const left = document.getElementById('storyLeft');
  const right = document.getElementById('storyRight');
  const dashes = Array.from(document.querySelectorAll('#storyDashes .story-dash'));
  let idx = 0, timer = null;

  const render = (n) => {
    idx = (n + stories.length) % stories.length;
    const s = stories[idx];
    left.classList.add('out'); right.classList.add('out');
    setTimeout(() => {
      photo.src = s.photo;
      quote.textContent = s.quote;
      avatar.src = s.avatar;
      name.textContent = s.name;
      role.textContent = s.role;
      left.classList.remove('out'); right.classList.remove('out');
    }, prefersReduced ? 0 : 250);
    dashes.forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  dashes.forEach(d => d.addEventListener('click', () => { render(parseInt(d.dataset.index, 10)); reset(); }));
  const start = () => { if (!prefersReduced) timer = setInterval(() => render(idx + 1), 7000); };
  const reset = () => { clearInterval(timer); start(); };
  section.addEventListener('mouseenter', () => clearInterval(timer));
  section.addEventListener('mouseleave', start);
  render(0); start();
}

/* ---------- Blog search + category filter ---------- */
function initBlog() {
  const cards = document.querySelectorAll('.post-card');
  if (!cards.length) return;
  const searchForm = document.getElementById('blogSearchForm');
  const search = document.getElementById('blogSearch');
  const catLinks = document.querySelectorAll('[data-cat]');
  const empty = document.getElementById('blogEmpty');
  let activeCat = 'all';

  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach(c => {
      const title = (c.dataset.title || '').toLowerCase();
      const cat = (c.dataset.category || '').toLowerCase();
      const match = (!q || title.includes(q)) && (activeCat === 'all' || cat === activeCat);
      c.classList.toggle('hidden', !match);
      if (match) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0);
  };

  search?.addEventListener('input', apply);
  searchForm?.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
  catLinks.forEach(l => l.addEventListener('click', (e) => {
    e.preventDefault();
    activeCat = (l.dataset.cat || 'all').toLowerCase();
    catLinks.forEach(x => x.classList.remove('text-gold-500', 'font-bold'));
    l.classList.add('text-gold-500', 'font-bold');
    apply();
  }));
}

/* ---------- Newsletter form (Web3Forms) ---------- */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const keyField = form.querySelector('input[name="access_key"]');
  if (keyField) keyField.value = WEB3FORMS_ACCESS_KEY;
  const status = document.getElementById('newsletterStatus');
  const email = form.querySelector('input[name="email"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.querySelector('input[name="botcheck"]').checked) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      status.textContent = 'Please enter a valid email.';
      status.className = 'mt-2 text-xs text-red-400';
      return;
    }
    status.textContent = 'Subscribing…';
    status.className = 'mt-2 text-xs text-gray-dark';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await res.json();
      if (data.success) {
        form.reset();
        status.textContent = '✓ You\'re subscribed. Thank you!';
        status.className = 'mt-2 text-xs font-semibold text-gold-400';
      } else { throw new Error(); }
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again.';
      status.className = 'mt-2 text-xs text-red-400';
    }
  });
}

/* ---------- Footer year ---------- */
function setYear() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}
