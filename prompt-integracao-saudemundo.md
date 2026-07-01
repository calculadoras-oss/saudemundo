# Tarefa: 5 melhorias de integração entre Meta Calórica / Queima Calórica / Pode-Não-Pode — site SaúdeMundo

## Contexto do site

O SaúdeMundo (saudemundo.com.br) é um site estático de calculadoras de saúde (HTML/CSS/JS puro, sem build system, sem framework, sem backend próprio — exceto um Cloudflare Worker usado só para o chat de IA da página Pode-Não-Pode). Todas as páginas incluem `shared.css` e `shared.js` no final do `<body>`. `shared.js` injeta dinamicamente a navegação, o rodapé, o tema claro/escuro, a seção "Outras Calculadoras" e gerencia dados do usuário compartilhados via `localStorage`.

Existem 13 ferramentas no site (11 calculadoras "standalone" + 3 que formam um fluxo conectado):

**Fluxo conectado (o foco desta tarefa):**
1. **`index.html`** — "Calculadora de Calorias e Macros" (a home). Calcula a meta calórica diária do usuário.
2. **`calculadora-queima-calorica.html`** — Calculadora de Queima Calórica. Calcula quantas calorias o usuário gasta em treinos (fórmula MET) e permite registrar isso num "diário de atividades do dia".
3. **`pode-nao-pode.html`** — Assistente de decisão alimentar com IA (chat). Tem um semáforo (verde/amarelo/vermelho) que avalia se cada refeição está dentro do limite proporcional da meta diária.

**Calculadoras standalone** (não fazem parte deste fluxo, não precisam ser tocadas): IMC, TMB, Água, Proteína, TDEE, Déficit Calórico, Cutting, Bulking, Macronutrientes, Calorias por Dia.

## Como os 3 módulos se conectam hoje (via localStorage)

| Chave | Formato | Quem escreve | Quem lê |
|---|---|---|---|
| `sm-user-data` | `{peso, altura, idade, sexo, atividade, ...}` | `index.html` (função `calcular()` → `smSaveUserData()`) | `calculadora-queima-calorica.html` (pré-preenche o campo peso) |
| `sm_pnp_meta_kcal` | número (string) | `index.html` (`calcular()` e `enviarParaPodeNaoPode()`) — também editável direto dentro do `pode-nao-pode.html` | `pode-nao-pode.html` e `calculadora-queima-calorica.html` (modo comparar) |
| `sm_pnp_YYYY-MM-DD` | array de `{id, nome, refeicao, kcal}` | `pode-nao-pode.html` | `pode-nao-pode.html` e `calculadora-queima-calorica.html` (para calcular saldo do dia) |
| `sm_pnp_ativ_YYYY-MM-DD` | array de `{id, nome, kcal}` | `calculadora-queima-calorica.html` | `pode-nao-pode.html` (soma ao total da meta do dia) e a própria calculadora de queima |

**O fluxo de uso ideal é:** usuário calcula a meta na home → (opcional) registra o treino do dia na calculadora de queima, o que aumenta seu orçamento calórico do dia → registra/decide refeições no Pode-Não-Pode, cujo semáforo já considera esse crédito extra.

## Problema atual (diagnosticado em sessão de debug anterior)

A integração **funciona tecnicamente** (os dados fluem corretamente entre as 3 páginas via localStorage, já testamos e confirmamos), mas tem 5 falhas de UX/produto que fazem a integração passar despercebida ou incompleta:

1. Quando o usuário registra um treino na calculadora de queima, esse crédito de calorias **nunca aparece como um item visível** no "diário" (lista "📋 Registros de hoje") do Pode-Não-Pode — ele só entra silenciosamente numa conta matemática que aumenta a meta do dia. Isso quebra a metáfora de "diário unificado": o usuário registra o treino, mas quando olha o diário não vê rastro dele em lugar nenhum.
2. Quando esse crédito é aplicado, a única pista visual disponível é um texto cinza, pequeno (`.7rem`), dentro de um parêntese, junto de outras informações na barra de progresso do dia (`"Dia: 1200 / 2248 kcal (+248 queimadas)"`). É fácil não notar.
3. A sincronização entre abas existe via evento `storage`, mas esse evento **não dispara na mesma aba** (ex: usuário navega para a calculadora de queima e volta pro Pode-Não-Pode na mesma aba) — só funciona entre abas/janelas diferentes abertas simultaneamente.
4. Não existe nenhuma identidade visual ou explicação, em nenhuma das 3 páginas, indicando que elas formam um fluxo conectado. Cada uma parece uma ferramenta isolada, com sua própria paleta de cor e badge, mesmo estando comunicando dados entre si.
5. Na home (`index.html`), depois que o usuário calcula a meta, o único CTA disponível ("🚦 Usar no Pode, Não Pode?") pula direto para o registro de refeições — não existe nenhum convite equivalente para primeiro registrar o treino do dia na calculadora de queima, então a maioria dos usuários nunca vai passar por ali.

## As 5 mudanças pedidas

### Mudança 1 — Treinos aparecem como itens no diário do Pode-Não-Pode
Em `pode-nao-pode.html`, a função `renderLista()` deve passar a exibir, junto com os registros de comida (`registros`, vindos de `carregarRegistros()`), também as atividades do dia (vindas de `carregarAtividadesQC()`, que já existe no arquivo). Requisitos:
- Cada item de treino deve ter um badge visualmente distinto dos badges de refeição (ex: `🔥 Queima`, cor laranja para diferenciar da paleta verde/azul do resto da página).
- O valor de kcal do treino deve ser exibido como crédito positivo (ex: `+248 kcal`, em verde ou laranja), não como consumo.
- Itens de treino **não devem ser editáveis/deletáveis diretamente no Pode-Não-Pode** (evita dessincronizar os dois arquivos) — em vez do botão de deletar (✕), pode ter um link discreto "editar na calculadora de queima →" apontando para `calculadora-queima-calorica.html`.
- A lista pode ordenar treinos e refeições juntos por ordem de inserção, ou separar visualmente em duas seções dentro do mesmo card ("🍽️ Refeições" e "🔥 Treinos") — escolha a abordagem que ficar mais limpa, mas mantenha tudo dentro do card único "📋 Registros de hoje" para não fragmentar a experiência.
- Ajuste o estado vazio (`empty-msg`) se necessário para refletir que a lista pode conter os dois tipos.

### Mudança 2 — Destaque visual do crédito de calorias queimadas
No mesmo arquivo `pode-nao-pode.html`, o trecho que hoje mostra `(+248 queimadas)` dentro de `bar-lbl-dia`, com `font-size:.7rem` e `color:var(--muted)`, deve virar um elemento visualmente destacado — sugestão: um chip/badge separado, com ícone 🔥, cor de destaque (ex: laranja, puxando a identidade visual da calculadora de queima), posicionado perto da barra de progresso ou do painel-topo (semáforo), e clicável — levando para `calculadora-queima-calorica.html`. Não deve mais estar escondido dentro de uma frase cinza pequena.

### Mudança 3 — Sincronização mais robusta entre as páginas
Ainda em `pode-nao-pode.html`, além do listener de `storage` que já existe no fim do arquivo, adicionar também um listener de `visibilitychange` que chama `atualizarTudo()` sempre que a aba volta a ficar visível. Isso cobre o caso mais comum na prática: usuário sai da aba do Pode-Não-Pode, vai para a calculadora de queima (mesma aba ou aba nova), registra o treino, e volta — sem precisar dar refresh manual.

```javascript
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") atualizarTudo();
});
```

### Mudança 4 — Identidade visual de "sistema conectado" nas 3 páginas
Criar um componente reutilizável — uma faixa/banner compacto tipo "stepper" com 3 etapas nomeadas (ex: "🎯 Meta → 🔥 Treino → 🚦 Refeições"), destacando visualmente em qual etapa o usuário está na página atual, com um texto curto explicando a integração (ex: "Essas 3 ferramentas trabalham juntas: sua meta calórica ajusta o semáforo de refeições, e o treino registrado aqui vira crédito extra no seu dia."). Esse componente deve ser inserido:
- No `index.html`, logo abaixo do header ou perto do card de resultado.
- No `calculadora-queima-calorica.html`, logo abaixo do header.
- No `pode-nao-pode.html`, logo abaixo do header (pode substituir ou conviver com o `<details class="conceito-caixa">` que já existe lá).

Cada etapa do stepper deve ser um link clicável para a respectiva página, com a etapa atual visualmente marcada como "ativa" (ex: preenchida/destacada) e as outras como "disponíveis" (outline/neutro). Use uma paleta de cor consistente entre as 3 páginas para esse componente especificamente (pode ser um novo tom de azul ou um gradiente neutro que não compita com as cores específicas de cada ferramenta).

### Mudança 5 — CTA duplo na home + destaque das 3 ferramentas conectadas
Duas partes:

**5a.** Em `index.html`, dentro de `.share-btns` (onde já existe o botão `btn-pnp` "🚦 Usar no Pode, Não Pode?"), adicionar um botão irmão "🔥 Registrar treino de hoje" apontando para `calculadora-queima-calorica.html`, com estilo visual equivalente (mesma altura/formato dos outros `.share-btn`, cor laranja para diferenciar). Isso garante que o usuário seja convidado a passar pela calculadora de queima antes de ir direto para o Pode-Não-Pode.

**5b.** Em `shared.js`, dentro da lista `SM_TOOLS` e da função `smRenderOtherTools()`, adicionar uma forma de marcar visualmente Queima Calórica e Pode-Não-Pode como parte do "sistema conectado" dentro da grade "Outras Calculadoras" — por exemplo adicionando uma propriedade `grupo: "conectado"` nesses dois itens do array `SM_TOOLS`, e fazendo `smRenderOtherTools()` renderizar um pequeno selo/tag (`🔗`) no card desses dois itens específicos, para diferenciá-los visualmente dos 10 outros cards que são calculadoras standalone. Não precisa reordenar a grade nem criar uma seção separada — só adicionar esse selo distintivo nos cards certos.

## Arquivos completos atuais

> Abaixo estão os 4 arquivos completos e atuais do site. Use-os como base — não invente estrutura, IDs, classes ou funções que não estejam aqui. Ao final, entregue os arquivos completos e prontos para substituir os originais (não apenas diffs), preservando tudo que não precisa mudar. Adicione comentários HTML/JS curtos (`<!-- ALTERAÇÃO: ... -->` ou `// ALTERAÇÃO: ...`) nos trechos que você modificar ou adicionar, para facilitar a revisão.

### `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7621101027712052"
     crossorigin="anonymous"></script>
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9184321382546271" crossorigin="anonymous"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<meta name="p:domain_verify" content="eca22c1874d0f893f45c2915f4d7d556"/>
<title>Calculadora de Calorias e Macros | SaúdeMundo</title>
<meta name="description" content="Calcule suas calorias diárias e macronutrientes de forma gratuita. Descubra quanto comer para emagrecer, manter ou ganhar massa.">
<meta name="keywords" content="calculadora de calorias, macronutrientes, TMB, TDEE, dieta, emagrecimento, ganho de massa">
<meta property="og:title" content="Calculadora de Calorias e Macros | SaúdeMundo">
<meta property="og:description" content="Calcule suas calorias e macros em segundos. Grátis e sem cadastro.">
<meta property="og:url" content="https://saudemundo.com.br">
<meta property="og:type" content="website">
<meta property="og:image" content="https://saudemundo.com.br/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="https://saudemundo.com.br/og-image.jpg">
<link rel="canonical" href="https://saudemundo.com.br">

<!-- FAQ UNIFICADO (substitui os dois blocos FAQPage duplicados que existiam antes) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quantas calorias devo consumir por dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Depende do seu metabolismo e nível de atividade. Use a calculadora de calorias e macros para descobrir seu número exato."
      }
    },
    {
      "@type": "Question",
      "name": "O que são macronutrientes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Macronutrientes são os três grupos principais de nutrientes: proteínas (4 kcal/g), carboidratos (4 kcal/g) e gorduras (9 kcal/g)."
      }
    },
    {
      "@type": "Question",
      "name": "O que é TMB?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TMB (Taxa Metabólica Basal) é a quantidade de calorias que seu corpo precisa em repouso completo para manter as funções vitais."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto de proteína devo consumir por dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Para quem treina, entre 1,6g e 2,2g por kg de peso corporal."
      }
    },
    {
      "@type": "Question",
      "name": "O que é déficit calórico e como calcular?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É consumir menos calorias do que você gasta. Um déficit de 500 kcal/dia resulta em aproximadamente 0,5kg de perda por semana."
      }
    },
    {
      "@type": "Question",
      "name": "Quantos litros de água devo beber por dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Em média 35ml por kg de peso, podendo variar com atividade física e clima."
      }
    },
    {
      "@type": "Question",
      "name": "Como saber se estou no peso ideal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O IMC é um dos indicadores mais usados para avaliar se o peso está adequado à altura."
      }
    },
    {
      "@type": "Question",
      "name": "Qual o melhor suplemento para quem está começando?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Creatina monohidratada e whey protein são os mais custo-benefício para iniciantes."
      }
    },
    {
      "@type": "Question",
      "name": "Pré-treino faz mal para a saúde?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Em doses adequadas é seguro para a maioria das pessoas. O recomendado é começar com metade da dose para testar a tolerância."
      }
    }
  ]
}
</script>

<script async src="https://www.googletagmanager.com/gtag/js?id=G-9EPL2XNX6H"></script>

<!-- Pinterest Tag -->
<script>
!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '2613219355683', {em: '<user_email_address>'});
pintrk('page');
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt=""
  src="https://ct.pinterest.com/v3/?event=init&tid=2613219355683&pd[em]=<hashed_email_address>&noscript=1" />
</noscript>
<!-- end Pinterest Tag -->

<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9EPL2XNX6H');</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- CSS COMPARTILHADO -->
<link rel="stylesheet" href="shared.css">

<style>
/* === CSS ESPECÍFICO DO INDEX === */
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
@media(max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.result-card { background: var(--dark2); border: 1px solid rgba(46,204,113,0.3); border-radius: var(--radius); padding: 28px; display: none; }
.result-card.show { display: block; animation: fadeIn 0.5s ease; }

.result-main { text-align: center; padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.result-label { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
.result-value { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 900; background: linear-gradient(135deg, #005C2E, var(--green-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.result-unit { font-size: 1rem; color: var(--text-muted); margin-top: 4px; }

.macro-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.macro-item { background: var(--dark3); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid var(--border); }
.macro-label { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
.macro-value { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 2px; }
.macro-value.prot { color: #C0392B; }
.macro-value.carb { color: #D35400; }
.macro-value.fat  { color: #2471A3; }
.macro-sub { font-size: 11px; color: var(--text-muted); }

.chart-card { background: var(--dark2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; margin-bottom: 24px; display: none; }
.chart-card.show { display: block; }
.chart-wrap { position: relative; height: 240px; }

.share-section { margin-top: 20px; }
.share-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; text-align: center; }
.share-btns { display: flex; gap: 10px; flex-wrap: wrap; }
.share-btn { flex: 1; min-width: 120px; border: none; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 12px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.share-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
.btn-whatsapp { background: #25D366; color: white; }
.btn-copy { background: var(--dark3); color: var(--text); border: 1px solid var(--border); }
.btn-pnp { background: #16a34a; color: white; }
.btn-pnp:hover { background: #15803d; }

.ai-card { background: var(--dark2); border: 1px solid rgba(46,204,113,0.2); border-radius: var(--radius); padding: 28px; margin-bottom: 24px; display: none; }
.ai-card.show { display: block; }
.ai-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.ai-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #005C2E, var(--green-dark)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.ai-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--green-dark); }
body.dark .ai-title { color: var(--green); }
.ai-subtitle { font-size: 12px; color: var(--text-muted); }

/* Artigos */
.articles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.article-card { background: var(--dark2); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; text-decoration: none; transition: all 0.3s; display: block; }
.article-card:hover { border-color: var(--green-dark); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(26,158,82,0.1); }
.article-category { display: inline-block; background: rgba(46,204,113,0.12); color: var(--green-dark); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; margin-bottom: 12px; }
body.dark .article-category { color: var(--green); }
.article-card h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: var(--text); line-height: 1.4; margin-bottom: 8px; }
.article-card p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }
.btn-read { display: inline-block; margin-top: 4px; font-size: 13px; color: var(--green-dark); font-weight: 600; text-decoration: none; transition: color 0.2s; }
.btn-read:hover { color: var(--green); text-decoration: underline; }
body.dark .btn-read { color: var(--green); }

/* Afiliados */
.aff-section { background: var(--dark2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; margin-bottom: 24px; }
.aff-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--green-dark); margin-bottom: 6px; }
body.dark .aff-title { color: var(--green); }
.aff-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
.aff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.aff-card { background: var(--dark3); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-align: center; text-decoration: none; transition: all 0.3s; display: block; }
.aff-card:hover { border-color: var(--green-dark); transform: translateY(-2px); }
.aff-name { font-weight: 600; color: var(--text); font-size: 0.95rem; margin-bottom: 4px; }
.aff-benefit { font-size: 12px; color: var(--green-dark); margin-bottom: 10px; }
body.dark .aff-benefit { color: var(--green); }
.aff-cta { display: inline-block; background: linear-gradient(135deg, #005C2E, var(--green-dark)); color: white; border-radius: 6px; font-size: 12px; font-weight: 700; padding: 6px 14px; }
</style>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculadora de Calorias e Macros - SaúdeMundo",
  "url": "https://saudemundo.com.br/",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Any",
  "description": "Calcule suas calorias diárias e macronutrientes de forma gratuita. Descubra quanto comer para emagrecer, manter ou ganhar massa.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  },
  "author": {
    "@type": "Person",
    "name": "Lucas Andrade"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SaúdeMundo",
    "url": "https://saudemundo.com.br/"
  }
}
</script>
</head>
<body>
<div class="bg-grid"></div>

<!-- NAV É INJETADO PELO shared.js -->

<header>
  <div class="badge">✦ saudemundo · Nutrição & Saúde</div>
  <h1>Calculadora de<br>Calorias e Macros</h1>
  <p class="subtitle">Descubra quantas calorias você precisa por dia e qual o split ideal de proteínas, carboidratos e gorduras para o seu objetivo.</p>
</header>

<div class="container">
  <div class="author-box">
    <span>✍️ Por <a href="sobre.html">Lucas Andrade</a></span>
    <span>📅 Atualizado em 14 de junho de 2026</span>
  </div>
  <div class="grid">
    <div class="card">
      <div class="card-title">🥗 Seus dados pessoais</div>
      <div class="field">
        <label>Sexo</label>
        <div class="toggle-group" id="sexo-group">
          <button class="active" onclick="setSexo('M',this)">Masculino</button>
          <button onclick="setSexo('F',this)">Feminino</button>
        </div>
      </div>
      <div class="field"><label>Idade (anos)</label><div class="input-row"><input type="number" id="idade" placeholder="25" min="10" max="100" value="25"></div></div>
      <div class="field"><label>Peso (kg)</label><div class="input-row"><span class="input-prefix">kg</span><input type="number" id="peso" placeholder="70" min="30" max="300" value="70"></div></div>
      <div class="field"><label>Altura (cm)</label><div class="input-row"><span class="input-prefix">cm</span><input type="number" id="altura" placeholder="170" min="100" max="250" value="170"></div></div>
      <div class="field">
        <label>Nível de atividade física</label>
        <div class="input-row">
          <select id="atividade">
            <option value="1.2">Sedentário (pouco ou nenhum exercício)</option>
            <option value="1.375">Levemente ativo (1-3x por semana)</option>
            <option value="1.55" selected>Moderadamente ativo (3-5x por semana)</option>
            <option value="1.725">Muito ativo (6-7x por semana)</option>
            <option value="1.9">Extremamente ativo (atleta / 2x ao dia)</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Objetivo</label>
        <div class="toggle-group" id="objetivo-group">
          <button onclick="setObjetivo('emagrecer',this)">Emagrecer</button>
          <button class="active" onclick="setObjetivo('manter',this)">Manter</button>
          <button onclick="setObjetivo('ganhar',this)">Ganhar massa</button>
        </div>
      </div>
      <button class="btn-calc" onclick="calcular()">Calcular minhas metas →</button>
    </div>

    <div>
      <div class="result-card" id="result-card">
        <div class="result-main">
          <div class="result-label">Meta calórica diária</div>
          <div class="result-value" id="res-calorias">0</div>
          <div class="result-unit">kcal / dia</div>
        </div>
        <div class="macro-grid">
          <div class="macro-item"><div class="macro-label">Proteína</div><div class="macro-value prot" id="res-prot">0g</div><div class="macro-sub" id="res-prot-kcal">0 kcal</div></div>
          <div class="macro-item"><div class="macro-label">Carboidrato</div><div class="macro-value carb" id="res-carb">0g</div><div class="macro-sub" id="res-carb-kcal">0 kcal</div></div>
          <div class="macro-item"><div class="macro-label">Gordura</div><div class="macro-value fat" id="res-fat">0g</div><div class="macro-sub" id="res-fat-kcal">0 kcal</div></div>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><div class="meta-item-label">🔥 TMB (repouso)</div><div class="meta-item-value" id="res-tmb">—</div></div>
          <div class="meta-item"><div class="meta-item-label">⚡ TDEE (total)</div><div class="meta-item-value" id="res-tdee">—</div></div>
          <div class="meta-item"><div class="meta-item-label">💪 Proteína/kg</div><div class="meta-item-value" id="res-prot-kg">—</div></div>
          <div class="meta-item"><div class="meta-item-label">🎯 Objetivo</div><div class="meta-item-value" id="res-objetivo">—</div></div>
        </div>
        <div class="share-section">
          <div class="share-title">✦ Compartilhe seu resultado</div>
          <div class="share-btns">
            <button class="share-btn btn-whatsapp" onclick="shareWhatsApp()">📱 WhatsApp</button>
            <button class="share-btn btn-copy" onclick="copyLink()">📋 Copiar link</button>
            <button class="share-btn btn-pnp" onclick="enviarParaPodeNaoPode()">🚦 Usar no Pode, Não Pode?</button>
          </div>
        </div>
      </div>
      <div id="result-placeholder" class="card" style="text-align:center;padding:60px 28px;">
        <div style="font-size:48px;margin-bottom:16px;">🥗</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--green-dark);margin-bottom:8px;">Seus resultados aparecerão aqui</div>
        <div style="font-size:13px;color:var(--text-muted);">Preencha seus dados e clique em calcular</div>
      </div>
    </div>
  </div>

  <div class="chart-card" id="chart-card">
    <div class="section-title">🥧 Distribuição de Macronutrientes</div>
    <div class="chart-wrap"><canvas id="macroChart"></canvas></div>
  </div>

  <div class="ai-card" id="ai-card">
    <div class="ai-header">
      <div class="ai-icon">🤖</div>
      <div><div class="ai-title">Consultor Nutricional IA</div><div class="ai-subtitle">Analise sua dieta com inteligência artificial</div></div>
    </div>
    <div style="background:var(--dark3);border-radius:12px;padding:20px;font-size:0.95rem;line-height:1.7;color:var(--text);margin-bottom:16px;">
      Seus dados nutricionais estão prontos! Clique abaixo para abrir o ChatGPT com suas metas já preenchidas e receber orientações personalizadas. 💡
    </div>
    <button class="btn-calc" onclick="abrirChatGPT()" style="background:linear-gradient(135deg,#10a37f,#1a7f64);margin-top:0;">💬 Analisar com ChatGPT →</button>
  </div>

  <div class="card">
    <h2 class="section-title">🔥 Como Calcular Suas Calorias</h2>
    <p style="line-height:1.8;color:var(--text-muted);">A quantidade de calorias que você precisa por dia depende de vários fatores: peso, altura, idade, sexo e nível de atividade física. Nossa calculadora usa a fórmula de Mifflin-St Jeor, considerada a mais precisa atualmente, para calcular sua Taxa Metabólica Basal (TMB) e seu Gasto Total de Energia Diário (TDEE).</p>
    <p style="line-height:1.8;color:var(--text-muted);margin-top:12px;">A partir do TDEE, ajustamos as calorias de acordo com seu objetivo: para emagrecer aplicamos um déficit de 500 kcal, para manter o peso usamos o TDEE exato, e para ganhar massa adicionamos 300 kcal ao TDEE.</p>
  </div>

  <div class="card">
    <h2 class="section-title">🥩 O Que São Macronutrientes?</h2>
    <p style="line-height:1.8;color:var(--text-muted);">Macronutrientes são os três grupos principais de nutrientes que fornecem energia ao corpo: <strong style="color:var(--text)">proteínas</strong> (constroem e reparam músculos — 4 kcal/g), <strong style="color:var(--text)">carboidratos</strong> (principal fonte de energia — 4 kcal/g) e <strong style="color:var(--text)">gorduras</strong> (hormônios e absorção de vitaminas — 9 kcal/g).</p>
    <p style="line-height:1.8;color:var(--text-muted);margin-top:12px;">A distribuição ideal entre os três varia conforme seu objetivo. Quem quer emagrecer se beneficia de mais proteína para preservar massa muscular. Quem quer ganhar massa precisa de mais carboidratos para energia nos treinos.</p>
  </div>

  <!-- ARTIGOS -->
  <div id="sm-blog-placeholder"></div>


  <!-- FAQ -->
  <div class="section-title">❓ Perguntas Frequentes</div>
  <div class="faq-section">
    <div class="faq-item"><div class="faq-q">Quantas calorias devo consumir por dia?</div><div class="faq-a">Depende do seu metabolismo e nível de atividade. Use a calculadora acima para descobrir seu número exato. <a href="#top">Calcular agora ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">Quanto de proteína devo consumir por dia?</div><div class="faq-a">Para quem treina, entre 1,6g e 2,2g por kg de peso corporal. <a href="calculadora-proteina.html">Use nossa calculadora de proteína ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">O que é déficit calórico e como calcular?</div><div class="faq-a">É consumir menos calorias do que você gasta. Um déficit de 500 kcal/dia resulta em aproximadamente 0,5kg de perda por semana. <a href="#top">Simular meu déficit ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">Quantos litros de água devo beber por dia?</div><div class="faq-a">Em média 35ml por kg de peso, podendo variar com atividade física e clima. <a href="calculadora-agua.html">Calcule sua hidratação ideal ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">Como saber se estou no peso ideal?</div><div class="faq-a">O IMC é um dos indicadores mais usados. <a href="calculadora-imc.html">Calcule seu IMC agora ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">Qual o melhor suplemento para quem está começando?</div><div class="faq-a">Creatina monohidratada e whey protein são os mais custo-benefício para iniciantes. <a href="artigos/artigo-guia-whey-protein.html">Saiba mais sobre whey ➔</a></div></div>
    <div class="faq-item"><div class="faq-q">Pré-treino faz mal para a saúde?</div><div class="faq-a">Em doses adequadas é seguro para a maioria. Comece com metade da dose para testar tolerância. <a href="artigos/artigo-pre-treino.html">Leia o artigo completo ➔</a></div></div>
  </div>

  <div class="section-title">🛠️ Outras Calculadoras</div>
  <div class="tools-grid">
    <a href="calculadora-imc.html" class="tool-card"><div class="tool-icon">⚖️</div><div class="tool-name">Calculadora de IMC</div><div class="tool-desc">Descubra seu Índice de Massa Corporal e o que ele significa para sua saúde.</div></a>
    <a href="calculadora-agua.html" class="tool-card"><div class="tool-icon">💧</div><div class="tool-name">Calculadora de Água</div><div class="tool-desc">Descubra quantos litros de água você deve beber por dia.</div></a>
    <a href="calculadora-deficit-calorico.html" class="tool-card"><div class="tool-icon">📉</div><div class="tool-name">Déficit Calórico</div><div class="tool-desc">Calcule seu déficit e o tempo estimado para atingir seu peso ideal.</div></a>
    <a href="calculadora-cutting.html" class="tool-card"><div class="tool-icon">✂️</div><div class="tool-name">Cutting</div><div class="tool-desc">Planejamento completo para fase de cutting com preservação muscular.</div></a>
    <a href="calculadora-bulking.html" class="tool-card"><div class="tool-icon">💪</div><div class="tool-name">Bulking</div><div class="tool-desc">Planejamento de ganho de massa com controle de gordura.</div></a>
  </div>
</div>

<!-- JS COMPARTILHADO (nav, footer, tema, localStorage) -->
<script src="shared.js"></script>

<!-- JS ESPECÍFICO DO INDEX -->
<script>
let sexo = 'M', objetivo = 'manter', chartInstance = null, lastResult = null;

function setSexo(s, btn) {
  sexo = s;
  document.getElementById('sexo-group').querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setObjetivo(o, btn) {
  objetivo = o;
  document.getElementById('objetivo-group').querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function fmt(v) { return Math.round(v).toLocaleString('pt-BR'); }

function calcular() {
  const peso    = parseFloat(document.getElementById('peso').value)    || 70;
  const altura  = parseFloat(document.getElementById('altura').value)  || 170;
  const idade   = parseInt(document.getElementById('idade').value)     || 25;
  const fator   = parseFloat(document.getElementById('atividade').value) || 1.55;

  // Salva dados do usuário para outras calculadoras
  smSaveUserData({ peso, altura, idade, sexo, atividade: String(fator) });

  let tmb = sexo === 'M'
    ? 10 * peso + 6.25 * altura - 5 * idade + 5
    : 10 * peso + 6.25 * altura - 5 * idade - 161;

  const tdee = tmb * fator;
  let meta = tdee;
  if (objetivo === 'emagrecer') meta = tdee - 500;
  if (objetivo === 'ganhar')    meta = tdee + 300;
  meta = Math.round(meta);

  let protPct, carbPct, fatPct;
  if (objetivo === 'emagrecer')     { protPct = 0.40; carbPct = 0.30; fatPct = 0.30; }
  else if (objetivo === 'ganhar')   { protPct = 0.30; carbPct = 0.45; fatPct = 0.25; }
  else                              { protPct = 0.30; carbPct = 0.40; fatPct = 0.30; }

  const protKcal = Math.round(meta * protPct);
  const carbKcal = Math.round(meta * carbPct);
  const fatKcal  = Math.round(meta * fatPct);
  const protG    = Math.round(protKcal / 4);
  const carbG    = Math.round(carbKcal / 4);
  const fatG     = Math.round(fatKcal  / 9);
  const protKg   = (protG / peso).toFixed(1);
  const objLabel = objetivo === 'emagrecer' ? 'Emagrecimento' : objetivo === 'ganhar' ? 'Ganho de massa' : 'Manutenção';

  lastResult = { meta, tmb: Math.round(tmb), tdee: Math.round(tdee), protG, carbG, fatG, protKcal, carbKcal, fatKcal, protKg, objLabel };

  document.getElementById('res-calorias').textContent   = fmt(meta);
  document.getElementById('res-prot').textContent       = protG + 'g';
  document.getElementById('res-carb').textContent       = carbG + 'g';
  document.getElementById('res-fat').textContent        = fatG  + 'g';
  document.getElementById('res-prot-kcal').textContent  = protKcal + ' kcal';
  document.getElementById('res-carb-kcal').textContent  = carbKcal + ' kcal';
  document.getElementById('res-fat-kcal').textContent   = fatKcal  + ' kcal';
  document.getElementById('res-tmb').textContent        = fmt(tmb)  + ' kcal';
  document.getElementById('res-tdee').textContent       = fmt(tdee) + ' kcal';
  document.getElementById('res-prot-kg').textContent    = protKg    + 'g/kg';
  document.getElementById('res-objetivo').textContent   = objLabel;

  document.getElementById('result-card').classList.add('show');
  document.getElementById('result-placeholder').style.display = 'none';
  renderChart(protKcal, carbKcal, fatKcal);
  document.getElementById('ai-card').classList.add('show');

  // Salva a meta calculada (já considera emagrecer/manter/ganhar) para o
  // "Pode, Não Pode?" usar caso o usuário clique no botão de envio.
  try { localStorage.setItem('sm_pnp_meta_kcal', String(meta)); } catch(e) {}
}

function renderChart(p, c, f) {
  document.getElementById('chart-card').classList.add('show');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('macroChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['Proteína', 'Carboidrato', 'Gordura'], datasets: [{ data: [p, c, f], backgroundColor: ['#C0392B', '#D35400', '#2471A3'], borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { labels: { color: '#4A6A4A', font: { family: 'DM Sans', size: 13 }, padding: 20 } }, tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' kcal' } } } }
  });
}

function abrirChatGPT() {
  if (!lastResult) return;
  const { meta, tmb, tdee, protG, carbG, fatG, objLabel } = lastResult;
  const prompt = `Você é um nutricionista. Analise esses dados:\n\n- Objetivo: ${objLabel}\n- Meta calórica: ${meta} kcal/dia\n- TMB: ${tmb} kcal\n- TDEE: ${tdee} kcal\n- Proteína: ${protG}g/dia\n- Carboidrato: ${carbG}g/dia\n- Gordura: ${fatG}g/dia\n\nPor favor: 1) Avalie se é um bom plano, 2) Sugira 3 alimentos para bater cada macro, 3) Dê 2 dicas práticas.`;
  window.open('https://chat.openai.com/?q=' + encodeURIComponent(prompt), '_blank');
}

function shareWhatsApp() {
  if (!lastResult) return;
  const { meta, protG, carbG, fatG, objLabel } = lastResult;
  const txt = `🥗 Calculei minhas metas no SaúdeMundo!\n🎯 Objetivo: ${objLabel}\n🔥 Calorias: ${fmt(meta)} kcal/dia\n💪 Proteína: ${protG}g | 🍚 Carb: ${carbG}g | 🥑 Gordura: ${fatG}g\n\nCalcule as suas: ${SITE_URL}`;
  window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(txt), '_blank');
}

function enviarParaPodeNaoPode() {
  if (!lastResult) {
    alert('Calcule sua meta primeiro!');
    return;
  }
  try { localStorage.setItem('sm_pnp_meta_kcal', String(lastResult.meta)); } catch(e) {}
  window.location.href = 'pode-nao-pode.html';
}
</script>
</body>
</html>
```

### `calculadora-queima-calorica.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calculadora de Queima Calórica – Quantas Calorias Você Gasta no Treino | SaúdeMundo</title>
  <meta name="description" content="Calcule quantas calorias você queima em musculação, corrida, spinning, yoga e outras atividades. Compare duas opções de treino e veja qual fecha melhor sua conta calórica do dia." />
  <link rel="canonical" href="https://www.saudemundo.com.br/calculadora-queima-calorica.html" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9EPL2XNX6H"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-9EPL2XNX6H');
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="shared.css" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Calculadora de Queima Calórica",
    "url": "https://www.saudemundo.com.br/calculadora-queima-calorica.html",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "description": "Calcule quantas calorias você gasta em musculação, corrida, ciclismo, spinning, yoga e outras atividades físicas, com base no seu peso e na duração do treino.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
    "author": { "@type": "Person", "name": "Lucas Andrade", "url": "https://www.saudemundo.com.br/sobre.html" },
    "publisher": { "@type": "Organization", "name": "SaúdeMundo", "url": "https://www.saudemundo.com.br" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "dateModified": "2026-07-01",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Como é calculado o gasto calórico do treino?",
        "acceptedAnswer": { "@type": "Answer", "text": "Usamos a fórmula científica MET: calorias = MET x peso (kg) x tempo (horas). O MET é um número padronizado que representa a intensidade de cada atividade. Por exemplo, uma pessoa de 70kg pedalando 30 minutos em ritmo moderado (MET 6,8) queima aproximadamente 6,8 x 70 x 0,5 = 238 kcal." }
      },
      {
        "@type": "Question",
        "name": "O ritmo da corrida (pace) muda o total de calorias?",
        "acceptedAnswer": { "@type": "Answer", "text": "Menos do que parece. O gasto calórico da corrida depende principalmente da distância percorrida, não da velocidade. Por isso, na corrida usamos a distância como base do cálculo, e o pace serve só para estimar quanto tempo o treino levou." }
      },
      {
        "@type": "Question",
        "name": "Por que a musculação tem duas opções de intensidade?",
        "acceptedAnswer": { "@type": "Answer", "text": "O gasto de um treino de força varia bastante conforme o volume e o tempo de descanso entre séries. Musculação moderada (MET 3,5) representa treinos com descansos mais longos; musculação intensa (MET 6,0) representa treinos com pouco descanso e ritmo elevado, como circuitos." }
      },
      {
        "@type": "Question",
        "name": "Como funciona a comparação entre duas atividades?",
        "acceptedAnswer": { "@type": "Answer", "text": "A calculadora lê sua meta diária e o quanto você já registrou no Pode, Não Pode. A partir disso, calcula seu saldo calórico atual e mostra qual das duas opções de treino deixa esse saldo mais próximo ou dentro da meta." }
      },
      {
        "@type": "Question",
        "name": "Essa calculadora substitui a orientação de um educador físico?",
        "acceptedAnswer": { "@type": "Answer", "text": "Não. Os valores são estimativas baseadas em tabelas científicas de referência (MET) e servem como apoio educacional. Para um plano de treino individualizado, consulte um educador físico ou profissional de saúde." }
      }
    ]
  }
  </script>

  <style>
    :root {
      --qc-verde:   var(--green, #16a34a);
      --qc-verde-bg:#f0fdf4; --qc-verde-brd:#86efac;
      --qc-laranja: #ea580c; --qc-laranja-bg:#fff7ed; --qc-laranja-brd:#fed7aa;
      --qc-azul:    #2563eb; --qc-azul-bg:#eff6ff; --qc-azul-brd:#bfdbfe;
      --qc-brd:     var(--border-color,#e2e8f0);
      --qc-surface: var(--card-bg,#ffffff);
      --qc-text:    var(--text-primary,#1a1a1a);
      --qc-muted:   var(--text-secondary,#64748b);
      --qc-radius:  14px;
    }

    .qc-header { text-align:center; padding:2rem 1rem 0; }
    .qc-badge {
      display:inline-flex; align-items:center; gap:.45rem;
      font-size:.7rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
      color:var(--qc-laranja); background:var(--qc-laranja-bg); padding:.28rem .8rem;
      border-radius:20px; margin-bottom:.8rem;
    }
    .qc-header h1 {
      font-family:'Playfair Display',serif; font-weight:900;
      font-size:clamp(1.8rem,5vw,2.6rem); letter-spacing:-.02em;
      margin:0 0 .3rem; line-height:1.05;
    }
    .qc-header h1 em { font-style:normal; color:var(--qc-laranja); }
    .qc-tagline { font-size:.88rem; color:var(--qc-muted); max-width:440px; margin:0 auto 1.5rem; line-height:1.5; }

    .container { max-width:660px; margin:0 auto; padding:0 1rem 3rem; }

    .qc-card { background:var(--qc-surface); border:1px solid var(--qc-brd); border-radius:var(--qc-radius); padding:1.2rem; margin-bottom:.9rem; }
    .qc-card-title { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--qc-laranja); margin-bottom:.85rem; }

    .qc-row { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin-bottom:.7rem; }
    .qc-row label { font-size:.8rem; font-weight:600; color:var(--qc-muted); white-space:nowrap; min-width:110px; }
    .qc-row select, .qc-row input[type="number"] {
      flex:1; min-width:120px; padding:.55rem .7rem; border:1.5px solid var(--qc-brd); border-radius:8px;
      font-size:.9rem; background:transparent; color:var(--qc-text);
    }
    .qc-peso-link { font-size:.75rem; color:var(--qc-laranja); text-decoration:none; white-space:nowrap; }
    .qc-peso-link:hover { text-decoration:underline; }

    .qc-pills { display:flex; gap:.5rem; margin-bottom:.9rem; background:var(--qc-surface); border:1px solid var(--qc-brd); border-radius:var(--qc-radius); padding:.6rem .8rem; }
    .qc-pill {
      flex:1; text-align:center; padding:.5rem .5rem; border-radius:8px; border:1.5px solid var(--qc-brd);
      font-size:.82rem; font-weight:600; cursor:pointer; transition:all .2s; color:var(--qc-muted); background:transparent; line-height:1.25;
    }
    .qc-pill.ativo { background:var(--qc-laranja-bg); border-color:var(--qc-laranja-brd); color:var(--qc-laranja); }

    .qc-corrida-extra { display:none; }
    .qc-corrida-extra.show { display:flex; }

    .qc-resultado {
      display:none; text-align:center; padding:1.1rem; border-radius:var(--qc-radius);
      background:var(--qc-laranja-bg); border:1px solid var(--qc-laranja-brd); margin-bottom:.8rem;
    }
    .qc-resultado.show { display:block; }
    .qc-resultado .qc-kcal { font-size:2rem; font-weight:900; color:var(--qc-laranja); font-family:'Playfair Display',serif; line-height:1; }
    .qc-resultado .qc-kcal-label { font-size:.78rem; color:var(--qc-muted); margin-top:.2rem; }
    .qc-resultado .qc-formula { font-size:.72rem; color:var(--qc-muted); margin-top:.5rem; }

    .btn-qc {
      display:inline-block; padding:.6rem 1.1rem; background:var(--qc-laranja); color:#fff; border:none;
      border-radius:10px; font-size:.85rem; font-weight:700; cursor:pointer; transition:background .2s;
    }
    .btn-qc:hover { background:#c2410c; }
    .btn-qc:disabled { background:#94a3b8; cursor:not-allowed; }
    .btn-qc-outline {
      display:inline-block; padding:.6rem 1.1rem; background:transparent; color:var(--qc-laranja);
      border:1.5px solid var(--qc-laranja-brd); border-radius:10px; font-size:.85rem; font-weight:700; cursor:pointer;
    }

    /* Lista do dia */
    .qc-lista-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
    .qc-item { display:flex; align-items:center; gap:.5rem; padding:.55rem 0; border-bottom:1px solid var(--qc-brd); font-size:.86rem; }
    .qc-item:last-child { border-bottom:none; }
    .qc-item-nome { flex:1; font-weight:600; color:var(--qc-text); }
    .qc-item-kcal { font-weight:700; color:var(--qc-laranja); white-space:nowrap; }
    .qc-item-del { background:none; border:none; color:var(--qc-muted); cursor:pointer; font-size:.9rem; padding:.1rem .25rem; }
    .qc-item-del:hover { color:#dc2626; }
    .qc-empty { text-align:center; color:var(--qc-muted); font-size:.85rem; padding:1.2rem 0; }
    .qc-total-dia { text-align:right; font-size:.85rem; font-weight:700; color:var(--qc-laranja); margin-top:.4rem; }

    /* Comparação */
    .qc-compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; margin-bottom:.8rem; }
    @media (max-width:520px) { .qc-compare-grid { grid-template-columns:1fr; } }
    .qc-opcao { border:1.5px solid var(--qc-brd); border-radius:10px; padding:.8rem; }
    .qc-opcao-titulo { font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--qc-muted); margin-bottom:.6rem; }
    .qc-opcao select, .qc-opcao input { width:100%; margin-bottom:.5rem; padding:.5rem .6rem; border:1.5px solid var(--qc-brd); border-radius:8px; font-size:.85rem; background:transparent; color:var(--qc-text); }

    .qc-saldo-box {
      font-size:.82rem; color:var(--qc-muted); background:#f8fafc; border:1px solid var(--qc-brd);
      border-radius:10px; padding:.6rem .8rem; margin-bottom:.8rem; line-height:1.6;
    }
    .qc-saldo-box strong { color:var(--qc-text); }

    .qc-compare-result { display:none; }
    .qc-compare-result.show { display:block; }
    .qc-compare-linha { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px dashed var(--qc-brd); font-size:.86rem; }
    .qc-compare-linha:last-child { border-bottom:none; }
    .qc-vencedora { background:var(--qc-verde-bg); border:1px solid var(--qc-verde-brd); border-radius:10px; padding:.7rem .9rem; margin-top:.6rem; font-size:.86rem; color:#15803d; font-weight:600; }

    /* Editorial / FAQ (fallback caso shared.css não cubra) */
    .editorial { font-size:.9rem; line-height:1.75; color:var(--qc-text); }
    .editorial h2 { font-family:'Playfair Display',serif; font-size:1.25rem; margin:2rem 0 .65rem; }
    .editorial p { margin:0 0 .85rem; }
    .card-title { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--qc-laranja); margin-bottom:.9rem; }
    .faq-item { padding:.85rem 0; border-bottom:1px solid var(--qc-brd); }
    .faq-item:last-child { border-bottom:none; }
    .faq-q { font-weight:600; font-size:.88rem; margin-bottom:.28rem; }
    .faq-a { font-size:.84rem; color:var(--qc-muted); line-height:1.6; }

    [data-theme="dark"] .qc-badge { background:#3b1a00; }
    [data-theme="dark"] .qc-resultado { background:#3b1a00; border-color:#7c2d12; }
    [data-theme="dark"] .qc-saldo-box { background:#1a1a1a; border-color:#2d2d2d; }
    [data-theme="dark"] .qc-vencedora { background:#052e16; border-color:#166534; }
  </style>
</head>
<body>

<header class="qc-header">
  <div class="qc-badge">🔥 SaúdeMundo · Gasto calórico</div>
  <h1>Calculadora de <em>Queima</em> Calórica</h1>
  <p class="qc-tagline">Descubra quantas calorias você gasta no treino — e compare duas opções para saber qual fecha melhor a conta do seu dia.</p>
</header>

<main class="container">

  <!-- Peso -->
  <div class="qc-card">
    <div class="qc-card-title">⚖️ Seu peso</div>
    <div class="qc-row" style="margin-bottom:0;">
      <label for="peso">Peso (kg):</label>
      <input type="number" id="peso" placeholder="ex: 70" min="20" max="300" oninput="onPesoChange()" />
      <a href="index.html" class="qc-peso-link">Não sabe sua meta? Calcule aqui →</a>
    </div>
  </div>

  <!-- Seletor de modo -->
  <div class="qc-pills">
    <button class="qc-pill" id="pill-registrar" onclick="setModoQC('registrar')">📊 Registrar atividade</button>
    <button class="qc-pill" id="pill-comparar" onclick="setModoQC('comparar')">⚖️ Comparar duas opções</button>
  </div>

  <!-- ===================== MODO REGISTRAR ===================== -->
  <div id="bloco-registrar">
    <div class="qc-card">
      <div class="qc-card-title">📊 Qual atividade você fez?</div>

      <div class="qc-row">
        <label for="ativ-select">Atividade:</label>
        <select id="ativ-select" onchange="onAtividadeChange('ativ')"></select>
      </div>

      <div class="qc-row" id="ativ-duracao-row">
        <label for="ativ-duracao">Duração (min):</label>
        <input type="number" id="ativ-duracao" min="1" max="600" placeholder="ex: 45" />
      </div>

      <div class="qc-row qc-corrida-extra" id="ativ-corrida-extra">
        <label for="ativ-distancia">Distância (km):</label>
        <input type="number" id="ativ-distancia" min="0.5" max="100" step="0.1" placeholder="ex: 10" />
      </div>
      <div class="qc-row qc-corrida-extra" id="ativ-pace-extra">
        <label for="ativ-pace">Pace (min/km):</label>
        <input type="number" id="ativ-pace" min="2" max="15" step="0.1" placeholder="ex: 5.5" />
      </div>

      <button class="btn-qc" onclick="calcularAtividade()">🔥 Calcular</button>

      <div class="qc-resultado" id="ativ-resultado">
        <div class="qc-kcal" id="ativ-kcal-valor">0 kcal</div>
        <div class="qc-kcal-label" id="ativ-kcal-detalhe"></div>
        <div class="qc-formula" id="ativ-formula"></div>
        <div style="margin-top:.9rem;">
          <button class="btn-qc" onclick="adicionarAoDia()">✅ Adicionar ao dia</button>
        </div>
      </div>
    </div>

    <!-- Lista do dia -->
    <div class="qc-card">
      <div class="qc-lista-header">
        <div class="qc-card-title" style="margin:0;">📋 Atividades de hoje</div>
        <button class="qc-item-del" style="border:1px solid var(--qc-brd);border-radius:6px;padding:.2rem .5rem;font-size:.72rem;" onclick="limparAtividadesDia()">🗑 Limpar</button>
      </div>
      <div id="lista-atividades"></div>
      <div class="qc-total-dia" id="total-atividades-dia"></div>
      <p style="font-size:.78rem;color:var(--qc-muted);margin-top:.7rem;">
        Essas calorias entram automaticamente como crédito extra no seu semáforo de hoje.
      </p>
      <div style="text-align:center;margin-top:1rem;">
        <a href="pode-nao-pode.html" class="btn-qc" style="text-decoration:none;">🚦 Ver no Pode, Não Pode →</a>
      </div>
    </div>
  </div>

  <!-- ===================== MODO COMPARAR ===================== -->
  <div id="bloco-comparar" style="display:none;">
    <div class="qc-card">
      <div class="qc-card-title">⚖️ O que treinar hoje?</div>
      <div class="qc-saldo-box" id="qc-saldo-info">Calculando seu saldo do dia…</div>

      <div class="qc-compare-grid">
        <div class="qc-opcao">
          <div class="qc-opcao-titulo">Opção A</div>
          <select id="op-a-select" onchange="onAtividadeChange('op-a')"></select>
          <input type="number" id="op-a-duracao" placeholder="Duração (min)" min="1" max="600">
          <input type="number" id="op-a-distancia" class="qc-corrida-extra" placeholder="Distância (km)" min="0.5" step="0.1">
          <input type="number" id="op-a-pace" class="qc-corrida-extra" placeholder="Pace (min/km)" min="2" step="0.1">
        </div>
        <div class="qc-opcao">
          <div class="qc-opcao-titulo">Opção B</div>
          <select id="op-b-select" onchange="onAtividadeChange('op-b')"></select>
          <input type="number" id="op-b-duracao" placeholder="Duração (min)" min="1" max="600">
          <input type="number" id="op-b-distancia" class="qc-corrida-extra" placeholder="Distância (km)" min="0.5" step="0.1">
          <input type="number" id="op-b-pace" class="qc-corrida-extra" placeholder="Pace (min/km)" min="2" step="0.1">
        </div>
      </div>

      <button class="btn-qc" onclick="compararOpcoes()">⚖️ Comparar</button>

      <div class="qc-compare-result" id="qc-compare-result">
        <div class="qc-compare-linha"><span>Opção A</span><strong id="cmp-a-txt">—</strong></div>
        <div class="qc-compare-linha"><span>Opção B</span><strong id="cmp-b-txt">—</strong></div>
        <div class="qc-vencedora" id="qc-vencedora"></div>
      </div>
    </div>
  </div>

  <!-- Editorial -->
  <div class="editorial">
    <h2>🔥 Como funciona o cálculo</h2>
    <p>
      Usamos a fórmula do <strong>MET</strong> (Equivalente Metabólico), uma medida padronizada e usada
      cientificamente para estimar o gasto de qualquer atividade: <em>calorias = MET × peso (kg) × tempo (horas)</em>.
      Uma pessoa de 70kg pedalando 30 minutos em ritmo moderado (MET 6,8) queima aproximadamente
      6,8 × 70 × 0,5 = <strong>238 kcal</strong>.
    </p>
    <p>
      Para a <strong>corrida</strong> usamos uma lógica um pouco diferente: em vez de depender do ritmo (pace),
      o gasto calórico acompanha principalmente a <strong>distância</strong> percorrida — correr 10km gasta
      praticamente o mesmo total de calorias em qualquer ritmo razoável, porque o corpo percorre a mesma
      distância. Por isso pedimos a distância, e usamos o pace apenas para estimar a duração do treino.
    </p>
    <p>
      Depois de calcular, você pode somar as calorias direto na sua conta do dia no
      <a href="pode-nao-pode.html">Pode, Não Pode?</a> — assim o semáforo considera o que você comeu
      <em>e</em> o que você já queimou. Se ainda não calculou sua meta diária, comece pela
      <a href="index.html">Calculadora de Calorias e Macros</a>.
    </p>
    <p style="font-size:.82rem;color:var(--qc-muted);">
      ⚠️ Ferramenta educacional. Valores são estimativas baseadas em tabelas MET de referência.
      Para um plano de treino individualizado, consulte um educador físico ou médico.
    </p>
  </div>

  <!-- FAQ -->
  <div class="qc-card">
    <div class="card-title">❓ Perguntas Frequentes</div>
    <div class="faq-section">
      <div class="faq-item">
        <div class="faq-q">Como é calculado o gasto calórico do treino?</div>
        <div class="faq-a">Usamos a fórmula MET: calorias = MET × peso (kg) × tempo (horas). Uma pessoa de 70kg pedalando 30 minutos em ritmo moderado (MET 6,8) queima aproximadamente 238 kcal.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">O ritmo da corrida (pace) muda o total de calorias?</div>
        <div class="faq-a">Menos do que parece. O gasto depende principalmente da distância percorrida, não da velocidade. O pace é usado só para estimar a duração do treino.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Por que a musculação tem duas opções de intensidade?</div>
        <div class="faq-a">O gasto varia com o volume e o descanso entre séries. Moderada (MET 3,5) representa descansos mais longos; intensa (MET 6,0) representa treinos com pouco descanso, como circuitos.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Como funciona a comparação entre duas atividades?</div>
        <div class="faq-a">A calculadora lê sua meta diária e o que você já registrou no Pode, Não Pode, calcula seu saldo atual e mostra qual opção de treino deixa esse saldo mais próximo ou dentro da meta.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Essa calculadora substitui a orientação de um educador físico?</div>
        <div class="faq-a">Não. Os valores são estimativas baseadas em tabelas científicas de referência (MET). Para um plano individualizado, consulte um educador físico ou profissional de saúde.</div>
      </div>
    </div>
  </div>

  <div id="sm-blog-placeholder"></div>
</main>

<script src="shared.js"></script>
<script>
const HOJE = new Date().toISOString().slice(0,10);
const ATIV_KEY = "sm_pnp_ativ_" + HOJE;      // lido futuramente pelo Pode, Não Pode
const DIARIO_KEY = "sm_pnp_" + HOJE;          // registros de comida do Pode, Não Pode
const META_KEY = "sm_pnp_meta_kcal";

// Tabela MET (Compendium of Physical Activities, valores aproximados)
const ATIVIDADES = {
  musc_mod:   { label: "🏋️ Musculação (moderada)",        met: 3.5 },
  musc_int:   { label: "🏋️ Musculação (intensa/circuito)", met: 6.0 },
  corrida:    { label: "🏃 Corrida (por distância)",        met: null }, // especial
  caminh_len: { label: "🚶 Caminhada lenta (~3km/h)",       met: 2.8 },
  caminh_rap: { label: "🚶 Caminhada rápida (~6km/h)",      met: 4.3 },
  ciclismo_l: { label: "🚴 Ciclismo leve (<16km/h)",        met: 4.0 },
  ciclismo_m: { label: "🚴 Ciclismo moderado (16–19km/h)",  met: 6.8 },
  spinning:   { label: "🚴 Spinning / bike indoor",         met: 8.5 },
  yoga:       { label: "🧘 Yoga",                           met: 2.5 },
  pilates:    { label: "🧘 Pilates",                        met: 3.0 },
  natacao:    { label: "🏊 Natação (moderada)",             met: 6.0 },
  danca:      { label: "💃 Dança",                          met: 4.8 },
  futebol:    { label: "⚽ Futebol recreativo",             met: 7.0 },
  hiit:       { label: "⚡ HIIT / treino funcional intenso", met: 8.0 },
};

let modoQC = "registrar";
let ultimoCalculo = null; // { nome, kcal }

document.addEventListener("DOMContentLoaded", () => {
  preencherSelects();
  atualizarVisuaisModo();
  renderListaAtividades();

  const ud = smGetUserData();
  if (ud && ud.peso) document.getElementById("peso").value = ud.peso;
});

function onPesoChange() {
  const v = parseFloat(document.getElementById("peso").value) || 0;
  if (v > 0) smSaveUserData({ peso: v });
}

function preencherSelects() {
  const opts = Object.entries(ATIVIDADES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join("");
  ["ativ-select","op-a-select","op-b-select"].forEach(id => {
    document.getElementById(id).innerHTML = opts;
  });
  onAtividadeChange("ativ");
  onAtividadeChange("op-a");
  onAtividadeChange("op-b");
}

function onAtividadeChange(prefix) {
  const select = document.getElementById(prefix === "ativ" ? "ativ-select" : prefix + "-select");
  const key = select.value;
  const isCorrida = key === "corrida";

  if (prefix === "ativ") {
    document.getElementById("ativ-duracao-row").style.display = isCorrida ? "none" : "flex";
    document.getElementById("ativ-corrida-extra").classList.toggle("show", isCorrida);
    document.getElementById("ativ-pace-extra").classList.toggle("show", isCorrida);
  } else {
    document.getElementById(prefix + "-duracao").style.display = isCorrida ? "none" : "block";
    document.getElementById(prefix + "-distancia").classList.toggle("show", isCorrida);
    document.getElementById(prefix + "-pace").classList.toggle("show", isCorrida);
  }
}

function getPeso() {
  return parseFloat(document.getElementById("peso").value) || 0;
}

// Calcula kcal para uma atividade dada (usado no registro simples e na comparação)
function calcularKcal(chave, duracaoMin, distanciaKm, paceMinKm, peso) {
  if (!peso || peso <= 0) return null;

  if (chave === "corrida") {
    if (!distanciaKm || distanciaKm <= 0) return null;
    const kcal = Math.round(1.036 * peso * distanciaKm);
    const duracaoEstimada = paceMinKm > 0 ? Math.round(distanciaKm * paceMinKm) : null;
    return { kcal, duracaoMin: duracaoEstimada, formula: `1,036 × ${peso}kg × ${distanciaKm}km` };
  }

  const met = ATIVIDADES[chave] ? ATIVIDADES[chave].met : null;
  if (!met || !duracaoMin || duracaoMin <= 0) return null;
  const horas = duracaoMin / 60;
  const kcal = Math.round(met * peso * horas);
  return { kcal, duracaoMin, formula: `${met} MET × ${peso}kg × ${horas.toFixed(2)}h` };
}

function calcularAtividade() {
  const peso = getPeso();
  const chave = document.getElementById("ativ-select").value;
  const duracao = parseFloat(document.getElementById("ativ-duracao").value) || 0;
  const distancia = parseFloat(document.getElementById("ativ-distancia").value) || 0;
  const pace = parseFloat(document.getElementById("ativ-pace").value) || 0;

  if (!peso) { alert("Informe seu peso primeiro."); return; }

  const r = calcularKcal(chave, duracao, distancia, pace, peso);
  if (!r) { alert("Preencha os campos da atividade selecionada."); return; }

  const nomeAtividade = ATIVIDADES[chave].label.replace(/^\S+\s/, ""); // remove emoji do nome salvo
  ultimoCalculo = { nome: nomeAtividade, kcal: r.kcal };

  document.getElementById("ativ-kcal-valor").textContent = r.kcal + " kcal";
  document.getElementById("ativ-kcal-detalhe").textContent = r.duracaoMin
    ? "≈ " + r.duracaoMin + " min de " + nomeAtividade
    : nomeAtividade;
  document.getElementById("ativ-formula").textContent = "Cálculo: " + r.formula;
  document.getElementById("ativ-resultado").classList.add("show");
}

function adicionarAoDia() {
  if (!ultimoCalculo) return;
  const atividades = carregarAtividades();
  atividades.push({ id: Date.now(), nome: ultimoCalculo.nome, kcal: ultimoCalculo.kcal });
  salvarAtividades(atividades);
  renderListaAtividades();
  document.getElementById("ativ-resultado").classList.remove("show");
  if (typeof showToast === "function") showToast("✅ " + ultimoCalculo.kcal + " kcal adicionadas ao dia!");
  ultimoCalculo = null;
}

function carregarAtividades() {
  try { const r = localStorage.getItem(ATIV_KEY); return r ? JSON.parse(r) : []; }
  catch(e) { return []; }
}
function salvarAtividades(arr) {
  try { localStorage.setItem(ATIV_KEY, JSON.stringify(arr)); } catch(e) {}
}

function renderListaAtividades() {
  const atividades = carregarAtividades();
  const el = document.getElementById("lista-atividades");
  if (!atividades.length) {
    el.innerHTML = '<div class="qc-empty">Nenhuma atividade registrada hoje.</div>';
    document.getElementById("total-atividades-dia").textContent = "";
    return;
  }
  el.innerHTML = atividades.map(a =>
    `<div class="qc-item">
      <span class="qc-item-nome">${a.nome}</span>
      <span class="qc-item-kcal">-${a.kcal} kcal</span>
      <button class="qc-item-del" onclick="removerAtividade(${a.id})" title="Remover">✕</button>
    </div>`
  ).join("");
  const total = atividades.reduce((s,a) => s + a.kcal, 0);
  document.getElementById("total-atividades-dia").textContent = "Total queimado hoje: " + total + " kcal";
}

function removerAtividade(id) {
  const atividades = carregarAtividades().filter(a => a.id !== id);
  salvarAtividades(atividades);
  renderListaAtividades();
}

function limparAtividadesDia() {
  if (!confirm("Limpar todas as atividades de hoje?")) return;
  salvarAtividades([]);
  renderListaAtividades();
}

// ── Modo ──
function setModoQC(modo) {
  modoQC = modo;
  atualizarVisuaisModo();
  if (modo === "comparar") atualizarSaldoInfo();
}

function atualizarVisuaisModo() {
  document.getElementById("pill-registrar").className = "qc-pill" + (modoQC === "registrar" ? " ativo" : "");
  document.getElementById("pill-comparar").className  = "qc-pill" + (modoQC === "comparar" ? " ativo" : "");
  document.getElementById("bloco-registrar").style.display = modoQC === "registrar" ? "block" : "none";
  document.getElementById("bloco-comparar").style.display  = modoQC === "comparar"  ? "block" : "none";
}

// ── Comparar ──
function totalConsumidoHoje() {
  try {
    const r = localStorage.getItem(DIARIO_KEY);
    const registros = r ? JSON.parse(r) : [];
    return registros.reduce((s,x) => s + (x.kcal||0), 0);
  } catch(e) { return 0; }
}
function getMeta() {
  try { return parseInt(localStorage.getItem(META_KEY)) || 0; } catch(e) { return 0; }
}
function totalQueimadoHoje() {
  return carregarAtividades().reduce((s,a) => s + (a.kcal||0), 0);
}

function atualizarSaldoInfo() {
  const meta = getMeta();
  const consumido = totalConsumidoHoje();
  const queimado = totalQueimadoHoje();
  const box = document.getElementById("qc-saldo-info");

  if (!meta) {
    box.innerHTML = "Você ainda não definiu sua meta diária no <a href='pode-nao-pode.html' style='color:var(--qc-laranja);'>Pode, Não Pode</a>. Sem meta, comparamos só o gasto calórico bruto de cada opção.";
    return;
  }
  const saldo = meta - consumido + queimado;
  box.innerHTML = "Meta: <strong>" + meta + " kcal</strong> · Consumido hoje: <strong>" + consumido + " kcal</strong>"
    + (queimado > 0 ? " · Já queimado hoje: <strong>" + queimado + " kcal</strong>" : "")
    + "<br>Saldo atual: <strong>" + (saldo >= 0 ? saldo + " kcal disponíveis" : Math.abs(saldo) + " kcal acima da meta") + "</strong>";
}

function lerOpcao(prefix) {
  const chave = document.getElementById(prefix + "-select").value;
  const duracao = parseFloat(document.getElementById(prefix + "-duracao").value) || 0;
  const distancia = parseFloat(document.getElementById(prefix + "-distancia").value) || 0;
  const pace = parseFloat(document.getElementById(prefix + "-pace").value) || 0;
  return { chave, duracao, distancia, pace };
}

function compararOpcoes() {
  const peso = getPeso();
  if (!peso) { alert("Informe seu peso primeiro."); return; }

  const a = lerOpcao("op-a");
  const b = lerOpcao("op-b");
  const ra = calcularKcal(a.chave, a.duracao, a.distancia, a.pace, peso);
  const rb = calcularKcal(b.chave, b.duracao, b.distancia, b.pace, peso);

  if (!ra || !rb) { alert("Preencha os campos das duas opções."); return; }

  const nomeA = ATIVIDADES[a.chave].label;
  const nomeB = ATIVIDADES[b.chave].label;

  document.getElementById("cmp-a-txt").textContent = nomeA + ": " + ra.kcal + " kcal";
  document.getElementById("cmp-b-txt").textContent = nomeB + ": " + rb.kcal + " kcal";

  const meta = getMeta();
  let veredicto;
  if (meta) {
    const consumido = totalConsumidoHoje();
    const queimadoJa = totalQueimadoHoje();
    const saldoAtual = meta - consumido + queimadoJa;
    const saldoA = saldoAtual + ra.kcal;
    const saldoB = saldoAtual + rb.kcal;
    const melhor = saldoA >= saldoB ? "A" : "B";
    const nomeMelhor = melhor === "A" ? nomeA : nomeB;
    const saldoMelhor = melhor === "A" ? saldoA : saldoB;
    veredicto = "✅ " + nomeMelhor + " fecha melhor sua conta hoje: seu saldo vai para "
      + (saldoMelhor >= 0 ? saldoMelhor + " kcal disponíveis." : Math.abs(saldoMelhor) + " kcal acima da meta, mesmo assim.");
  } else {
    const melhor = ra.kcal >= rb.kcal ? "A" : "B";
    const nomeMelhor = melhor === "A" ? nomeA : nomeB;
    veredicto = "🔥 " + nomeMelhor + " queima mais calorias no total (defina sua meta para uma comparação considerando o que você já comeu).";
  }

  document.getElementById("qc-vencedora").textContent = veredicto;
  document.getElementById("qc-compare-result").classList.add("show");
  atualizarSaldoInfo();
}
</script>
</body>
</html>
```

### `pode-nao-pode.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pode, Não Pode? – Assistente de Decisão Alimentar | SaúdeMundo</title>
  <meta name="description" content="Antes de comer: compare opções e tome a melhor decisão. Depois de comer: registre e acompanhe. IA que te ajuda a escolher, não só a contar calorias." />
  <link rel="canonical" href="https://www.saudemundo.com.br/pode-nao-pode.html" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9EPL2XNX6H"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-9EPL2XNX6H');
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="shared.css" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Pode, Não Pode? – Assistente de Decisão Alimentar",
    "url": "https://www.saudemundo.com.br/pode-nao-pode.html",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "description": "IA que ajuda você a decidir o que vale a pena comer — antes e depois de comer. Semáforo inteligente por refeição.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
    "author": { "@type": "Person", "name": "Lucas Andrade", "url": "https://www.saudemundo.com.br/sobre.html" },
    "publisher": { "@type": "Organization", "name": "SaúdeMundo", "url": "https://www.saudemundo.com.br" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "dateModified": "2026-06-29",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Posso usar antes de comer para decidir o pedido?",
        "acceptedAnswer": { "@type": "Answer", "text": "Sim, esse é o uso principal. Pergunte 'vale a pena pedir o X ou o Y?' e a IA compara o impacto de cada opção na sua meta e recomenda a melhor escolha." }
      },
      {
        "@type": "Question",
        "name": "Como funciona o semáforo por refeição?",
        "acceptedAnswer": { "@type": "Answer", "text": "Cada refeição tem um limite proporcional da meta diária: café da manhã 20%, almoço 35%, jantar 20%, lanches 10% cada e ceia 5%. O semáforo avalia se aquela refeição específica está dentro do esperado." }
      },
      {
        "@type": "Question",
        "name": "Preciso selecionar alimentos em uma lista?",
        "acceptedAnswer": { "@type": "Answer", "text": "Não. Escreva como quiser: 'vale mais o frango ou o hambúrguer?', 'comi uma concha de feijão com arroz'. A IA entende e responde na hora." }
      },
      {
        "@type": "Question",
        "name": "Os dados ficam salvos se eu fechar o celular?",
        "acceptedAnswer": { "@type": "Answer", "text": "Sim. Tudo fica salvo localmente no dispositivo. Reabra no mesmo navegador no mesmo dia e os dados estarão lá. Ao virar a meia-noite os registros são zerados." }
      },
      {
        "@type": "Question",
        "name": "O Pode, Não Pode substitui um nutricionista?",
        "acceptedAnswer": { "@type": "Answer", "text": "Não. É uma ferramenta educacional de acompanhamento. Para dietas individualizadas, consulte um nutricionista ou médico." }
      }
    ]
  }
  </script>

  <style>
    :root {
      --verde:   #16a34a; --verde-bg: #f0fdf4; --verde-brd: #86efac;
      --amarelo: #d97706; --amar-bg:  #fffbeb; --amar-brd:  #fde68a;
      --verm:    #dc2626; --verm-bg:  #fef2f2; --verm-brd:  #fca5a5;
      --azul:    #2563eb; --azul-bg:  #eff6ff; --azul-brd:  #bfdbfe;
      --brd:     var(--border-color,#e2e8f0);
      --surface: var(--card-bg,#ffffff);
      --text:    var(--text-primary,#1a1a1a);
      --muted:   var(--text-secondary,#64748b);
      --radius:  14px;
    }

    /* ── Header ── */
    .pnp-header { text-align:center; padding:2rem 1rem 0; }
    .pnp-badge {
      display:inline-flex; align-items:center; gap:.45rem;
      font-size:.7rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
      color:var(--verde); background:#f0fdf4; padding:.28rem .8rem;
      border-radius:20px; margin-bottom:.8rem;
    }
    .mini-sinal { display:inline-flex; flex-direction:column; gap:2px; }
    .mini-sinal span { width:6px;height:6px;border-radius:50%;display:block; }
    .ms-r{background:#dc2626;} .ms-y{background:#d97706;} .ms-g{background:#16a34a;}
    .pnp-header h1 {
      font-family:'Playfair Display',serif; font-weight:900;
      font-size:clamp(1.8rem,5vw,2.6rem); letter-spacing:-.02em;
      margin:0 0 .3rem; line-height:1.05;
    }
    .pnp-header h1 em { font-style:normal; color:var(--verde); }
    .pnp-tagline { font-size:.88rem; color:var(--muted); max-width:400px; margin:0 auto 1.5rem; line-height:1.5; }

    .container { max-width:660px; margin:0 auto; padding:0 1rem 3rem; }

    /* ── Semáforo compacto ── */
    .painel-topo {
      display:flex; align-items:center; gap:.6rem;
      background:var(--surface); border:1px solid var(--brd);
      border-radius:var(--radius); padding:.5rem .8rem; margin-bottom:.5rem;
    }
    .sinal-mini { display:flex; flex-direction:row; gap:4px; flex-shrink:0; }
    .luz-mini { width:10px; height:10px; border-radius:50%; background:#e2e8f0; transition:background .4s,box-shadow .4s; }
    .sinal-ativo-verde   .luz-mini-verde   { background:var(--verde);   box-shadow:0 0 8px 2px #86efac; }
    .sinal-ativo-amarelo .luz-mini-amarelo { background:var(--amarelo); box-shadow:0 0 8px 2px #fde68a; }
    .sinal-ativo-verm    .luz-mini-verm    { background:var(--verm);    box-shadow:0 0 8px 2px #fca5a5; }
    .sinal-info { flex:1; min-width:0; }
    .sinal-veredicto { font-weight:700; font-size:.9rem; color:#94a3b8; transition:color .4s; line-height:1.1; }
    .sinal-ativo-verde   .sinal-veredicto { color:var(--verde); }
    .sinal-ativo-amarelo .sinal-veredicto { color:var(--amarelo); }
    .sinal-ativo-verm    .sinal-veredicto { color:var(--verm); }
    .sinal-detalhe { display:none; }

    /* ── Barra ── */
    .bar-wrap { margin-bottom:1rem; }
    .bar-bg { height:6px; background:var(--brd); border-radius:99px; overflow:hidden; }
    .bar-fill { height:100%; border-radius:99px; background:var(--verde); transition:width .4s,background .4s; width:0%; }
    .bar-fill.amarelo { background:var(--amarelo); }
    .bar-fill.vermelho { background:var(--verm); }
    .bar-labels { display:flex; justify-content:space-between; font-size:.7rem; color:var(--muted); margin-bottom:.25rem; }
    .bar-chips { display:flex; gap:1rem; margin-top:.35rem; flex-wrap:wrap; }
    .bar-chips .chip-mini { font-size:.7rem; }

    /* ── Cards ── */
    .pnp-card { background:var(--surface); border:1px solid var(--brd); border-radius:var(--radius); padding:1.2rem; margin-bottom:.9rem; }
    .pnp-card-title { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--verde); margin-bottom:.85rem; }

    /* ── Meta ── */
    .meta-toggle { display:flex; align-items:center; justify-content:space-between; cursor:pointer; user-select:none; }
    .meta-toggle-label { font-size:.8rem; font-weight:600; color:var(--muted); }
    .meta-toggle-icon { font-size:.8rem; color:var(--muted); transition:transform .2s; }
    .meta-toggle-icon.aberto { transform:rotate(180deg); }
    .meta-corpo { margin-top:.8rem; display:none; }
    .meta-corpo.aberto { display:block; }
    .meta-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .meta-row label { font-size:.88rem; font-weight:500; white-space:nowrap; }
    .meta-row input[type="number"] { width:110px; padding:.5rem .7rem; border:1.5px solid var(--brd); border-radius:8px; font-size:1rem; background:transparent; color:var(--text); }
    .meta-link { font-size:.8rem; color:var(--verde); text-decoration:none; }
    .meta-link:hover { text-decoration:underline; }
    .meta-destaque { background:var(--verde-bg); border-color:var(--verde-brd); }
    .meta-destaque .meta-toggle-label { color:var(--verde); }

    /* ── Modo pills ── */
    .modo-pills {
      display:flex; gap:.5rem; margin-bottom:.9rem;
      background:var(--surface); border:1px solid var(--brd);
      border-radius:var(--radius); padding:.6rem .8rem;
      align-items:center;
    }
    .modo-label { font-size:.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-right:.2rem; white-space:nowrap; }
    .modo-pill {
      flex:1; text-align:center; padding:.45rem .5rem;
      border-radius:8px; border:1.5px solid var(--brd);
      font-size:.8rem; font-weight:600; cursor:pointer;
      transition:all .2s; color:var(--muted); background:transparent;
      line-height:1.2;
    }
    .modo-pill.ativo-decisao { background:var(--azul-bg); border-color:var(--azul-brd); color:var(--azul); }
    .modo-pill.ativo-registro { background:var(--verde-bg); border-color:var(--verde-brd); color:var(--verde); }
    .modo-hint {
      font-size:.72rem; color:var(--muted); margin-bottom:.6rem;
      padding:.35rem .7rem; border-radius:8px;
      border:1px dashed var(--brd); background:#fafafa;
      line-height:1.4;
    }
    .modo-hint.hint-decisao { background:var(--azul-bg); border-color:var(--azul-brd); color:#1d4ed8; }
    .modo-hint.hint-registro { background:var(--verde-bg); border-color:var(--verde-brd); color:#15803d; }

    /* ── Seletor refeição ── */
    .chat-refeicao-row { display:flex; align-items:center; gap:.6rem; margin-bottom:.7rem; flex-wrap:wrap; }
    .chat-refeicao-row label { font-size:.8rem; font-weight:600; color:var(--muted); white-space:nowrap; }
    .chat-refeicao-row select { flex:1; padding:.45rem .7rem; border:1.5px solid var(--brd); border-radius:8px; font-size:.88rem; background:transparent; color:var(--text); cursor:pointer; }

    .limite-refeicao { font-size:.75rem; color:var(--muted); margin-bottom:.6rem; background:#f8fafc; border-radius:8px; padding:.4rem .7rem; border:1px solid var(--brd); }
    .limite-refeicao strong { color:var(--text); }

    /* ── Exemplos chips ── */
    .chat-exemplos { display:flex; flex-wrap:wrap; gap:.35rem; margin-bottom:.65rem; }
    .chip-ex {
      font-size:.72rem; border-radius:20px; padding:.18rem .6rem; cursor:pointer; transition:background .15s;
      border:1px solid; line-height:1.4;
    }
    .chip-ex-decisao { background:var(--azul-bg); color:var(--azul); border-color:var(--azul-brd); }
    .chip-ex-decisao:hover { background:#dbeafe; }
    .chip-ex-registro { background:#f0fdf4; color:var(--verde); border-color:var(--verde-brd); }
    .chip-ex-registro:hover { background:#dcfce7; }
    .chips-titulo { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--muted); width:100%; margin-top:.35rem; margin-bottom:.1rem; }

    /* ── Chat ── */
    .chat-mensagens {
      min-height:160px; max-height:320px; overflow-y:auto;
      border:1.5px solid var(--brd); border-radius:10px;
      padding:.75rem; margin-bottom:.7rem;
      display:flex; flex-direction:column; gap:.55rem;
      background:#fafafa; scroll-behavior:smooth;
    }
    .msg { max-width:92%; padding:.55rem .8rem; border-radius:12px; font-size:.87rem; line-height:1.5; }
    .msg-ia      { background:var(--verde-bg); border:1px solid var(--verde-brd); color:var(--text); align-self:flex-start; border-radius:4px 12px 12px 12px; }
    .msg-ia.decisao { background:var(--azul-bg); border-color:var(--azul-brd); }
    .msg-user    { background:var(--verde); color:#fff; align-self:flex-end; border-radius:12px 4px 12px 12px; }
    .msg-user.decisao { background:var(--azul); }
    .msg-erro    { background:var(--verm-bg); border:1px solid var(--verm-brd); color:var(--verm); align-self:flex-start; border-radius:4px 12px 12px 12px; }
    .msg-digitando { background:#f1f5f9; color:var(--muted); align-self:flex-start; border-radius:4px 12px 12px 12px; font-style:italic; font-size:.8rem; padding:.45rem .8rem; }

    .btn-lancar { display:inline-block; margin-top:.45rem; padding:.38rem .85rem; background:var(--verde); color:#fff; border:none; border-radius:8px; font-size:.78rem; font-weight:700; cursor:pointer; transition:background .2s; }
    .btn-lancar:hover { background:#15803d; }

    /* ── Input ── */
    .chat-input-row { display:flex; gap:.45rem; align-items:flex-end; }
    .chat-input {
      flex:1; padding:.7rem .9rem; border:2px solid var(--verde); border-radius:10px;
      font-size:.95rem; font-family:'DM Sans',sans-serif;
      background:transparent; color:var(--text);
      resize:none; min-height:46px; max-height:100px; outline:none; line-height:1.4;
      transition:border-color .2s, box-shadow .2s;
    }
    .chat-input.modo-decisao { border-color:var(--azul); }
    .chat-input.modo-decisao:focus { border-color:#1d4ed8; box-shadow:0 0 0 3px #bfdbfe; }
    .chat-input:focus { border-color:#15803d; box-shadow:0 0 0 3px #bbf7d0; }
    .chat-input::placeholder { color:#bbb; }
    .btn-enviar {
      padding:.7rem 1rem; background:var(--verde); color:#fff; border:none; border-radius:10px;
      font-size:1.1rem; cursor:pointer; transition:background .2s,transform .1s; align-self:flex-end; line-height:1;
    }
    .btn-enviar.modo-decisao { background:var(--azul); }
    .btn-enviar.modo-decisao:hover { background:#1d4ed8; }
    .btn-enviar:hover  { background:#15803d; }
    .btn-enviar:active { transform:scale(.96); }
    .btn-enviar:disabled { background:#94a3b8; cursor:not-allowed; }
    .btn-foto {
      padding:.7rem .8rem; background:var(--surface); border:1px solid var(--brd);
      border-radius:10px; font-size:1.1rem; cursor:pointer;
      transition:background .2s; align-self:flex-end; line-height:1; flex-shrink:0;
    }
    .btn-foto:hover { background:var(--brd); }
    .btn-foto:disabled { opacity:.5; cursor:not-allowed; }
    .btn-foto-label { font-size:.65rem; display:block; line-height:1; color:var(--muted); }

    /* ── Registros ── */
    .reg-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
    .btn-limpar { font-size:.72rem; color:var(--verm); background:none; border:1px solid var(--verm); border-radius:6px; padding:.22rem .55rem; cursor:pointer; }
    .btn-limpar:hover { background:var(--verm-bg); }
    .reg-item { display:flex; align-items:flex-start; gap:.45rem; padding:.6rem 0; border-bottom:1px solid var(--brd); font-size:.86rem; }
    .reg-item:last-child { border-bottom:none; }
    .reg-badge { flex-shrink:0; font-size:.6rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:.15rem .38rem; border-radius:5px; margin-top:.15rem; }
    .b-cafe{background:#fff3e0;color:#c2410c;} .b-lanche1{background:#f3e5f5;color:#7e22ce;}
    .b-almoco{background:#eff6ff;color:#1d4ed8;} .b-lanche2{background:#f3e5f5;color:#7e22ce;}
    .b-jantar{background:#eef2ff;color:#3730a3;} .b-ceia{background:#fdf2f8;color:#9d174d;}
    .reg-info { flex:1; }
    .reg-nome { font-weight:600; color:var(--text); font-size:.86rem; }
    .reg-kcal { font-weight:700; white-space:nowrap; color:var(--text); padding-top:.1rem; font-size:.86rem; }
    .reg-del  { background:none; border:none; color:var(--muted); cursor:pointer; padding:.1rem .25rem; font-size:.9rem; }
    .reg-del:hover { color:var(--verm); }
    .empty-msg { text-align:center; color:var(--muted); font-size:.85rem; padding:1.5rem 0; line-height:1.7; }

    /* ── Editorial ── */
    .editorial { font-size:.9rem; line-height:1.75; color:var(--text); }
    .editorial h2 { font-family:'Playfair Display',serif; font-size:1.25rem; margin:2rem 0 .65rem; }
    .editorial p  { margin:0 0 .85rem; }
    .card-title { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--verde); margin-bottom:.9rem; }
    .faq-item { padding:.85rem 0; border-bottom:1px solid var(--brd); }
    .faq-item:last-child { border-bottom:none; }
    .faq-q { font-weight:600; font-size:.88rem; margin-bottom:.28rem; }
    .faq-a { font-size:.84rem; color:var(--muted); line-height:1.6; }

    /* ── Conceito (analogia do extrato bancário) ── */
    .pnp-intro {
      text-align: center;
      font-size: .92rem;
      color: var(--muted);
      max-width: 480px;
      margin: .5rem auto 1.2rem;
      line-height: 1.6;
      padding: 0 1rem;
    }
    .conceito-caixa {
      margin: 12px auto 16px;
      padding: 12px 16px;
      border: 1px solid var(--azul, #3b82f6);
      border-radius: 10px;
      background: #eff6ff;
      max-width: 480px;
    }
    .conceito-caixa summary {
      cursor: pointer;
      font-weight: 600;
      color: var(--azul, #3b82f6);
      list-style: none;
    }
    .conceito-caixa summary::-webkit-details-marker {
      display: none;
    }
    .conceito-caixa[open] summary {
      margin-bottom: 8px;
    }
    .conceito-caixa p {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.5;
      color: var(--text);
      text-align: left;
    }

    /* ── Dark mode ── */
    [data-theme="dark"] .pnp-badge { background:#052e16; }
    [data-theme="dark"] .painel-topo { border-color:#2d2d2d; }
    [data-theme="dark"] .luz-mini { background:#2d2d2d; }
    [data-theme="dark"] .chat-mensagens { background:#111; border-color:#2d2d2d; }
    [data-theme="dark"] .msg-ia { background:#052e16; border-color:#166534; }
    [data-theme="dark"] .msg-ia.decisao { background:#0c1d3d; border-color:#1e40af; }
    [data-theme="dark"] .msg-digitando { background:#1e1e1e; }
    [data-theme="dark"] .chip-ex-registro { background:#052e16; border-color:#166534; }
    [data-theme="dark"] .chip-ex-decisao { background:#0c1d3d; border-color:#1e40af; }
    [data-theme="dark"] .limite-refeicao { background:#1a1a1a; border-color:#2d2d2d; }
    [data-theme="dark"] .meta-destaque { background:#052e16; border-color:#166534; }
    [data-theme="dark"] .modo-hint.hint-decisao { background:#0c1d3d; color:#93c5fd; border-color:#1e40af; }
    [data-theme="dark"] .modo-hint.hint-registro { background:#052e16; color:#86efac; border-color:#166534; }
    [data-theme="dark"] .modo-pills { border-color:#2d2d2d; }
    [data-theme="dark"] .modo-pill.ativo-decisao { background:#0c1d3d; border-color:#1e40af; color:#93c5fd; }
    [data-theme="dark"] .modo-pill.ativo-registro { background:#052e16; border-color:#166534; color:#86efac; }
    [data-theme="dark"] .b-cafe{background:#3b1a00;color:#fb923c;}
    [data-theme="dark"] .b-lanche1,[data-theme="dark"] .b-lanche2{background:#2e0059;color:#d8b4fe;}
    [data-theme="dark"] .b-almoco{background:#0c1d3d;color:#93c5fd;}
    [data-theme="dark"] .b-jantar{background:#0f0d2e;color:#a5b4fc;}
    [data-theme="dark"] .b-ceia{background:#2d0030;color:#f9a8d4;}
    [data-theme="dark"] .modo-hint { background:#1a1a1a; border-color:#2d2d2d; }
    [data-theme="dark"] .btn-foto { border-color:#2d2d2d; }
    [data-theme="dark"] .conceito-caixa { background:#0c1d3d; }
  </style>
</head>
<body>

<header class="pnp-header">
  <div class="pnp-badge">
    <span class="mini-sinal"><span class="ms-r"></span><span class="ms-y"></span><span class="ms-g"></span></span>
    SaúdeMundo · Decisão alimentar
  </div>
  <h1><em>Pode,</em> Não Pode?</h1>
  <p class="pnp-tagline">Assistente de decisão alimentar com IA</p>
   <details class="conceito-caixa">
    <summary>💡 Entenda o conceito</summary>
    <p>Pense nas calorias como dinheiro. Cada refeição é um depósito. Cada gasto de energia — do coração batendo ao treino na academia — é um saque. No fim do dia, o corpo fecha as contas: depositou mais do que gastou, o saldo vira reserva (gordura). Gastou mais do que depositou, o corpo usa as reservas guardadas (você emagrece). O <strong>Pode, Não Pode?</strong> é o seu extrato em tempo real: antes de fazer o próximo "gasto", você já sabe se o saldo do dia aguenta.</p>
  </details>
</header>
<p class="pnp-intro">Me diga o que vai pedir ou o que já comeu — eu calculo as calorias e mostro se está dentro da sua meta 🚦</p>
<main class="container">

  <!-- Semáforo compacto -->
  <div class="painel-topo" id="painel-topo">
    <div class="sinal-mini">
      <div class="luz-mini luz-mini-verm"></div>
      <div class="luz-mini luz-mini-amarelo"></div>
      <div class="luz-mini luz-mini-verde"></div>
    </div>
    <div class="sinal-info">
      <div class="sinal-veredicto" id="sinal-veredicto">Aguardando…</div>
      <div class="sinal-detalhe" id="sinal-detalhe"></div>
    </div>
  </div>

  <!-- Barra do dia -->
  <div class="bar-wrap" id="bar-wrap" style="display:none;">
    <div class="bar-labels">
      <span id="bar-lbl-ref">Refeição atual: 0 kcal</span>
      <span id="bar-lbl-dia">Dia: 0 / 0 kcal</span>
    </div>
    <div class="bar-bg"><div class="bar-fill" id="bar-fill"></div></div>
    <div class="bar-chips">
      <span class="chip-mini">Dia: <strong id="chip-total">0 kcal</strong></span>
      <span class="chip-mini">Saldo: <strong id="chip-saldo">—</strong></span>
      <span class="chip-mini">Itens: <strong id="chip-itens">0</strong></span>
    </div>
  </div>

  <!-- Meta colapsável -->
  <div class="pnp-card meta-destaque" id="meta-card">
    <div class="meta-toggle" onclick="toggleMeta()">
      <span class="meta-toggle-label" id="meta-toggle-label">🎯 Defina sua meta diária para ativar o semáforo</span>
      <span class="meta-toggle-icon" id="meta-icon">▼</span>
    </div>
    <div class="meta-corpo aberto" id="meta-corpo">
      <div class="meta-row" style="margin-top:.8rem;">
        <label for="meta-input">Meta diária (kcal):</label>
        <input type="number" id="meta-input" placeholder="ex: 2000" min="0" max="9999"
               oninput="onMetaChange()" onblur="onMetaBlur()" />
        <a href="https://www.saudemundo.com.br/index.html" class="meta-link">Calcule aqui →</a>
      </div>
    </div>
  </div>

  <!-- Seletor de modo -->
  <div class="modo-pills">
    <span class="modo-label">Modo:</span>
    <button class="modo-pill" id="pill-decisao" onclick="setModo('decisao')">
      🧠 O que vou pedir?
    </button>
    <button class="modo-pill" id="pill-registro" onclick="setModo('registro')">
      📊 Vou comer isso
    </button>
  </div>

  <!-- Chat IA -->
  <div class="pnp-card">
    <div class="pnp-card-title" id="chat-card-title">🤖 Assistente alimentar</div>

    <!-- Hint de modo -->
    <div class="modo-hint" id="modo-hint">
      A IA detecta automaticamente se você quer <strong>decidir</strong> ou <strong>registrar</strong> — ou use os botões acima para deixar explícito.
    </div>

    <div class="chat-refeicao-row">
      <label for="refeicao-select">Refeição:</label>
      <select id="refeicao-select" onchange="onRefeicaoChange()">
        <option value="cafe">☀️ Café da manhã</option>
        <option value="lanche1">🍎 Lanche manhã</option>
        <option value="almoco" selected>🍽️ Almoço</option>
        <option value="lanche2">🍌 Lanche tarde</option>
        <option value="jantar">🌙 Jantar</option>
        <option value="ceia">🌛 Ceia</option>
      </select>
    </div>

    <div class="limite-refeicao">
      Limite desta refeição: <strong id="limite-valor">—</strong>
      &nbsp;·&nbsp; Já registrado: <strong id="limite-usado">0 kcal</strong>
    </div>

    <!-- Exemplos por modo -->
    <div class="chat-exemplos" id="chat-exemplos">
      <!-- preenchido via JS -->
    </div>

    <!-- Janela chat -->
    <div class="chat-mensagens" id="chat-mensagens">
      <div class="msg msg-ia">
        👋 Olá! Me diga o que vai pedir <em>antes de comer</em> e eu comparo as opções — ou me conte o que comeu para registrar no diário. Faça os dois na mesma conversa!
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input-row">
      <textarea
        class="chat-input"
        id="chat-input"
        placeholder="Ex: vale mais pedir o frango ou o hambúrguer?"
        rows="2"
      ></textarea>
      <input type="file" id="foto-input" accept="image/*" capture="environment"
             style="display:none" onchange="onFotoSelecionada(this)">
      <button class="btn-foto" id="btn-foto" onclick="document.getElementById('foto-input').click()"
        title="Foto da refeição (estimativa visual ±20%)">📸 <span class="btn-foto-label">foto</span></button>
      <button class="btn-enviar" id="btn-enviar" onclick="enviarMensagem()" title="Enviar">➤</button>
    </div>
  </div>

  <!-- Registros -->
  <div class="pnp-card">
    <div class="reg-header">
      <div class="pnp-card-title" style="margin:0;">📋 Registros de hoje</div>
      <button class="btn-limpar" onclick="limparDiario()">🗑 Limpar</button>
    </div>
    <div id="lista-registros">
      <div class="empty-msg">Nenhum registro ainda.<br>Use o modo <strong>📊 Vou comer isso</strong> para registrar! 🚦</div>
    </div>
  </div>

  <!-- Editorial -->
  <div class="editorial">
    <h2>🧠 Decida antes, acompanhe depois</h2>
    <p>
      A maioria dos apps de dieta só serve <em>depois</em> que você já comeu — e aí já foi.
      O <strong>Pode, Não Pode?</strong> funciona nos dois momentos:
      antes da escolha (restaurante, delivery, supermercado) e depois, para acompanhar o impacto no dia.
    </p>
    <p>
      O semáforo avalia <em>cada refeição separadamente</em>. Com meta de 2.000 kcal,
      o almoço "pode" até 700 kcal (35%). Assim o alerta chega na hora certa — não só à noite quando não tem mais jeito.
    </p>
    <p>
      Escreva como quiser: "vale pedir o X-burguer ou a salada?", "comi frango com arroz integral".
      A IA entende o contexto e responde diferente para cada situação.
      Use a <a href="https://www.saudemundo.com.br/index.html">Calculadora de Calorias e Macros</a> para descobrir sua meta ideal.
    </p>
    <p style="font-size:.82rem;color:var(--muted);">
      ⚠️ Ferramenta educacional. Valores são estimativas médias. Para dietas individualizadas, consulte um nutricionista ou médico.
    </p>
  </div>

  <!-- FAQ -->
  <div class="pnp-card">
    <div class="card-title">❓ Perguntas Frequentes</div>
    <div class="faq-item">
      <div class="faq-q">Posso usar antes de comer para decidir o pedido?</div>
      <div class="faq-a">Sim — esse é o uso principal. Pergunte "vale o X ou o Y?" e a IA compara o impacto e recomenda a melhor escolha para sua meta.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Como funciona o semáforo por refeição?</div>
      <div class="faq-a">Cada refeição tem um limite proporcional: café 20%, almoço 35%, jantar 20%, lanches 10% cada, ceia 5%. O semáforo avalia aquela refeição — não o dia inteiro.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Preciso selecionar alimentos em lista?</div>
      <div class="faq-a">Não. Escreva como quiser: "vale o frango ou o hambúrguer?", "comi um pote de iogurte com granola". A IA entende e responde.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">Os dados ficam salvos se eu fechar o celular?</div>
      <div class="faq-a">Sim. Salvo localmente no dispositivo. Reabra no mesmo navegador no mesmo dia e estará lá.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">O Pode, Não Pode substitui um nutricionista?</div>
      <div class="faq-a">Não. Para dietas individualizadas, consulte um nutricionista ou médico.</div>
    </div>
  </div>

  <div id="sm-blog-placeholder"></div>
</main>

<script src="shared.js"></script>
<script>
const WORKER_URL  = "https://summer-hill-da28.philipdesousa.workers.dev";
const META_KEY    = "sm_pnp_meta_kcal";
const STORAGE_KEY = "sm_pnp_" + new Date().toISOString().slice(0,10);
const ATIV_KEY = "sm_pnp_ativ_" + new Date().toISOString().slice(0,10);
function carregarAtividadesQC() {
  try { const r = localStorage.getItem(ATIV_KEY); return r ? JSON.parse(r) : []; }
  catch(e) { return []; }
}
function totalQueimadoHoje() {
  return carregarAtividadesQC().reduce((s,a) => s + (a.kcal||0), 0);
}

const PESO_REFEICAO = { cafe:0.20, lanche1:0.10, almoco:0.35, lanche2:0.10, jantar:0.20, ceia:0.05 };
const NOME_REFEICAO = { cafe:"Café da manhã", lanche1:"Lanche manhã", almoco:"Almoço", lanche2:"Lanche tarde", jantar:"Jantar", ceia:"Ceia" };

const EXEMPLOS_DECISAO = [
  { texto:"qual o melhor prato no rodízio japonês?", label:"🧠 Decisão" },
  { texto:"suco natural ou refrigerante zero?", label:"🧠 Decisão" },
];
const EXEMPLOS_REGISTRO = [
  { texto:"comi peito de frango grelhado 120g com salada", label:"📊 Registro" },
  { texto:"scoop de whey com 200ml de leite desnatado", label:"📊 Registro" },
];

let registros  = carregarRegistros();
let historico  = [];
let metaAberta = true;
let modoAtual  = "auto";

function selecionarRefeicaoPorHorario() {
  const h = new Date().getHours();
  let ref;
  if      (h >= 6  && h < 10) ref = "cafe";
  else if (h >= 10 && h < 12) ref = "lanche1";
  else if (h >= 12 && h < 15) ref = "almoco";
  else if (h >= 15 && h < 18) ref = "lanche2";
  else if (h >= 18 && h < 21) ref = "jantar";
  else                         ref = "ceia";
  document.getElementById("refeicao-select").value = ref;
}

document.addEventListener("DOMContentLoaded", () => {
  const metaLocal = carregarMeta();
  if (metaLocal > 0) {
    document.getElementById("meta-input").value = metaLocal;
    fecharMetaSePreenchida(metaLocal);
  } else {
    try {
      const ud = typeof smGetUserData === "function" ? smGetUserData() : null;
      if (ud) {
        const m = parseInt(ud.metaCalorica || ud.meta || ud.calorias || ud.tdee || 0);
        if (m > 0) { document.getElementById("meta-input").value = m; salvarMeta(m); fecharMetaSePreenchida(m); }
      }
    } catch(e) {}
  }
  document.getElementById("chat-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
  });
  selecionarRefeicaoPorHorario();
  renderLista();
  atualizarTudo();
  renderExemplos();
  atualizarVisuaisModo();
});

// ── Meta ──
function salvarMeta(v) { try { localStorage.setItem(META_KEY, String(v)); } catch(e) {} }
function carregarMeta() { try { return parseInt(localStorage.getItem(META_KEY)) || 0; } catch(e) { return 0; } }

function onMetaChange() {
  const meta = parseInt(document.getElementById("meta-input").value) || 0;
  if (meta > 0) {
    salvarMeta(meta);
    try {
      const ud = typeof smGetUserData === "function" ? (smGetUserData()||{}) : {};
      ud.metaCalorica = meta;
      if (typeof smSaveUserData === "function") smSaveUserData(ud);
    } catch(e) {}
  }
  atualizarTudo();
}

function onMetaBlur() {
  const meta = parseInt(document.getElementById("meta-input").value) || 0;
  fecharMetaSePreenchida(meta);
}

function fecharMetaSePreenchida(meta) {
  if (meta > 0 && metaAberta) {
    document.getElementById("meta-card").classList.remove("meta-destaque");
    document.getElementById("meta-corpo").classList.remove("aberto");
    document.getElementById("meta-icon").classList.remove("aberto");
    document.getElementById("meta-toggle-label").textContent = "🎯 Meta: " + meta + " kcal/dia";
    metaAberta = false;
  }
}

function toggleMeta() {
  const corpo = document.getElementById("meta-corpo");
  const icon  = document.getElementById("meta-icon");
  const aberto = corpo.classList.toggle("aberto");
  icon.classList.toggle("aberto", aberto);
  metaAberta = aberto;
}

// ── Modo ──
function setModo(modo) {
  modoAtual = modo;
  atualizarVisuaisModo();
  renderExemplos();
  document.getElementById("chat-input").focus();
}

function atualizarVisuaisModo() {
  const input  = document.getElementById("chat-input");
  const btnEnv = document.getElementById("btn-enviar");
  const hint   = document.getElementById("modo-hint");
  const pillD  = document.getElementById("pill-decisao");
  const pillR  = document.getElementById("pill-registro");

  pillD.className = "modo-pill";
  pillR.className = "modo-pill";

  if (modoAtual === "decisao") {
    pillD.className = "modo-pill ativo-decisao";
    input.className = "chat-input modo-decisao";
    input.placeholder = "Ex: vale mais o frango ou o hambúrguer?";
    btnEnv.className = "btn-enviar modo-decisao";
    hint.className = "modo-hint hint-decisao";
    hint.innerHTML = "🧠 <strong>Modo Decisão</strong> — me diga as opções que está considerando e eu indico a melhor para sua meta.";
  } else if (modoAtual === "registro") {
    pillR.className = "modo-pill ativo-registro";
    input.className = "chat-input";
    input.placeholder = "Ex: comi peito de frango grelhado 120g com salada...";
    btnEnv.className = "btn-enviar";
    hint.className = "modo-hint hint-registro";
    hint.innerHTML = "📊 <strong>Modo Registro</strong> — me diga o que você comeu e eu calculo as calorias para lançar no diário.";
  } else {
    input.className = "chat-input";
    input.placeholder = "Ex: vale mais pedir o frango ou o hambúrguer?";
    btnEnv.className = "btn-enviar";
    hint.className = "modo-hint";
    hint.innerHTML = "A IA detecta automaticamente se você quer <strong>decidir</strong> ou <strong>registrar</strong> — ou use os botões acima para deixar explícito.";
  }
}

function renderExemplos() {
  const box = document.getElementById("chat-exemplos");
  let html = "";
  if (modoAtual === "decisao" || modoAtual === "auto") {
    if (modoAtual === "auto") html += "<span class='chips-titulo'>Exemplos — decidir antes de comer:</span>";
    EXEMPLOS_DECISAO.forEach(e => {
      html += `<span class="chip-ex chip-ex-decisao" onclick="preencherEx(this)">${e.texto}</span>`;
    });
  }
  if (modoAtual === "registro" || modoAtual === "auto") {
    if (modoAtual === "auto") html += "<span class='chips-titulo'>Exemplos — registrar o que comeu:</span>";
    EXEMPLOS_REGISTRO.forEach(e => {
      html += `<span class="chip-ex chip-ex-registro" onclick="preencherEx(this)">${e.texto}</span>`;
    });
  }
  box.innerHTML = html;
}

function preencherEx(el) {
  document.getElementById("chat-input").value = el.textContent.trim();
  document.getElementById("chat-input").focus();
}

// ── Chat ──
function addMsg(html, tipo, isDecisao) {
  const box = document.getElementById("chat-mensagens");
  const div = document.createElement("div");
  let cls = "msg msg-" + tipo;
  if (isDecisao && (tipo === "ia" || tipo === "user")) cls += " decisao";
  div.className = cls;
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function detectarModoMensagem(texto) {
  const decisaoRegex = /\b(posso|vale|devo|melhor|pedir|escolher|ou|comparar|delivery|restaurante|pede|comprar|qual|quero comer|o que comer|sugere|recomenda)\b/i;
  const registroRegex = /\b(comi|tomei|almocei|jantei|caf[eé]|bebi|comi hoje|acabei de comer|tive|jantar foi|almo[cç]o foi)\b/i;
  if (registroRegex.test(texto) && !decisaoRegex.test(texto)) return "registro";
  if (decisaoRegex.test(texto) && !registroRegex.test(texto)) return "decisao";
  return modoAtual !== "auto" ? modoAtual : "misto";
}

function onRefeicaoChange() { atualizarTudo(); }
function kcalRefeicaoAtual() {
  const ref = document.getElementById("refeicao-select").value;
  return registros.filter(r => r.refeicao === ref).reduce((s,r) => s + r.kcal, 0);
}

async function enviarMensagem() {
  const input  = document.getElementById("chat-input");
  const texto  = input.value.trim();
  const btnEnv = document.getElementById("btn-enviar");
  if (!texto) { input.focus(); return; }
  document.getElementById("chat-exemplos").style.display = "none";

  const meta     = parseInt(document.getElementById("meta-input").value) || 0;
  const ref      = document.getElementById("refeicao-select").value;
  const limRef   = meta > 0 ? Math.round(meta * PESO_REFEICAO[ref]) : null;
  const usadoRef = kcalRefeicaoAtual();
  const modoMsg   = detectarModoMensagem(texto);
  const isDecisao = modoMsg === "decisao";

  // Etapa 5 — aviso de conflito entre modo manual e conteúdo digitado
  if (modoAtual !== "auto") {
    const decisaoRegex = /\b(posso|vale|devo|melhor|pedir|escolher|ou|comparar|delivery|restaurante|pede|comprar|qual|quero comer|o que comer|sugere|recomenda)\b/i;
    const registroRegex = /\b(comi|tomei|almocei|jantei|caf[eé]|bebi|comi hoje|acabei de comer|tive|jantar foi|almo[cç]o foi)\b/i;
    const conflito =
      (modoAtual === "decisao" && registroRegex.test(texto) && !decisaoRegex.test(texto)) ||
      (modoAtual === "registro" && decisaoRegex.test(texto) && !registroRegex.test(texto));
    if (conflito) {
      const modoOposto  = modoAtual === "decisao" ? "registro" : "decisao";
      const labelOposto = modoAtual === "decisao" ? "📊 registrar em vez de comparar?" : "🧠 comparar em vez de registrar?";
      const avisoId = "aviso-conflito-" + Date.now();
      const avisoHtml = `<div id="${avisoId}" style="font-size:.8rem;color:var(--muted);margin-bottom:.4rem;padding:.4rem .6rem;background:var(--surface);border:1px solid var(--brd);border-radius:6px;">
        ⚠️ Parece que o texto não combina com o modo selecionado.
        <button onclick="setModo('${modoOposto}');document.getElementById('${avisoId}').remove()"
          style="background:none;border:none;color:var(--azul);cursor:pointer;font-size:.8rem;text-decoration:underline;padding:0">
          Quer ${labelOposto}
        </button>
      </div>`;
      document.getElementById("chat-mensagens").insertAdjacentHTML("beforeend", avisoHtml);
      document.getElementById("chat-mensagens").scrollTop = 999999;
    }
  }

  addMsg(texto, "user", isDecisao);
  historico.push({ role:"user", content: texto });
  input.value = "";
  btnEnv.disabled = true;

  const contexto = meta > 0
    ? "\n\n[CONTEXTO DO APP: meta diária = " + meta + " kcal. Refeição atual = "
      + NOME_REFEICAO[ref] + " (limite: " + limRef + " kcal, já consumido nela: " + usadoRef + " kcal)."
      + (isDecisao ? " O usuário está DECIDINDO o que comer — NÃO use [KCAL:X]." : " O usuário está REGISTRANDO o que comeu — use [KCAL:X].")
      + "]"
    : (isDecisao ? "\n\n[CONTEXTO: O usuário está DECIDINDO o que comer — NÃO use [KCAL:X].]"
                 : "\n\n[CONTEXTO: O usuário está REGISTRANDO o que comeu — use [KCAL:X].]");

  const mensagensEnvio = [
    ...historico.slice(0, -1),
    { role:"user", content: texto + contexto }
  ];

  const dig = addMsg("⏳ Analisando…", "digitando", false);

  try {
    const resp = await fetch(WORKER_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ messages: mensagensEnvio }),
    });
    if (!resp.ok) throw new Error("Servidor retornou HTTP " + resp.status);

    const data = await resp.json();
    let resposta = data.resposta || data.content || data.reply || data.message || data.text || null;
    if (!resposta && Array.isArray(data.choices) && data.choices[0])
      resposta = (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || null;
    if (!resposta && Array.isArray(data.content))
      resposta = data.content.filter(b => b.type==="text").map(b => b.text).join("\n") || null;
    if (!resposta) throw new Error("Formato de resposta desconhecido.");

    dig.remove();
    const match = resposta.match(/\[KCAL:(\d+)\]/);
    const kcal  = match ? parseInt(match[1]) : null;
    const limpo = resposta.replace(/\[KCAL:\d+\]/g,"").trim();
    let html = limpo.replace(/\n/g,"<br>");
    if (kcal && kcal > 0) {
      html += "<br><button class=\"btn-lancar\" onclick=\"lancar("
            + kcal + ",'" + encodeURIComponent(texto) + "')\">✅ Lançar "
            + kcal + " kcal no diário</button>";
    }
    addMsg(html, "ia", isDecisao);
    historico.push({ role:"assistant", content: resposta });

  } catch(err) {
    dig.remove();
    console.error("[PNP] Erro:", err);
    addMsg("❌ Erro ao falar com o assistente.<br><small style='opacity:.7'>" + err.message + "</small>", "erro", false);
  } finally {
    btnEnv.disabled = false;
  }
}

// ── Foto ──
function onFotoSelecionada(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const base64   = reader.result.split(",")[1];
    const mimeType = file.type || "image/jpeg";
    enviarComFoto(base64, mimeType);
  };
  reader.readAsDataURL(file);
  input.value = "";
}

async function enviarComFoto(base64, mimeType) {
  const btnEnv  = document.getElementById("btn-enviar");
  const btnFoto = document.getElementById("btn-foto");
  const meta     = parseInt(document.getElementById("meta-input").value) || 0;
  const ref      = document.getElementById("refeicao-select").value;
  const limRef   = meta > 0 ? Math.round(meta * PESO_REFEICAO[ref]) : null;
  const usadoRef = kcalRefeicaoAtual();

  document.getElementById("chat-exemplos").style.display = "none";

  const textoContexto = meta > 0
    ? "[CONTEXTO DO APP: meta diária = " + meta + " kcal. Refeição atual = "
      + NOME_REFEICAO[ref] + " (limite: " + limRef + " kcal, já consumido: " + usadoRef + " kcal)."
      + " O usuário enviou uma FOTO — estime as calorias visualmente e use [KCAL:X].]"
    : "[CONTEXTO: O usuário enviou uma FOTO de refeição — estime as calorias visualmente e use [KCAL:X].]";

  addMsg("📸 <em>Foto enviada para análise…</em>", "user", false);
  historico.push({ role:"user", content: textoContexto });

  btnEnv.disabled  = true;
  btnFoto.disabled = true;

  const dig = addMsg("📸 Analisando sua foto…", "digitando", false);

  try {
    const resp = await fetch(WORKER_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ messages: historico, imagem: { mimeType, data: base64 } }),
    });
    if (!resp.ok) throw new Error("Servidor retornou HTTP " + resp.status);

    const data = await resp.json();
    let resposta = data.resposta || null;
    if (!resposta) throw new Error("Formato de resposta desconhecido.");

    dig.remove();
    const match = resposta.match(/\[KCAL:(\d+)\]/);
    const kcal  = match ? parseInt(match[1]) : null;
    const limpo = resposta.replace(/\[KCAL:\d+\]/g,"").trim();
    let html = limpo.replace(/\n/g,"<br>");
    if (kcal && kcal > 0) {
      html += "<br><button class=\"btn-lancar\" onclick=\"lancar("
            + kcal + ",'" + encodeURIComponent("📸 foto da refeição") + "')\">✅ Lançar "
            + kcal + " kcal no diário</button>";
    }
    addMsg(html, "ia", false);
    historico.push({ role:"assistant", content: resposta });

  } catch(err) {
    dig.remove();
    console.error("[PNP] Erro foto:", err);
    addMsg("❌ Não consegui analisar a foto.<br><small style='opacity:.7'>" + err.message + "</small>", "erro", false);
  } finally {
    btnEnv.disabled  = false;
    btnFoto.disabled = false;
  }
}

function lancar(kcal, descCod) {
  const desc     = decodeURIComponent(descCod);
  const refeicao = document.getElementById("refeicao-select").value;
  const resumo   = desc.length > 55 ? desc.slice(0,52)+"…" : desc;
  registros.push({ id:Date.now(), nome:resumo, refeicao, kcal });
  salvarRegistros(); renderLista(); atualizarTudo();
  addMsg("✅ <strong>" + kcal + " kcal</strong> lançadas no diário!", "ia", false);
  if (typeof showToast === "function") showToast("✅ Lançado no diário!");
}

// ── Registros ──
const REF_CFG = {
  cafe:{l:"Café da manhã",c:"b-cafe"}, lanche1:{l:"Lanche manhã",c:"b-lanche1"},
  almoco:{l:"Almoço",c:"b-almoco"},   lanche2:{l:"Lanche tarde",c:"b-lanche2"},
  jantar:{l:"Jantar",c:"b-jantar"},   ceia:{l:"Ceia",c:"b-ceia"},
};

function renderLista() {
  const el = document.getElementById("lista-registros");
  if (!registros.length) {
    el.innerHTML = "<div class=\"empty-msg\">Nenhum registro ainda.<br>Use o modo <strong>📊 Vou comer isso</strong> para registrar! 🚦</div>";
    return;
  }
  el.innerHTML = registros.map(r => {
    const rf = REF_CFG[r.refeicao]||{l:r.refeicao,c:""};
    return "<div class=\"reg-item\">"
      + "<span class=\"reg-badge " + rf.c + "\">" + rf.l + "</span>"
      + "<span class=\"reg-info\"><span class=\"reg-nome\">" + r.nome + "</span></span>"
      + "<span class=\"reg-kcal\">" + r.kcal + " kcal</span>"
      + "<button class=\"reg-del\" onclick=\"removerRegistro(" + r.id + ")\" title=\"Remover\">✕</button>"
      + "</div>";
  }).join("");
}

function removerRegistro(id) {
  registros = registros.filter(r => r.id !== id);
  salvarRegistros(); renderLista(); atualizarTudo();
}

function limparDiario() {
  if (!confirm("Limpar todos os registros de hoje?")) return;
  registros = []; salvarRegistros(); renderLista(); atualizarTudo();
}

// ── Semáforo ──
function atualizarTudo() {
  const meta     = parseInt(document.getElementById("meta-input").value) || 0;
  const queimado    = totalQueimadoHoje();
  const metaEfetiva = meta > 0 ? meta + queimado : 0;
  const ref      = document.getElementById("refeicao-select").value;
  const totalDia = registros.reduce((s,r) => s + r.kcal, 0);
  const totalRef = kcalRefeicaoAtual();
  const limRef   = metaEfetiva > 0 ? Math.round(metaEfetiva * PESO_REFEICAO[ref]) : 0;
  const saldo    = metaEfetiva > 0 ? metaEfetiva - totalDia : 0;

  document.getElementById("chip-total").textContent = totalDia + " kcal";
  document.getElementById("chip-itens").textContent = registros.length;
  document.getElementById("chip-saldo").textContent = metaEfetiva > 0
    ? (saldo >= 0 ? saldo + " kcal" : "-" + Math.abs(saldo) + " kcal") : "—";
  document.getElementById("limite-valor").textContent = metaEfetiva > 0
    ? limRef + " kcal (" + Math.round(PESO_REFEICAO[ref]*100) + "% de " + metaEfetiva + " kcal)"
    : "— (defina sua meta)";
  document.getElementById("limite-usado").textContent = totalRef + " kcal";

  const barWrap = document.getElementById("bar-wrap");
  if (metaEfetiva > 0) {
    barWrap.style.display = "block";
    const pct  = Math.min((totalDia/metaEfetiva)*100, 100);
    const fill = document.getElementById("bar-fill");
    fill.style.width = pct + "%";
    fill.className = "bar-fill" + (pct > 100 ? " vermelho" : pct > 80 ? " amarelo" : "");
    document.getElementById("bar-lbl-ref").textContent = NOME_REFEICAO[ref] + ": " + totalRef + " kcal";
    document.getElementById("bar-lbl-dia").textContent = "Dia: " + totalDia + " / " + metaEfetiva + " kcal"
      + (queimado > 0 ? " (+" + queimado + " queimadas)" : "");
  } else {
    barWrap.style.display = "none";
  }

  const painel = document.getElementById("painel-topo");
  const verd   = document.getElementById("sinal-veredicto");
  const det    = document.getElementById("sinal-detalhe");
  painel.className = "painel-topo";

  if (registros.length === 0) {
    painel.style.display = "none";
    return;
  }
  painel.style.display = "";

  if (!metaEfetiva) {
    verd.textContent = "Aguardando…";
    det.textContent  = "Defina sua meta acima para ativar o semáforo.";
    return;
  }

  if (!registros.filter(r => r.refeicao === ref).length) {
    verd.textContent = NOME_REFEICAO[ref] + " — pronto!";
    det.textContent  = "Limite: " + limRef + " kcal. Escreva o que vai comer ou comeu.";
    return;
  }

  const pctRef = (totalRef / limRef) * 100;
  if (pctRef <= 80) {
    painel.classList.add("sinal-ativo-verde");
    verd.textContent = "🟢 Boa escolha!";
    det.textContent  = NOME_REFEICAO[ref] + ": " + totalRef + " de " + limRef + " kcal. Ainda tem " + (limRef-totalRef) + " kcal.";
  } else if (pctRef <= 100) {
    painel.classList.add("sinal-ativo-amarelo");
    verd.textContent = "🟡 Atenção!";
    det.textContent  = NOME_REFEICAO[ref] + ": restam apenas " + (limRef-totalRef) + " kcal. Escolha com cuidado.";
  } else {
    painel.classList.add("sinal-ativo-verm");
    verd.textContent = "🔴 Passou do limite!";
    det.textContent  = NOME_REFEICAO[ref] + " passou " + (totalRef-limRef) + " kcal acima. Compense na próxima.";
  }
}

function salvarRegistros() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); } catch(e) {} }
function carregarRegistros() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; }
  catch(e) { return []; }
}
window.addEventListener("storage", (e) => {
  if (e.key === ATIV_KEY || e.key === META_KEY || e.key === STORAGE_KEY) {
    atualizarTudo();
  }
});
</script>
</body>
</html>
```

### `shared.js`

```javascript
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
    { href: 'index.html',                        label: 'Calorias' },
    { href: 'calculadora-imc.html',              label: 'IMC' },
    { href: 'calculadora-tmb.html',              label: 'TMB' },
    { href: 'calculadora-agua.html',             label: 'Água' },
    { href: 'calculadora-proteina.html',         label: 'Proteína' },
    { href: 'calculadora-tdee.html',             label: 'TDEE' },
    { href: 'calculadora-deficit-calorico.html', label: 'Déficit' },
    { href: 'calculadora-cutting.html',          label: 'Cutting' },
    { href: 'calculadora-bulking.html',          label: 'Bulking' },
    { href: 'calculadora-macros.html',           label: 'Macros' },
    { href: 'calorias-por-dia.html',             label: 'Cal/Dia' },
    { href: 'calculadora-queima-calorica.html', label: 'Queima Calórica' },
    { href: smRootHref("pode-nao-pode.html"), label: "Pode, Não Pode?" },

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
const SM_ARTIGOS = [
  { file: 'artigo-deficit-calorico.html',             icon: '📉', cat: 'Nutrição',                name: 'O que é Déficit Calórico? O Guia Definitivo para Começar',        desc: 'Entenda o conceito biológico mais importante por trás do emagrecimento saudável e como aplicá-lo.' },
  { file: 'artigo-creatina.html',                     icon: '💊', cat: 'Suplementação',           name: 'Guia Prático sobre Creatina: Como Tomar, Horários e Mitos',        desc: 'O suplemento mais estudado do mundo. Saiba se vale a pena fazer saturação e se ela causa retenção.' },
  { file: 'artigo-guia-whey-protein.html',            icon: '🥛', cat: 'Suplementação',           name: 'Whey Protein Concentrado, Isolado e Hidrolisado: As Diferenças',   desc: 'Não jogue dinheiro fora. Aprenda as reais distinções industriais e escolha o melhor custo-benefício.' },
  { file: 'artigo-whey-protein-emagrece.html',        icon: '⚖️', cat: 'Emagrecimento',           name: 'Whey Protein Engorda ou Ajuda a Emagrecer? Descubra a Verdade',    desc: 'Entenda o grande mito e aprenda a usar o suplemento proteico como um forte aliado na saciedade.' },
  { file: 'artigo-pre-treino.html',                   icon: '⚡', cat: 'Suplementação',           name: 'Suplementos Pré-Treino: Benefícios, Riscos e Como Escolher',       desc: 'Promessas de foco e explosão muscular. Analise o papel da cafeína e os cuidados com o coração.' },
  { file: 'artigo-pre-pos-treino.html',               icon: '🍽️', cat: 'Nutrição',                name: 'O que Comer no Pré e Pós-Treino para Maximizar a Hipertrofia',     desc: 'Abasteça suas células de glicogênio e aminoácidos nos horários corretos para acelerar seus ganhos.' },
  { file: 'artigo-sono-e-massa-muscular.html',        icon: '😴', cat: 'Estilo de Vida',          name: 'Como a Falta de Sono Destrói Seus Ganhos de Massa Magra',          desc: 'Dormir pouco sabota seus níveis de testosterona, eleva o cortisol e aumenta sua fome por doces.' },
  { file: 'artigo-divisoes-de-treino.html',           icon: '🏋️', cat: 'Treino',                  name: 'Como Montar Divisões de Treino de Musculação: Guia Prático',       desc: 'Aprenda a distribuir seus treinos na semana (ABC, AB, ABCDE) respeitando o descanso ideal.' },
  { file: 'artigo-jejum-intermitente.html',           icon: '⏱️', cat: 'Nutrição',                name: 'Jejum Intermitente: Funciona para Emagrecer e Ganhar Massa?',      desc: 'Entenda o que acontece no seu corpo durante o jejum e como usar essa estratégia a seu favor.' },
  { file: 'artigo-fontes-de-proteina.html',           icon: '🍗', cat: 'Nutrição',                name: 'Fontes de Proteína: O Guia Completo Além do Whey',                 desc: 'Tabela completa com as melhores fontes de proteína, custo-benefício e como distribuir ao longo do dia.' },
  { file: 'artigo-sobrecarga-progressiva.html',       icon: '📈', cat: 'Treino',                  name: 'Sobrecarga Progressiva: O Segredo Para Nunca Parar de Crescer',    desc: 'Descubra as 6 formas de progredir no treino e por que fazer sempre o mesmo te mantém no platô.' },
  { file: 'artigo-hipertrofia-feminina.html',         icon: '💪', cat: 'Treino',                  name: 'Hipertrofia Feminina: Mitos, Verdades e Treino de Superiores',     desc: 'Mulheres não ficam masculinizadas por treinar braços. Descubra como moldar a linha da cintura.' },
  { file: 'artigo-ovos-diarios.html',                 icon: '🥚', cat: 'Nutrição',                name: 'Quantos Ovos Posso Comer por Dia? O Que a Ciência Diz',            desc: 'O mito do colesterol caiu. Entenda quantos ovos você pode comer com segurança todos os dias.' },
  { file: 'artigo-desenvolvimento-motor-infantil.html',icon: '🧠', cat: 'Desenvolvimento Infantil',name: 'Desenvolvimento Motor Infantil: Guia Completo da Primeira Infância', desc: 'Marcos motores por idade e como escolher a primeira atividade física do seu filho.' },
  { file: 'artigo-esporte-infantil.html',             icon: '🛹', cat: 'Desenvolvimento Infantil',name: 'Patinete e Skate na Primeira Infância: Relato de um Pai',          desc: 'A progressão real de duas crianças de 2 e 3 anos no patinete, etapa por etapa.' },
  { file: 'artigo-recomposicao-corporal.html', icon: '💪', cat: 'Treino', name: 'Recomposição Corporal: Como Perder Gordura e Ganhar Músculo ao Mesmo Tempo', desc: 'Entenda a fisiologia da recomposição corporal, para quem funciona e como montar um protocolo prático de treino e alimentação.' },
];

/* ---------- Footer HTML + seção "Artigos do Blog" ---------- */
(function injectFooter() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const container = document.querySelector('.container');

  const isInstitucional = document.body.getAttribute('data-page') === 'institucional';

  /* --- Seção "Artigos do Blog" --- */
  const artigosFiltrados = SM_ARTIGOS.filter(a => !(SM_IN_ARTIGOS && current === a.file));

  if (!isInstitucional && artigosFiltrados.length > 0) {
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
  { href: 'index.html',                        icon: '🥗', name: 'Calorias e Macros', desc: 'Meta calórica e macronutrientes' },
  { href: 'calculadora-imc.html',              icon: '⚖️', name: 'IMC',               desc: 'Índice de Massa Corporal' },
  { href: 'calculadora-tmb.html',              icon: '🔥', name: 'TMB e TDEE',        desc: 'Quantas calorias você queima' },
  { href: 'calculadora-proteina.html',         icon: '💪', name: 'Proteína',          desc: 'Ingestão ideal de proteínas' },
  { href: 'calculadora-agua.html',             icon: '💧', name: 'Água',              desc: 'Hidratação diária ideal' },
  { href: 'calculadora-tdee.html',             icon: '⚡', name: 'TDEE',             desc: 'Gasto energético total' },
  { href: 'calculadora-deficit-calorico.html', icon: '📉', name: 'Déficit Calórico',  desc: 'Calcule seu déficit calórico' },
  { href: 'calculadora-cutting.html',          icon: '✂️', name: 'Cutting',           desc: 'Planejamento de cutting' },
  { href: 'calculadora-bulking.html',          icon: '💪', name: 'Bulking',           desc: 'Planejamento de bulking' },
  { href: 'calculadora-macros.html',           icon: '🥧', name: 'Macronutrientes',   desc: 'Distribuição de macros' },
  { href: 'calorias-por-dia.html',             icon: '📅', name: 'Calorias por Dia',  desc: 'Estimativa calórica diária' },
  { href: 'calculadora-queima-calorica.html', icon: '🔥', name: 'Queima Calórica', desc: 'Calcule calorias gastas no treino' },
  { href: 'pode-nao-pode.html', icon: '🚦', name: 'Pode, Não Pode?', desc: 'Registre cada refeição e veja: semáforo verde, amarelo ou vermelho.' },
];

function smRenderOtherTools() {
  const isInstitucional = document.body.getAttribute('data-page') === 'institucional';
  if (isInstitucional) return;

  const current = window.location.pathname.split('/').pop() || 'index.html';
  const filtered = SM_TOOLS.filter(t => t.href !== current);

  document.querySelectorAll('.tools-grid').forEach(container => {
    container.innerHTML = filtered.map(t =>
      `<a href="${t.href}" class="tool-card">
        <div class="tool-icon">${t.icon}</div>
        <div class="tool-name">${t.name}</div>
        <div class="tool-desc">${t.desc}</div>
      </a>`
    ).join('');
  });

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

/* ---------- Byline automático nas calculadoras ---------- */
function injectByline() {
  if (SM_IN_ARTIGOS) return;

  const isInstitucional = document.body.getAttribute('data-page') === 'institucional';
  if (isInstitucional) return;

  const h1 = document.querySelector('h1');
  if (!h1) return;

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
  byline.innerHTML = `✍️ Por <a href="${smRootHref('sobre.html')}" style="color:var(--green);text-decoration:none;font-weight:600;">Lucas Andrade</a> &nbsp;📅 Atualizado em ${dataFormatada}`;
  byline.style.cssText = 'font-size:.85rem;color:var(--text-muted);margin:8px 0 24px;';

  h1.insertAdjacentElement('afterend', byline);
}

document.addEventListener('DOMContentLoaded', () => {
  smLoadUserData();
  smRenderOtherTools();
  injectByline();

  /* ---------- Corrige "atualizado recentemente" → data real ---------- */
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];

  document.querySelectorAll('[data-date]').forEach(el => {
    const raw = el.getAttribute('data-date');
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
```

### Observação importante sobre `index.html` / `shared.js`

Note que `index.html` já contém uma seção `.tools-grid` **hardcoded** com apenas 5 calculadoras (IMC, Água, Déficit, Cutting, Bulking) no HTML estático — mas o `smRenderOtherTools()` do `shared.js`, chamado em `DOMContentLoaded`, **sobrescreve** o conteúdo de qualquer `.tools-grid` da página com a lista completa de `SM_TOOLS` (12 itens, todos exceto a página atual). Ou seja, em produção essa seção acaba mostrando todas as 12 outras ferramentas, incluindo Queima e PNP — o HTML hardcoded é só um fallback/placeholder que nunca chega a ser visto de fato. Ao implementar a Mudança 5b, edite `SM_TOOLS` e `smRenderOtherTools()` (a fonte real que é renderizada), não o HTML estático do `index.html`.

## Outras calculadoras existentes no site (contexto, não precisam ser editadas)

IMC, TMB, Água, Proteína, TDEE, Déficit Calórico, Cutting, Bulking, Macronutrientes, Calorias por Dia — 10 calculadoras standalone que não fazem parte deste fluxo e não devem ser alteradas.

## O que entregar

1. `index.html` completo e atualizado (mudança 4 e 5a).
2. `calculadora-queima-calorica.html` completo e atualizado (mudança 4).
3. `pode-nao-pode.html` completo e atualizado (mudanças 1, 2, 3 e 4).
4. `shared.js` completo e atualizado (mudança 5b).
5. Um resumo curto, no final, listando exatamente o que mudou em cada arquivo (2-3 linhas por arquivo), para eu revisar rapidamente antes de publicar.

Não altere nada relacionado a Google Ads, Analytics, Pinterest Tag, meta tags de SEO, JSON-LD, ou qualquer outra calculadora/página fora do escopo das 5 mudanças acima. Preserve nomes de funções, IDs e classes existentes sempre que possível, para não quebrar nada que já funciona.
