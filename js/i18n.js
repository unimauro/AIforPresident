const I18n = {
  locale: 'en',
  country: null,
  strings: {},

  detect() {
    const lang = navigator.language || 'en';
    const parts = lang.split('-');
    this.locale = parts[0];
    this.country = parts[1] || null;
    return { locale: this.locale, country: this.country };
  },

  async load(locale) {
    try {
      const basePath = this._getBasePath();
      const res = await fetch(`${basePath}i18n/${locale}.json`);
      if (!res.ok) throw new Error('Not found');
      this.strings = await res.json();
      this.locale = locale;
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
    document.documentElement.lang = this.locale;
  },

  _getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/countries/')) return '../';
    return '';
  }
};

window.I18n = I18n;
