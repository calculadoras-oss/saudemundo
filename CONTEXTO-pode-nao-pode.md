# CONTEXTO — Projeto "Pode, Não Pode?" (SaúdeMundo)

> **COMO USAR ESTE ARQUIVO**
> Este é o arquivo-mestre único do projeto — substitui os contextos anteriores separados. Cole o conteúdo inteiro no início de qualquer novo chat com o Claude para retomar o trabalho de onde parou.
> Ele tem duas funções: (1) explicar toda a arquitetura e o funcionamento técnico da ferramenta, para que qualquer Claude novo entenda o código sem precisar redescobrir nada; (2) registrar o andamento das melhorias, tanto as já implementadas quanto as planejadas.
> Ao final de cada sessão, peça: **"atualize o arquivo de contexto com o que fizemos hoje"**. O Claude deve editar a seção "STATUS ATUAL", mover itens concluídos para o histórico, e adicionar uma entrada no "LOG DE PROGRESSO". Depois baixe e suba a versão nova no GitHub, substituindo a anterior.

---

## 🔴 STATUS ATUAL (sempre ler isto primeiro)

**Última atualização:** 30/06/2026
**Fase do projeto:** As 6 etapas do plano de melhorias de UX/produto (reorganização do chat, onboarding, atalhos, modo foto) foram concluídas. O roadmap estratégico maior (PWA instalável, registro de atividade física para fechar o ciclo do déficit calórico, gamificação com streak/score/card compartilhável) ainda **não foi iniciado** — está descrito na Seção 5 como próxima fase.

**O que já está pronto e funcionando:**
- Arquitetura de dados entre calculadoras do site (meta calórica calculada em `index.html` flui para `pode-nao-pode.html` via localStorage)
- Chat com IA em dois modos (decisão / registro) com detecção automática por regex
- Semáforo de refeição com pesos proporcionais à meta diária
- 6 bugs de código corrigidos (ver Seção 3.1)
- 6 etapas de melhoria de UX/produto implementadas (ver Seção 3.2)

**O que ainda não existe:**
- PWA instalável (manifest.json, service worker, ícones)
- Registro de gasto calórico por atividade física (hoje só computa consumo, não gasto)
- Gamificação (streak, score, níveis, card semanal compartilhável)
- Qualquer modelo de monetização implementado
- Persistência de dados robusta entre dispositivos (hoje tudo é localStorage — decisão de arquitetura ainda pendente, ver Seção 5.3)

**Próximo passo recomendado:** decidir se a próxima fase de trabalho é (a) seguir para o roadmap estratégico da Seção 5, começando pelo PWA instalável, ou (b) revisar/testar as 6 etapas recém-concluídas antes de avançar. Perguntar ao usuário no início da próxima sessão.

---

## 1. VISÃO GERAL DO PRODUTO

**Nome:** Pode, Não Pode?
**URL atual:** https://www.saudemundo.com.br/pode-nao-pode.html
**O que faz:** Calculadora de decisão alimentar em formato de chat com IA. Antes de comer algo, o usuário pergunta e a IA calcula se cabe no orçamento calórico da refeição/dia (modo **decisão**), ou registra o que já comeu e lança as calorias no diário do dia (modo **registro**). Tem semáforo visual (verde/amarelo/vermelho) distribuído por refeição (café, almoço, jantar etc.), não só por dia — isso evita descobrir só à noite que estourou o limite.

**Diferencial frente à concorrência** (Nutrilio, Yazio, Lifesum, MyFitnessPal, Tecnonutri, Dieta.ai): nenhum concorrente combina *decisão prévia (antes de comer) + semáforo por refeição + IA conversacional em português* no mesmo produto.

**Limitação estratégica ainda não resolvida:** o princípio do déficit calórico é consumir menos OU gastar mais — hoje a ferramenta só computa a primeira metade (consumo). Gasto por atividade física está no roadmap (Seção 5.1) mas não foi implementado.

**Visão de longo prazo do dono do projeto:** transformar em APP nativo. Passo intermediário planejado: PWA (Progressive Web App) instalável na tela inicial do celular, com cara de app próprio, independente visualmente do domínio saudemundo.com.br.

**É um site estático** (HTML/CSS/JS puro, sem framework/build), hospedado em hosting estático simples, com um backend de IA via **Cloudflare Worker** separado.

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Arquivos-chave e seus papéis

- **`shared.js`** — JS compartilhado entre TODAS as páginas do site. Injeta nav/footer, controla tema (dark/light), expõe funções globais de persistência de dados do usuário entre calculadoras:
  - `smSaveUserData(obj)` — salva dados pessoais (peso, altura, idade, sexo, atividade) em localStorage para reaproveitar entre calculadoras.
  - `smGetUserData()` — lê esses dados de volta.
  - `showToast(msg)` — exibe notificação rápida na tela.
  - **Conteúdo real deste arquivo ainda não foi visto por nenhum Claude em nenhuma sessão** — apenas inferido pelas chamadas feitas nele. Se for necessário alterar algo dentro do `shared.js` em si, é preciso pedir ao usuário o conteúdo completo.
- **`shared.css`** — CSS global compartilhado (cores, variáveis de tema dark/light, layout base).
- **`index.html`** — Calculadora principal de Calorias e Macros. Fórmula de Mifflin-St Jeor para TMB, ajusta TDEE por objetivo (emagrecer −500kcal / manter / ganhar +300kcal), calcula macros por percentuais que variam por objetivo. Ao final do cálculo, salva a meta em `localStorage.setItem('sm_pnp_meta_kcal', String(meta))` — esta é a **ponte de dados** entre a calculadora principal e a "Pode, Não Pode?". Tem um botão "🚦 Usar no Pode, Não Pode?" que salva a meta e redireciona para `pode-nao-pode.html`.
- **`pode-nao-pode.html`** — A calculadora-alvo do projeto. Chat com IA em dois modos (decisão/registro). Detalhada na Seção 2.3.
- **Cloudflare Worker** (tipo `index.js`, deployado em algo como `https://summer-hill-da28.philipdesousa.workers.dev`) — backend serverless que recebe as mensagens do chat e chama a API do Gemini (Google) para calcular calorias/comparar opções. Tem um `systemInstruction` que define o comportamento da IA (detectar modo decisão/registro/misto, retornar `[KCAL:X]` na última linha quando for registro).

### 2.2 Fluxo de dados (de onde vem cada informação)

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
     → ao lançar, registro vai para localStorage do dia (chave sm_pnp_YYYY-MM-DD)
     → semáforo e barra de progresso são recalculados com base nos registros do dia
```

### Chaves de localStorage confirmadas
- `sm_pnp_meta_kcal` — meta diária em kcal, escrita pelo `index.html`, lida pela `pode-nao-pode.html`.
- `sm_pnp_YYYY-MM-DD` (data do dia atual) — array de registros de comida do dia, somente na `pode-nao-pode.html`. Reseta à meia-noite porque a chave muda de dia para dia.
- Chave usada por `smSaveUserData`/`smGetUserData` — **desconhecida**, pedir `shared.js` se necessário.

### 2.3 Estrutura da página `pode-nao-pode.html` (de cima para baixo)

1. Header com título e tagline
2. `.painel-topo` — semáforo compacto (luz verde/amarelo/vermelho + veredicto + 3 chips: Dia/Saldo/Itens) — **desde a Etapa 2, só aparece depois do primeiro registro do dia**
3. `.bar-wrap` — barra de progresso do dia (kcal consumidos vs meta) — unificada com os 3 chips desde a Etapa 3
4. `.meta-card` — card colapsável para definir a meta diária manualmente (ou já vem preenchido vindo do `index.html`)
5. `.modo-pills` — dois botões: "🧠 O que vou pedir?" (decisão) e "📊 Vou comer isso" (registro), além do modo "auto" (detecção automática por regex)
6. `.modo-hint` — texto explicando o modo atual
7. Seletor de refeição (`<select>`: café, lanche manhã, almoço, lanche tarde, jantar, ceia) — **desde a Etapa 4a, pré-selecionado automaticamente por horário**
8. `.limite-refeicao` — mostra limite kcal daquela refeição (% da meta) e quanto já foi usado
9. `.chat-exemplos` — chips de exemplo — **desde a Etapa 1, reduzidos a 2 por modo e ocultos após a primeira mensagem enviada**
10. `.chat-mensagens` — janela de chat com histórico
11. Input de texto + botão enviar + **botão de câmera/anexo (Etapa 6, modo foto)**
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
**Desde a Etapa 5:** quando o modo manual está ativo mas o regex do modo oposto dispara fortemente, um aviso sutil aparece acima do input oferecendo trocar de modo, em vez de forçar silenciosamente o modo manual.

### Pesos de refeição sobre a meta diária
```js
const PESO_REFEICAO = { cafe:0.20, lanche1:0.10, almoco:0.35, lanche2:0.10, jantar:0.20, ceia:0.05 };
```

---

## 3. HISTÓRICO DE MUDANÇAS JÁ IMPLEMENTADAS

### 3.1 Bugs corrigidos
1. **Worker usando modelos Gemini desativados** (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`, descontinuados pelo Google em jun/2026) — causava falha total e silenciosa ("Não consegui calcular agora"). Corrigido trocando para `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-3.1-flash-lite`.
2. **Worker descartava o histórico da conversa**, enviando só a última mensagem ao Gemini. Corrigido: agora converte e envia `messages` inteiro, mapeando `role: "assistant"` → `"model"`.
3. **Worker escondia o erro real** quando todos os modelos falhavam. Corrigido: agora devolve `debug_erro` no JSON de resposta.
4. **`setSexo()` no `index.html`** tinha bug de `localStorage.setItem('sm_pnp_meta_kcal', String(meta))` com a variável `meta` fora de escopo (erro silencioso engolido por `try/catch` vazio) e tinha perdido a lógica de marcar o botão M/F como ativo. Corrigido: linha incorreta removida de dentro de `setSexo()`, toggle de classe `active` restaurado, salvamento da meta movido para dentro de `calcular()`.
5. **Faltava forma explícita de exportar a meta calculada** do `index.html` para o `pode-nao-pode.html`. Corrigido: botão "🚦 Usar no Pode, Não Pode?" adicionado, com função `enviarParaPodeNaoPode()`.
6. **Dois blocos `<script type="application/ld+json"> FAQPage </script>` duplicados** no `<head>` do `index.html` — unificados em um único bloco com 9 perguntas.

### 3.2 Etapas de melhoria de UX/produto — concluídas

**Etapa 1 — Redução de exemplos:** de 8 chips (4 decisão + 4 registro) para 2 por modo, ocultos permanentemente após a primeira mensagem enviada. Título único: "Toque um exemplo ou escreva o seu:".

**Etapa 2 — Reorganização do onboarding:** no estado vazio (sem registros do dia), o semáforo é escondido e substituído por: "Me diga o que vai pedir ou o que já comeu — eu cuido do resto 🚦", com o input em foco. Semáforo e barra de progresso só aparecem após o primeiro registro do dia.

**Etapa 3 — Compactação do painel:** semáforo reduzido a uma faixa fina tipo "status bar" (luz + veredicto curto). Os 3 chips (Dia/Saldo/Itens) unificados dentro da `.bar-wrap`, eliminando disputa de espaço vertical com o chat.

**Etapa 4 — Atalhos de baixa fricção:**
- 4a. Seleção automática de refeição por horário (`new Date().getHours()`), com opção de troca manual.
- 4b. Atalho "🔁 Repetir última refeição" / "Comi o mesmo de [refeição] de ontem".

**Etapa 5 — Resolução de conflito de modo:** aviso sutil quando o modo manual e a detecção automática discordam fortemente, com botão de troca rápida em vez de forçar silenciosamente.

**Etapa 6 — Cálculo de calorias por foto:** botão de câmera/anexo (`<input type="file" accept="image/*" capture="environment">`), imagem convertida para base64 e enviada ao Worker, que inclui `{ inlineData: { mimeType: "image/jpeg", data: "<base64>" } }` no payload do Gemini. `systemInstruction` ajustado para a IA sinalizar "estimativa visual, pode variar ±20%" antes do `[KCAL:X]`. Loading state diferenciado ("📸 Analisando sua foto…"). Foto é modo adicional opcional — texto continua funcionando normalmente.

> **Nota de verificação:** este merge marca as 6 etapas como concluídas com base na confirmação do usuário. Antes de fazer qualquer alteração nova nesses trechos, é recomendável pedir o código atual de `pode-nao-pode.html` e do Worker para confirmar que tudo está exatamente como descrito aqui.

---

## 4. ARQUITETURA DE IA — DECISÃO E RESTRIÇÕES

**Provedor:** Gemini API, tier gratuito (Google AI Studio).
**Modelos em uso no Worker (fallback em sequência):** `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-3.1-flash-lite`. Não usar Pro — cota gratuita de Pro é muito restrita (~50 req/dia).

**Limites do tier gratuito (referência, sujeito a mudança pelo Google):**
- ~1.500 requisições/dia, 1 milhão de tokens/minuto (Flash/Flash-Lite)
- Cota é por *projeto* Google Cloud, não por chave de API
- Reset diário à meia-noite horário do Pacífico (PT)

**Riscos documentados:**
1. Google já reduziu cotas gratuitas em 50–80% sem aviso prévio (dez/2025) — pode acontecer de novo.
2. Ativar billing no projeto **elimina o tier gratuito inteiro** — todo uso passa a ser cobrado desde o primeiro token.
3. Prompts do tier gratuito podem ser usados pelo Google para treinar modelos — atenção se a IA-coach passar a coletar dados de saúde mais sensíveis.

**Recomendação ainda não implementada:** criar uma camada fina de abstração para chamadas de IA no Worker (função tipo `callAI(prompt)`) que permita trocar de provedor por configuração, não por reescrita, caso a cota gratuita aperte.

**Nota sobre o modelo do Worker (importante manter atualizado):** a lista de modelos no Worker precisou ser trocada uma vez porque o Google descontinuou modelos antigos sem aviso (ver bug #1 na Seção 3.1). Isso pode se repetir — se a IA voltar a falhar silenciosamente, checar primeiro se os nomes de modelo no Worker ainda existem na API do Gemini.

---

## 5. ROADMAP ESTRATÉGICO — PRÓXIMA FASE (ainda não iniciada)

### 5.1 PWA instalável
Tornar a página instalável na tela inicial do celular (ícone próprio, abre em tela cheia, sem barra de navegador).
**Requisitos técnicos:** HTTPS (já tem), `manifest.json`, Service Worker, ícones em 192x192 e 512x512.
**Esforço estimado:** 1–2 dias.

### 5.2 Registro de atividade física (fecha o ciclo do déficit calórico)
Modo no chat (`🏃 Treinei hoje`) onde o usuário descreve a atividade em linguagem natural ("corri 5km em 30 min") e a IA estima o gasto calórico (fórmulas MET) e soma ao saldo do dia, aumentando a meta calórica disponível.
**Fase futura (não é MVP):** integração com Apple Health / Google Fit — só faz sentido na versão app nativo.
**Esforço estimado:** 3–4 dias.

### 5.3 Gamificação (streak + score + card compartilhável)
- **Streak diário:** dias consecutivos dentro da meta.
- **Sistema de pontos:** dentro da meta (+10), atividade registrada (+5), alimento saudável identificado (+3), uso do modo decisão antes de comer (+2), semana perfeita (bônus +30).
- **Card semanal compartilhável:** resumo visual (dias na meta, streak, treinos, déficit acumulado, score, nível) pronto para redes sociais — motor de crescimento orgânico principal.
- **Níveis:** Iniciante → Consciente → Guerreiro → Mestre do Déficit → Lenda.
**Esforço estimado:** 4–5 dias (streak+score) + 2–3 dias (geração do card).

**Gargalo técnico central desta fase:** hoje os dados só existem em localStorage. Isso quebra streak, score acumulado e card semanal, porque some se o usuário trocar de navegador/celular ou limpar cache.
**Decisão pendente:** localStorage robusto (mais rápido, frágil) vs. backend leve com login sem senha / magic link (mais correto para o futuro app nativo, mais esforço). **Precisa ser resolvida antes de começar o streak/score.**

### 5.4 IA como coach (evolução do prompt, não feature isolada)
Expandir o papel da IA além do cálculo: sugestões pré-refeição, incentivo pós-treino, identificação de padrões ("você sempre extrapola no jantar"), respostas sobre dúvidas de treino e alimentação.

### Roadmap de referência (14 dias, ajustar datas reais conforme execução)
| Dias | Entrega | Depende de |
|------|---------|------------|
| 1–2 | Decidir arquitetura de dados + PWA manifest/service worker | — |
| 3–5 | Registro de atividade física no chat | — (paralelo aos dias 1–2) |
| 6–9 | Streak + score diário persistido | Dias 1–2 resolvidos |
| 10–12 | Card semanal compartilhável | Dias 6–9 |
| 13–14 | Testes, ajuste de prompts da IA-coach, polimento geral | Tudo anterior |

---

## 6. MONETIZAÇÃO — MODELOS AVALIADOS (nenhum implementado ainda)

**Princípio geral:** não monetizar antes de provar retenção (streak) e viralização (card compartilhável).

1. **B2B2C — licença para nutricionistas/personal trainers** *(modelo prioritário de médio prazo)*. Profissional paga licença mensal (ex: R$ 49–99/mês) para dar acesso à ferramenta a um grupo de pacientes/alunos, com dashboard de acompanhamento. *B2B2C = Business to Business to Consumer: vende-se para o profissional, que oferece o acesso ao cliente final dele.*
2. **Freemium leve** — versão grátis generosa, paga desbloqueia histórico ilimitado, export de dados, card sem marca d'água, badges exclusivos.
3. **Apoio voluntário / "pague o que puder"** — botão de doação (Pix ou assinatura simbólica R$5–10/mês), baixa fricção.
4. **Conteúdo educacional pago** — ex: programa estruturado de 30 dias, venda única.
5. **Marketplace de afiliados alimentares** — comissão por indicação. Usar com cautela: risco de comprometer a percepção de neutralidade da IA.
6. **Dados agregados anonimizados** — exige LGPD bem resolvido, só com volume grande de usuários. Longo prazo.
7. **White-label B2B** — venda para empresas como benefício corporativo. Ciclo de venda lento, ticket maior. Longo prazo.

### Sequência recomendada
| Fase | Ação |
|------|------|
| Fase atual | Concluir roadmap estratégico (Seção 5) antes de qualquer monetização |
| +1–2 meses após lançar gamificação | Testar botão de apoio/doação (modelo 3) — risco zero |
| +2–3 meses | Validar interesse de 3–5 nutricionistas com conversas reais (modelo 1) antes de construir qualquer coisa |
| +6 meses | Se tração for boa, formalizar B2B2C como motor principal de receita |

---

## 7. LOG DE PROGRESSO (entrada mais recente no topo)

### 30/06/2026 — Merge dos contextos + confirmação das 6 etapas concluídas
- Unificado o arquivo de contexto estratégico (visão de produto, roadmap de PWA/atividade física/gamificação, monetização) com o arquivo de contexto técnico (arquitetura de código, fluxo de dados, bugs corrigidos, 6 etapas de melhoria de UX).
- Confirmado pelo usuário que as 6 etapas do plano de UX (redução de exemplos, onboarding, compactação do painel, atalhos, resolução de conflito de modo, cálculo por foto) estão implementadas.
- Roadmap estratégico maior (PWA, atividade física, gamificação, monetização) permanece como próxima fase, ainda não iniciada.
- Este arquivo passa a ser o único documento de contexto do projeto — os dois arquivos anteriores separados podem ser descontinuados.

### (sessão anterior, sem data exata registrada) — Correção de bugs e implementação das 6 etapas de UX
- Diagnosticados e corrigidos 6 bugs de código (modelos Gemini desativados, histórico de chat descartado, erros escondidos, bug de escopo em `setSexo()`, falta de ponte de dados entre calculadoras, JSON-LD duplicado).
- Implementado plano de 6 etapas de melhoria de UX aprovado pelo usuário.

### 30/06/2026 (sessão anterior) — Planejamento estratégico inicial
- Analisada a ferramenta e comparada com concorrentes (Nutrilio, Yazio, Lifesum, MyFitnessPal, Tecnonutri, Dieta.ai).
- Definidas as 3 melhorias estratégicas maiores: PWA instalável, registro de atividade física, gamificação com card compartilhável.
- Decidido usar Gemini API tier gratuito como provedor de IA, com riscos documentados.
- Mapeados 7 modelos de monetização, priorizado B2B2C como caminho de médio prazo.

---

## 8. INSTRUÇÕES PARA O CLAUDE (em novos chats, ao receber este arquivo)

1. Leia a seção "STATUS ATUAL" primeiro para saber exatamente onde o projeto está.
2. Antes de alterar qualquer trecho de código descrito nas Seções 2 ou 3, peça ao usuário o conteúdo atual de `pode-nao-pode.html` e/ou do Worker (`index.js`) — este arquivo descreve a arquitetura e o histórico, mas não substitui o código real.
3. Não peça `shared.js`/`shared.css`/`index.html` (calculadora principal) a menos que a tarefa em questão exija especificamente.
4. Confirme com o usuário qual item da Seção 5 (roadmap estratégico) será trabalhado nesta sessão, já que essa é a fase atual do projeto.
5. Implemente uma etapa por vez, devolvendo o arquivo completo atualizado (não apenas trechos), e explique brevemente o que mudou.
6. Ao final da sessão, se o usuário pedir para atualizar o contexto, edite este mesmo arquivo: atualize "STATUS ATUAL", adicione uma nova entrada no topo do "LOG DE PROGRESSO", e mova itens concluídos da Seção 5 para a Seção 3.
7. Mantenha o idioma português do Brasil em toda a interface e nas respostas da IA.
8. Mantenha a paleta de cores e o sistema de variáveis CSS já existentes (`--verde`, `--amarelo`, `--verm`, `--azul`, dark mode via `[data-theme="dark"]`).
