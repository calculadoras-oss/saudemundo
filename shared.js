/* ============================================================
   shared.js — SaúdeMundo · Lógica compartilhada entre páginas
   Inclua no FINAL do <body> de TODAS as páginas
   ============================================================ */

/* ---------- Constantes ---------- */
const SITE_URL = 'https://saudemundo.com.br';
const SM_STORAGE_KEY = 'sm-user-data';

/* ---------- Detecta se está dentro de /artigos/ ---------- */
const SM_IN_ARTIGOS = window.location.pathname.includes('/artigos/');
const SM_ROOT = SM_IN_ARTIGOS ? '../' : '';
function smRootHref(file) { return SM_ROOT + file; }
function smArtigoHref(file) { return SM_IN_ARTIGOS ? file : 'artigos/' + file; }

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
    `<a href="${smRootHref(p.href)}"${current === p.href ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  const navHTML = `
    <nav>
      <div class="nav-inner">
        <a href="${smRootHref('index.html')}" class="nav-logo">✦ saudemundo</a>
        <div class="nav-links">${links}</div>
        <button class="theme-btn" id="theme-btn" onclick="toggleTheme()">🌙</button>
      </div>
    </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
})();

/* ---------- Artigos do blog ---------- */
/* Para adicionar um novo artigo, basta acrescentar uma linha aqui. */
const SM_ARTIGOS = [
  { file: 'artigo-deficit-calorico.html',        icon: '📉', cat: 'Nutrição',       name: 'O que é Déficit Calórico?',                          desc: 'O guia definitivo para começar a emagrecer com saúde.' },
  { file: 'artigo-creatina.html',                 icon: '💊', cat: 'Suplementação',  name: 'Guia Prático sobre Creatina',                        desc: 'Como tomar, horários e mitos sobre o suplemento mais estudado.' },
  { file: 'artigo-guia-whey-protein.html',        icon: '🥛', cat: 'Suplementação',  name: 'Whey Protein: Guia Completo',                        desc: 'Concentrado, isolado e hidrolisado — as diferenças reais.' },
  { file: 'artigo-whey-protein-emagrece.html',    icon: '⚖️', cat: 'Emagrecimento',  name: 'Whey Protein Engorda ou Emagrece?',                  desc: 'Entenda o mito e use o suplemento como aliado na saciedade.' },
  { file: 'artigo-pre-treino.html',               icon: '⚡', cat: 'Suplementação',  name: 'Suplementos Pré-Treino: Guia Completo',              desc: 'Benefícios, riscos e como escolher o melhor pra você.' },
  { file: 'artigo-pre-pos-treino.html',           icon: '🍽️', cat: 'Nutrição',       name: 'O que Comer no Pré e Pós-Treino',                    desc: 'Abasteça suas células nos horários certos para acelerar ganhos.' },
  { file: 'artigo-sono-e-massa-muscular.html',    icon: '😴', cat: 'Estilo de Vida', name: 'Como a Falta de Sono Destrói Seus Ganhos',          desc: 'Sono ruim sabota testosterona, eleva cortisol e aumenta fome.' },
  { file: 'artigo-divisoes-de-treino.html',       icon: '🏋️', cat: 'Treino',         name: 'Como Montar Divisões de Treino',                     desc: 'Distribua seus treinos na semana respeitando o descanso ideal.' },
  { file: 'artigo-jejum-intermitente.html',       icon: '⏱️', cat: 'Nutrição',       name: 'Jejum Intermitente: Funciona Mesmo?',                desc: 'O que acontece no corpo durante o jejum e como usar a seu favor.' },
  { file: 'artigo-fontes-de-proteina.html',       icon: '🍗', cat: 'Nutrição',       name: 'Fontes de Proteína Além do Whey',                    desc: 'Tabela completa com custo-benefício e distribuição ao longo do dia.' },
  { file: 'artigo-sobrecarga-progressiva.html',   icon: '📈', cat: 'Treino',         name: 'Sobrecarga Progressiva',                             desc: 'As 6 formas de progredir no treino e sair do platô.' },
  { file: 'artigo-hipertrofia-feminina.html',     icon: '💪', cat: 'Treino',         name: 'Hipertrofia Feminina: Mitos e Verdades',             desc: 'Treino de superiores sem medo de "ficar masculinizada".' },
  { file: 'artigo-ovos-diarios.html',             icon: '🥚', cat: 'Nutrição',       name: 'Quantos Ovos Comer por Dia?',                        desc: 'O que a ciência diz sobre colesterol e consumo diário de ovos.' },
];

/* ---------- Footer HTML + seção "Artigos do Blog" ---------- */
(function injectFooter() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const container = document.querySelector('.container');

  /* --- Seção "Artigos do Blog" ---
     Por padrão, é inserida no lugar do elemento com id="sm-blog-placeholder"
     (permitindo controlar a posição na página). Se esse placeholder não
     existir, cai no comportamento antigo: anexa ao final do .container. */
  const artigosFiltrados = SM_ARTIGOS.filter(a => !(SM_IN_ARTIGOS && current === a.file));

  if (artigosFiltrados.length > 0) {
    const artigosCards = artigosFiltrados.map(a => `
      <a href="${smArtigoHref(a.file)}" class="blog-card">
        <div class="blog-card-cat">${a.cat}</div>
        <div class="blog-card-name">${a.icon} ${a.name}</div>
        <div class="blog-card-desc">${a.desc}</div>
        <span class="blog-card-cta">Ler artigo →</span>
      </a>`).join('');

    const blogSection = `
      <div class="blog-section">
        <div class="blog-title">📚 Blog SaúdeMundo</div>
        <div class="blog-sub">Aprenda mais sobre nutrição, suplementação e treino:</div>
        <div class="blog-grid">${artigosCards}</div>
      </div>`;

    const blogPlaceholder = document.getElementById('sm-blog-placeholder');
    if (blogPlaceholder) {
      blogPlaceholder.outerHTML = blogSection;
    } else if (container) {
      container.insertAdjacentHTML('beforeend', blogSection);
    }
  }

  /* --- Footer --- */
  const footerHTML = `
    <footer>
      <div class="footer-inner">
        <div class="footer-links">
          <a href="${smRootHref('sobre.html')}">Sobre Nós</a>
          <a href="${smRootHref('contato.html')}">Contato</a>
          <a href="${smRootHref('privacidade.html')}">Política de Privacidade</a>
          <a href="${smRootHref('termos.html')}">Termos de Uso</a>
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
