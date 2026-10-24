# Changelog

## 2026-10-22/23 — Redesenho completo (v129–v140)

Novo desenho em todo o site (escuro + claro): ecrã Início, páginas de
modalidade, cabeçalho "Dragão Stats", navegação inferior com menu "Mais",
botão "Lembrar-me" (aviso 1 hora antes; requer Apps Script v93), calendário
com linhas modernas e filtros em pílulas, modo edição com barra "Gestão",
Histórico/Esta semana/Marcadores restyle, formulários e painéis, esqueleto de
carregamento, páginas SEO das modalidades, correção do transbordo da
newsletter. Detalhes e localização no código em `CLAUDE.md`.
Último zip: `dragaostats-deploy-v140.zip`. Versão anterior sem redesenho: v126.

## 2026-10-14 — Divisão em módulos

O `index.html` (um único ficheiro de ~450KB) foi dividido em módulos mais
pequenos dentro de `src/` (ver `CLAUDE.md`), sem mudar nenhum comportamento —
confirmado com uma comparação byte a byte entre o `index.html` original e o
resultado do `build.js` logo após a divisão. Esta versão corresponde ao que
estava publicado como `dragaostats-deploy-v95.zip`.

Nenhuma funcionalidade foi alterada nesta divisão; é só reorganização do
código para facilitar trabalhar nele.

## v151
- Ao vivo: a faixa "Ao vivo agora", o texto do marcador nas linhas e o cartão azul mostram **quem joga em casa à esquerda** (antes o FC Porto ficava sempre à esquerda, mesmo fora), com os pontos do set pela mesma ordem. A faixa volta a desenhar-se se os dados ao vivo chegarem antes da lista de jogos. Cache `dia22-cache-v227`.

## v150
- Início/páginas de modalidade: o cartão azul de destaque mostra o jogo ao vivo com **resultado e minutos** (golos: "2.ª parte · 51'"; voleibol: sets), pílula "AO VIVO" com ponto a piscar e contorno laranja. Sem dados da fonte mas com a hora já passada, mostra só "A decorrer" (já não diz "AO VIVO"). Cache `dia22-cache-v226`.

## v149
- Campo "ID do jogo ao vivo" aceita também o link do Sofascore (número depois de `#id:`). Cache `dia22-cache-v225`.
- Apps Script **v102** (não vive aqui): ao vivo por Sofascore para Futebol Feminino, Andebol e Futsal (`apps-script-v102.gs`).
- Apps Script **v103**: classificação do Futsal automática via Sofascore (3ª Divisão, Série A).

## v148
- Editor: novo campo opcional "ID do jogo ao vivo" (modo Modalidades). Aceita o número do FIBA LiveStats ou o endereço completo; guarda só o número em `ev.liveId`.
- Apps Script v100: basquetebol ao vivo pelo FIBA LiveStats usando esse ID.
