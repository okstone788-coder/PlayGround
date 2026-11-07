import { PALETTES, FACES, ACCESSORIES, STAMPS, STAMP_LIMIT } from './data.js';

const $ = (s) => document.querySelector(s);

function paintFace(canvas, key, glow) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = 92;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const bg = ctx.createRadialGradient(46, 36, 4, 46, 46, 44);
  bg.addColorStop(0, '#6a4233');
  bg.addColorStop(0.7, '#3a2130');
  bg.addColorStop(1, '#241327');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(46, 46, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,180,0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = glow;
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;

  if (key === 'happy') {
    ctx.beginPath(); ctx.arc(34, 40, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(58, 40, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(33, 57); ctx.quadraticCurveTo(46, 70, 59, 57); ctx.stroke();
  } else if (key === 'sleepy') {
    ctx.beginPath(); ctx.arc(34, 45, 8, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.arc(58, 45, 8, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.arc(46, 60, 4, 0, Math.PI * 2); ctx.fill();
  } else if (key === 'wink') {
    ctx.beginPath(); ctx.arc(33, 41, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(59, 44, 8, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(35, 58); ctx.quadraticCurveTo(48, 69, 59, 57); ctx.stroke();
  } else if (key === 'cat') {
    ctx.beginPath(); ctx.ellipse(34, 41, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(58, 41, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(46, 51); ctx.lineTo(41, 57); ctx.lineTo(51, 57); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(40, 61, 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(52, 61, 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  } else if (key === 'spooky') {
    ctx.beginPath(); ctx.moveTo(27, 34); ctx.lineTo(42, 34); ctx.lineTo(34, 49); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, 34); ctx.lineTo(65, 34); ctx.lineTo(58, 49); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(30, 58);
    ctx.lineTo(36, 66); ctx.lineTo(42, 58); ctx.lineTo(48, 66); ctx.lineTo(54, 58); ctx.lineTo(60, 66);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function optionButton(inner, active, attrs = '') {
  return `<button class="opt ${active ? 'active' : ''}" ${attrs}>${inner}</button>`;
}

export class UI {
  constructor(handlers) {
    this.h = handlers;
    this.tab = 'color';
    this.state = null;
    this.currentOrder = null;
    this.muted = false;

    this.scoreEl = $('#score');
    this.comboEl = $('#combo');
    this.comboChip = $('#comboChip');
    this.orderPanel = $('#orderPanel');
    this.orderName = $('#orderName');
    this.orderLine = $('#orderLine');
    this.spiritBadge = $('#spiritBadge');
    this.wishList = $('#wishList');
    this.roundDots = $('#roundDots');
    this.timeFill = $('#timeFill');
    this.timeText = $('#timeText');
    this.serveBtn = $('#serveBtn');
    this.optionsEl = $('#options');
    this.toastEl = $('#toast');
    this.stampHint = $('#stampHint');
    this.mirrorBtn = $('#mirrorBtn');
    this.freeBanner = $('#freeBanner');
    this.startOverlay = $('#startOverlay');
    this.resultsOverlay = $('#resultsOverlay');
    this.photoHint = $('#photoHint');

    $('#tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      this.setTab(btn.dataset.tab);
    });

    $('#startRush').addEventListener('click', () => this.h.onStartRush());
    $('#startFree').addEventListener('click', () => this.h.onStartFree());
    $('#replayBtn').addEventListener('click', () => this.h.onReplay());
    $('#freeBtn').addEventListener('click', () => this.h.onFreeFromResults());
    $('#rushBtn').addEventListener('click', () => this.h.onStartRush());
    this.serveBtn.addEventListener('click', () => this.h.onServe());
    $('#undoBtn').addEventListener('click', () => this.h.onUndo());
    $('#clearBtn').addEventListener('click', () => this.h.onClear());
    this.mirrorBtn.addEventListener('click', () => this.h.onMirror());
    $('#soundBtn').addEventListener('click', () => this.h.onSound());
    $('#photoBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.h.onPhoto();
    });
    $('#stage').addEventListener('click', (e) => {
      if (document.body.classList.contains('photo-mode') && e.target.id !== 'photoBtn') {
        this.h.onPhoto();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.serveBtn.disabled && this.orderPanel.classList.contains('show')) {
        this.h.onServe();
      }
      if (e.key === 'z' || e.key === 'Z') this.h.onUndo();
      if (e.key === 'm' || e.key === 'M') this.h.onMirror();
    });

    this.setTab('color');
  }

  sync(state, force = false) {
    this.state = state;
    if (force) this.renderOptions();
    this.updateHud(state);
  }

  updateHud(state) {
    this.scoreEl.textContent = Math.round(state.score).toLocaleString();
    const mult = state.multiplier || 1;
    this.comboEl.textContent = '×' + (mult % 1 === 0 ? mult : mult.toFixed(2).replace(/0$/, ''));
    this.comboChip.classList.toggle('hot', mult > 1.01);
    this.mirrorBtn.classList.toggle('on', !!state.mirror);
    this.mirrorBtn.setAttribute('aria-pressed', state.mirror ? 'true' : 'false');
    this.mirrorBtn.querySelector('span').textContent = state.mirror ? 'on' : 'off';
  }

  setTab(tab) {
    this.tab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.body.classList.toggle('stamp-mode', tab === 'stamp');
    this.renderOptions();
    this.stampHint.classList.toggle('show', tab === 'stamp');
    window.dispatchEvent(new CustomEvent('parlor:tab', { detail: tab }));
  }

  renderOptions() {
    const s = this.state;
    if (!s) return;
    let html = '';
    if (this.tab === 'color') {
      html = Object.entries(PALETTES).map(([key, p]) => optionButton(
        `<span class="swatch" style="--c:${p.body};--c2:${p.accent}"></span><span class="opt-name">${p.name}</span>`,
        s.palette === key,
        `data-kind="color" data-key="${key}"`,
      )).join('');
    } else if (this.tab === 'face') {
      html = Object.entries(FACES).map(([key, f]) => optionButton(
        `<canvas class="face-preview" data-face="${key}"></canvas><span class="opt-name">${f.name}</span>`,
        s.face === key,
        `data-kind="face" data-key="${key}"`,
      )).join('');
    } else if (this.tab === 'acc') {
      html = Object.entries(ACCESSORIES).map(([key, a]) => optionButton(
        `<span class="opt-icon">${a.icon}</span><span class="opt-name">${a.name}</span>`,
        s.accessory === key,
        `data-kind="acc" data-key="${key}"`,
      )).join('');
    } else {
      const total = s.stampTotal || 0;
      html = Object.entries(STAMPS).map(([key, st]) => optionButton(
        `<span class="opt-icon stamp-icon">${st.icon}</span><span class="opt-name">${st.name}</span>`,
        s.stampType === key,
        `data-kind="stamp" data-key="${key}"`,
      )).join('');
      html += `<div class="stamp-meta"><b>${total}</b> / ${STAMP_LIMIT} charms · tap the pumpkin to place</div>`;
    }
    this.optionsEl.innerHTML = html;

    this.optionsEl.querySelectorAll('.face-preview').forEach((c) => {
      const key = c.dataset.face;
      paintFace(c, key, FACES[key].glow);
    });

    this.optionsEl.querySelectorAll('.opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.kind;
        const key = btn.dataset.key;
        if (kind === 'color') this.h.onColor(key);
        if (kind === 'face') this.h.onFace(key);
        if (kind === 'acc') this.h.onAcc(key);
        if (kind === 'stamp') this.h.onStamp(key);
      });
    });
  }

  // ----- wishes -----
  startOrder(order, index, total) {
    this.currentOrder = order;
    this.orderName.textContent = `${order.spirit.name}'s Wish`;
    this.orderLine.textContent = order.line;
    this.spiritBadge.textContent = '👻';
    this.spiritBadge.style.setProperty('--glow', order.spirit.color);
    this.serveBtn.disabled = false;

    const pal = PALETTES[order.color];
    const face = FACES[order.face];
    const acc = ACCESSORIES[order.accessory];
    const stamp = STAMPS[order.stamp.type];
    this.wishList.innerHTML = `
      <li data-req="color">
        <span class="req-mark"><i class="swatch tiny" style="--c:${pal.body};--c2:${pal.accent}"></i></span>
        <span class="req-label">${pal.name} pumpkin</span><b class="req-check">✓</b>
      </li>
      <li data-req="face">
        <span class="req-mark"><i class="glow-dot" style="--g:${face.glow}"></i></span>
        <span class="req-label">${face.name} face</span><b class="req-check">✓</b>
      </li>
      <li data-req="acc">
        <span class="req-mark"><span class="req-emoji">${acc.icon}</span></span>
        <span class="req-label">${acc.name}</span><b class="req-check">✓</b>
      </li>
      <li data-req="stamp">
        <span class="req-mark"><span class="req-emoji">${stamp.icon}</span></span>
        <span class="req-label">${order.stamp.count} × ${stamp.name} stamp${order.stamp.count > 1 ? 's' : ''}</span>
        <span class="req-count">0/${order.stamp.count}</span><b class="req-check">✓</b>
      </li>`;

    this.roundDots.innerHTML = Array.from({ length: total }, (_, i) => {
      const cls = i < index ? 'done' : i === index ? 'active' : '';
      return `<i class="${cls}"></i>`;
    }).join('');

    this.orderPanel.classList.add('show');
    this.orderPanel.classList.remove('hidden');
  }

  updateWish(stats, order) {
    if (!order) return;
    const checks = {
      color: stats.palette === order.color,
      face: stats.face === order.face,
      acc: stats.accessory === order.accessory,
      stamp: (stats.counts[order.stamp.type] || 0) >= order.stamp.count,
    };
    for (const li of this.wishList.children) {
      const key = li.dataset.req;
      li.classList.toggle('done', !!checks[key]);
      if (key === 'stamp') {
        const n = Math.min(stats.counts[order.stamp.type] || 0, order.stamp.count);
        li.querySelector('.req-count').textContent = `${n}/${order.stamp.count}`;
      }
    }
    return checks;
  }

  updateTimer(timeLeft, maxTime) {
    const pct = Math.max(0, Math.min(1, timeLeft / maxTime));
    this.timeFill.style.width = (pct * 100).toFixed(1) + '%';
    this.timeFill.classList.toggle('low', pct < 0.28);
    const s = Math.max(0, Math.ceil(timeLeft));
    this.timeText.textContent = `0:${String(s).padStart(2, '0')}`;
    this.timeText.classList.toggle('low', pct < 0.28);
  }

  setFreeMode(on) {
    this.orderPanel.classList.toggle('hidden', on);
    this.freeBanner.classList.toggle('hidden', !on);
    if (on) this.currentOrder = null;
  }

  setServeEnabled(on) {
    this.serveBtn.disabled = !on;
  }

  toast(html, kind = '') {
    this.toastEl.innerHTML = html;
    this.toastEl.className = 'toast show ' + kind;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2400);
  }

  showStart() {
    this.startOverlay.classList.remove('hidden');
    this.resultsOverlay.classList.add('hidden');
  }

  hideStart() {
    this.startOverlay.classList.add('hidden');
  }

  showResults({ rank, title, line, score, bestCombo, perfect }) {
    $('#rankBadge').textContent = rank;
    $('#rankBadge').dataset.rank = rank;
    $('#resultTitle').textContent = title;
    $('#resultLine').textContent = line;
    $('#finalScore').textContent = Math.round(score).toLocaleString();
    $('#bestCombo').textContent = '×' + (bestCombo % 1 === 0 ? bestCombo : bestCombo.toFixed(2).replace(/0$/, ''));
    $('#perfectCount').textContent = perfect;
    this.resultsOverlay.classList.remove('hidden');
    this.orderPanel.classList.remove('show');
  }

  hideResults() {
    this.resultsOverlay.classList.add('hidden');
  }

  toggleSound(muted) {
    this.muted = muted;
    $('#soundBtn').textContent = muted ? '🔇' : '🔊';
    $('#soundBtn').setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  setPhotoMode(on) {
    document.body.classList.toggle('photo-mode', on);
    this.photoHint.classList.toggle('show', on);
  }
}
