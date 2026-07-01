# CONTEXTO — Projeto "Pode, Não Pode?" (App de Decisão Alimentar com IA)

> **COMO USAR ESTE ARQUIVO**
> Este é o arquivo-mestre do projeto. Cole ele inteiro no início de qualquer novo chat com o Claude para retomar o trabalho de onde parou.
> Ao final de cada sessão de trabalho, peça ao Claude: **"atualize o arquivo de contexto com o que fizemos hoje"** — ele deve editar a seção "STATUS ATUAL" no topo e adicionar uma entrada no "LOG DE PROGRESSO" no final.
> Depois, baixe o arquivo atualizado e suba no GitHub (substituindo o anterior).

---

## 🔴 STATUS ATUAL (sempre ler isto primeiro)

**Última atualização:** 30/06/2026
**Fase do projeto:** Planejamento concluído. Ainda não iniciada a implementação.
**Próximo passo imediato:** Decidir arquitetura de persistência de dados (ver Bloco 1 do roadmap) e começar o PWA (manifest + service worker).

**Decisões já fechadas:**
- Ferramenta de IA: **Gemini API (tier gratuito)** — Flash/Flash-Lite, não Pro
- Meta de custo: manter em R$ 0 na fase inicial
- Prazo alvo do MVP das 3 melhorias: 14 dias corridos a partir de 30/06/2026
- Modelo de negócio futuro priorizado: **B2B2C** (licença para nutricionistas/personal trainers)
- Passo intermediário antes do app nativo: **PWA instalável** (site com cara de app, sem loja de aplicativos)

**Ainda em aberto / decisão pendente:**
- [ ] Arquitetura de persistência: localStorage robusto vs. backend leve com login (magic link)
- [ ] Ferramenta de geração de imagem para o card semanal compartilhável
- [ ] Ícones do PWA (192x192 e 512x512) — precisam ser desenhados/exportados

---

## 1. O QUE É O PROJETO

**Nome:** Pode, Não Pode?
**URL atual:** https://www.saudemundo.com.br/pode-nao-pode.html
**O que faz hoje:** Calculadora de decisão alimentar. Antes de comer algo, o usuário pergunta e a IA calcula se cabe no orçamento calórico da refeição/dia, com lógica de semáforo (verde/amarelo/vermelho) distribuída por refeição (café, almoço, jantar etc.), não só por dia.

**Diferencial já identificado frente à concorrência** (Nutrilio, Yazio, Lifesum, MyFitnessPal, Tecnonutri, Dieta.ai): nenhum concorrente combina *decisão prévia (antes de comer) + semáforo por refeição + IA conversacional em português* no mesmo produto. Esse é o ângulo a proteger e amplificar.

**Limitação central hoje:** só computa consumo (o que se come). Não computa gasto (atividade física). O princípio do déficit calórico é: consumir menos OU gastar mais — hoje só a primeira metade existe na ferramenta.

**Visão de futuro do dono do projeto:** transformar em APP nativo. Passo intermediário: PWA (Progressive Web App) instalável na tela inicial do celular, independente do domínio saudemundo.com.br visualmente (cara de app próprio).

---

## 2. AS 3 MELHORIAS PRIORITÁRIAS (definidas e validadas)

### 🥇 Melhoria 1 — PWA instalável
Tornar a página instalável na tela inicial do celular (ícone próprio, abre em tela cheia, sem barra de navegador).
**Requisitos técnicos:** HTTPS (já tem), `manifest.json`, Service Worker, ícones em 192x192 e 512x512.
**Esforço estimado:** 1-2 dias.

### 🥈 Melhoria 2 — Registro de atividade física (fecha o ciclo do déficit calórico)
Adicionar um modo no chat (`🏃 Treinei hoje`) onde o usuário descreve a atividade em linguagem natural ("corri 5km em 30 min") e a IA estima o gasto calórico (fórmulas MET) e soma ao saldo do dia, aumentando a meta calórica disponível.
**Fase 2 futura (não é MVP):** integração com Apple Health / Google Fit via APIs nativas — só faz sentido na versão app nativo.
**Esforço estimado:** 3-4 dias.

### 🥉 Melhoria 3 — Gamificação (streak + score + card compartilhável)
- **Streak diário:** dias consecutivos dentro da meta, exibido com indicador visual (estilo Duolingo).
- **Sistema de pontos:** dentro da meta (+10), atividade registrada (+5), alimento saudável identificado (+3), uso do modo decisão antes de comer (+2), semana perfeita (bônus +30).
- **Card semanal compartilhável:** resumo visual gerado automaticamente (dias na meta, streak, treinos, déficit acumulado, score, nível) pronto para postar no Instagram/WhatsApp. É o motor de crescimento orgânico principal.
- **Níveis:** Iniciante → Consciente → Guerreiro → Mestre do Déficit → Lenda.
**Esforço estimado:** 4-5 dias (streak+score) + 2-3 dias (geração do card).

### Bônus — IA como coach (não é feature isolada, é evolução do prompt)
Expandir o papel da IA além do cálculo: sugestões pré-refeição, incentivo pós-treino, identificação de padrões ("você sempre extrapola no jantar"), respostas sobre dúvidas de treino e alimentação.

---

## 3. GARGALO TÉCNICO CENTRAL (resolver primeiro)

Hoje os dados só existem em localStorage (armazenamento local do navegador). Isso **quebra** streak, score acumulado e card semanal, porque some se o usuário trocar de navegador/celular ou limpar cache.

**Decisão necessária antes de codar streak/score:**
- Opção A: localStorage robusto (mais rápido de implementar, mas frágil — usuário pode perder progresso)
- Opção B: backend leve com login sem senha (magic link por e-mail ou telefone), sincroniza entre dispositivos — mais correto para o futuro app nativo, mas adiciona dias de trabalho de infraestrutura no início

> Esta decisão trava o início do Bloco 3 (gamificação) do roadmap abaixo. Resolver no Dia 1-2.

---

## 4. ROADMAP DE 14 DIAS (referência, ajustar datas reais conforme execução)

| Dias | Entrega | Depende de |
|------|---------|------------|
| 1–2  | Decidir arquitetura de dados (A ou B acima) + PWA manifest/service worker | — |
| 3–5  | Registro de atividade física no chat (IA estima gasto via MET, soma ao saldo) | — (pode rodar em paralelo aos dias 1-2) |
| 6–9  | Streak + score diário persistido | Dias 1-2 resolvidos |
| 10–12 | Card semanal compartilhável (geração de imagem) | Dias 6-9 |
| 13–14 | Testes, ajuste de prompts da IA-coach, polimento geral | Tudo anterior |

---

## 5. ARQUITETURA DE IA — DECISÃO E RESTRIÇÕES

**Provedor escolhido:** Gemini API, tier gratuito (Google AI Studio).
**Modelo:** Flash ou Flash-Lite (não usar Pro — cota gratuita de Pro é muito restrita: ~50 req/dia).

**Limites do tier gratuito (referência, sujeito a mudança pelo Google):**
- ~1.500 requisições/dia, 1 milhão de tokens/minuto (Flash/Flash-Lite)
- Cota é por *projeto* Google Cloud, não por chave de API — criar múltiplas chaves não aumenta cota
- Reset diário à meia-noite horário do Pacífico (PT)

**Riscos identificados (importante lembrar em qualquer decisão futura):**
1. Google já reduziu cotas gratuitas em 50-80% sem aviso prévio (dez/2025) — pode acontecer de novo
2. Ativar billing no projeto **elimina o tier gratuito inteiro**, não complementa — todo uso passa a ser cobrado desde o primeiro token
3. Prompts do tier gratuito podem ser usados pelo Google para treinar modelos (não acontece no tier pago) — atenção se a IA-coach passar a coletar dados de saúde mais sensíveis

**Recomendação de arquitetura:** construir uma camada fina de abstração para chamadas de IA (ex: função `callAI(prompt)`) que hoje chama Gemini, mas permite trocar de provedor por configuração, não por reescrita, caso a cota gratuita aperte no futuro.

---

## 6. MONETIZAÇÃO — MODELOS AVALIADOS E SEQUÊNCIA RECOMENDADA

**Princípio geral:** não monetizar nas primeiras semanas. Foco total em provar retenção (streak) e viralização (card compartilhável) primeiro. Monetização prematura tende a matar crescimento orgânico.

### Modelos avaliados (do mais ao menos prioritário)

1. **B2B2C — licença para nutricionistas/personal trainers** *(modelo prioritário de médio prazo)*
   Profissional paga licença mensal (ex: R$ 49-99/mês) para dar acesso à ferramenta a um grupo de pacientes/alunos, com dashboard de acompanhamento. Resolve o problema real de apps de saúde perderem efeito sem supervisão humana. Reduz custo de aquisição de usuário (o profissional traz a carteira) e aumenta retenção (alguém cobra o uso).
   *B2B2C = Business to Business to Consumer: você vende para o profissional, que oferece para o cliente final dele.*

2. **Freemium leve** — versão grátis generosa (custo de IA é baixo/zero via Gemini), paga desbloqueia: histórico ilimitado, export de dados, card sem marca d'água, badges exclusivos.

3. **Apoio voluntário / "pague o que puder"** — botão de doação (Pix ou assinatura simbólica R$5-10/mês), baixa fricção, não compromete acesso gratuito de ninguém. Bom primeiro teste de termômetro de disposição a pagar.

4. **Conteúdo educacional pago** — ex: programa estruturado de 30 dias, venda única, baixa manutenção.

5. **Marketplace de afiliados alimentares** — comissão por indicação (delivery, produtos saudáveis). *Usar com cautela* — risco de comprometer a percepção de neutralidade da IA, que é o maior diferencial do produto. Só considerar em fase madura.

6. **Dados agregados anonimizados** — valor para pesquisa/indústria, exige LGPD bem resolvido desde o desenho do banco. Só faz sentido com volume grande de usuários. Longo prazo.

7. **White-label B2B** — venda para empresas como benefício corporativo de saúde. Ciclo de venda lento, ticket maior. Longo prazo.

### Sequência recomendada
| Fase | Ação |
|------|------|
| Agora – Mês 2 | Tudo grátis. Foco 100% em retenção e viralização (streak + card) |
| Mês 2–3 | Testar botão de apoio/doação (modelo 3) — risco zero |
| Mês 3–4 | Validar interesse de 3-5 nutricionistas com conversas reais (modelo 1) antes de construir qualquer coisa |
| Mês 6+ | Se tração for boa, formalizar B2B2C como motor principal de receita |

---

## 7. LOG DE PROGRESSO (adicionar uma entrada nova a cada sessão, mais recente no topo)

### 30/06/2026 — Sessão de planejamento inicial
- Analisada a ferramenta atual e comparada com concorrentes (Nutrilio, Yazio, Lifesum, MyFitnessPal, Tecnonutri, Dieta.ai)
- Definidas as 3 melhorias prioritárias: PWA instalável, registro de atividade física, gamificação com card compartilhável
- Identificado o gargalo técnico central: ausência de persistência robusta de dados entre sessões/dispositivos
- Decidido usar Gemini API tier gratuito como provedor de IA, com ressalvas documentadas sobre riscos de mudança de cota
- Mapeados 7 modelos de monetização, priorizado B2B2C (licença para nutricionistas) como caminho de médio prazo
- Roadmap de 14 dias esboçado
- **Nenhuma linha de código escrita ainda.** Próxima sessão deve começar pela decisão de arquitetura de dados (Seção 3) e iniciar o PWA.

---

## 8. INSTRUÇÕES PARA O CLAUDE (em novos chats, ao receber este arquivo)

Ao receber este documento colado no início de um chat:
1. Leia a seção "STATUS ATUAL" primeiro para saber exatamente onde o projeto está.
2. Confirme com o usuário qual bloco do roadmap será trabalhado nesta sessão.
3. Ao final da sessão, se o usuário pedir para atualizar o contexto, edite este mesmo arquivo: atualize "STATUS ATUAL", adicione uma nova entrada no topo do "LOG DE PROGRESSO", e marque itens concluídos nas checklists.
4. Gere o arquivo atualizado para download, para o usuário subir no GitHub substituindo a versão anterior.
