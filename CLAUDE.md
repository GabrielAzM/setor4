# CLAUDE.md — Contexto do projeto SETOR-4

Você (Claude Code) é o desenvolvedor principal deste projeto. O dono é o Gabriel: dev de software (Python/Flask, JS, React básico), **primeiro jogo dele**, aprendendo game dev no processo. Explique decisões em 1-2 linhas quando criar/alterar arquivos. Trabalhe **incremental**: uma entrega por vez, testável no navegador, commit por entrega. Use modo Plan em mudanças grandes. Código e comentários em português; nomes de arquivos em inglês.

## O que este projeto é

Escape room de terror psicológico investigativo, **3D first-person no navegador** (Three.js 0.160 via importmap/CDN, vanilla ES modules, sem build). Estado atual: **v0.2 completa e jogável** — 7 fases + epílogo, todos os sistemas centrais funcionando. Este código foi escrito sem execução visual prévia: **espere bugs de integração**; a primeira tarefa é sempre corrigir o que o Gabriel reportar do teste real.

## Pilar de ouro (INEGOCIÁVEL)

Habilidade do JOGADOR > stats. Zero RPG, zero atributos, zero sorte, zero automação de dedução. O código NUNCA entrega conclusões nem destaca a resposta ("você percebeu que..."). O jogador deduz sozinho a partir dos textos das pistas. Qualquer feature nova deve respeitar isso.

## Os 3 estados visuais (máquina de estados em `game-state.js`)

| Estado | Visual | Implementação |
|---|---|---|
| EXPLORING | Mundo cinza dessaturado; vermelho-sangue emissivo só nos interativos | materiais em `room-builder.js` |
| DEDUCING | Filtro azul frio | `#overlay-blue` (CSS) via `ui.setBlueOverlay` |
| PUNISHED | Flash vermelho + tremida + áudio distorcido ~2,2s | `#overlay-red` + `.shake` + `audio.playDistortion` |

Extras: MENU e CINEMATIC (rádio, encaixe, final). Debug: teclas 1/2/3.

## Arquitetura

- `G` (em `game-state.js`) = contexto compartilhado mutável entre módulos. `bus` = EventTarget para eventos (`punish-start/end`, `gameover`, `door-open`, `confront-kenji`, `lock/unlock`, `loop-cycle`, `piece-ejected`, `uv-changed`, `state-changed`).
- **Tudo orientado a dados**: `data/levels.json` define salas, objetos, pistas, deduções, textos. Criar fase = escrever JSON. NÃO hardcode conteúdo de fase em JS.
- Fluxo de fase (`main.js`): `loadLevel` → `resetLevelFlags` → `buildLevel` → rádio intro → EXPLORING → pistas → TAB → dedução → acerto ejeta peça (`makePieceMesh`) → pegar peça → porta → `fittingAnimation` → próxima fase. Erro → `punish(true)`; 3 erros → `gameover` → reinicia a fase (pistas zeram — decisão de tensão, ajustável).
- Fase 3 (loop): `G.loop` teleporta o player no fim do corredor e cicla `loopStage`; objetos com `loopStage` só aparecem no estágio correspondente; coletar as 3 pistas quebra o loop.
- Luz Negra: `setUV` troca cor/intensidade da lanterna e a visibilidade dos `uvItems` (`uvdecal` usa CanvasTexture com texto).
- Fase 7: sem dedução; `kenji` interativo dispara `confront-kenji` → escolha → `runEnding` (epílogo cinematográfico: chuva, rádio, anúncio datilografado, fade, clique final da peça, créditos).
- Áudio 100% sintetizado em `audio.js` (Web Audio) — sem assets.

## Sistemas adicionados na v0.2

- `js/textures.js`: texturas procedurais (superfícies em cinza), sketches periciais (`evidenceCanvas`, tema paper/dark), e a peça de quebra-cabeça (`tracePiecePath` 2D + `makePieceGeometry` 3D com knobs).
- **Revelação** (`revealMesh` em room-builder): 1ª inspeção aplica a textura do objeto e reduz o emissive pra 0.12 fixo (não pulsante) — feedback de progresso.
- **Iscas na dedução**: `deduction.cards` pode ter MAIS itens que `deduction.correctOrder`; slots = correctOrder.length. Coletar todas as evidências (`isClue`) continua sendo o requisito do TAB (`ui.totalClues()` conta pelos objects, não pelos cards).
- **Quadro do Caso**: `G.caseBoard` (persiste entre fases; NÃO é zerado em resetLevelFlags). Cada level tem `connection {label, text}` — registrado ao atravessar a porta (main.js) e exibido com destaque antes da próxima fase. Tecla C abre a qualquer momento. Peças desenhadas encaixando em `#board-pieces`.

## Decisões conscientes (não são bugs)

1. **Dedução por clique** (carta → próximo slot), não drag & drop — mais confiável cross-device. Polir pra drag é entrega futura.
2. Colisão só com as paredes (AABB da sala); atravessa objetos pequenos.
3. Encaixe da peça é overlay 2D (conforme GDD: "as peças deslizam pela tela").
4. Dificuldade v0.2: textos sem marcadores explícitos de ordem + iscas nas fases 1, 2 e 6. Calibrar mais com playtests.
5. Sem persistência de progresso (F5 = jogo do zero).
6. Inspiração sensível: NUNCA nomear casos criminais reais no jogo (decisão de design/ética já acordada).

## Changelog v0.3.1

- **Texturas de MATERIAL na revelação 3D** (`revealMaterialTexture` + `materialCanvas` em textures.js): inspecionar agora aplica matéria real no objeto — zinco sujo com escorridos (lixeira), sangue coagulado sobre lona (corpo), papel envelhecido com caligrafia borrada, banda de rodagem no asfalto, veludo com pregas, pelúcia com etiqueta etc. O **sketch pericial ficou exclusivo do dossiê 2D** (drawSketchInto no painel). Mapa sketch→material em MATERIAL_MAP; adicionar objeto novo = escolher um sketch existente, o material vem junto.
- Revelado quase não brilha mais (emissive 0.05) e não tinge de vermelho — feedback do playtest: "textura de verdade, não desenho".

## Changelog v0.3 (nesta entrega)

1. **Fio de dedução** (`spawnDeductionLine` em room-builder.js): no acerto, uma linha vermelha se desenha pelo cenário ligando as evidências NA ORDEM deduzida até o compartimento — a peça só ejeta quando o fio chega. Ao pegar a peça, um segundo fio corre até a porta. É a conexão física dedução → cenário → escape, complementando o Quadro do Caso (tecla C), que conecta as fases entre si.
2. **Distratores nas 3 fases que faltavam**: catraca (Metrô), caixa do Incêndio/1999 (Arquivo), urso de pelúcia (Quarto). Agora TODAS as fases têm mais cartas que slots.
3. Sketches novos em textures.js: `bear` e `turnstile`.
4. Lição operacional: o disco é a fonte da verdade — sempre inspecionar o estado atual dos arquivos antes de reescrever (um rewrite cego quase destruiu a v0.2; recuperada do zip de entrega).

## Roadmap sugerido (uma entrega por vez, na ordem que o Gabriel pedir)

1. **Correção de bugs do primeiro teste real** (prioridade absoluta)
2. Drag & drop real na dedução + animação das cartas
3. Save/checkpoint via localStorage (fase atual)
4. Iluminação por fase (holofote no Teatro, spots no Matadouro) e props extras nas salas
5. Sons ambientes contínuos por fase (drone, chuva audível, coração no PUNISHED)
6. Timer visível de pressão no PUNISHED e no Matadouro
7. Modelos GLTF substituindo primitivas (Blender/asset packs) — manter slots do JSON
8. Menu de opções (sensibilidade do mouse, volume, reduced motion)
9. Mobile (joystick virtual) · 10. Deploy (itch.io/GitHub Pages) · 11. Co-op 2 jogadores (WebSocket) — só depois de tudo acima

## Como testar

`README.md` tem controles e walkthrough com todas as soluções. Live Server ou `python -m http.server`. Critério mínimo de regressão: completar a Fase 1 inteira (pistas → dedução → peça → porta) sem erro no console.
