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

    let stats, proposals, candidates, issues;
    try {
      [stats, proposals, candidates, issues] = await Promise.all([
        this.fetchJSON('statistics.json').catch(() => ({})),
        this.fetchJSON('proposals.json').catch(() => []),
        this.fetchJSON('candidates.json').catch(() => []),
        this.fetchJSON('issues.json').catch(() => [])
      ]);
    } catch (e) {
      console.error('Error loading data:', e);
      return;
    }

    this.updateHeroTitle();

    this.renderStats(stats);
    this.renderProposals(proposals);

    // Comparison charts (radar, bar, table)
    const scoredCandidates = (candidates || []).filter(c => c.scores);
    if (scoredCandidates.length > 0) {
      this.renderRadarChart(scoredCandidates);
      this.renderBarChart(scoredCandidates);
      this.renderComparisonTable(scoredCandidates);
    }

    // Candidate cards
    if (candidates && candidates.length > 0) {
      this.renderCandidates(candidates);

      const searchInput = document.getElementById('candidate-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase();
          document.querySelectorAll('#candidates-grid .card').forEach(card => {
            const text = card.dataset.search || '';
            card.style.display = text.includes(q) ? '' : 'none';
          });
        });
      }
    }

    this.renderIssues(issues || []);

    // News
    this.fetchJSON('news.json').catch(() => null).then(news => {
      if (news) this.renderNews(news);
    });
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
    const isEn = I18n.locale === 'en';

    grid.innerHTML = candidates.map(c => {
      const position = c.position ? `<span style="color:var(--text-secondary);font-size:0.75rem">#${c.position}</span> ` : '';
      const planLink = c.plan_url ? `<a href="${c.plan_url}" target="_blank" rel="noopener" style="font-size:0.8rem; display:inline-block; margin-top:0.5rem;">📄 ${isEn ? 'Government Plan' : 'Plan de Gobierno'}</a>` : '';

      const symbol = c.symbol || '🏛️';
      return `
        <div class="card" style="border-left: 3px solid ${c.color}" data-search="${(c.name + ' ' + c.party).toLowerCase()}">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:1.5rem">${symbol}</span>
            <div>
              <div class="card-title" style="color:${c.color}">${position}${c.name}</div>
              <div class="card-subtitle">${c.party}</div>
            </div>
          </div>
          <ul style="margin-top:0.5rem; padding-left:1.2rem; color:var(--text-secondary); font-size:0.82rem;">
            ${c.key_proposals.map(p => `<li>${p}</li>`).join('')}
          </ul>
          ${planLink}
        </div>
      `;
    }).join('');
  },

  radarChart: null,
  barChart: null,

  renderRadarChart(candidates) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    if (this.radarChart) this.radarChart.destroy();

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social', 'science'];
    const labels = dims.map(d => I18n.t(`dimensions.${d}`));

    const datasets = candidates.map(c => ({
      label: c.name,
      data: dims.map(d => c.scores[d]),
      borderColor: c.color,
      backgroundColor: c.color + '20',
      pointBackgroundColor: c.color,
      borderWidth: 2
    }));

    this.radarChart = new Chart(canvas, {
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

    if (this.barChart) this.barChart.destroy();

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social', 'science'];

    const datasets = candidates.map(c => ({
      label: c.name,
      data: dims.map(d => c.scores[d]),
      backgroundColor: c.color + 'CC',
      borderColor: c.color,
      borderWidth: 1
    }));

    this.barChart = new Chart(canvas, {
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

    const dims = ['education', 'security', 'economy', 'health', 'environment', 'corruption', 'technology', 'social', 'science'];

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
  },

  renderNews(news) {
    // Ticker
    const tickerTrack = document.getElementById('ticker-track');
    if (tickerTrack && news.ticker) {
      const items = news.ticker.map(n =>
        `<span class="ticker-item"><a href="${n.url}" target="_blank" rel="noopener">${n.text}</a></span>`
      ).join('');
      tickerTrack.innerHTML = items + items;
    }

    // Interview marquee chips
    const interviewsTrack = document.getElementById('interviews-track');
    if (interviewsTrack && news.interviews) {
      const chips = news.interviews.map(iv => `
        <a href="${iv.url}" target="_blank" rel="noopener" class="interview-chip">
          <span class="interview-chip-dot" style="background:${iv.color}"></span>
          <span class="interview-chip-name">${iv.candidate}</span>
          <span class="interview-chip-party">${iv.party}</span>
          <span class="interview-chip-play">▶</span>
        </a>
      `).join('');
      // Duplicate for infinite loop
      interviewsTrack.innerHTML = chips + chips;
    }

    // News/debate cards
    const grid = document.getElementById('news-grid');
    if (grid && news.videos) {
      const typeLabels = { debate: '🎤 Debate', foro: '🏛️ Foro', analisis: '📊 Análisis', entrevista: '🎥 Entrevista' };

      grid.innerHTML = news.videos.map(v => {
        const d = new Date(v.date);
        const dateStr = d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
        const typeClass = `news-type-${v.type}`;
        const typeLabel = typeLabels[v.type] || v.type;
        const isPast = d <= new Date();
        const badge = isPast ? '' : '<span style="color:var(--accent-gold);font-size:0.75rem">📅 Próximamente</span>';

        return `
          <a href="${v.url}" target="_blank" rel="noopener" class="news-card">
            <span class="news-card-type ${typeClass}">${typeLabel}</span>
            <div class="news-card-title">${v.title}</div>
            <p class="news-card-desc">${v.description}</p>
            <div class="news-card-meta">
              <span>${v.source} · ${dateStr}</span>
              ${badge}
            </div>
          </a>
        `;
      }).join('');
    }
  },

  pollsChart: null,

  renderPollsChart(polls) {
    const canvas = document.getElementById('polls-chart');
    if (!canvas || !polls.polls) return;

    if (this.pollsChart) this.pollsChart.destroy();

    const sortedPolls = [...polls.polls].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedPolls.map(p => {
      const d = new Date(p.date);
      return `${p.pollster} ${d.toLocaleDateString('es', { month: 'short', day: 'numeric' })}`;
    });

    const datasets = polls.candidates_tracked.map(ct => ({
      label: ct.name,
      data: sortedPolls.map(p => p.results[ct.id] || null),
      borderColor: ct.color,
      backgroundColor: ct.color + '20',
      pointBackgroundColor: ct.color,
      borderWidth: 2,
      tension: 0.3,
      spanGaps: true
    }));

    this.pollsChart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#8b949e', maxRotation: 45 }, grid: { color: '#30363d' } },
          y: { beginAtZero: true, max: 18, ticks: { color: '#8b949e', callback: v => v + '%' }, grid: { color: '#30363d' } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#e6edf3', padding: 10, usePointStyle: true, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` } }
        }
      }
    });
  },

  renderPollsTable(polls) {
    const container = document.getElementById('polls-table-container');
    const disclaimerEl = document.getElementById('polls-disclaimer');
    if (!container || !polls.polls) return;

    const isEn = I18n.locale === 'en';
    const sorted = [...polls.polls].sort((a, b) => new Date(b.date) - new Date(a.date));

    const headerCells = polls.candidates_tracked.map(ct =>
      `<th style="color:${ct.color};min-width:70px">${ct.name}</th>`
    ).join('');

    const rows = sorted.map(p => {
      const d = new Date(p.date);
      const dateStr = d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
      const cells = polls.candidates_tracked.map(ct => {
        const val = p.results[ct.id];
        if (!val) return '<td>—</td>';
        const cls = val >= 8 ? 'score-high' : val >= 4 ? 'score-mid' : '';
        return `<td class="${cls}">${val}%</td>`;
      }).join('');
      return `<tr><td><strong>${p.pollster}</strong><br><span style="font-size:0.75rem;color:var(--text-secondary)">${dateStr}</span></td>${cells}</tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>${isEn ? 'Pollster' : 'Encuestadora'}</th>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    if (disclaimerEl) {
      disclaimerEl.textContent = isEn ? polls.disclaimer_en : polls.disclaimer;
    }
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
