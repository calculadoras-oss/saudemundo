/* ============================================================
   shared.js — SaúdeMundo · Lógica compartilhada entre páginas
   Inclua no FINAL do <body> de TODAS as páginas
   ============================================================ */

/* ---------- Constantes ---------- */
const SITE_URL = 'https://saudemundo.com.br';
const SM_STORAGE_KEY = 'sm-user-data'; // dados do usuário (peso, altura, etc.)

/* ---------- Nav HTML ---------- */
/* A página atual é detectada automaticamente pela URL */
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

  // Detecta página atual
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

  // Insere antes do primeiro elemento do body
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

  // Preenche ano automaticamente em todos os spans .year-auto
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

// Aplica tema salvo ao carregar
(function applyTheme() {
  if (localStorage.getItem('sm-theme') === 'dark') {
    document.body.classList.add('dark');
    // theme-btn ainda pode não existir (injectNav roda antes, mas DOM pode não ter renderizado)
    // Usamos requestAnimationFrame para garantir
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

/* ============================================================
   DADOS DO USUÁRIO — compartilhados entre calculadoras
   ============================================================

   Como usar em qualquer calculadora:

   SALVAR (chame depois de calcular):
     smSaveUserData({ peso: 70, altura: 170, idade: 25, sexo: 'M' });

   CARREGAR (chame no início da página para preencher campos):
     smLoadUserData();   ← preenche automaticamente campos com os IDs:
                           #peso, #altura, #idade, #sexo-group (toggle)

   OBTER objeto completo:
     const d = smGetUserData(); // { peso, altura, idade, sexo, ... } ou {}
*/

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
  if (!d || !Object.keys(d).length) return; // sem dados salvos, não faz nada

  // Preenche campos comuns se existirem na página
  const fields = ['peso', 'altura', 'idade'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id]) el.value = d[id];
  });

  // Sexo (toggle group)
  if (d.sexo) {
    const btns = document.querySelectorAll('#sexo-group button');
    btns.forEach(b => {
      b.classList.toggle('active', b.textContent.trim().startsWith(d.sexo === 'M' ? 'M' : 'F'));
    });
  }

  // Atividade física (select)
  if (d.atividade) {
    const sel = document.getElementById('atividade');
    if (sel) sel.value = d.atividade;
  }
}

// Carrega dados ao iniciar (funciona em todas as páginas)
document.addEventListener('DOMContentLoaded', smLoadUserData);
