/* ============================================================
   shared.js — SaúdeMundo · Lógica compartilhada entre páginas
   Inclua no FINAL do <body> de TODAS as páginas
   ============================================================ */

/* ---------- Constantes ---------- */
const SITE_URL = 'https://saudemundo.com.br';
const SM_STORAGE_KEY = 'sm-user-data';

/* ---------- Nav HTML ---------- */
(function injectNav() {
  const pages = [
    { href: 'index.html',                    label: 'Calorias' },
    { href: 'calculadora-imc.html',          label: 'IMC' },
    { href: 'calculadora-tmb.html',          label: 'TMB' },
    { href: 'calculadora-agua.html',         label: 'Água' },
    { href: 'calculadora-proteina.html',     label: 'Proteína' },
    { href: 'calculadora-tdee.html',         label: 'TDEE' },
    { href: 'calculadora-deficit-calorico.html', label: 'Déficit' },
    { href: 'calculadora-cutting.html',      label: 'Cutting' },
    { href: 'calculadora-bulking.html',      label: 'Bulking' },
    { href: 'calculadora-macros.html',       label: 'Macros' },
    { href: 'calorias-por-dia.html',         label: 'Cal/Dia' },
  ];

  const current = window.location.pathname.split('/').pop() || 'index.html';

  const links = pages.map(p =>
    `<a href="${p.href}"${current === p.href ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  const navHTML = `
    <nav>
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">✦ saudemundo</a>
        <div class="nav-links">${links}</div>
        <button class="theme-btn" id="theme-btn" onclick="toggleTheme()">🌙</button>
      </div>
    </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
})();

/* ---------- Footer HTML ---------- */
(function injectFooter() {
  const footerHTML = `
    <footer>
      <div class="footer-inner">
        <div class="footer-links">
          <a href="sobre.html">Sobre Nós</a>
          <a href="contato.html">Contato</a>
          <a href="privacidade.html">Política de Privacidade</a>
          <a href="termos.html">Termos de Uso</a>
        </div>
        <p style="max-width:600px;line-height:1.6;font-size:12px;">
          Aviso: As calculadoras do SaúdeMundo têm fins educativos e informativos.
          Os resultados são estimativas e não substituem orientação de nutricionista ou médico.
        </p>
        <p>© <span class="year-auto"></span> · 
          <a href="https://saudemundo.com.br" style="color:var(--green);text-decoration:none;font-weight:500;">saudemundo.com.br</a>
          · Todos os direitos reservados.
        </p>
      </div>
    </footer>
    <div class="toast" id="toast"></div>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);

  document.querySelectorAll('.year-auto').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ---------- Tema (dark/light) ---------- */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('sm-theme', isDark ? 'dark' : 'light');
}

(function applyTheme() {
  if (localStorage.getItem('sm-theme') === 'dark') {
    document.body.classList.add('dark');
    requestAnimationFrame(() => {
      const btn = document.getElementById('theme-btn');
      if (btn) btn.textContent = '☀️';
    });
  }
})();

/* ---------- Toast ---------- */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ---------- Compartilhar ---------- */
function copyLink() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(SITE_URL).then(() => showToast('✅ Link copiado!'));
  }
}

/* ---------- Outras Calculadoras ---------- */
const SM_TOOLS = [
  { href: 'index.html',                       icon: '🥗', name: 'Calorias e Macros',  desc: 'Meta calórica e macronutrientes' },
  { href: 'calculadora-imc.html',             icon: '⚖️', name: 'IMC',                desc: 'Índice de Massa Corporal' },
  { href: 'calculadora-tmb.html',             icon: '🔥', name: 'TMB e TDEE',         desc: 'Quantas calorias você queima' },
  { href: 'calculadora-proteina.html',        icon: '💪', name: 'Proteína',           desc: 'Ingestão ideal de proteínas' },
  { href: 'calculadora-agua.html',            icon: '💧', name: 'Água',               desc: 'Hidratação diária ideal' },
  { href: 'calculadora-tdee.html',            icon: '⚡', name: 'TDEE',              desc: 'Gasto energético total' },
  { href: 'calculadora-deficit-calorico.html',icon: '📉', name: 'Déficit Calórico',   desc: 'Calcule seu déficit calórico' },
  { href: 'calculadora-cutting.html',         icon: '✂️', name: 'Cutting',            desc: 'Planejamento de cutting' },
  { href: 'calculadora-bulking.html',         icon: '💪', name: 'Bulking',            desc: 'Planejamento de bulking' },
  { href: 'calculadora-macros.html',          icon: '🥧', name: 'Macronutrientes',    desc: 'Distribuição de macros' },
  { href: 'calorias-por-dia.html',            icon: '📅', name: 'Calorias por Dia',   desc: 'Estimativa calórica diária' },
];

function smRenderOtherTools() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const filtered = SM_TOOLS.filter(t => t.href !== current);

  // .tools-grid → cards grandes (usado no index.html)
  document.querySelectorAll('.tools-grid').forEach(container => {
    container.innerHTML = filtered.map(t =>
      `<a href="${t.href}" class="tool-card">
        <div class="tool-icon">${t.icon}</div>
        <div class="tool-name">${t.name}</div>
        <div class="tool-desc">${t.desc}</div>
      </a>`
    ).join('');
  });

  // .other-tools → links compactos (usado nas demais páginas)
  document.querySelectorAll('.other-tools').forEach(container => {
    container.innerHTML = filtered.map(t =>
      `<a href="${t.href}" class="tool-link">
        <div class="tool-link-name">${t.icon} ${t.name}</div>
        <div class="tool-link-desc">${t.desc}</div>
      </a>`
    ).join('');
  });
}

/* ============================================================
   DADOS DO USUÁRIO — compartilhados entre calculadoras
   ============================================================ */

function smGetUserData() {
  try { return JSON.parse(localStorage.getItem(SM_STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function smSaveUserData(newData) {
  const current = smGetUserData();
  const merged = { ...current, ...newData };
  localStorage.setItem(SM_STORAGE_KEY, JSON.stringify(merged));
}

function smLoadUserData() {
  const d = smGetUserData();
  if (!d || !Object.keys(d).length) return;

  const fields = ['peso', 'altura', 'idade'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id]) el.value = d[id];
  });

  if (d.sexo) {
    const btns = document.querySelectorAll('#sexo-group button');
    btns.forEach(b => {
      b.classList.toggle('active', b.textContent.trim().startsWith(d.sexo === 'M' ? 'M' : 'F'));
    });
  }

  if (d.atividade) {
    const sel = document.getElementById('atividade');
    if (sel) sel.value = d.atividade;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  smLoadUserData();
  smRenderOtherTools();
});
