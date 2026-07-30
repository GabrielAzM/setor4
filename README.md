# SETOR-4 (v0.2)

Escape room de terror psicológico investigativo, 3D first-person, rodando 100% no navegador com **Three.js**. Sem build, sem npm — os módulos carregam via CDN (precisa de internet na primeira execução).

**Pilar de ouro:** habilidade do jogador > stats. Nenhum sistema resolve nada por você.

## Como rodar

Precisa de um servidor local (o jogo carrega JSON via fetch):

- **VS Code**: instale a extensão **Live Server** → botão direito no `index.html` → *Open with Live Server*; **ou**
- Terminal na pasta do projeto: `python -m http.server 8000` → abra `http://localhost:8000`

Testado no Chrome desktop. Use fones.

## Controles

| Tecla | Ação |
|---|---|
| Clique | Trava o mouse / retoma o controle |
| WASD + Mouse | Mover e olhar |
| E | Inspecionar o que está na mira / fechar painel |
| Q | Fechar painéis (sem soltar o mouse) |
| TAB | Modo Dedução (quando todas as pistas da cena foram coletadas) |
| F | Luz Negra (revela escritas ocultas) |
| K | Gravador K7 (quando a cena tem fita) |
| C | Quadro do Caso (as conexões entre as cenas) |
| 1 / 2 / 3 | **Debug**: força os estados Exploração / Dedução / Punição |

## Novidades da v0.2

- **Texturas procedurais** em tons de cinza (tijolo, concreto, azulejo, metal, madeira) — geradas em código, zero assets.
- **Inspeção revela**: o mundo é cru; examinar um objeto aplica a "textura correta" nele e mostra um **sketch pericial** no dossiê. Objetos revelados param de pulsar (vira contorno sutil).
- **Evidências-isca**: nem tudo que você coleta entra na dedução — há mais cartas do que posições.
- **Quadro do Caso [C]**: a cada porta atravessada, uma nova conexão liga as cenas com fio vermelho, e as peças de quebra-cabeça vão se encaixando no topo.
- Peças agora têm **formato real de quebra-cabeça** (3D e na animação de encaixe).

## O loop

Explore a cena escura → objetos com brilho **vermelho** são interativos → colete todas as pistas → **TAB** abre o Modo Dedução (filtro azul) → clique nas cartas na ordem lógica correta → **errou**: punição de sanidade (3 erros = game over narrativo, a cena reinicia) → **acertou**: a cena ejeta uma **Peça de Quebra-Cabeça** → pegue-a → interaja com a **porta** → animação de encaixe → próxima cena.

## Walkthrough (SPOILERS)

<details>
<summary>Clique para revelar as soluções das 7 fases</summary>

1. **O Beco** — 4 evidências, 3 posições: Bilhete → Freada → Corpo. A **lixeira é isca** (lixo de dias atrás).
2. **O Apartamento** — 5 evidências, 4 posições: Calendário → Xícaras → Sofá → Polaroids. O **correio é isca**.
3. **Metrô Fantasma** — o corredor se repete; a cada volta um objeto novo aparece (relógio, cartaz, pichação). Examine as 4 evidências (a catraca fica fixa perto do início) pra quebrar o loop. Ordem: Relógio (anos) → Cartaz (meses) → Pichação (agora). A catraca acorrentada fica de fora — morreu com a estação, não com o ciclo.
4. **Arquivo Morto** — aperte **F**: duas pistas só aparecem na Luz Negra (escritas na parede). Ordem cronológica: 1987 → 1994 → 2003 (túnel) → 2011 (a menina). A caixa do Incêndio (1999) fica de fora — caso encerrado não pertence ao padrão.
5. **Quarto de Casinha** — melodia: Sobe → Sustenta no alto → Desce → Repete a primeira nota. O urso novo em folha fica de fora — não é memória dela.
6. **O Matadouro** — 6 evidências, 5 posições: Registro → Ganchos → Avental → Dreno → Etiquetas. O **extintor é isca**.
7. **O Teatro** — sem puzzle. Aproxime-se de Kenji, aperte E e escolha. Qualquer escolha leva ao mesmo epílogo (a lacuna é proposital: o Verdadeiro Assassino está solto).

</details>

## Estrutura

```
index.html          UI 2D completa + importmap do Three.js
css/                base (HUD/painéis) e states (os 3 estados visuais)
js/
  main.js           bootstrap, loop de render, fluxo de fases e final
  game-state.js     máquina de estados global + punição
  player.js         first-person, colisão, corredor em loop
  room-builder.js   monta salas a partir do data/levels.json
  interaction.js    raycast, teclas, pistas, porta, Kenji
  deduction.js      UI de dedução (ordenar cartas)
  ui.js             HUD, painéis, rádio, encaixe, game over, créditos
  audio.js          todo o áudio sintetizado via Web Audio
data/levels.json    as 7 fases + epílogo (100% orientado a dados)
```

**Criar/editar fases = editar `data/levels.json`.** Nenhum código novo necessário para salas, objetos, pistas e deduções.

Leia o `CLAUDE.md` para contexto completo de design e o roadmap do que falta.
