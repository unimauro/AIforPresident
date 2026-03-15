let allCountries = [];
let activeRegion = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  const { locale } = I18n.detect();
  await I18n.load(locale);
  I18n.apply();

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = I18n.locale;
    langSelect.addEventListener('change', async (e) => {
      await I18n.load(e.target.value);
      I18n.apply();
      renderCountries();
      renderFilters();
      showBanner();
      initSlider();
    });
  }

  renderCountries();
  renderFilters();
  showBanner();
  initSlider();
  initHamburger();
  initBackToTop();
  initSearch();
});

/* Hamburger menu */
function initHamburger() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
  });

  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.textContent = '☰';
    }
  });
}

/* Back to top */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* Search */
function initSearch() {
  const input = document.getElementById('country-search');
  if (!input) return;

  input.addEventListener('input', () => {
    filterCountries();
  });
}

function filterCountries() {
  const input = document.getElementById('country-search');
  const query = (input ? input.value : '').toLowerCase().trim();
  const grid = document.getElementById('countries-grid');
  const noResults = document.getElementById('no-results');
  const countEl = document.getElementById('search-count');
  if (!grid) return;

  const cards = grid.querySelectorAll('.country-card');
  let visible = 0;

  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const region = card.dataset.region;
    const matchSearch = !query || name.includes(query);
    const matchRegion = activeRegion === 'all' || region === activeRegion;
    const show = matchSearch && matchRegion;
    card.classList.toggle('card-hidden', !show);
    if (show) visible++;
  });

  if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  if (countEl) countEl.textContent = query || activeRegion !== 'all' ? `${visible}/${cards.length}` : '';
}

/* Region filter tabs */
function renderFilters() {
  const container = document.getElementById('filter-tabs');
  if (!container) return;

  const regions = ['all', 'americas', 'europe', 'asia', 'africa', 'oceania'];

  container.innerHTML = regions.map(r => `
    <button class="filter-tab ${r === activeRegion ? 'active' : ''}" data-region="${r}">
      ${I18n.t(`regions.${r}`)}
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    activeRegion = tab.dataset.region;
    container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filterCountries();
  });
}

/* Country banner */
const COUNTRY_MAP = {
  PE: { name: 'Perú', path: 'countries/peru.html' },
  AR: { name: 'Argentina', path: '#' },
  MX: { name: 'México', path: '#' },
  CO: { name: 'Colombia', path: '#' },
  BR: { name: 'Brasil', path: '#' }
};

function showBanner() {
  const banner = document.getElementById('country-banner');
  if (!banner) return;

  const country = I18n.country;
  const mapped = country ? COUNTRY_MAP[country.toUpperCase()] : null;

  if (mapped && mapped.path !== '#') {
    banner.style.display = 'flex';
    banner.innerHTML = `
      <span class="country-banner-text">
        ${I18n.t('banner.detected')} <strong>${mapped.name}</strong>
      </span>
      <a href="${mapped.path}" class="btn btn-primary">${I18n.t('banner.cta')}</a>
    `;
  } else {
    banner.style.display = 'none';
  }
}

/* Vision Slider */
async function initSlider() {
  const track = document.getElementById('slider-track');
  const dotsContainer = document.getElementById('slider-dots');
  if (!track) return;

  try {
    const res = await fetch('data/vision.json');
    const slides = await res.json();
    const isEn = I18n.locale === 'en';

    track.innerHTML = slides.map(s => `
      <div class="slider-slide" style="--slide-accent: ${s.accent}">
        <span class="slide-year" style="background:${s.accent}">${s.year}</span>
        <div class="slide-icon">${s.icon}</div>
        <div class="slide-title">${isEn ? s.title_en : s.title}</div>
        <p class="slide-text">${isEn ? s.text_en : s.text}</p>
        <span class="slide-stat">${isEn ? s.stat_en : s.stat}</span>
      </div>
    `).join('');

    let currentIndex = 0;
    const slideWidth = 320 + 24;
    const visibleSlides = Math.floor(track.offsetWidth / slideWidth) || 1;
    const maxIndex = Math.max(0, slides.length - visibleSlides);

    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map((_, i) =>
        `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
      ).join('');

      dotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('slider-dot')) {
          currentIndex = Math.min(parseInt(e.target.dataset.index), maxIndex);
          scrollToSlide();
        }
      });
    }

    function scrollToSlide() {
      track.scrollTo({ left: currentIndex * slideWidth, behavior: 'smooth' });
      updateDots();
    }

    function updateDots() {
      if (!dotsContainer) return;
      dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    if (prevBtn) prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      scrollToSlide();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      currentIndex = Math.min(maxIndex, currentIndex + 1);
      scrollToSlide();
    });

    let autoPlay = setInterval(() => {
      currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      scrollToSlide();
    }, 5000);

    track.addEventListener('mouseenter', () => clearInterval(autoPlay));
    track.addEventListener('mouseleave', () => {
      autoPlay = setInterval(() => {
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        scrollToSlide();
      }, 5000);
    });

    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      clearInterval(autoPlay);
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) currentIndex = Math.min(maxIndex, currentIndex + 1);
        else currentIndex = Math.max(0, currentIndex - 1);
        scrollToSlide();
      }
    }, { passive: true });

  } catch (e) {
    console.error('Error loading vision slider:', e);
  }
}

/* Render countries */
async function renderCountries() {
  const grid = document.getElementById('countries-grid');
  if (!grid) return;

  try {
    const res = await fetch('data/countries.json');
    allCountries = await res.json();

    // Sort: active first, then alphabetical
    allCountries.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      const nameA = I18n.locale === 'en' ? a.name_en : a.name;
      const nameB = I18n.locale === 'en' ? b.name_en : b.name;
      return nameA.localeCompare(nameB);
    });

    grid.innerHTML = allCountries.map(c => {
      const isActive = c.status === 'active';
      const name = I18n.locale === 'en' ? c.name_en : c.name;
      const badgeClass = isActive ? 'badge-active' : 'badge-soon';
      const badgeText = isActive ? I18n.t('countries.active') : I18n.t('countries.coming_soon');

      return `
        <a href="${isActive ? c.path : '#'}"
           class="card country-card ${isActive ? '' : 'card-inactive'}"
           data-name="${c.name} ${c.name_en}"
           data-region="${c.region}"
           style="${isActive ? '' : 'opacity:0.6;pointer-events:none'}">
          <div class="card-header">
            <span class="card-flag">${c.flag}</span>
            <div>
              <div class="card-title">${name}</div>
              <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  } catch (e) {
    console.error('Error loading countries:', e);
  }
}
