(function() {
  'use strict';

  const listEl = document.getElementById('project-list');
  const updateTimeEl = document.querySelector('.update-time');
  const resultCountEl = document.querySelector('.result-count');
  const tabs = document.querySelectorAll('.tab');

  let currentPeriod = 'daily';
  let allData = {};

  // Load all data files
  async function loadData() {
    const periods = ['daily', 'weekly', 'monthly', 'halfyearly'];
    try {
      const results = await Promise.allSettled(
        periods.map(p =>
          fetch(`data/${p}.json?t=${Date.now()}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      periods.forEach((p, i) => {
        allData[p] = results[i].status === 'fulfilled' ? results[i].value : null;
      });
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    renderCurrent();
  }

  function renderCurrent() {
    const data = allData[currentPeriod];
    if (!data || !data.projects || data.projects.length === 0) {
      listEl.innerHTML = '<div class="empty-state">暂无数据，请稍后再试</div>';
      resultCountEl.textContent = '';
      updateTimeEl.textContent = '';
      return;
    }

    updateTimeEl.textContent = '更新于 ' + formatDate(data.updated);
    resultCountEl.textContent = data.projects.length + ' 个项目';

    listEl.innerHTML = data.projects.map((p, i) => `
      <div class="project-card" data-index="${i}">
        <div class="card-summary" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="card-rank">${String(i + 1).padStart(2, '0')}</span>
          <div class="card-body">
            <div class="card-name">${escHtml(p.name)}</div>
            <div class="card-desc">${escHtml(p.description || '')}</div>
            <div class="card-meta">
              ${p.language ? `<span class="meta-lang">${escHtml(p.language)}</span>` : ''}
              <span class="meta-stars">${fmtNum(p.stars)} ★</span>
              ${p.stars_gained ? `<span class="meta-gained">+${fmtNum(p.stars_gained)}</span>` : ''}
              ${p.forks ? `<span class="meta-forks">${fmtNum(p.forks)} forks</span>` : ''}
            </div>
          </div>
          <span class="card-expand">▸</span>
        </div>
        <div class="card-detail">
          ${p.full_description ? `<p>${escHtml(p.full_description)}</p>` : ''}
          <div class="detail-row">
            <span class="detail-label">Stars</span>
            <span class="detail-value">${fmtNum(p.stars)}</span>
          </div>
          ${p.stars_gained ? `
          <div class="detail-row">
            <span class="detail-label">新增</span>
            <span class="detail-value">+${fmtNum(p.stars_gained)}</span>
          </div>` : ''}
          ${p.forks ? `
          <div class="detail-row">
            <span class="detail-label">Forks</span>
            <span class="detail-value">${fmtNum(p.forks)}</span>
          </div>` : ''}
          ${p.language ? `
          <div class="detail-row">
            <span class="detail-label">语言</span>
            <span class="detail-value">${escHtml(p.language)}</span>
          </div>` : ''}
          ${p.topics && p.topics.length ? `
          <div class="card-topics">
            ${p.topics.map(t => `<span class="topic-tag">${escHtml(t)}</span>`).join('')}
          </div>` : ''}
          <a class="card-link" href="${escHtml(p.url)}" target="_blank" rel="noopener">在 GitHub 查看 →</a>
        </div>
      </div>
    `).join('');
  }

  function switchTab(period) {
    currentPeriod = period;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.period === period));
    renderCurrent();
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.period));
  });

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) { return isoStr; }
  }

  function fmtNum(n) {
    if (n == null) return '0';
    if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Init
  loadData();

})();
