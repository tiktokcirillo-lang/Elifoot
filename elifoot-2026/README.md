# Elifoot 2026

Jogo de gerenciamento de futebol em PWA, inspirado em Elifoot e Brasfoot, construído com stack moderno em React + TypeScript.

## Stack

- **Vite + React 18 + TypeScript** — bundler rápido, tipagem estática
- **Tailwind CSS** — design system utilitário
- **Zustand** — state management leve (mais simples que Redux para jogos)
- **Dexie (IndexedDB)** — save offline persistente, suporta saves grandes
- **vite-plugin-pwa + Workbox** — service worker, manifesto, instalável
- **Framer Motion** — animações de partida
- **React Router** — roteamento SPA
- **Lucide React** — ícones

## Como rodar

```bash
npm install
npm run dev          # desenvolvimento em http://localhost:5173
npm run build        # build de produção em /dist
npm run preview      # preview do build
```

Para instalar como PWA: rode o build, sirva a pasta `dist`, abra no Chrome/Edge e clique em "Instalar app" na barra de endereço.

## Estrutura do projeto

```
src/
  types/          → modelo de domínio (Player, Team, Match, Competition, Save)
  engine/         → motor de simulação minuto a minuto e gerador de jogadores
  competitions/   → geradores de Brasileirão, Copa do Brasil, Libertadores, Champions, Mundial, Paulistão, Copa do Mundo
  data/           → seeds de times brasileiros, sul-americanos e europeus
  store/          → Zustand store com lógica de gameplay
  db/             → Dexie/IndexedDB para save offline
  components/     → Layout, navegação
  pages/          → Home, NewGame, Dashboard, Match, Table, Squad, Fixtures
  utils/          → utilitários (RNG seeded, etc)
```

## O que já está pronto (Fase 1)

- 20 times do Brasileirão Série A com elencos gerados proceduralmente (25 jogadores cada, atributos por posição)
- Motor de simulação minuto a minuto: força ofensiva/defensiva, vantagem de mando, posse de bola, eventos (gols, cartões, escanteios), narração textual
- Brasileirão pontos corridos completo (38 rodadas, ida e volta, classificação ordenada por pontos > vitórias > saldo > gols pró)
- Tela de partida com narração animada e placar evoluindo minuto a minuto
- Save/load via IndexedDB (funciona offline)
- PWA instalável com service worker
- Avanço de turno simulando partidas dos outros times automaticamente
- Tela de elenco com escolha de titulares
- Tela de calendário com todas as partidas do clube do usuário
- Geradores prontos para Copa do Brasil, Libertadores, Champions League (formato suíço), Mundial de Clubes (32 times), Copa do Mundo, Paulistão (basta ativar no `gameStore.generateInitialCompetitions`)

## Roadmap das próximas fases

### Fase 2 — Mais competições e calendário integrado
- Ativar Copa do Brasil, Libertadores, Paulistão, Champions, Mundial e Copa do Mundo no calendário
- Resolver conflitos de datas (DDA: Distribuição de Datas Automática)
- Sistema de classificação para Libertadores via Brasileirão e Copa do Brasil
- Avanço de fases mata-mata com regra do gol fora desativada (regulamento atual)

### Fase 3 — Mercado de transferências
- IA de mercado: clubes oferecem propostas baseadas em reputação, valor e posição carente
- Negociação de salário e luvas
- Janela de transferências (pré-temporada e meio do ano)
- Empréstimos e renovações de contrato

### Fase 4 — Treino e desenvolvimento
- Sistema de treinos semanais (foco em atributos)
- Evolução de jogadores jovens (com "potencial" oculto)
- Categorias de base que sobem para o profissional
- Lesões com gravidade variável e recuperação por fitness/idade

### Fase 5 — Finanças, board e patrocínios
- Receita de bilheteria por jogo (depende de mando, importância, desempenho)
- Patrocínios principais e de manga
- Direitos de TV variando por divisão
- Metas da diretoria com risco de demissão

### Fase 6 — Táticas avançadas e instruções
- Pré-jogo: postura (defensiva, equilibrada, ofensiva), pressão, marcação
- Substituições durante a partida (a tela de partida já suporta a estrutura)
- Set pieces (cobrador de pênalti, falta, escanteio)

### Fase 7 — Modo multitemporada
- Ciclo de temporadas com aposentadoria, novos contratos, mudanças de elenco da IA
- Ranking histórico (títulos, recordes pessoais)
- Hall da fama dos jogadores criados

### Fase 8 — Polimento
- Sons (apito, gol, torcida) com Howler.js
- Animação de campo 2D na partida (em vez de só texto), com SVG ou Canvas
- Localização (PT-BR, EN, ES)
- Editor de elenco e times customizados
- Sincronização de save em nuvem opcional (Supabase ou Firebase)

## Notas técnicas

**Sobre o motor de simulação.** O simulador trabalha em granularidade de minuto a minuto, com probabilidade de evento ajustada pela soma de força ofensiva dos dois times. A vantagem de mando é fixa em 8% e pode ser exposta como parâmetro no futuro. O `pickWeighted` de marcadores prioriza atacantes (peso 5), depois meias (peso 2), e raramente zagueiros (peso 0,6) — refletindo a distribuição real de gols em uma temporada.

**Sobre a Champions formato suíço.** O algoritmo de pareamento garante que cada time enfrente 8 adversários únicos, com 4 jogos em casa e 4 fora, distribuídos em rodadas onde nenhum time joga duas vezes na mesma rodada. Isso é uma simplificação do sorteio real da UEFA (que usa pots e restrições por país), mas funciona para o jogo.

**Sobre saves grandes.** O Zustand mantém o save em memória, e o Dexie persiste no IndexedDB. Para um save com 50+ times e várias temporadas de histórico, o JSON pode passar de 5 MB — o IndexedDB suporta isso sem problema. Para reduzir, é possível migrar para deltas (apenas mudanças desde o último save) na Fase 8.

**Sobre a estrutura de pastas.** A separação `engine/` ↔ `competitions/` ↔ `store/` é deliberada: o engine não conhece o store, o store não conhece a UI. Isso permite testar o simulador isoladamente com Vitest e eventualmente rodá-lo em Web Worker para não travar a UI durante simulações em massa.
