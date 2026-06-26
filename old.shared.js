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

  const isBlogIndex = SM_IN_ARTIGOS && (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html'));
  const links = pages.map(p =>
    `<a href="${smRootHref(p.href)}"${current === p.href ? ' class="active"' : ''}>${p.label}</a>`
  ).join('') + `<a href="${smRootHref('artigos/index.html')}"${isBlogIndex ? ' class="active"' : ''}>Blog</a>`;

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
  { file: 'artigo-deficit-calorico.html',        icon: '📉', cat: 'Nutrição',       name: 'O que é Déficit Calórico? O Guia Definitivo para Começar',        desc: 'Entenda o conceito biológico mais importante por trás do emagrecimento saudável e como aplicá-lo.' },
  { file: 'artigo-creatina.html',                 icon: '💊', cat: 'Suplementação',  name: 'Guia Prático sobre Creatina: Como Tomar, Horários e Mitos',        desc: 'O suplemento mais estudado do mundo. Saiba se vale a pena fazer saturação e se ela causa retenção.' },
  { file: 'artigo-guia-whey-protein.html',        icon: '🥛', cat: 'Suplementação',  name: 'Whey Protein Concentrado, Isolado e Hidrolisado: As Diferenças',   desc: 'Não jogue dinheiro fora. Aprenda as reais distinções industriais e escolha o melhor custo-benefício.' },
  { file: 'artigo-whey-protein-emagrece.html',    icon: '⚖️', cat: 'Emagrecimento',  name: 'Whey Protein Engorda ou Ajuda a Emagrecer? Descubra a Verdade',    desc: 'Entenda o grande mito e aprenda a usar o suplemento proteico como um forte aliado na saciedade.' },
  { file: 'artigo-pre-treino.html',               icon: '⚡', cat: 'Suplementação',  name: 'Suplementos Pré-Treino: Benefícios, Riscos e Como Escolher',       desc: 'Promessas de foco e explosão muscular. Analise o papel da cafeína e os cuidados com o coração.' },
  { file: 'artigo-pre-pos-treino.html',           icon: '🍽️', cat: 'Nutrição',       name: 'O que Comer no Pré e Pós-Treino para Maximizar a Hipertrofia',     desc: 'Abasteça suas células de glicogênio e aminoácidos nos horários corretos para acelerar seus ganhos.' },
  { file: 'artigo-sono-e-massa-muscular.html',    icon: '😴', cat: 'Estilo de Vida', name: 'Como a Falta de Sono Destrói Seus Ganhos de Massa Magra',          desc: 'Dormir pouco sabota seus níveis de testosterona, eleva o cortisol e aumenta sua fome por doces.' },
  { file: 'artigo-divisoes-de-treino.html',       icon: '🏋️', cat: 'Treino',         name: 'Como Montar Divisões de Treino de Musculação: Guia Prático',       desc: 'Aprenda a distribuir seus treinos na semana (ABC, AB, ABCDE) respeitando o descanso ideal.' },
  { file: 'artigo-jejum-intermitente.html',       icon: '⏱️', cat: 'Nutrição',       name: 'Jejum Intermitente: Funciona para Emagrecer e Ganhar Massa?',      desc: 'Entenda o que acontece no seu corpo durante o jejum e como usar essa estratégia a seu favor.' },
  { file: 'artigo-fontes-de-proteina.html',       icon: '🍗', cat: 'Nutrição',       name: 'Fontes de Proteína: O Guia Completo Além do Whey',                 desc: 'Tabela completa com as melhores fontes de proteína, custo-benefício e como distribuir ao longo do dia.' },
  { file: 'artigo-sobrecarga-progressiva.html',   icon: '📈', cat: 'Treino',         name: 'Sobrecarga Progressiva: O Segredo Para Nunca Parar de Crescer',    desc: 'Descubra as 6 formas de progredir no treino e por que fazer sempre o mesmo te mantém no platô.' },
  { file: 'artigo-hipertrofia-feminina.html',     icon: '💪', cat: 'Treino',         name: 'Hipertrofia Feminina: Mitos, Verdades e Treino de Superiores',     desc: 'Mulheres não ficam masculinizadas por treinar braços. Descubra como moldar a linha da cintura.' },
  { file: 'artigo-ovos-diarios.html',             icon: '🥚', cat: 'Nutrição',       name: 'Quantos Ovos Posso Comer por Dia? O Que a Ciência Diz',            desc: 'O mito do colesterol caiu. Entenda quantos ovos você pode comer com segurança todos os dias.' },
  { file: 'artigo-desenvolvimento-motor-infantil.html', icon: '🧠', cat: 'Desenvolvimento Infantil', name: 'Desenvolvimento Motor Infantil: Guia Completo da Primeira Infância', desc: 'Marcos motores por idade e como escolher a primeira atividade física do seu filho.' },
  { file: 'artigo-esporte-infantil.html',         icon: '🛹', cat: 'Desenvolvimento Infantil', name: 'Patinete e Skate na Primeira Infância: Relato de um Pai',          desc: 'A progressão real de duas crianças de 2 e 3 anos no patinete, etapa por etapa.' },
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
   /* ---------- Byline automático nas calculadoras ---------- */
(function injectByline() {
  if (SM_IN_ARTIGOS) return; // artigos já têm byline próprio no HTML

  const h1 = document.querySelector('h1');
  if (!h1) return;

  // Lê data do atributo data-date da página, ou usa data padrão
  const dateEl = document.querySelector('[data-date]');
  let dataFormatada = '14 de junho de 2026';
  if (dateEl) {
    const raw = dateEl.getAttribute('data-date');
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho',
                   'julho','agosto','setembro','outubro','novembro','dezembro'];
    const [y, m, d] = raw.split('-').map(Number);
    if (y && m && d) dataFormatada = `${d} de ${MESES[m - 1]} de ${y}`;
  }

  const byline = document.createElement('p');
  byline.className = 'article-byline';
  byline.innerHTML = `✍️ Por <a href="${smRootHref('sobre.html')}">Lucas Andrade</a> &nbsp;📅 Atualizado em ${dataFormatada}`;
  byline.style.cssText = 'font-size:.85rem;color:var(--text-muted);margin:8px 0 24px;';

  h1.insertAdjacentElement('afterend', byline);
})();
  /* ---------- Corrige "atualizado recentemente" → data real ----------
     Adicione data-date="YYYY-MM-DD" em qualquer elemento da página
     (ex: no <article> ou na <div> que contém a autoria).
     O script busca todos os elementos com esse atributo e substitui
     qualquer texto "atualizado recentemente" pela data formatada. */
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];

  document.querySelectorAll('[data-date]').forEach(el => {
    const raw = el.getAttribute('data-date'); // "YYYY-MM-DD"
    if (!raw) return;
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return;
    const formatted = `${d} de ${MESES[m - 1]} de ${y}`;
    el.innerHTML = el.innerHTML.replace(
      /atualizado\s+recentemente/gi,
      `Atualizado em ${formatted}`
    );
  });
});
