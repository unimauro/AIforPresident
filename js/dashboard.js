const Dashboard = {
  basePath: '../data/peru/',
  countryCode: 'PE',

  detectCountry() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c') || 'PE';
    this.countryCode = code.toUpperCase();
    this.basePath = `../data/${this.getCountryFolder()}/`;
  },

  countryInfo: {
    PE: { flag: '🇵🇪', name: 'Perú', name_en: 'Peru' },
    AR: { flag: '🇦🇷', name: 'Argentina', name_en: 'Argentina' },
    MX: { flag: '🇲🇽', name: 'México', name_en: 'Mexico' },
    CO: { flag: '🇨🇴', name: 'Colombia', name_en: 'Colombia' },
    CL: { flag: '🇨🇱', name: 'Chile', name_en: 'Chile' },
    BR: { flag: '🇧🇷', name: 'Brasil', name_en: 'Brazil' },
    US: { flag: '🇺🇸', name: 'Estados Unidos', name_en: 'United States' },
    ES: { flag: '🇪🇸', name: 'España', name_en: 'Spain' },
    FR: { flag: '🇫🇷', name: 'Francia', name_en: 'France' },
    DE: { flag: '🇩🇪', name: 'Alemania', name_en: 'Germany' },
    JP: { flag: '🇯🇵', name: 'Japón', name_en: 'Japan' },
    KR: { flag: '🇰🇷', name: 'Corea del Sur', name_en: 'South Korea' },
    IN: { flag: '🇮🇳', name: 'India', name_en: 'India' },
    NG: { flag: '🇳🇬', name: 'Nigeria', name_en: 'Nigeria' },
    AU: { flag: '🇦🇺', name: 'Australia', name_en: 'Australia' }
  },

  updateHeroTitle() {
    const info = this.countryInfo[this.countryCode] || this.countryInfo.PE;
    const isEn = I18n.locale === 'en';
    const name = isEn ? info.name_en : info.name;
    const title = document.getElementById('country-hero-title');
    const subtitle = document.getElementById('country-hero-subtitle');
    if (title) title.textContent = `${info.flag} ${isEn ? 'AI President for' : 'Presidente IA para'} ${name}`;
    if (subtitle) subtitle.textContent = isEn ? `Ideal proposals and analysis for ${name}` : `Propuestas ideales y análisis para ${name}`;
    document.title = `AI President — ${name} ${info.flag}`;
  },

  getCountryFolder() {
    const map = {
      PE: 'peru', AR: 'argentina', MX: 'mexico', CO: 'colombia',
      CL: 'chile', BR: 'brazil', US: 'usa', ES: 'spain',
      FR: 'france', DE: 'germany', JP: 'japan', KR: 'south-korea',
      IN: 'india', NG: 'nigeria', AU: 'australia'
    };
    return map[this.countryCode] || 'peru';
  },

  async init() {
    this.detectCountry();

    const [stats, proposals, candidates, issues] = await Promise.all([
      this.fetchJSON('statistics.json'),
      this.fetchJSON('proposals.json'),
      this.fetchJSON('candidates.json').catch(() => []),
      this.fetchJSON('issues.json')
    ]);

    this.updateHeroTitle();

    this.renderStats(stats);
    this.renderProposals(proposals);

    // Show candidate sections only if data exists
    if (candidates && candidates.length > 0) {
      const candSection = document.getElementById('candidates');
      const compSection = document.getElementById('comparison-section');
      if (candSection) candSection.style.display = '';
      if (compSection) compSection.style.display = '';
      this.renderCandidates(candidates);
      this.renderRadarChart(candidates);
      this.renderBarChart(candidates);
      this.renderComparisonTable(candidates);
    }

    this.renderIssues(issues);
  },

  async fetchJSON(file) {
    const res = await fetch(this.basePath + file);
    return res.json();
  },

  formatValue(stat) {
    const v = stat.value;
    switch (stat.format) {
      case 'number': return v.toLocaleString();
      case 'currency': return `${stat.prefix || ''}${v.toLocaleString()}`;
      case 'percent': return `${v}%`;
      case 'years': return `${v} años`;
      case 'decimal': return v.toFixed(2);
      default: return v;
    }
  },

  renderStats(stats) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    const isEn = I18n.locale === 'en';

    grid.innerHTML = Object.values(stats).map(s => `
      <div class="stat-card">
        <div class="stat-value">${this.formatValue(s)}</div>
        <div class="stat-label">${isEn ? s.label_en : s.label}</div>
        <div class="stat-source">${s.source} (${s.year})</div>
      </div>
    `).join('');
  },

  renderProposals(proposals) {
    const grid = document.getElementById('proposals-grid');
    if (!grid) return;
    const isEn = I18n.locale === 'en';

    grid.innerHTML = proposals.map(p => `
      <div class="card">
        <div class="proposal-icon">${p.icon}</div>
        <div class="proposal-title">${isEn ? p.title_en : p.title}</div>
        <p class="proposal-text">${isEn ? p.description_en : p.description}</p>
      </div>
    `).join('');
  },

  renderCandidates(candidates) {
    const grid = document.getElementById('candidates-grid');
    if (!grid) return;

    grid.innerHTML = candidates.map(c => `
      <div class="card" style="border-left: 3px solid ${c.color}">
        <div class="card-title" style="color:${c.color}">${c.name}</div>
        <div class="card-subtitle">${c.party}</div>
        <ul style="margin-top:0.75rem; padding-left:1.2rem; color:var(--text-secondary); font-size:0.85rem;">
          ${c.key_proposals.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  },

  renderRadarChart(candidates) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social'];
    const labels = dims.map(d => I18n.t(`dimensions.${d}`));

    const datasets = candidates.map(c => ({
      label: c.name,
      data: dims.map(d => c.scores[d]),
      borderColor: c.color,
      backgroundColor: c.color + '20',
      pointBackgroundColor: c.color,
      borderWidth: 2
    }));

    new Chart(canvas, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: { stepSize: 2, color: '#8b949e', backdropColor: 'transparent' },
            grid: { color: '#30363d' },
            pointLabels: { color: '#e6edf3', font: { size: 11 } }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e6edf3', padding: 15, usePointStyle: true }
          }
        }
      }
    });
  },

  renderBarChart(candidates) {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social'];

    const datasets = candidates.map(c => ({
      label: c.name,
      data: dims.map(d => c.scores[d]),
      backgroundColor: c.color + 'CC',
      borderColor: c.color,
      borderWidth: 1
    }));

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dims.map(d => I18n.t(`dimensions.${d}`)),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
          y: { beginAtZero: true, max: 10, ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e6edf3', padding: 15, usePointStyle: true }
          }
        }
      }
    });
  },

  renderIssues(issues) {
    const grid = document.getElementById('issues-grid');
    if (!grid) return;
    const isEn = I18n.locale === 'en';

    const sorted = [...issues].sort((a, b) => b.severity - a.severity);

    grid.innerHTML = sorted.map(issue => {
      const severityClass = issue.severity >= 8 ? 'score-low' : issue.severity >= 6 ? 'score-mid' : 'score-high';
      return `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span style="font-size:1.5rem">${issue.icon}</span>
            <span class="${severityClass}" style="font-size:1.2rem">${issue.severity}/10</span>
          </div>
          <div class="card-title">${isEn ? issue.name_en : issue.name}</div>
          <p class="proposal-text" style="margin-top:0.5rem">${isEn ? issue.description_en : issue.description}</p>
        </div>
      `;
    }).join('');
  },

  renderComparisonTable(candidates) {
    const wrapper = document.getElementById('comparison-table');
    if (!wrapper) return;

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social'];

    const headerCells = candidates.map(c =>
      `<th style="color:${c.color}">${c.name}</th>`
    ).join('');

    const rows = dims.map(d => {
      const cells = candidates.map(c => {
        const score = c.scores[d];
        const cls = score >= 7 ? 'score-high' : score >= 5 ? 'score-mid' : 'score-low';
        return `<td class="${cls}">${score}/10</td>`;
      }).join('');
      return `<tr><td><strong>${I18n.t(`dimensions.${d}`)}</strong></td>${cells}</tr>`;
    }).join('');

    wrapper.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>${I18n.locale === 'en' ? 'Dimension' : 'Dimensión'}</th>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
};

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
      Dashboard.init();
    });
  }

  Dashboard.init();

  // PDF download
  const pdfBtn = document.getElementById('download-pdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      const originalText = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '⏳ <span data-i18n="pdf.generating">' + (I18n.locale === 'en' ? 'Generating...' : 'Generando...') + '</span>';
      pdfBtn.disabled = true;
      try {
        await PDFGenerator.generate();
      } catch (e) {
        console.error('PDF error:', e);
      }
      pdfBtn.innerHTML = originalText;
      pdfBtn.disabled = false;
    });
  }

  // Hamburger
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.textContent = '☰'; }
    });
  }
});
