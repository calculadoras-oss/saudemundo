# Contexto completo — Projeto SaúdeMundo / Calculadora "Pode, Não Pode?"

Você está assumindo a continuação de um projeto já em andamento. Leia todo este documento antes de agir — ele contém a arquitetura do site, a origem de cada dado, os bugs já corrigidos e o plano de melhorias acordado com o usuário. Não peça para o usuário reexplicar o que já está documentado aqui; peça apenas os arquivos de código indicados na seção "O que preciso que você me envie".

## 1. Visão geral do site

O site é **saudemundo.com.br**, um site de calculadoras de saúde/nutrição (calorias, IMC, água, déficit calórico, etc.) com artigos e afiliados. É um site estático (HTML/CSS/JS puro, sem framework/build), hospedado provavelmente em hosting estático simples, com um backend de IA via **Cloudflare Worker** separado.

### Arquivos-chave e seus papéis

- **`shared.js`** — JS compartilhado entre TODAS as páginas do site. Injeta nav/footer, controla tema (dark/light), e expõe funções globais de persistência de dados do usuário entre calculadoras:
  - `smSaveUserData(obj)` — salva dados pessoais (peso, altura, idade, sexo, atividade) em localStorage para serem reaproveitados por outras calculadoras do site.
  - `smGetUserData()` — lê esses dados de volta.
  - `showToast(msg)` — exibe notificação rápida na tela.
  - **Eu (Claude, na sessão anterior) NÃO tive acesso ao conteúdo real deste arquivo** — apenas inferi sua existência pelas chamadas feitas nele. Se for necessário alterar algo dentro do `shared.js` em si, será preciso que o usuário cole o conteúdo dele.
- **`shared.css`** — CSS global compartilhado (cores, variáveis de tema dark/light, layout base).
- **`index.html`** — A calculadora principal de Calorias e Macros. Fórmula de Mifflin-St Jeor para TMB, ajusta TDEE por objetivo (emagrecer -500kcal / manter / ganhar +300kcal), calcula macros (proteína/carbo/gordura) por percentuais que variam por objetivo. Ao final do cálculo, salva a meta calculada em `localStorage.setItem('sm_pnp_meta_kcal', String(meta))` — esta é a **ponte de dados** entre a calculadora principal e a "Pode, Não Pode?". Tem também um botão "🚦 Usar no Pode, Não Pode?" que salva essa meta e redireciona para `pode-nao-pode.html`.
- **`pode-nao-pode.html`** — A calculadora-alvo das melhorias atuais. É um chat com IA que funciona em dois modos: **decisão** (antes de comer, compara opções) e **registro** (depois de comer, calcula e lança kcal no diário). Tem um semáforo visual (verde/amarelo/vermelho) que avalia se a refeição atual está dentro do limite proporcional da meta diária. Detalhado na seção 3.
- **Cloudflare Worker** (arquivo tipo `index.js`, deployado em algo como `https://summer-hill-da28.philipdesousa.workers.dev`) — é o backend serverless que recebe as mensagens do chat da "Pode, Não Pode?" e chama a API do Gemini (Google) para calcular calorias/comparar opções. Tem um `systemInstruction` que define o comportamento da IA (detectar modo decisão/registro/misto, retornar `[KCAL:X]` na última linha quando for registro).

## 2. Fluxo de dados (de onde vem cada informação)

```
[index.html] usuário preenche peso/altura/idade/sexo/atividade/objetivo
     ↓ calcular()
     → smSaveUserData() salva dados pessoais no localStorage (compartilhado entre calculadoras)
     → localStorage['sm_pnp_meta_kcal'] = meta calculada (kcal/dia, já ajustada por objetivo)
     ↓ (usuário clica "Usar no Pode, Não Pode?" OU simplesmente recalcula)
[pode-nao-pode.html] ao carregar, lê localStorage['sm_pnp_meta_kcal'] → preenche campo de meta
     ↓ usuário digita mensagem no chat (ex: "comi frango com arroz" ou "vale o X ou Y?")
     → JS detecta modo (decisão/registro/misto) via regex local (detectarModoMensagem)
     → monta contexto (meta, refeição atual, limite da refeição) e envia para o Worker
[Cloudflare Worker] recebe { messages: [...] }
     → monta systemInstruction + contents (histórico convertido pro formato do Gemini)
     → chama Gemini API (generateContent) tentando uma lista de modelos em sequência
     → extrai texto da resposta, devolve { resposta: "..." } para o front
[pode-nao-pode.html] recebe resposta
     → se tiver [KCAL:X], mostra botão "Lançar X kcal no diário"
     → ao lançar, registro vai para localStorage do dia (chave `sm_pnp_YYYY-MM-DD`)
     → semáforo e barra de progresso são recalculados com base nos registros do dia
```

### Chaves de localStorage relevantes (confirmadas)
- `sm_pnp_meta_kcal` — meta diária em kcal, escrita pelo `index.html`, lida pela `pode-nao-pode.html`.
- `sm_pnp_YYYY-MM-DD` (data do dia atual) — array de registros de comida do dia, somente na `pode-nao-pode.html`. Reseta à meia-noite porque a chave muda de dia para dia.
- Chave usada por `smSaveUserData`/`smGetUserData` — **desconhecida** (não vista no código fornecido até agora); se for necessário usá-la, peça o `shared.js`.

## 3. Estado atual da "Pode, Não Pode?" — estrutura da página

A página tem, de cima para baixo:
1. Header com título e tagline
2. `.painel-topo` — semáforo compacto (luz verde/amarelo/vermelho + veredicto + 3 chips: Dia/Saldo/Itens)
3. `.bar-wrap` — barra de progresso do dia (kcal consumidos vs meta), escondida até ter meta definida
4. `.meta-card` — card colapsável para definir a meta diária manualmente (ou já vem preenchido vindo do index.html)
5. `.modo-pills` — dois botões: "🧠 O que vou pedir?" (decisão) e "📊 Vou comer isso" (registro), além do modo "auto" (detecção automática por regex)
6. `.modo-hint` — texto explicando o modo atual
7. Seletor de refeição (`<select>`: café, lanche manhã, almoço, lanche tarde, jantar, ceia)
8. `.limite-refeicao` — mostra limite kcal daquela refeição (% da meta) e quanto já foi usado
9. `.chat-exemplos` — chips de exemplo de mensagens (hoje: 4 de decisão + 4 de registro = 8 chips, sempre visíveis no modo "auto")
10. `.chat-mensagens` — janela de chat com histórico
11. Input de texto + botão enviar
12. Lista de registros do dia (`#lista-registros`)
13. Conteúdo editorial (SEO) + FAQ

### Lógica de detecção de modo (JS, função `detectarModoMensagem`)
```js
function detectarModoMensagem(texto) {
  const decisaoRegex = /\b(posso|vale|devo|melhor|pedir|escolher|ou|comparar|delivery|restaurante|pede|comprar|qual|quero comer|o que comer|sugere|recomenda)\b/i;
  const registroRegex = /\b(comi|tomei|almocei|jantei|caf[eé]|bebi|comi hoje|acabei de comer|tive|jantar foi|almo[cç]o foi)\b/i;
  if (registroRegex.test(texto) && !decisaoRegex.test(texto)) return "registro";
  if (decisaoRegex.test(texto) && !registroRegex.test(texto)) return "decisao";
  return modoAtual !== "auto" ? modoAtual : "misto";
}
```

### Pesos de refeição sobre a meta diária
```js
const PESO_REFEICAO = { cafe:0.20, lanche1:0.10, almoco:0.35, lanche2:0.10, jantar:0.20, ceia:0.05 };
```

## 4. Bugs já corrigidos nesta sessão anterior (NÃO precisa refazer)

1. **Worker usando modelos Gemini desativados** (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b` foram todos descontinuados pelo Google em jun/2026) — causava falha total e silenciosa ("Não consegui calcular agora"). Corrigido trocando para `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-3.1-flash-lite`.
2. **Worker descartava o histórico da conversa**, enviando só a última mensagem ao Gemini. Corrigido: agora converte e envia `messages` inteiro, mapeando `role: "assistant"` → `"model"` (nome exigido pelo Gemini).
3. **Worker escondia o erro real** quando todos os modelos falhavam. Corrigido: agora devolve `debug_erro` no JSON de resposta para facilitar diagnóstico futuro.
4. **`setSexo()` no index.html** tinha um bug de `localStorage.setItem('sm_pnp_meta_kcal', String(meta))` com a variável `meta` fora de escopo (gerava erro silencioso engolido por `try/catch` vazio) E tinha perdido a lógica de marcar o botão M/F como ativo. Corrigido: removida a linha de localStorage incorreta de dentro de `setSexo()`, devolvido o toggle de classe `active`, e o salvamento da meta foi movido para dentro de `calcular()` (no lugar certo, com a variável já calculada).
5. **Faltava uma forma explícita de exportar a meta calculada** da calculadora principal para a "Pode, Não Pode?". Corrigido: adicionado botão "🚦 Usar no Pode, Não Pode?" na seção de compartilhar resultado do `index.html`, com função `enviarParaPodeNaoPode()` que salva `lastResult.meta` no localStorage e redireciona.
6. **Dois blocos `<script type="application/ld+json"> FAQPage </script>` duplicados** no `<head>` do `index.html` (schema.org) — unificados em um único bloco com 9 perguntas sem duplicar.

Esses 6 pontos já estão resolvidos no código atual (peça ao usuário a versão mais recente dos arquivos para confirmar, mas não é necessário re-diagnosticar).

## 5. Plano de melhorias aprovado pelo usuário (é isso que você deve implementar, em etapas)

O usuário concordou com a análise abaixo e quer que você implemente **em etapas**, perguntando confirmação antes de avançar para a próxima, para não gastar contexto/tokens com retrabalho. Ordem de prioridade definida:

### Etapa 1 (alto impacto, baixo esforço) — Reduzir e ocultar exemplos
- Hoje aparecem 8 chips de exemplo (4 decisão + 4 registro) sempre visíveis no modo "auto", gerando excesso de carga cognitiva antes mesmo da primeira interação.
- **Ação:** reduzir para 2 exemplos por modo (não 4). Ocultar a seção de exemplos (`display:none`) permanentemente após o usuário enviar a primeira mensagem (não precisa reaparecer depois). Trocar os dois títulos de seção por um único texto: "Toque um exemplo ou escreva o seu:".

### Etapa 2 — Reorganizar hierarquia visual / onboarding
- Hoje o usuário vê primeiro um semáforo vazio ("Aguardando…"), barra escondida, card de meta pedindo pra abrir — só entende o conceito do app ao chegar na mensagem de boas-vindas do chat, que vem depois de 4 componentes.
- **Ação:** no estado vazio (sem nenhum registro do dia), esconder o `.painel-topo` (semáforo) e mostrar no lugar dele uma frase fixa de onboarding: "Me diga o que vai pedir ou o que já comeu — eu cuido do resto 🚦", com o chat input já em foco/destaque. O semáforo e a barra de progresso só devem aparecer depois do primeiro registro do dia (`registros.length > 0`).
- Considerar adiar a exigência de definir a meta: deixar o usuário interagir no chat primeiro (modo decisão funciona sem meta), e só pedir a meta quando for relevante mostrar limites percentuais.

### Etapa 3 — Compactar o painel do semáforo vs. tamanho do chat
- O `.painel-topo` tem padding grande e compete visualmente com o chat (que é o core da ferramenta), empurrando-o para baixo da rolagem inicial no celular.
- **Ação:** reduzir o semáforo a uma faixa fina tipo "status bar" (luz + veredicto curto, sem o card grande). Unificar os 3 chips (Dia/Saldo/Itens) dentro da própria `.bar-wrap` (barra de progresso), que já existe, em vez de manter dois blocos separados disputando espaço vertical.

### Etapa 4 — Atalhos de baixa fricção para uso o dia todo
- **4a.** Selecionar a refeição automaticamente por horário (`new Date().getHours()`: ex. 6h-10h=café, 11h-14h=almoço, 14h-17h=lanche tarde, 17h-20h=jantar, 20h-23h=ceia), permitindo o usuário trocar manualmente se quiser. Hoje o `<select>` fica sempre em "almoço" por padrão, mesmo se for outro horário do dia.
- **4b.** Botão de atalho "🔁 Repetir última refeição" ou "Comi o mesmo de [refeição] de ontem" — economiza digitação para refeições repetitivas (ex: café da manhã). Requer guardar/ler também os registros do dia anterior (nova chave de localStorage ou estender a existente).

### Etapa 5 — Resolver conflito entre modo manual (pills) e detecção automática (regex)
- Hoje, se o usuário seleciona manualmente o pill "🧠 O que vou pedir?" mas escreve algo que claramente é um registro (ex: "comi um pão"), o modo manual sempre vence e a IA trata como decisão — pode gerar resposta estranha.
- **Ação:** quando o modo manual estiver ativo mas o regex do modo oposto disparar fortemente, mostrar um aviso sutil acima do input: "Parece que você já comeu isso — quer que eu registre em vez de comparar?" com um botão de troca rápida de modo, em vez de forçar silenciosamente.

### Etapa 6 (maior esforço, maior impacto "viciante") — Cálculo de calorias por foto
- A API do Gemini já suporta input de imagem nativamente (`inlineData` com base64 + `image/jpeg`), então é viável tecnicamente sem trocar de provedor.
- **Ação:**
  1. No front (`pode-nao-pode.html`): adicionar um botão de câmera/anexo ao lado do input de texto, que abre seletor de arquivo/câmera do celular (`<input type="file" accept="image/*" capture="environment">`), converte a imagem para base64, e envia junto com a mensagem (ou sozinha, com um texto padrão tipo "Estime as calorias desta refeição").
  2. No Worker: ajustar o payload enviado ao Gemini para incluir um `parts` adicional do tipo `{ inlineData: { mimeType: "image/jpeg", data: "<base64>" } }` junto da parte de texto, quando uma imagem for enviada.
  3. Ajustar o `systemInstruction` para instruir a IA a, ao receber imagem, deixar claro que é uma **estimativa visual** (ex: "estimativa visual, pode variar ±20%") antes do `[KCAL:X]`, para não gerar falsa confiança no usuário.
  4. Loading state mais longo/diferente para chamadas com imagem (ex: "📸 Analisando sua foto…") já que o tempo de resposta é maior.
  5. Foto deve ser um **modo adicional opcional**, não substituir o texto — ambos devem continuar funcionando.

## 6. O que preciso que você (próximo Claude) peça ao usuário antes de começar

Como você está numa sessão nova sem acesso aos arquivos, solicite ao usuário, na ordem:
1. O conteúdo atual completo de `pode-nao-pode.html` (provavelmente já com os bugs da seção 4 corrigidos — confirme lendo o código).
2. O conteúdo atual completo de `index.js` do Cloudflare Worker (idem).
3. Pergunte se ele quer começar pela **Etapa 1** (reduzir exemplos) — é a mais simples e rápida, recomendada como primeiro passo, e confirme cada etapa concluída antes de avançar para a próxima, para preservar o orçamento de tokens da conversa.
4. Não peça `shared.js`/`shared.css`/`index.html` (calculadora de calorias) a menos que uma etapa específica do plano exija — a maior parte do trabalho das Etapas 1-6 acontece dentro de `pode-nao-pode.html` e do Worker.

## 7. Estilo de trabalho esperado

- Implemente uma etapa por vez, devolvendo o arquivo completo atualizado (não apenas trechos), e explique brevemente o que mudou.
- Pergunte confirmação antes de avançar para a etapa seguinte.
- Mantenha o idioma português do Brasil em toda a interface e nas respostas da IA (systemInstruction do Worker já exige isso — não mude).
- Mantenha a paleta de cores e o sistema de variáveis CSS já existentes (`--verde`, `--amarelo`, `--verm`, `--azul`, dark mode via `[data-theme="dark"]`).
