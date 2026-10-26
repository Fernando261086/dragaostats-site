## v167 — Dia a dia em "Esta semana"
- Faixa Seg…Dom por cima da lista, com o número de jogos de cada dia; tocar num dia mostra só esse dia, "Toda a semana" volta atrás. Muda de semana com Anterior/Seguinte. Cache `dia22-cache-v243`.

## v166 — Pesquisa de jogos
- Início: barra "Procurar jogo, adversário, mês…" que abre um ecrã de pesquisa (`48-search.js`). Procura em todos os jogos por adversário, modalidade, competição, local, data e resultado (sem acentos); cada resultado abre a página do jogo. Cache `dia22-cache-v242`.

## v165 — Adicionar ao calendário + opção "sem avisos automáticos"
- Página do jogo: botão "📅 Adicionar ao calendário" (jogos futuros). Gera um .ics no próprio aparelho, com alarme 1 hora antes (`47-add-to-calendar.js`).
- Editor do jogo: caixa "Sem avisos automáticos de golo / fim de set neste jogo" (campo `noAuto`), lida pelo Apps Script v115.
- Cache `dia22-cache-v241`.

## v164 — Escudo do FC Porto
- O escudo do FC Porto aparece ao lado do nome em todo o lado onde já há o do adversário (Apps Script v114: `FCP|<modalidade>` e `FCP|*` no campo `escudos`; modalidades sem equipa no Sofascore usam o do futebol feminino).

## v163 — Escudos em todo o site
- Escudo do adversário no herói do Início, em "Últimos resultados", no calendário, na página da modalidade, no histórico e na página do jogo.
- Apps Script v114: nomes quase iguais (1-2 letras), pesquisa do Sofascore para os que faltam (`escudosBusca`) e tabela `ESCUDO_ALIASES_` à mão. Minuto do futebol (Equipa B/feminino) pelo início real da parte.

## v162 — Cronologia e estatísticas do jogo
- Apps Script v112: lê do Sofascore golos, cartões, substituições e estatísticas (Equipa B, Futebol Feminino, Andebol) e entrega-os no campo `detalhes` (prop `sofaDetalhes`). Teste: `testarDetalheSofascoreAgora`. Equipa B passa a usar o Sofascore (equipa 74469).
- Site (`46-game-details.js`): cartões "Cronologia" e "Estatísticas" na página do jogo. Só informação; não mexe em resultados.

## v161 — Equipa B "ao vivo" antes da hora
- Apps Script v110: `eqbEstado_` nunca dá "vivo" antes da hora do jogo e reconhece "notStarted" (continha "started"); o relógio só vai com o jogo vivo.
- Site: `cevLiveFor_` ignora "vivo" se faltam mais de 5 min para o jogo.

## v160 — Escudos dos adversários
- Apps Script v109: lê do Sofascore as equipas adversárias de cada modalidade (de 12 em 12 h), junta-as aos jogos do site (campo `escudos` do `doGet`) e entrega o escudo em base64 em `?escudo=<id>`. Teste: `testarEscudosAgora`.
- Site (`45-crests.js`): escudo na página do jogo e no cartão de imagem; guardado no aparelho. Sem escudo, tudo fica como estava.

## v159
- Início/rodapé (público): as 5 ligações passam a uma linha discreta (continuam no menu Mais).
- Página de modalidade sem próximo jogo: destaque mostra o último resultado.
- Página do jogo terminado: marcadores (estatística principal da modalidade), posição na classificação e reações ("O que achaste do jogo?"); o widget global de reação fica escondido nessa página.
- Páginas SEO por modalidade: caixa "Últimos resultados" preenchida ao abrir (fica escondida se falhar; texto e meta intactos).
- Textos de post antigos (Facebook/Reddit): link com https://.

## v158
- Campos "Nome de quem não está na lista" e "Nova estatística": o botão a 100% esmagava o campo de escrita; agora o campo ocupa o espaço e o botão fica ao lado.

## v157
- Folha "Resultado guardado" (44-result-share-prompt.js): ao escrever um resultado (modo edição), oferece Imagem, Reel e Copiar texto desse jogo.
- Apps Script v108: email de aviso quando um jogo a decorrer não tem dados ao vivo (1 por jogo; futsal ignorado) + verificação diária passa a incluir o gatilho do ao vivo.

## v156
- Imagem + texto dos RESULTADOS de hoje (31-day-share.js): novo botão ao lado de "jogos de hoje", só em modo edição, aparece quando há resultados de hoje.

## v155
- Convite para ativar notificações no Início e na página do jogo (`43-notify-cta.js`): só para quem vê e ainda não ativou; "Agora não" esconde 5 dias; texto só promete resultado final + lembrete 1 h antes. Popup atualizado com o mesmo texto.

## v154
- "Quem jogou": quem está selecionado mostra um círculo dourado com ✕ (o visto nativo aparecia como pílula em branco).

## v153
- Página do jogo: voltam os botões Imagem do resultado/promover, Reel e Estatísticas (estavam só no menu 📤 do calendário).

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

## v152
- **Página do jogo** (`src/scripts/42-game-page.js`, vista `jogo`, `#gameView`): "Ver jogo", "Ver detalhes", a faixa "Ao vivo agora" e os links `?jogo=<id>` abrem uma página só daquele jogo — resultado enorme (ao vivo com minutos/pontos do set; terminado com V/E/D; futuro com contagem decrescente), sets, informação, transmissão, "Lembrar-me", partilhar (link `?comp=..&jogo=..`), classificação e "Ver no calendário". Atualiza sozinha. `goToEventCard` abre-a em modo Modalidades; o salto antigo ao cartão é `goToEventCardCal_`. Cache `dia22-cache-v228`.

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
