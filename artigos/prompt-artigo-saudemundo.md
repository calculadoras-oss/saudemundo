# PROMPT — Criar novo artigo para saudemundo.com.br

Crie um artigo completo, publicável sem edições, para o blog do SaúdeMundo sobre o tema: **[DESCREVER O TEMA AQUI]**

Este prompt já contém todas as decisões de padrão do site. Não pergunte sobre template, autor,
revisor ou estrutura — apenas execute. Só faça perguntas se o TEMA em si for ambíguo a ponto de
mudar o ângulo do artigo.

---

## 1. Verificação de sobreposição (obrigatório, antes de escrever)

Liste os artigos já existentes que tratam de tema próximo e explicite, em 2-3 frases, o ângulo,
subtema ou profundidade que ESTE artigo aborda e os outros não.

Lista atual de artigos (arquivo `/artigos/` no repo `calculadoras-oss/saudemundo`):
artigo-deficit-calorico, artigo-creatina, artigo-guia-whey-protein, artigo-whey-protein-emagrece,
artigo-pre-treino, artigo-pre-pos-treino, artigo-sono-e-massa-muscular, artigo-divisoes-de-treino,
artigo-jejum-intermitente, artigo-fontes-de-proteina, artigo-sobrecarga-progressiva,
artigo-hipertrofia-feminina, artigo-ovos-diarios, artigo-desenvolvimento-motor-infantil,
artigo-esporte-infantil, artigo-automonitoramento-calculadoras.

Esta lista pode estar desatualizada. Se eu não colar uma lista mais recente na conversa, pergunte
apenas isso — "a lista de artigos acima ainda está atualizada, ou tem título novo que eu deveria
considerar?" — antes de prosseguir. Não pergunte mais nada além disso.

---

## 2. Padrão fixo do site (não perguntar, sempre usar)

- **Template:** unificado. TODO artigo novo usa `../shared.css` e `../shared.js`, sem CSS ou
  header/footer próprios. O template "solo" (CSS embutido, logo manual) está descontinuado —
  nunca usar, mesmo que apareça em artigos antigos como referência.
- **Autor padrão:** Lucas Andrade (link para `../sobre.html`).
- **Revisor técnico padrão:** Carolina Velneri (link para `../sobre.html`) — sempre usar quando o
  tema envolver fisiologia, nutrição, saúde infantil ou qualquer conteúdo de saúde sensível. Omitir
  `reviewedBy` apenas se o tema for puramente operacional (ex: "como usar a calculadora X"), o que
  é raro.
- **Idioma:** `pt-BR` em `<html lang="pt-BR">`.
- **Nome do arquivo:** `artigo-[slug-curto-do-tema].html`, minúsculas, sem acento, hífen entre
  palavras.

---

## 3. Estrutura do `<head>` — use este esqueleto literal, só troque o conteúdo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Título específico, 50-65 caracteres] | SaúdeMundo</title>
<meta name="description" content="[Resumo com o argumento central do artigo, 150-160 caracteres, sem clickbait]">
<link rel="canonical" href="https://saudemundo.com.br/artigos/artigo-[slug].html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../shared.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[mesmo título, sem o sufixo | SaúdeMundo]",
  "author": {"@type":"Person","name":"Lucas Andrade","url":"https://saudemundo.com.br/sobre.html"},
  "reviewedBy": {"@type":"Person","name":"Carolina Velneri","url":"https://saudemundo.com.br/sobre.html"},
  "datePublished": "[AAAA-MM-DD real, a data de hoje]",
  "dateModified": "[mesma data]",
  "publisher": {"@type":"Organization","name":"SaúdeMundo","url":"https://saudemundo.com.br"}
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "[pergunta 1]", "acceptedAnswer": { "@type": "Answer", "text": "[resposta 1]" } },
    { "@type": "Question", "name": "[pergunta 2]", "acceptedAnswer": { "@type": "Answer", "text": "[resposta 2]" } }
  ]
}
</script>
</head>
```

⚠️ **Checagem obrigatória antes de entregar:** releia os dois blocos JSON caractere por caractere
e confirme vírgula entre TODAS as propriedades, especialmente depois de `"dateModified"` antes de
`"publisher"`, e entre cada objeto dentro de `"mainEntity"`. Um schema quebrado já ficou dias no ar
sem ninguém perceber.

Só inclua um `<style>` extra no `<head>` se o artigo tiver uma tabela ou gráfico SVG (ver seção 6).
Nesse caso, escopar as classes com um nome único do artigo (ex: `.article-table`) para não colidir
com o `shared.css`. Nunca recrie no `<style>` algo que o `shared.css` já resolve (cards, títulos,
cores, tipografia).

---

## 4. Estrutura do `<body>` — esqueleto literal

```html
<body>
<div class="bg-grid"></div>

<header>
  <h1>[H1 específico — pode repetir ou expandir o title, não genérico]</h1>
  <p class="subtitle">[1-2 frases resumindo a promessa do artigo]</p>
</header>

<div class="container" style="max-width:760px;">

  <div class="author-box">
    <span>✍️ Por <a href="../sobre.html">Lucas Andrade</a></span>
    <span>✅ Revisão técnica: <a href="../sobre.html">Carolina Velneri</a></span>
    <span>📅 Atualizado em [dia] de [mês por extenso] de [ano]</span>
  </div>

  <div class="card">
    [Parágrafo(s) de abertura: apresente a pergunta ou tensão real que o leitor tem, sem
    "é importante ressaltar que" ou frases genéricas de blog.]
  </div>

  <div class="section-title">[emoji] [Título da seção 1]</div>
  <div class="card">
    [conteúdo]
  </div>

  <!-- repetir section-title + card para cada seção -->

  <div class="section-title">⚠️ Erros Comuns [sobre o tema]</div>
  <div class="card">
    <p><strong>[Erro 1]:</strong> [explicação].</p>
    <p><strong>[Erro 2]:</strong> [explicação].</p>
    <!-- 3 a 5 erros -->
  </div>

  [ELEMENTO OPCIONAL: CTA de calculadora — ver seção 6]
  [ELEMENTO OPCIONAL: tool-card contextual — ver seção 6]
  [ELEMENTO OPCIONAL: caixa de Fontes e Referências — ver seção 6]

  <div class="faq-section">
    <div class="card-title">❓ Perguntas Frequentes</div>
    <div class="faq-item">
      <div class="faq-q">[pergunta 1 — idêntica à do schema]</div>
      <div class="faq-a">[resposta 1 — idêntica à do schema]</div>
    </div>
    <!-- repetir para cada pergunta do FAQPage -->
  </div>

  <div id="sm-blog-placeholder"></div>

</div>

<script src="../shared.js"></script>
</body>
</html>
```

Tamanho de referência: 5 a 8 seções de conteúdo (`section-title` + `card`) além da introdução, dos
erros comuns e do FAQ — o suficiente para ~1500-2200 palavras de corpo visível. Não enchê-lo
artificialmente; cada seção precisa responder a uma pergunta real que o leitor teria.

---

## 5. Links internos — regra fixa

Nunca criar bloco solto de "veja também". Todo link para outra calculadora ou artigo do site vai
**dentro de uma frase editorial**, no meio do raciocínio do texto, explicando por que/quando usar
aquilo — como fazer a ponte, não só citar. Exemplo do padrão certo (não copiar o tema, só a lógica):
"Esse efeito de saciedade é especialmente útil para quem segue [protocolos de jejum intermitente],
onde uma refeição rica em X sustenta o apetite controlado por mais tempo do que...".

Inclua pelo menos 1 link para outro artigo do site (quando fizer sentido temático) e pelo menos 1
link para uma calculadora relevante, sempre com essa lógica contextual.

---

## 6. Elementos opcionais — quando usar cada um

Use apenas os que fizerem sentido para o tema. Não force todos em todo artigo.

**a) Caixa "Fontes e Referências"** — usar quando o artigo citar estudos, instituições ou dados
específicos por nome (ex: nome de pesquisador, ano, órgão como SBP/OMS/Ministério da Saúde). Não
inventar fonte: se não houver uma referência real e verificável, omitir a caixa e, se necessário,
usar linguagem genérica ("estudos mostram", "a literatura aponta") sem citar autor/ano específico.

```html
<div style="background:#f0faf4;border:1px solid #c0e0cc;border-radius:12px;padding:20px 24px;margin-top:28px;">
  <p style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#007A3D;opacity:0.8;margin-bottom:14px;">📚 Fontes e Referências</p>
  <ol style="color:#555;font-size:0.82rem;line-height:1.8;padding-left:18px;margin:0;">
    <li style="margin-bottom:6px;">[Autor(es). <em>Título.</em> Publicação, ano.] <a href="[url]" target="_blank" rel="noopener" style="color:#007A3D;text-decoration:none;">[domínio.com]</a></li>
  </ol>
</div>
```

**b) CTA gradiente para calculadora** — usar quando o artigo tiver uma ação de conversão natural e
específica (ex: "calcule sua meta antes de aplicar isso"). Não usar em todo artigo — só quando o
próximo passo lógico do leitor for realmente calcular algo.

```html
<div style="background:linear-gradient(135deg, rgba(16,185,129,.08), rgba(5,150,105,.08)); border:2px dashed var(--green-dark); border-radius:12px; padding:1.5rem; margin:2rem 0; text-align:center;">
  <p><strong>🎯 [Chamada de uma linha ligada ao conteúdo]</strong></p>
  <p>[1-2 frases explicando por que esse é o próximo passo lógico.]</p>
  <a href="../[calculadora].html" style="display:inline-flex; align-items:center; gap:0.5rem; background-color:var(--green-dark); color:#fff; text-decoration:none; padding:0.7rem 1.5rem; border-radius:8px; font-weight:600; margin-top:1rem;">🧮 [Verbo + ação] →</a>
</div>
```

**c) `tool-card`** — sempre incluir pelo menos um, para uma calculadora ou artigo relacionado.
Pode ficar no meio do artigo (ligado a uma seção específica) ou perto do fim.

```html
<a href="../[calculadora-ou-artigo].html" class="tool-card" style="margin-bottom:24px;">
  <div class="tool-icon">[emoji]</div>
  <div class="tool-name">[Nome da ferramenta/artigo]</div>
  <div class="tool-desc">[1 frase contextual: o que o leitor ganha ao clicar, ligado ao que acabou de ler]</div>
</a>
```

**d) Gráfico SVG ilustrativo** — usar só quando uma tendência (ex: adesão ao longo do tempo,
comparação entre dois grupos) ajudar a visualizar o argumento central do artigo. Precisa de:
`role="img"` + `aria-label`, `<title>` e `<desc>` descrevendo o gráfico, e uma legenda abaixo em
texto pequeno deixando claro que é ilustração conceitual, não dado extraído de um estudo específico
(a menos que seja um dado real e citado nas Fontes).

**e) Tabela comparativa** — usar quando o artigo tiver uma comparação natural (pilares, calculadoras,
opções). Precisa do `<style>` escopado (ver seção 3) com fallback mobile em `display:block` +
`data-label` nas `<td>`, seguindo o padrão de `.article-table` já usado no site.

---

## 7. Tom e estilo

- Autoral e direto. Nunca usar "é importante ressaltar que", "vale ressaltar", "não podemos deixar
  de mencionar" ou equivalentes.
- Pelo menos uma seção com exemplo prático COM NÚMEROS REAIS (não recomendação genérica) —
  ex: simular um caso com peso/idade/fórmula aplicada, não só descrever a fórmula.
- Nunca recomendar dosagem ou protocolo de suplemento/substância sem ressalva de que não substitui
  orientação de nutricionista ou médico.
- Se o tema envolver criança, gestante ou população de risco, incluir seção de "quando buscar
  avaliação profissional" com sinais concretos, não vagos.

---

## 8. Ao final, entregue também

1. O código-fonte completo do arquivo `.html`, pronto para colar.

2. A entrada pronta para adicionar no array `SM_ARTIGOS`, dentro de `shared.js`. O array usa
   estas chaves exatas — não usar `slug`, `titulo`, `resumo` ou `data`, que não existem nesse
   arquivo:
   ```js
   { file: 'artigo-[slug].html', icon: '[emoji]', cat: '[categoria]', name: '[título do artigo, sem o sufixo | SaúdeMundo]', desc: '[1 frase curta de gancho, não precisa repetir a meta description]' },
   ```
   - `cat` deve usar uma categoria já existente no array sempre que o tema se encaixar nela
     (`Nutrição`, `Suplementação`, `Emagrecimento`, `Estilo de Vida`, `Treino`,
     `Desenvolvimento Infantil`). Só crie uma categoria nova se nenhuma existente fizer sentido.
   - Adicionar a entrada dentro do array já existente, sem recriar o array inteiro.

3. O bloco `<url>` pronto para colar dentro de `sitemap.xml`, na seção `<!-- Blog -->`, junto
   dos outros artigos (não na seção de calculadoras nem na institucional):
   ```xml
   <url>
     <loc>https://saudemundo.com.br/artigos/artigo-[slug].html</loc>
     <lastmod>[AAAA-MM-DD real, a data de hoje]</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.6</priority>
   </url>
   ```
   Use `priority` 0.6, que é o padrão usado pelos artigos de blog no sitemap atual (as
   calculadoras usam 0.9, a home usa 1.0 — não copiar essas prioridades para um artigo).

4. Um checklist do que EU preciso fazer fora desta conversa:
   - [ ] Subir o arquivo `.html` em `/artigos/` no repositório `calculadoras-oss/saudemundo`
   - [ ] Adicionar a entrada no array `SM_ARTIGOS` dentro de `shared.js` (já entregue pronta acima)
   - [ ] Adicionar o bloco `<url>` no `sitemap.xml`, dentro da seção `<!-- Blog -->` (já entregue pronto acima)
   - [ ] Testar a URL publicada no Rich Results Test e no validator.schema.org
   - [ ] Verificar se faz sentido linkar este artigo novo a partir de algum artigo antigo relacionado
