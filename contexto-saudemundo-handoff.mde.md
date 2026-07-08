# Contexto — SaúdeMundo (site e arquitetura)

> Documento de referência estrutural. Explica o que o site é e como está organizado. Não contém plano de tarefas nem lista de bugs — isso fica em `prompt-implementacao.md`, separado.

## 1. O que é o site

**saudemundo.com.br** é um site estático de calculadoras de saúde: HTML/CSS/JS puro, sem framework, sem build system. Não há backend próprio, **exceto** um Cloudflare Worker usado só para o chat de IA de uma das páginas.

## 2. Estrutura geral

- Todas as páginas incluem `shared.css` e `shared.js` no final do `<body>`.
- `shared.js` injeta dinamicamente: navegação, rodapé, tema claro/escuro, a seção "Outras Calculadoras" (via `SM_TOOLS` + `smRenderOtherTools()`), e gerencia dados do usuário salvos em `localStorage` (`smGetUserData` / `smSaveUserData`).
- 13 ferramentas no total:
  - **10 calculadoras standalone**, independentes entre si: IMC, TMB, Água, Proteína, TDEE, Déficit Calórico, Cutting, Bulking, Macronutrientes, Calorias por Dia.
  - **3 ferramentas conectadas**, que trocam dados entre si via `localStorage`:

| Página | Função |
| --- | --- |
| `index.html` | Calculadora de Calorias e Macros (home). Calcula a meta calórica diária do usuário. |
| `calculadora-queima-calorica.html` | Calculadora de Queima Calórica (fórmula MET). Registra treinos num diário de atividades do dia. |
| `pode-nao-pode.html` | Assistente de decisão alimentar com IA (chat). Semáforo verde/amarelo/vermelho por refeição, com base em % da meta diária. |

## 3. Como as 3 páginas conectadas trocam dados (schema de `localStorage`)

| Chave | Formato | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| `sm-user-data` | `{peso, altura, idade, sexo, atividade, ...}` | `index.html` (`calcular()` → `smSaveUserData()`) | `calculadora-queima-calorica.html` (pré-preenche peso) |
| `sm_pnp_meta_kcal` | número (string) | `index.html`, também editável dentro de `pode-nao-pode.html` | `pode-nao-pode.html` e `calculadora-queima-calorica.html` (modo comparar) |
| `sm_pnp_YYYY-MM-DD` | array de `{id, nome, refeicao, kcal}` | `pode-nao-pode.html` | `pode-nao-pode.html` e `calculadora-queima-calorica.html` |
| `sm_pnp_ativ_YYYY-MM-DD` | array de `{id, nome, kcal}` | `calculadora-queima-calorica.html` | `pode-nao-pode.html` (soma à meta do dia) e a própria calculadora |

**Limitação estrutural conhecida:** cada dia vive numa chave de `localStorage` isolada (`sm_pnp_YYYY-MM-DD`), gerada sempre a partir de `new Date()` no momento em que a página carrega. Não existe hoje um índice central listando quais dias têm dados, nem forma de ler/escrever o registro de um dia diferente do atual.

## 4. Fluxo de uso ideal

Usuário calcula meta na home → (opcional) registra treino na calculadora de queima, aumentando o orçamento calórico do dia → registra/decide refeições no Pode-Não-Pode, cujo semáforo já considera esse crédito extra.

## 5. O que já funciona hoje no Pode-Não-Pode

- Semáforo por refeição (não por dia inteiro): cada refeição tem um peso da meta diária (café 20%, almoço 35%, jantar 20%, lanches 10% cada, ceia 5%), e o semáforo avalia a refeição atual contra esse limite.
- Chat com IA (via Worker) que detecta modo "decisão" (antes de comer) vs. "registro" (depois de comer), com fallback de detecção automática por regex.
- Crédito de treino: calorias queimadas na calculadora de queima somam à meta efetiva do dia, aparecendo como chip clicável.
- Sincronização entre abas via `storage` event + `visibilitychange`.

## 6. Regras gerais de trabalho neste projeto

1. Preservar nomes de funções, IDs e classes existentes sempre que possível.
2. Não mexer em Google Ads, Analytics, Pinterest Tag, meta tags de SEO, JSON-LD, ou nas 10 calculadoras standalone.
3. Qualquer mudança de schema de `localStorage` precisa ser retrocompatível — nunca descartar dados de usuários que já usam o site.
4. Ao entregar código, comentar os trechos alterados (`<!-- ALTERAÇÃO: ... -->` / `// ALTERAÇÃO: ...`).
5. O conteúdo real de cada arquivo (HTML/CSS/JS) deve ser colado na conversa quando necessário — este documento descreve a arquitetura, não substitui o código-fonte atual.
