document.addEventListener('DOMContentLoaded', async () => {
  const { locale, country } = I18n.detect();
  await I18n.load(locale);
  I18n.apply();

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = I18n.locale;
    langSelect.addEventListener('change', async (e) => {
      await I18n.load(e.target.value);
      I18n.apply();
      if (typeof renderCountries === 'function') renderCountries();
      showBanner();
      initSlider();
    });
  }

  if (typeof renderCountries === 'function') renderCountries();
  showBanner();
  initSlider();
});

const COUNTRY_MAP = {
  PE: { name: 'Perú', path: 'countries/peru.html' },
  AR: { name: 'Argentina', path: '#' },
  MX: { name: 'México', path: '#' },
  CO: { name: 'Colombia', path: '#' }
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

    // Slider logic
    let currentIndex = 0;
    const slideWidth = 320 + 24; // min-width + gap
    const visibleSlides = Math.floor(track.offsetWidth / slideWidth) || 1;
    const maxIndex = Math.max(0, slides.length - visibleSlides);

    // Dots
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

    // Buttons
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

    // Auto-play
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

    // Touch support
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

async function renderCountries() {
  const grid = document.getElementById('countries-grid');
  if (!grid) return;

  try {
    const res = await fetch('data/countries.json');
    const countries = await res.json();

    grid.innerHTML = countries.map(c => {
      const isActive = c.status === 'active';
      const name = I18n.locale === 'en' ? c.name_en : c.name;
      const badgeClass = isActive ? 'badge-active' : 'badge-soon';
      const badgeText = isActive ? I18n.t('countries.active') : I18n.t('countries.coming_soon');

      return `
        <a href="${isActive ? c.path : '#'}" class="card" style="${isActive ? '' : 'opacity:0.6;pointer-events:none'}">
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
