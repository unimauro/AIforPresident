const I18n = {
  locale: 'en',
  country: null,
  strings: {},
  supportedLocales: ['en', 'es', 'pt', 'fr'],

  detect() {
    // Priority: 1) URL param ?lang=  2) localStorage  3) navigator.language
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');

    if (urlLang && this.supportedLocales.includes(urlLang)) {
      this.locale = urlLang;
      this.country = null;
    } else {
      const saved = localStorage.getItem('ai4pres-lang');
      if (saved && this.supportedLocales.includes(saved)) {
        this.locale = saved;
      } else {
        const lang = navigator.language || 'en';
        const parts = lang.split('-');
        this.locale = this.supportedLocales.includes(parts[0]) ? parts[0] : 'en';
        this.country = parts[1] || null;
      }
    }

    return { locale: this.locale, country: this.country };
  },

  async load(locale) {
    try {
      const basePath = this._getBasePath();
      const res = await fetch(`${basePath}i18n/${locale}.json`);
      if (!res.ok) throw new Error('Not found');
      this.strings = await res.json();
      this.locale = locale;
      localStorage.setItem('ai4pres-lang', locale);
    } catch {
      if (locale !== 'en') {
        await this.load('en');
      }
    }
  },

  t(key) {
    const keys = key.split('.');
    let val = this.strings;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return key;
      }
    }
    return val;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text !== key) {
        el.textContent = text;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.t(key);
      if (text !== key) {
        el.placeholder = text;
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = this.locale;

    // Update page title
    const siteTitle = this.t('site.title');
    const tagline = this.t('site.tagline');
    if (siteTitle !== 'site.title') {
      document.title = `${siteTitle} — ${tagline}`;
    }

    // Update meta description
    const desc = this.t('hero.subtitle');
    if (desc !== 'hero.subtitle') {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', desc);
    }
  },

  _getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/countries/')) return '../';
    return '';
  }
};

window.I18n = I18n;
