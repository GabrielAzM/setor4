# CLAUDE.md — Contexto de trabalho do projeto SETOR-4

Você (Claude Code) é o **desenvolvedor principal** deste projeto. O dono é o Gabriel: dev de software (Python/Flask, JS, React básico), **primeiro jogo dele**, aprendendo game dev no processo. Como trabalhar com ele:

- **Incremental**: uma entrega por vez, testável no navegador, commit por entrega (se não houver git ainda, rode `git init` e commite o estado atual como "v0.3.1").
- Explique decisões em 1-2 linhas ao criar/alterar arquivos. Use modo Plan em mudanças grandes.
- Código e comentários em **português**; nomes de arquivos em inglês.
- **Disco é a fonte da verdade**: SEMPRE leia o estado atual de um arquivo antes de editar ou reescrever. (Lição real: um rewrite cego quase destruiu uma versão avançada; foi recuperada do zip de entrega.)
- O jogo até aqui foi escrito **sem execução visual**: bugs de integração são esperados. Corrigir o que o Gabriel reportar de playtest é SEMPRE a prioridade nº 1.

## O que este projeto é

**SETOR-4**: escape room de terror psicológico investigativo, 3D first-person **no navegador** (Three.js 0.160 via importmap/CDN, vanilla ES modules, zero build, zero assets externos — todo áudio e toda textura são procedurais). Dois agentes (Artie e Sarah) atravessam 7 cenas de crime que são, na verdade, a mente fragmentada de Kenji Okada — um pai destruído pelo luto, manipulado pelo "Verdadeiro Assassino", que o jogo **nunca revela** (lacuna proposital e permanente).

**Estado atual: v0.3.1 — jogo completo e jogável** do menu aos créditos: 7 fases + epílogo, dedução com distratores em todas as fases, revelação de matéria, fio de dedução, Quadro do Caso, Luz Negra, gravador K7, punição/game over, escolha final e epílogo.

## Pilar de ouro (INEGOCIÁVEL)

**Habilidade do JOGADOR > stats.** Zero RPG, zero sorte, zero automação de dedução. O código NUNCA entrega conclusões nem destaca a resposta. O jogador infere a partir de estados materiais descritos nos textos (ferrugem, tinta fresca, papel quebradiço). Qualquer feature nova respeita isso.

## Decisões de design e ética (fixas)

1. NUNCA nomear casos criminais, pessoas ou cidades reais. Toda a mitologia é ficção integral.
2. A identidade do Verdadeiro Assassino é **LACUNA**: nunca aparece, nunca é nomeado, nunca é explicado — em nenhuma mídia, nunca.
3. O jogo quase não data nada: cronologia por material. Único ano cravado: 1999 (o Incêndio — o único caso resolvido, de propósito).
4. A filha de Kenji não tem nome (canon por omissão).
5. A escolha final (Atirar/Poupar) muda só uma fala de Sarah; o epílogo é o mesmo — a impotência é o ponto.

## Arquitetura

- `G` (game-state.js) = contexto mutável compartilhado. `bus` = EventTarget (`punish-start/end`, `gameover`, `door-open`, `confront-kenji`, `lock/unlock`, `loop-cycle`, `piece-ejected`, `uv-changed`, `state-changed`).
- **Data-driven**: `data/levels.json` define TUDO de cada fase (sala, tex, luzes, objetos, sketch, pistas, dedução com distratores, connection, tape, piece). Criar/editar fase = editar JSON. NÃO hardcode conteúdo de fase em JS.
- Estados: EXPLORING (cinza + vermelho pulsando nos interativos) · DEDUCING (overlay azul) · PUNISHED (flash vermelho + shake + áudio distorcido; 3 erros = game over narrativo, fase reinicia) · MENU/CINEMATIC. Debug: teclas 1/2/3.
- Fluxo: `loadLevel` → rádio intro → explorar → inspecionar (revela matéria + sketch no dossiê) → TAB (exige TODAS as `isClue`; `ui.totalClues()` conta pelos objects) → dedução (slots = `correctOrder.length` < nº de cartas) → acerto: **fio de dedução** (`spawnDeductionLine`) percorre as evidências na ordem até o compartimento → peça ejeta → pegar → segundo fio até a porta → `fittingAnimation` → connection empurrada pro **Quadro do Caso** (`G.caseBoard`, persiste entre fases; tecla C) → próxima fase.
- Fase 3: corredor em loop (`G.loop` teleporta e cicla `loopStage`); coletar todas as pistas quebra o ciclo. Fase 7: sem dedução; `confront-kenji` → escolha → `runEnding`.
- `textures.js` tem **três sistemas**: `surfaceTexture` (ambiente: tijolo/concreto/azulejo/metal/madeira/gesso em cinza), `evidenceCanvas`/`drawSketchInto` (sketch pericial — SÓ no dossiê 2D), `materialCanvas`/`revealMaterialTexture` + `MATERIAL_MAP` (matéria real aplicada no mesh 3D ao inspecionar). Objeto novo no JSON: escolher um `sketch` existente e o material vem via MATERIAL_MAP.

## Mapa de arquivos

```
index.html            UI 2D completa + importmap
css/base.css          HUD, painéis dossiê, dedução, board, menu
css/states.css        overlays dos 3 estados + fade
js/main.js            bootstrap, loop, fluxo de fases, board na porta, final
js/game-state.js      G, bus, estados, punição
js/player.js          first-person, colisão AABB, teleporte do loop
js/room-builder.js    salas do JSON, luzes, chuva, reveal, fio de dedução, peça 3D
js/interaction.js     raycast, E/TAB/C/F/K/Q, pistas, porta, kenji
js/deduction.js       UI de ordenar cartas c/ distratores, validação, fio no acerto
js/ui.js              HUD, dossiê c/ sketch, board, rádio, encaixe, gameover, créditos
js/audio.js           Web Audio sintetizado (distorção, clunks, estática, clique final)
js/textures.js        superfícies + sketches + materiais + geometria da peça
data/levels.json      7 fases + epílogo (fonte única de conteúdo)
docs/                 SETOR-4_Detonado_v0.3.1.docx · SETOR-4_Lore_v0.3.1.docx
README.md             como rodar, controles, walkthrough com soluções
```

## Documentação (docs/)

- **Detonado**: guia completo (mecânicas, conexões, soluções fase a fase).
- **Lore**: bíblia narrativa com sistema de selos — **CANON** (está no jogo) / **BÍBLIA** (bastidor, ajustável) / **LACUNA** (nunca se preenche).
- REGRA: mudou canon no jogo (texto, ordem, connection) → avisar o Gabriel que os .docx precisam de atualização correspondente.

## Decisões conscientes (não são bugs)

1. Dedução por clique (não drag & drop) — confiável cross-device; drag é polish futuro.
2. Colisão só com paredes (AABB); atravessa objetos pequenos.
3. Encaixe da peça é overlay 2D (GDD: "as peças deslizam pela tela").
4. Sem persistência (F5 = do zero) — localStorage é entrega futura.
5. Game over zera as pistas da fase (tensão; ajustável).

## ESTRATÉGIA DE PRODUTO (acordada — importante)

**Fase atual: DESIGN LOCK no web.** O protótipo web é o laboratório (iteração em segundos); Roblox é o destino de produto. NÃO portar enquanto o design estiver mudando — cada mudança custaria dobrado.

**Critérios de lock (quando atingidos, congela `levels.json` e inicia o port):**
- Puzzles calibrados por playtests de TERCEIROS (não só o Gabriel, que sabe as respostas);
- Dificuldade certa nas 7 fases (distratores enganando na taxa certa, sem frustrar);
- Loop central comprovadamente divertido do início ao fim.

**Não gastar polish web em coisa de produto final** (mobile, deploy bonito, modelos GLTF) — isso pertence ao Roblox.

**O port Roblox (quando chegar a hora):**
- É **reescrita do motor em Luau**, não tradução: JS/Three.js não roda no Roblox.
- Workflow: **Rojo** (projeto como arquivos .luau em pasta normal, sincronizada com o Studio) → VS Code + git + Claude Code continuam sendo o ambiente.
- **Ponte Lune**: Lune (runtime Luau standalone, lib `roblox` embutida) NÃO roda o jogo, mas lê/escreve .rbxl/.rbxm por script. Primeiro tijolo do port: um **conversor Lune** que lê `data/levels.json` e GERA o lugar Roblox (salas, objetos, ProximityPrompts) — uma fonte de verdade, dois jogos. Pode ser construído em paralelo SEM custo de sincronização, já que o conteúdo vive no JSON.
- Mapeamentos: inspeção→ProximityPrompt · first-person/colisão→nativos · fio→Beam entre Attachments · estados→ColorCorrectionEffect + Atmosphere · texturas→materiais/decals nativos · áudio→assets + DistortionSoundEffect (sem síntese runtime) · save→DataStore · co-op 2 agentes→nativo (era o item 11 do roadmap; no Roblox vira natural).
- Aviso: classificação etária Roblox — terror vende (Doors, The Mimic), mas sangue/temática exigirão classificação mais alta e provável suavização das texturas de sangue.

## Roadmap priorizado

1. **Bugs reportados de playtest** (sempre nº 1).
2. **Calibrar dificuldade com playtests externos** — instrumentar se ajudar (ex.: log local de erros por fase) e ajustar textos/distratores no JSON.
3. Polish web barato que serve ao lock: drag & drop na dedução; sons ambientes; iluminação por fase; timer de pressão no Matadouro.
4. (Paralelo, opcional) Infra Roblox sem conteúdo: setup Rojo + **conversor Lune levels.json→.rbxm** + esqueleto do motor Luau.
5. Pós-lock: port completo Roblox. O web congela como protótipo de referência.
6. Extras web só se fizerem sentido: localStorage, menu de opções, deploy itch.io como demo pública.

## Como testar

`README.md` tem controles e o walkthrough com todas as soluções. Rodar: Live Server no `index.html` ou `python -m http.server`. Regressão mínima: completar a Fase 1 inteira (pistas → dedução → fio → peça → porta) sem erro no console. Regressão completa: fases 3 (loop quebra), 4 (Luz Negra revela 2 pistas), 7 + epílogo (escolha → rádio → clique final → créditos).
