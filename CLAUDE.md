# Dragão Stats — site (dragaostats.pt)

Site de adeptos do FC Porto com calendário, resultados e estatísticas de
várias modalidades (Andebol, Basquetebol, Voleibol, Futsal, Hóquei em
Patins, Futebol Feminino, Equipa B). Projeto do Fernando e do irmão dele.

## Como isto está organizado

O site inteiro **era** um único `index.html` gigante (~450KB, código e estilo
tudo misturado). Foi dividido em módulos em outubro de 2026 para ser mais
seguro trabalhar nele, **sem mudar nenhum comportamento**:

```
src/
  template/           peças fixas do HTML (cabeçalho <head>, zona entre o
                      <style> e o <script> principal, e o fecho do ficheiro)
  styles/             o <style> antigo, dividido por secção (01-07, numerados
                      pela ordem em que apareciam no ficheiro original)
  scripts/            o <script> principal, dividido por secção (01-26,
                      também pela ordem original)
public/               tudo o que não é o index.html: manifest.json, sw.js,
                      ícones, páginas de cada modalidade (andebol.html, etc.),
                      robots.txt, sitemap.xml, _headers, _redirects
build.js              junta tudo de volta num único dist/index.html
```

**Regra de ouro: a ordem dos ficheiros dentro de `styles/` e `scripts/`
importa tanto como o código em si.** O `build.js` lê cada pasta por ordem
alfabética (por isso os nomes têm prefixos `01-`, `02-`, etc.) e cola tudo
sequencialmente — exatamente como estava no ficheiro original. Nunca
reordenar ficheiros só por "parecer mais lógico"; se for preciso mover
código de um ficheiro para outro, mover o código a sério, não só renomear.

## Redesenho de outubro de 2026 (versões v129–v140)

Ao contrário da divisão em módulos, o redesenho **mudou** o aspeto e o
comportamento. Segue a proposta de design do Fernando (tema escuro por
defeito + tema claro). Onde está cada coisa:

- **Início** (`src/scripts/36-home-view.js`): ecrã por defeito do público
  (link "só ver", modo Modalidades). Herói do próximo jogo, "Esta semana",
  "Últimos resultados". Abre por `openHomeByDefault_()`.
- **Página de modalidade** (`37-sport-page.js`): `openSportPage_(sport)`;
  separadores Jogos/Classificação/Marcadores. Plantel: `50-squad.js` (v170).
- **Lembrar-me** (`38-game-reminders.js` + Apps Script v93): aviso 1 hora
  antes. Guarda em `localStorage` (`dia22-reminders`) e envia
  `{setGameReminder:{token,evId,on}}` ao `STORE_URL`. No Apps Script usa a
  linha reservada `__game_reminders__` (tem de estar na lista de IDs
  reservados do `readAll_`). Ficheiro: `apps-script-v93.gs` (não vive neste
  repositório; é colado no Apps Script e a Web App é reimplantada).
- **Menu "Mais" e sino** (`39-more-sheet.js`): folha inferior que reencaminha
  cliques para os botões antigos (os IDs desses botões não podem mudar).
- **Barra Gestão** (`40-admin-toolbar.js`): só em modo edição; recolhe as
  ferramentas do editor (`tools-collapsed`).
- **Navegação inferior** (`34-bottom-nav.js`) e **filtros por modalidade**
  (`35-sport-cards.js`, agora pílulas).
- **Calendário**: linhas modernas `match-row` em modo Modalidades
  (`12-installed-list-and-timeline-a.js`, classe `tl-matches`); lista "Esta
  semana" em `13-timeline-render-b.js`; Histórico e Marcadores em
  `16-admin-panels-b-views.js`.
- **Classificação** (`41-standings.js` + Apps Script **v94**): separador "Classificação" na
  página de modalidade, lê `STANDINGS` (campo `standings` do `doGet`). O Apps Script lê de hora
  a hora (no gatilho de 5 min, `updateStandingsIfDue_`) e guarda na linha reservada
  `__classificacoes__` (tem de estar na lista do `readAll_`). Fontes: Andebol=FPA
  (JSON dentro da página), Voleibol=FPV, Basquetebol=FPB, Hóquei=hoqueipatins.pt,
  Futebol Feminino e Equipa B=fcporto.pt. Futsal = Sofascore (v103; edição manual `setManualStandings` só de reserva).
  zerozero.pt e resultados.fpf.pt bloqueiam o Google (403). As páginas de modalidade do
  fcporto.pt carregam por JavaScript (não servem). Se uma fonte mudar o HTML, só essa
  modalidade pára (fica a última boa) — correr `atualizarClassificacoesAgora` no Apps Script
  para ver qual falha.
- **Ao vivo** (`05-whatsapp-rivalry-live-badges.js` + Apps Script **v95**): cartão "AO VIVO" e
  marcador nas linhas. Voleibol = CEV (`cevLive`, sets). Hóquei (visto num jogo real: a decorrer = `status:true, ended:false, time:"1ªP - 10'"`; terminado = `time:"Resultado final"`) = `live.hoqueipatins.pt/api/updates`
  (JSON com `games[{id,score,time,part,ended,teams:["3584_230",..]}]`; FC Porto = id 3584), lido
  de minuto a minuto no gatilho `atualizarAoVivoCev_`. O `doGet` junta os dois em `cevLive`
  (`readAoVivoTodos_`); jogos por golos trazem `golosFcp/golosAdv/tempo/parte`. A página da FPA (andebol) **não** atualiza ao vivo (testado com Portugal–Guiné); futebol feminino e futsal ainda **não** têm ao vivo.
  **Voleibol campeonato (Apps Script v97)**: `portugalvoleibol.com/classificacao/api/live.php?status=all` (JSON; `status` DRAFT/IN_PROGRESS/COMPLETED,
  `resultado_a/b` = sets, `sets[{pontosA,pontosB}]`, `equipa_a/b.cod_clube`; FC Porto = `FCPORTO`; o campo `live` não é fiável). Mesmo formato do CEV. Teste: `testarAoVivoVoleiNacAgora`.
  **Equipa B (Apps Script v99)**: calendário iCal `ligaportugal.pt/calendars-ics/fc_porto_b.ics` (URL de cada jogo) + página do jogo
  (`/match/20262027/ligaportugalmeusuper/<jornada>/<jogo>`) com `__NUXT_DATA__` (devalue) → `homeTeamGoals/awayTeamGoals/status/subStatus`.
  **v111: a página da Liga NÃO tem relógio** (`minutesTillMatchStarts` = minutos até começar, negativo depois; `status 3/subStatus 3` visto aos 58 min do jogo de 25/10/2026) → o minuto vem do Sofascore (equipa FC Porto B = 74469, em `SOFA_SPORTS_`; sobrepõe a Liga). Valores de `status` num jogo a decorrer AINDA DESCONHECIDOS (afinar `eqbEstado_` após o 1.º jogo real; guardados em `codigo`). Teste: `testarAoVivoEquipaBAgora`.
  **Basquetebol (Apps Script v100)**: campo `liveId` em cada jogo (editor: "ID do jogo ao vivo", aceita o número ou o endereço do FIBA LiveStats) →
  `fibalivestats.dcd.shared.geniussports.com/data/<liveId>/data.json` (`clock`, `period`, `tm.1/2.name/score`; sem campo de estado: fim = último período, relógio 00:00, resultado desigual).
  **v101 descobre o ID sozinho**: os jogos da Liga Betclic são registados no FIBA em lotes seguidos (24/10/2026: 2922716…2922733 = jornada 3; 2922737 = FC Porto–CAB Madeira;
  FIBA = `internalID` da FPB + 2508631 nesse lote) e a página do FIBA existe antes do jogo. `basqueDescobrirId_` procura a partir do último ID conhecido um jogo com "Porto" + adversário do site
  (cache `basqueMap`). O campo `liveId` manual tem sempre prioridade. Os IDs do FIBA são globais (vizinhos podem ser jogos ucranianos).
  **Andebol (Apps Script v96)**: lê a página `portal.fpa.pt/prova/10016/` (JSON embutido: `JOG_GOLOS_CASA/FORA`,
  `JOGO_ESTADO_CODIGO`, "50" = terminado; o código de "a decorrer" ainda é desconhecido) no mesmo gatilho de 1 min;
  vivo = jogo do FC Porto, já na hora e código ≠ 50. Teste: `testarAoVivoAndebolAgora`. Basquetebol: o FIBA LiveStats
  (`/data/<id>/data.json`) é legível pelo Google, mas falta descobrir o id do jogo a partir da FPB (ficha tem `data-live`).
- **Resultado guardado → partilhar** (`44-result-share-prompt.js`, v157): folha em modo edição depois de escrever um resultado (imagem/reel/texto).
- **Convite de notificações** (`43-notify-cta.js`, v155): cartão no Início e na página do jogo.
- **Página do jogo** (`42-game-page.js`, v152): vista `jogo` em `setView()`; `openGamePage_(evId)`. `goToEventCard()` abre-a em modo Modalidades (o salto antigo ao cartão do calendário é `goToEventCardCal_`). Link partilhável `?comp=<id>&jogo=<evId>`. Classes `.gp-*`; o `body.view-jogo` esconde a faixa `#liveNowBanner`.
- **Estilos**: tudo o que é novo está no fim de `06-tabs-and-medals.css`
  (`.hv-*` Início, `.sp-*` modalidade, cabeçalho `html.mode-matches`).
  Classes no `<html>`: `theme-light`, `mode-matches`, `readonly-view`.
- **Páginas SEO** em `public/<modalidade>.html` usam o mesmo desenho, com
  texto/meta intactos; desde a v159 têm uma caixa "Últimos resultados" (script no fim, lê o `STORE_URL`; se falhar fica escondida). `public/social.html` **não** foi redesenhada.
- O título do cabeçalho é sempre "Dragão Stats" em modo Modalidades.
- Vistas de `setView()`: calendario, inicio, modalidade, medalhas,
  hoje-todas, estatisticas, historico, marcadores.

**Cuidados aprendidos:** usar `minmax(0,1fr)` em grelhas (senão há deslize
lateral no telemóvel); no modo edição verificar sempre overflow horizontal a
360/390/768px; subir a versão da cache em `public/sw.js` a cada publicação
(atual `dia22-cache-v257`); em telemóvel os widgets laterais aparecem
**depois** da lista de jogos.

**Ao vivo Sofascore (Apps Script v102):** Futebol Feminino, Andebol e Futsal leem
`api.sofascore.com/api/v1/event/<id>` (não oficial; pode deixar de funcionar). Sem ID, o script procura o
jogo nos jogos da equipa (`/team/<id>/events/next/0` + `last/0`; ids do Porto: feminino 938214, andebol 21795, futsal 1268317)
por dia + hora + adversário (v104). A lista `/sport/<x>/scheduled-events/<data>` dá **404** — não usar. **v105: Voleibol (campeonato)** também por Sofascore (equipa 335647; `homeScore.current`=sets, `period1..5`=pontos de cada set, o set em curso incluído) — dá os pontos em direto, ao contrário da API da FPV (só sets fechados); sobrepõe a FPV. **v107:** minuto REAL do andebol (confirmado 24/10/2026): `event.time.played` = segundos jogados, `time.playedLastUpdated` = quando foi atualizado (`periodLength` 1800); o script avança desde essa hora (máx. 90 s, depois fica parado). Futsal/feminino: por confirmar com jogo real. Sem `played` mostra só a parte (já não há minutos estimados). O campo `liveId` (link do Sofascore, `#id:NNN`) tem prioridade. Prop `aoVivoSofascore`,
fundida por último em `readAoVivoTodos_` (sobrepõe a página da FPA). Teste: `testarAoVivoSofascoreAgora`.
Por confirmar com jogo real (24/10/2026): golos a atualizar durante o jogo.
**Alertas (Apps Script v108):** `verificarSaudeAoVivo_` (5 em 5 min, no gatilho do ao vivo) manda 1 email por jogo que já começou há >20 min, sem resultado escrito e sem dados ao vivo; `ALERTA_AOVIVO_IGNORAR` = ["Futsal"] (o Sofascore não acompanha a 3.ª Divisão). Teste: `testarAlertasAoVivoAgora`. O heartbeat `aoVivo` entra na verificação diária.
**Futsal — classificação (Apps Script v103):** lida de `api.sofascore.com/api/v1/tournament/112814/season/102039/standings/total`
(3ª Divisão, 1ª Fase, Série A, 26/27; os números mudam de época: vêm em `event.tournament.id` / `event.season.id`). A edição manual fica como reserva (auto fresca <72 h tem prioridade).

**Escudos dos adversários (Apps Script v109, site v160):** `escudosAtualizar_` lê `team/<id>/events/next|last/0|1` do Sofascore (12 em 12 h, prop `escudosSofa`); `doGet` devolve `escudos` ("Modalidade|Adversário" → id; nome igual ou `cevNomesBatem_`); `?escudo=<id>` devolve `{ok,img:data URL}` (cache 6 h). Site: `45-crests.js` (`crestHtml_`, `crestImage_`, localStorage `dia22-crest-<id>`), usado em `42-game-page.js` e `02-share-card.js`. v114: reconhecimento por nome parecido/quase igual + pesquisa `search/all?q=` (`escudosPesquisar_`, prop `escudosBusca`) + `ESCUDO_ALIASES_` manual. Site v163: `crestName_/crestOnly_` em herói, listas e histórico. Teste real (25/10/2026): 53 de 58 adversários reconhecidos. `testarEscudosAgora` (quantos adversários são reconhecidos por modalidade).

**Cronologia (Apps Script v112, site v162):** `sofaGuardarDetalhe_` lê `event/<id>/incidents` e `/statistics` (Futebol Feminino, Andebol, Equipa B), guarda compacto em `sofaDetalhes` (máx. ~8 KB, 6 jogos) e o `doGet` devolve `detalhes`. Site: `46-game-details.js`. Formato dos incidentes de andebol/estatísticas por confirmar com jogo real (`testarDetalheSofascoreAgora`).

**Avisos automáticos (Apps Script v115, site v165):** golos da Equipa B e do Futebol Feminino e fim de cada set (exceto o decisivo) no Voleibol, no gatilho do ao vivo (`avisosAutoProcessar_`, estado na prop `avisosAuto`; só avisa à 2.ª leitura igual; grava antes de enviar). Modo por prop `AVISOS_AUTO_MODO` ("teste" por defeito: só os nomes de `AVISOS_AUTO_NOMES`; `avisosAutoModoTodos()` passa a todos). `ev.noAuto` desliga por jogo. Teste: `testarAvisosAutoAgora`. Intervalo e resultado final continuam manuais. Site: botão "Adicionar ao calendário" (`47-add-to-calendar.js`).

**Pesquisa (v166):** `48-search.js`, `openSearchSheet_()`, aberta pela barra `.hv-search` no Início.

**Dia a dia (v167):** `weekDayStripHtml_` / `weekDay_` em `13-timeline-render-b.js`, faixa `.wd-strip` na vista "Esta semana".

**Antes do jogo (v168):** `pregameHtml_(ev)` em `49-pregame.js`, usado em `42-game-page.js`; só com dados do site (histórico + `STANDINGS`). **Forma do adversário (Apps Script v116, site v169):** `formasAtualizar_` (de 6 em 6 h, jogos dos próximos 7 dias, Sofascore `team/<id>/events/last/0`, prop `formasSofa`); `doGet` devolve `formas` ("Modalidade|Adversário" → [[V|E|D, oponente, placar]]). Precisa do id do adversário nos `escudos` (Futsal não tem). Teste: `testarFormasAgora`.

**Plantel (Apps Script v120, site v170):** API do site do clube `api.app.fcporto.pt/v2/sportClasses/<classe>/teamsSquads?team=<equipa>` (pública, sem chave; `data[0].squad.players` com `number`, `full_name`, `position.name`; `data[0].staff_teams[].members` com `full_name`, `speciality`). Mapa `PLANTEL_FCP_`: Feminino 17/1150, Equipa B 2/100, Andebol 3/200, Basquetebol 4/300, Hóquei 5/400, Futsal 21/1500, Voleibol 14/250 (confirmar pelas posições). Lido de 24 em 24 h para props `plantelFcp_<modalidade>`; `doGet` devolve `plantel`. Fotos (v171, Apps Script v121): `profile.thumb`/`profile.url` (endereços em files.app.fcporto.pt, ligados diretamente com `<img>`, sem guardar) — **o Fernando tem autorização do clube**; se falhar/não houver, fica o círculo com o número. Teste: `atualizarPlantelAgora`.

**Classificações europeias (Apps Script v123, site v172):** `compStdAtualizar_` (de hora a hora; Sofascore `unique-tournament/<id>/season/<id>/standings/total`, a partir dos jogos da equipa nos últimos 45/próximos 150 dias; ignora campeonatos de categoria "Portugal" exceto a Taça da Liga; guarda só os grupos com o FC Porto; prop `compStandings`); `doGet` devolve `classificacoesComp`. O site liga o jogo à tabela pelo adversário (`compStandingForGame_`). Só `unique-tournament` funciona (o caminho `tournament/` dá 404 na CEV). Competições a eliminar (CEV Cup, Taças) não têm tabela. Testes: `testarClassificacoesEuropaAgora`, `testarBasqueSofaAgora` (basquetebol: a pesquisa por "FC Porto basketball" não achou a equipa; ver a lista).

**Ainda por fazer:** testar em produção as fontes reais (ao vivo de cada modalidade), o push do
"Lembrar-me" e a edição de um resultado real.

## Build e deploy

```
node build.js
```

Gera `dist/index.html` (o ficheiro juntado) e copia tudo de `public/` para
`dist/`. O conteúdo de `dist/` é o que vai para o servidor — é equivalente ao
"deploy zip" que se costumava publicar manualmente em dragaostats.pt.

**Verificação de segurança feita na divisão inicial:** logo a seguir a
dividir o `index.html` original nestes módulos, corri o build e confirmei
com `diff` que o resultado era **byte a byte idêntico** ao ficheiro antes da
divisão. Isto garante que dividir em módulos não mudou nada em produção —
só a forma como o código está arrumado para trabalhar nele. Qualquer sessão
futura que reestruture mais isto deve repetir este tipo de verificação
sempre que possível (build + comparação com uma cópia conhecida de estar a
funcionar), antes de publicar.

## O site em si (contexto para trabalhar no código)

- Multi-competição: cada "competição" tem um `mode`, `"matches"` (Modo
  Modalidades — jogos públicos, visíveis a toda a gente) ou `"medals"` (Modo
  Medalhas — só para quem edita, nunca visível em links de "só ver").
- Backend: Google Apps Script + Google Sheets como base de dados (não está
  neste repositório — vive na conta Google do Fernando/irmão). O `STORE_URL`
  no `src/scripts/01-core-data-and-state.js` aponta para essa Web App.
- Notificações push a sério via Firebase Cloud Messaging, despachadas pelo
  Apps Script (não por este código do browser).
- `READONLY_MODE` distingue o link normal (edição, com password) do link "só
  ver" (`?view=readonly` ou idêntico) — muita lógica do site ramifica-se
  consoante este modo.
- Testar sem o backend a sério: o `fetch(STORE_URL)` falha nesse caso; é
  possível simular dados com `page.route()` do Playwright a interceptar o
  pedido e devolver um JSON de exemplo (ver conversas anteriores para um
  exemplo deste mock).
- O ambiente de desenvolvimento típico (sandbox cloud) **bloqueia
  fonts.googleapis.com e outros domínios externos** — um screenshot feito
  aqui pode mostrar as fontes (Bebas Neue, Archivo, Archivo Narrow) a cair
  para a fonte genérica do browser, mesmo que no site a sério carreguem bem.
  Não concluir que há um bug de tipografia só a partir de um screenshot
  feito neste tipo de sandbox — confirmar primeiro se o bloqueio de rede
  está a afetar o teste.

## Fluxo de trabalho com o Fernando

Ele não mexe em código — pede alterações em português, e espera receber de
volta um ficheiro pronto a publicar (zip com `dist/index.html` + `public/`).
Depois de qualquer alteração: correr `node build.js`, testar visualmente
(Playwright + mock de dados quando fizer sentido), e só depois empacotar.

**v173:** escudos nas classificações (`crestCell_` em `41-standings.js`; Apps Script v126 `escudosComTabelas_`, teste `testarEscudosTabelasAgora`; escudos guardados a 128px). **Reel da semana:** `51-week-reel.js` (`generateWeekReel_`, `buildWeekReelText_`, `startWeekReel_`), botão `#weekReelBtn` em `13-timeline-render-b.js`; cache atual `dia22-cache-v250`.

**v174:** estatísticas do jogador: `playerSeasonStats_`, `sqNameMatch_`, `openPlayerSheet_` no fim de `50-squad.js` (linhas `.sq-click` com `data-sqp`); cache atual `dia22-cache-v257`.

**v175:** `playerSheetHtml_` (fim de `50-squad.js`): médias por jogo no Basquetebol e bloco "Por competição" (usa `ev.detail`); cache atual `dia22-cache-v257`.

**v176:** herói `.hv-hero[data-hero]` clicável (listener no fim de `36-home-view.js`); `pgSameTeam_` ignora palavras genéricas (`PG_GENERIC_`); cache atual `dia22-cache-v257`.

**v177:** `liveRecentHtml_` (46), `miniStandingHtml_` (41), "Como foi" em `42-game-page.js`; cache atual `dia22-cache-v257`.

**v178:** cartão Marcadores conta golos linha a linha; atalho `#gpAddStats` em modo edição; cache atual `dia22-cache-v257`.

**v179:** `52-extras-cache.js` (`extrasSave_`, `DATA_FRESH_`, `skelHtml_`; localStorage `dia22-extras-v1`); ranking com média e `squadIndexOf_`; tema claro e 44 px no fim de `06-tabs-and-medals.css`; cache atual `dia22-cache-v257`.

**v180:** `53-home-extras.js` (`todayStripHtml_` faixa "Hoje joga", `favSport_/favToggle_/favApplyOnce_` favorita em `dia22-fav-sport`, `track_/trackFlush_` contagem anónima enviada como `{track:{nome:n}}` ao `STORE_URL`, só `READONLY_MODE`). Apps Script **v131**: `doPost` trata `track` à parte (`usoRegistar_`, props `uso_AAAA-MM-DD`, 60 dias), `verificarSaudeFontesSeDevido_` (6 em 6 h, email agrupado, repete só após 3 dias; prop `alertaFontes`), `usoResumoSemanalSeDevido_` (segundas). Testes: `testarSaudeFontesAgora`, `testarUsoAgora`, `usoResumoAgora`. O convite de instalar já existia (`20-newsletter-and-install-prompts.js`); cache atual `dia22-cache-v258`.

**v181:** `shareTextFan_/shareGameFan_/resultWin_/winInviteHtml_` no fim de `53-home-extras.js` (texto de partilha com resultado; cartão de vitória no Início, `dia22-win-dismissed`); cartão `.gp-share` em `42-game-page.js` (só jogo terminado; os botões `#gpShare/#gpImg/#gpReel` passam para lá); cache atual `dia22-cache-v259`.

**v182:** `42-game-page.js`: em `READONLY_MODE` só há `#gpShare` e, com jogo terminado, `#gpImg`; `#gpReel` e os botões "para promover" só em edição; cache atual `dia22-cache-v260`.

**v183:** `setView` ganhou `classificacoes` (`#clsView`, `54-standings-view.js`, botão escondido `#viewStandingsBtn` só no público) e as classes `view-home`/`view-cal` no `<body>`; rodapé com `#newsletterBox`, `#footFollow`, `.foot-links`; `sportsGridHtml_` e a pesquisa única em `53-home-extras.js`; cache atual `dia22-cache-v261`.

**v184:** as regras de limpeza (`#newsletterBox`, `#formOverview`, `.search-row`…) e a barra com Tabelas usam `html.mode-matches` (público **e** edição); `openHomeByDefault_` abre o Início também em edição; cache atual `dia22-cache-v262`.

**v185:** `renderTodayAllView` (13) preserva `#weekReelBox`/`#weekShareBox` abertos (`dataset.week` = `weekOffset`) quando a sincronização (18) a volta a desenhar; `window.__weekReelBusy_` mantém o botão do reel bloqueado; cache atual `dia22-cache-v263`.

**v186:** `#footFb`/`#footIg` (rodapé) com os SVG dos logos (`.foot-soc`); o gradiente do Instagram usa o id próprio `igFootGrad`; cache atual `dia22-cache-v267`.

**v187:** `public/_worker.js` (Cloudflare Pages, modo avançado; corre em todos os pedidos mas só mexe em `/`+`?jogo=` e nas 7 páginas de modalidade; o resto passa direto; `_routes.json` não é suportado no upload por arrastar): pré-visualização por jogo (HTMLRewriter em title/description/og/twitter), injeção de "Próximos jogos"/"Classificação"/JSON-LD nas páginas SEO; lê o Apps Script (`env.STORE_URL` ou o valor por defeito), cache 120 s, qualquer erro → página normal. Apps Script **v132**: `backupDiarioSeDevido_` (cópia diária da Folha, mantém 14; teste `testarBackupDiarioAgora`); cache atual `dia22-cache-v267`.


**v188:** `51-week-reel.js`: duração por ecrã `weekReelSlideDur_(n)` = 3,4 + 1,6·n s, abertura 3,4 s, fecho 4,6 s; cache atual `dia22-cache-v267`.

**v189:** `55-webm-encode.js` (`webmEncodeFrames_`, mux WebM mínimo) usado por `generateWeekReel_`; fallback MediaRecorder; ecrã = 3,8+1,8·n s; cache atual `dia22-cache-v267`.

**v190:** `build.js` reduz JS/CSS com esbuild (devDependency; sem ele gera sem reduzir; `--no-min` para depurar — para ler o código final use sempre `--no-min`); endereços das páginas SEO sem `.html` (canonical/og/sitemap); cache atual `dia22-cache-v271`.

**v191:** auditoria completa (Playwright 16 combinações modo/tema/largura + axe-core): contraste AA (bloco `v191` no fim de `06-tabs-and-medals.css`), `sr-h1`, `role=main`, `aria-label` no `#compSelect`, canonical na home, `sw.js` só guarda respostas `ok`; cache atual `dia22-cache-v271`.

**v192:** removido o popup/página/ligações "Novidades" (`/novidades` redireciona para `/` em `_redirects`); `.hv-top` com `grid-template-rows:auto minmax(0,1fr) auto`; cartão ao vivo em largura total no computador; `og-image.png` 187 KB; `_headers` com cabeçalhos de segurança; `build.js` limpa `dist`; cache atual `dia22-cache-v271`.

**v193:** cabeçalho do modo edição compacto em ecrãs pequenos (bloco `v193` no fim de `06-tabs-and-medals.css`; `#syncLabel` ganha `data-short`); cache atual `dia22-cache-v271`.

**v194:** `56-day-reel.js` (`generateDayReel_`, `startDayReel_`) + variantes "ao vivo" em `31-day-share.js` (`hasLiveCoverage_`: tudo menos Futsal; botões `#dayShareLiveBtn/#dayReelBtn/#dayReelLiveBtn`); cache atual `dia22-cache-v272`.

**v195:** `REACTION_LIVE_` + `renderReactionBar(id, opts)` em `09-visit-milestones.js`; cartão `.gp-react-live` em `42-game-page.js` (jogo ao vivo/a decorrer; reações guardadas na linha `__reactions__`, sem Apps Script novo); marcadores em `shareTextFan_` (`53-home-extras.js`); cache atual `dia22-cache-v273`.

**v196:** `_worker.js` serve `/calendario/<slug>.ics` (`calendarioIcs_`) e troca o `og:image` por `/og/<slug>.png` nos links de jogo; botão `#spSub` em `37-sport-page.js`. Apps Script **v133** (`apps-script-v133.gs`): "Já começou!" em `checkGameRemindersForPush_` (campo `started`), `usoResumoCorpo_`/`jogosSemanaTexto_` (email de segunda com jogos da semana; `RESUMO_EMAILS_EXTRA`), teste `testarResumoSemanalAgora`. Imagens `public/og/*.png` geradas em Playwright (Bebas Neue + cor da modalidade). Cache atual `dia22-cache-v274`.

**v197:** `crestNameEnd_` (`45-crests.js`) para o escudo da 2.ª equipa no fim do nome nas linhas; cache atual `dia22-cache-v275`.

**v198:** herói `.hv-hero-match` (`36-home-view.js`) também com o escudo da 2.ª equipa no fim; cache atual `dia22-cache-v276`.

**v199:** cartão `TERMINOU` em `renderLiveNowBanner_` (`05-…`, `fimSemResultado`); Apps Script **v134** (`apps-script-v134.gs`): `verificarLigacaoAntes_`, `resumoMensalSeDevido_`; cache atual `dia22-cache-v295`.

**Ideias adiadas (lembrar ao Fernando perto de julho):** botão no editor que cria a competição da época seguinte a partir da atual (modalidades e adversários habituais). Também por decidir: "forma" V/E/D (só do FC Porto e do próximo adversário; as fontes não dão a forma de todas as equipas da tabela).

## Mudança de época (checklist — fazer em julho/agosto, antes da 1.ª jornada)

Várias fontes têm números ou endereços da época **26/27**. Quando a época mudar, verificar uma a uma
(no Apps Script correr o teste indicado e ver o Registo; se uma modalidade ficar com a classificação
parada, é quase sempre o endereço da fonte):

- **Classificações** (`STANDINGS_SOURCES_`, correr `atualizarClassificacoesAgora`):
  Andebol FPA `portal.fpa.pt/prova/10016/` (o número da prova muda), Voleibol FPV `campeonato=NSFI&fase=1&serie=.`,
  Basquetebol FPB `fpb.pt/classificacao/11440`, Hóquei `hoqueipatins.pt/liga/1-divisao-regular/`,
  Futebol Feminino e Equipa B em `fcporto.pt/.../classificacao` (normalmente estáveis).
- **Futsal** (Sofascore): torneio `112814` / época `102039` (3.ª Divisão, 1.ª Fase, Série A). Os números vêm no próprio jogo
  (`event.tournament.id` / `event.season.id`); a fase e a série também mudam. A edição manual (`setManualStandings`) fica de reserva.
- **Andebol ao vivo**: `ANDEBOL_PROVA_URL_` (mesmo número da prova da FPA).
- **Equipa B**: `EQB_ICS_` (`ligaportugal.pt/calendars-ics/fc_porto_b.ics`) — confirmar que continua a ser o calendário da nova época;
  o endereço da página de cada jogo (`/match/20262027/...`) vem do iCal, mas confirmar `eqbEstado_`.
- **Basquetebol ao vivo**: os IDs do FIBA são novos a cada época/lote (a descoberta automática `basqueDescobrirId_` e a cache `basqueMap`
  partem do último ID conhecido — apagar a cache se ficar presa; o desvio +2508631 era só do lote de 24/10/2026). Classificação FPB: ver acima.
- **Sofascore**: os ids das equipas do Porto (feminino 938214, andebol 21795, futsal 1268317, Equipa B 74469, voleibol 335647, basquetebol 208083)
  são estáveis; as **competições europeias** (`compStdAtualizar_`) descobrem-se sozinhas a partir dos jogos. Correr `testarEscudosAgora`,
  `testarFormasAgora`, `testarClassificacoesEuropaAgora`.
- **Plantel**: `atualizarPlantelAgora` (o mapa `PLANTEL_FCP_` usa classe/equipa do site do clube; confirmar que as equipas continuam as mesmas).
- **No site**: criar a competição nova (ex.: "Época 27/28", modo Modalidades) e arquivar a anterior; fixar a nova (📌); `Época 26/27` aparece no seletor.
  Verificar o Início, o Histórico e os Marcadores (somam por competição), a sondagem em curso e a imagem/texto do `og`.
- **Depois**: um jogo ao vivo de cada modalidade (ver "Ainda por fazer"), `sitemap.xml` (`lastmod`) e subir a cache em `public/sw.js`.

**v200:** `pregameWire_(host)` (`49-pregame.js`, chamada no fim da ligação de eventos de `42-game-page.js`): o bloco "Último confronto" (`.pg-click[data-pgjogo]`) abre `openGamePage_` desse jogo; cache atual `dia22-cache-v295`.

**v201:** `gameStack_` (`42-game-page.js`): "Voltar" da página do jogo desfaz a cadeia (jogo → jogo → vista de origem) com scroll; cache atual `dia22-cache-v295`.

**v202:** `navStack_/navPush_/navBack_` (`37-sport-page.js`): histórico das páginas de detalhe (modalidade/jogo) usado pelo "Voltar"/‹; `setView` (16) limpa-o em vistas de topo (exceto durante `__navBacking_`); substitui o `gameStack_` da v201; cache atual `dia22-cache-v295`.

**v203:** `showAthleteProfile` (14) guarda `navSnap_()`/`navStack_` e o "← Voltar" usa `navRestore_` (37); cache atual `dia22-cache-v295`.

**v204:** `navPush_` faz `history.pushState({dsNav:1})`; `popstate` (37) volta com `navRestore_`; `navUiBack_` (botões ‹/Voltar) usa `history.back()` se houver entrada; `navClear_` (chamada por `setView`) recua o histórico com `history.go(-n)` (`__navIgnore_` ignora o popstate); cache atual `dia22-cache-v295`.

**v205:** `gdTr_`, `GD_STAT_PT_`, `GD_INC_PT_` (`46-game-details.js`) traduzem estatísticas e tipos de lance do Sofascore; para um termo novo basta acrescentar ao dicionário; lances sem nome mostram o rótulo; cache atual `dia22-cache-v295`.

**v206:** `gJog_(sport, plural, cap)` e `FEM_PLAYER_SPORTS` (`03-share-reel.js`): "jogadora(s)" no Futebol Feminino e Voleibol, "jogador(es)" nas restantes; usado nos painéis de estatísticas/golos (13, 14); cache atual `dia22-cache-v295`.

**v207:** `gameDetailsHtml_` (`46-game-details.js`): "Lance a lance" em 2 colunas `.gd-row3` (FC Porto à esquerda se `ev.local !== "fora"`), resultado corrido nos golos (auto-golo conta para o lado de `x[2]`), 10 lances + `.gd-toggle` ("Ver todos"; estado em `GD_OPEN_`); cache atual `dia22-cache-v295`.

**v208 / Apps Script v137:** `zonas`/`zonasN` em cada classificação (`[{a,b,k,t}]`): `zonasDeLinhas_`, `zonaPT_`/`ZONAS_PT_` (tradução), `zonasSofaDescobrir_` (tabela nacional do Sofascore com o mesmo nº de equipas e ≥60% de nomes iguais; falha → fica a última boa), `ZONAS_OCULTAR_` (Equipa B sem subida); Hóquei: cores `#6cf900` (playoff) e `#ff0400` (descida) das linhas; competições europeias também levam `zonas`. Site: `standingsZonasMap_` (`41-standings.js`) + CSS `.z-<k>`/`.zc-<k>`/`.st-leg` no fim de `06-tabs-and-medals.css`; só desenha se `zonasN` = nº de linhas; cache atual `dia22-cache-v295`.

**v209:** resumo do Histórico em linha discreta (`.hist-slim`, `16-admin-panels-b-views.js`); cache atual `dia22-cache-v295`.

**v210:** `.hist-slim` é um `<details>` ("📊 Balanço da época"); cache atual `dia22-cache-v295`.

**v211:** linhas do Histórico (`16`) abrem `goToEventCard` em modo Modalidades (antes `openPlayerStatsPanel`); cache atual `dia22-cache-v295`.

**v212:** `41-standings.js`: `stSummaryHtml_` (frase-resumo, usa `zonas` para a descida), `stFormHtml_`/`stGames_` (forma do FC Porto e jogos contra uma equipa, a partir de `EVENTS`), nota da Equipa B (`.st-note`), listener global em `tr.st-click` que abre `tr.st-games` por baixo; cache atual `dia22-cache-v295`.

**v213:** `historyFilterMonth` (14) + `#histMonthSel` em `renderHistoryView` (16); `miniStandingHtml_` leva `stSummaryHtml_`; `createCompetitionNow_`/`nextSeasonName_` e `#nextSeasonBtn` (17 + template 02): botão "Época seguinte" (confirmação + nome editável + sem repetidos); cache atual `dia22-cache-v295`. A ideia adiada da época seguinte está feita; as sugestões de modalidades/adversários já vêm de todas as competições.

**v214:** `.hv-hero-match` em linha (`flex-direction:row; flex-wrap`) a partir de 700 px, bloco `v214` no fim de `06-tabs-and-medals.css`; cache atual `dia22-cache-v295`.

**v215 / Apps Script v138:** `57-visit-time.js` (`VISIT_TIME_ON_`, `visitTimeStart_` chamada por `logVisit` em 14, sessão em `dia22-visit-sess`, `visitTimeText_`/`visitTimeSummaryHtml_` usados no Registo de acessos em 15); Apps Script `updateVisitTime_` acrescenta `d` (segundos) e `v` (ecrãs) à entrada do registo (mesmo nome e hora, nunca diminui). Temporário a pedido do Fernando: para retirar, `VISIT_TIME_ON_ = false` (o painel deixa de mostrar e o site deixa de medir); cache atual `dia22-cache-v295`.

**v216:** `liveIntroHtml_`/`bindLiveIntro_` (fim de `53-home-extras.js`, usados em `36-home-view.js`): cartão "Novo: jogos ao vivo!" no Início público, fechado fica guardado em `dia22-live-intro-v1`; `#nextSeasonBtn` escondido em `body.readonly-mode` (esquecimento da v213); cache atual `dia22-cache-v295`.

**v217:** `#nextSeasonBtn` é um ícone `.comp-del` (⏭️) junto a 📌/📥 no template 02; cache atual `dia22-cache-v295`.
