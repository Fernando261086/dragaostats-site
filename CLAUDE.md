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

**v218 (sem alterações ao site):** `apps-script/apps-script-v138.gs` passa a viver no repositório (versão atual do backend; ao criar a seguinte, copiar para aqui). `npm test` (`tests/smoke.js`): abre `dist/` com dados simulados em modo público e edição a 360/390/768 px e falha se houver erros de JS, deslize lateral ou botões de gestão visíveis no link «só ver». Correr SEMPRE depois de `node build.js` e antes de empacotar (`npm run pack` faz os dois). Precisa de `playwright` instalado.

**v219:** textos `PRIVACY_HTML`/`TERMS_HTML` (14) atualizados; se mudar o que se recolhe, rever; cache atual `dia22-cache-v296`.

**v220:** `42-game-page.js` (ramo `aDecorrer`): aviso "Ao vivo indisponível de momento" quando `hasLiveCoverage_` e passaram >20 min sem dados; cache atual `dia22-cache-v297`.

**v221:** `origemVisita_` (fim de `53-home-extras.js`): `?src=` ou referrer → `track_("origem_<x>")` 1x por sessão (sessionStorage `dia22-origem`); aparece no resumo semanal pelo nome cru. Títulos/descrições SEO das páginas de modalidade reescritos; cache atual `dia22-cache-v298`.

**Apps Script v139 (teste, `apps-script/apps-script-v139.gs`):** v138 + `testarNoticiasAgora` (só lê: Google News por modalidade, feeds RSS de jornais/federações, feeds anunciados nas páginas e endpoints possíveis de notícias em `api.app.fcporto.pt`); serve para decidir a fonte da futura secção "Notícias". Nada mudou no site.

**v222:** `ev.watchName` ("Onde ver", input `#fWatchName` no template 02 / `17-forms-and-sync.js`); linha "Transmissão" em `gp-info` (`42-game-page.js`, `.gp-watch`), clicável com `ev.watchUrl`; cache atual `dia22-cache-v299`. Sem Apps Script novo (os campos do jogo passam tal e qual).

**v223 / Apps Script v140:** notícias. `noticias` no `doGet` ({Modalidade:[{id,t,f,u,d,i}]}); Apps Script `noticiasSeDevido_` (gatilho de 5 min, de hora a hora), props `noticias_<Modalidade>`, `noticiasOcultas`; `ocultarNoticia` (só admin). Imagem = og:image da página real (o link do Google News é resolvido por `noticiasResolverGoogle_`, não oficial, pode deixar de funcionar → fica só o título). Testes: `noticiasAtualizarAgora`, `testarNoticiasImagensAgora`, `noticiasLimparTudo`. Site: `58-news.js` (`newsPanelHtml_`, `newsHomeHtml_`, `bindNews_`); cache atual `dia22-cache-v300`.

**Apps Script v141 (`apps-script/apps-script-v141.gs`, sem alterações ao site):** notícias certas. Cada candidato do Google News tem o endereço real resolvido (nunca truncado; se falhar, fica a ligação completa do Google) e a página lida; `noticiasClassificar_` pontua as 7 modalidades por título + endereço + descrição/keywords + início do texto, exclui futebol masculino (`NOTICIAS_EXCLUIR_`), exige "Porto/Dragões" no topo (exceto fonte "FC Porto") e só aceita com ≥3 pontos e vantagem ≥1; na dúvida, fica de fora. Cadência 15 min, `NOTICIAS_VERSAO_="3"` limpa os dados antigos uma vez. Testes: `noticiasAtualizarAgora` (Registo "ENTRA em…/fica de fora: motivo"), `noticiasLimparTudo`. Resolução do Google e leitura de páginas por confirmar em produção (O Jogo dá 403 → só título, regras estritas).

**v224:** linha «Transmissão» (`42-game-page.js`): o nome do canal é o link; sem botão «Ver transmissão»; cache atual `dia22-cache-v301`.

**v225:** `watchLabel_(ev)` (`42-game-page.js`): nome do canal = `ev.watchName` ou deduzido do endereço; botão «Ver transmissão» nas ações mantém-se; cache atual `dia22-cache-v302`.

**Apps Script v141 (afinação após o 1.º Registo real):** resolução de endereços e imagens funcionam (159 analisadas; 50 entravam, várias erradas). Regras apertadas: o FC Porto (`fc porto|porto b|dragões|portista`) tem de estar no título ou na descrição (só no texto não conta); `futebol nacional` no endereço = futebol masculino; "liga betclic" (Liga de Basquetebol) conta 1 ponto para o Basquetebol; o futebol é excluído pelo endereço «futebol-nacional»; fora fichas de jogo/planteis/resumos; "Champions feminina" é ambíguo e não conta para o Futebol Feminino; vantagem mínima de 4 pontos se o 2.º tem ≥2; `noticiasParecida_` tira a mesma história de jornais diferentes. Ruído conhecido: notícias sobre jogadores da equipa principal que citam a equipa B (ex.: Evanilson).

**v226:** `watchLabel_` (`42-game-page.js`): `ev.watchName` → `ev.notes` (≤40 car.) → deduzido do endereço; cache atual `dia22-cache-v303`.

**Apps Script v141 (2.ª afinação, Registo de 30/10/2026):** o FC Porto tem de estar no **título** (fonte «FC Porto» dispensa); a modalidade precisa de uma palavra forte (peso 3) no título/endereço/descrição/início do texto; `NOTICIAS_EXCLUIR_TACAS_` (Taça de Portugal/da Liga, Liga Europa) não se aplica a títulos «feminin…» (Taça de Portugal feminina entra no Futebol Feminino); `evanilson` excluído; notícias sem página lida (Google a limitar) ficam «adiadas» e tentam de novo até 3 vezes (`vistos[id]` negativo = tentativas, 1 = feito) em vez de serem classificadas só pelo título.

**Apps Script v141 (3.ª afinação):** «dragão» sozinho no título já não conta como FC Porto (Dragão Arena/Dragão = estádio); só `fc porto|porto b|dragões|portista(s)`.

**v227:** separador Notícias (`59-news-view.js`, `renderNewsView_`, `setView("noticias")`, `#newsView`/`#viewNewsBtn`; fica na folha «Mais» e no «Ver todas →» do Início, não na barra de baixo por falta de espaço); Apps Script v141 com `LockService` em `noticiasAtualizar_` e `noticiasLimparTudo` a não apagar `noticiasUltimo` (evitava a corrida com o gatilho que deixava só 2 notícias); cache atual `dia22-cache-v304`.

**Apps Script v141:** `NOTICIAS_DIAS_` = 3 (só notícias das últimas 72 h; as candidatas do Google News já vêm com `when:7d`, o filtro de 3 dias aplica-se ao guardar e ao mostrar). Se ficar curto, subir este número.

**Apps Script v141 (4.ª afinação, Google a bloquear o resolvedor):** num teste (30/10/2026 16:17) TODAS as 129 notícias ficaram «adiadas» (o Google deixou de resolver os endereços depois de muitos testes seguidos) e o site ficou sem notícias. Agora: se a classificação só pelo título já é clara (FC Porto + palavra forte no título) a notícia entra mesmo sem página (fica com a ligação do Google e sem imagem); só se adia (máx. 3×) o que o título não resolve; disjuntor: após 6 falhas seguidas do resolvedor deixa de insistir nessa execução. Não repetir `noticiasAtualizarAgora` em série (limpa tudo e volta a bater no Google); esperar ~1 h.

**Apps Script v142 (`apps-script/apps-script-v142.gs`, sem alterações ao site):** v141 + `testarNoticiasFcpAgora` (só lê: procura na API da app/site do FC Porto as notícias de TODAS as modalidades e mostra o formato). Objetivo: usar a fonte oficial em vez do Google News (bloqueado/limitado). Depois do Registo, ligar a `noticiasAtualizar_`.

**Apps Script v143 (`apps-script/apps-script-v143.gs`, sem alterações ao site):** v142 + `testarNoticiasFcp2Agora`. Descoberto: `api.app.fcporto.pt/v2/news?limit=N` funciona (200; `data[{id,cover{thumb,url,image…},date,title,introduction,tags[8],visibility,items}]`), `highlights` também. Falta: modalidade (tags?), endereço de cada notícia, filtros.

**Apps Script v144 (`apps-script/apps-script-v144.gs`, sem alterações ao site):** notícias só da fonte oficial. `noticiasOficiais_` lê `api.app.fcporto.pt/v2/news?limit=20` (a API devolve no máx. 20; tenta `offset|skip|start` para mais páginas, guarda o que funciona em `noticiasPagParam`), modalidade pelas `tags` (`fcportob`=Equipa B, `fcportow`=Futebol Feminino, `andebol`, `basquet*`, `volei*`, `hoquei*`, `futsal`; sem etiqueta = futebol/outros, ignora), foto = `cover.thumb` (files.app.fcporto.pt), endereço = ligação real lida de `fcporto.pt/pt/noticias` (`/pt/noticias/AAAAMMDD-pt-<título-slug>`; se não aparecer, deduzido), data `date` (hora de Lisboa; ignora futuras). `NOTICIAS_GOOGLE_ON_ = false` (o Google News fica no código; pôr true para juntar). `NOTICIAS_VERSAO_="4"` limpa o antigo uma vez. Teste: `noticiasAtualizarAgora` (linhas "OFICIAL → modalidade | título"). Filtros `sportClass=` da API são ignorados.

**Apps Script v145 (`apps-script/apps-script-v145.gs`, sem alterações ao site):** v144 + `testarNoticiasFcp3Agora` (só lê): procura como paginar/filtrar `api.app.fcporto.pt/v2/news` (a API só dá 20) e se as páginas HTML do site têm mais notícias, para apanhar Andebol/Voleibol/Futsal.

**Apps Script v146 (`apps-script/apps-script-v146.gs`, sem alterações ao site):** a API `api.app.fcporto.pt/v2/news` aceita `?tags=<etiqueta>&limit=20` (máx. 20; `tag=`, `sportClass=`, `page`, `offset` são ignorados). `noticiasOficiais_` lê a lista geral + uma chamada por etiqueta (`andebol, basquetebol, voleibol, hoqueiempatins, futsal, fcportob, fcportow`; as de Voleibol/Futsal/Andebol por confirmar) e junta sem repetir. Modalidade: as específicas têm prioridade sobre `fcportob/fcportow`. Registo do teste mostra "por etiqueta: andebol N · …". A v145 (`testarNoticiasFcp3Agora`) ficou como diagnóstico.

**v228:** `isLeagueGame_(ev)` (`41-standings.js`): só jogos de campeonato (campo `ev.detail`: Campeonato…, 1ª Divisão, 2ª Liga, 3ª Divisão, Liga Portuguesa/BPI…; vazio = campeonato) usam `STANDINGS`; taças/torneios/amigáveis/europeias não. `miniStandingHtml_`, `pregameHtml_` (49) e o botão `#gpTable` (42) usam-no; `compStandingForGame_` (tabela de grupo) tem prioridade; sem tabela, cartão «Competição» com `detail · phase`. Se um campeonato novo tiver nome diferente, acrescentar ao regex. Cache atual `dia22-cache-v305`.

**v229 / Apps Script v147 (`apps-script/apps-script-v147.gs`):** `compPathHtml_` (41), `newsForGame_/newsTicketForGame_/gameNewsHtml_` e `NEWS_LIST_DAYS_=3`/`newsRecent_` (58), favorita primeiro em `newsHomeHtml_`, marca de 15 s em `57-visit-time.js`. Apps Script: `NOTICIAS_DIAS_OFICIAL_=14`, `NOTICIAS_MAX_POR_MODALIDADE_=14`, campo `g` (etiquetas, sem fcporto/ano) em cada notícia e no `doGet`. Cache atual `dia22-cache-v306`.

**v230 / Apps Script v148 (`apps-script/apps-script-v148.gs`):** cronologia do hóquei. A página `hoqueipatins.pt/evento/<id>/` tem `<tr class="commentary-item">` com 3 `<td>` (casa | `<div class="time">5' 1ªP</div>` | fora; linhas: `0-1 Nome`, `Assistência de X`, `Cartão azul X`, `Inicio Powerplay <equipa>`, `Timeout <equipa>`, `Grande Penalidade…`, `Penálti falhado X`, `Defesa de penálti X`, `Sai X, entra Y`, VAR) e `.nameTeam` (1.º = casa). O id do evento descobre-se em `/resultados-do-dia/`, `/resultados/`, `/agenda/`: cada jogo é uma linha `<tr data-live-event="<id>" class="container-event-<id>">` com as duas equipas e a ligação `/evento/<id>` no fim (procurar linha com "Porto" + palavra do adversário; a 1.ª versão olhava só para o texto depois da ligação e falhava). Lido no gatilho do ao vivo do hóquei (a cada 90 s, do início até +3 h), guardado em `sofaDetalhes` (mesmo formato do Sofascore; minuto = "1ªP 5", "Intervalo"). Teste: `testarHoqueiDetalheAgora` (usa o último jogo de hóquei do site). Por confirmar: se a página atualiza durante o jogo. Cache atual `dia22-cache-v307`.

**v231:** `MARCADORES_LABEL_SPORTS` (`03-share-reel.js`) inclui "Hóquei Patins" (botão/painel/página do jogo com "Marcadores"); cache atual `dia22-cache-v308`.

**v232:** calendário: `activeDay === "todos"` = todos os meses (`belongsToActiveDay`, `renderDayTabs` em 03; grelha mensal desligada nesse caso em 12); mudar de mês já não repõe `activeSport`; `getSportsPresent` (03) devolve as modalidades da competição toda em Modo Modalidades; aviso/botão "Ver <mês>" em `renderTimeline` (12); `35-sport-cards.js` só salta de mês se a modalidade não tiver jogos no mês aberto; cache atual `dia22-cache-v309`.

**v233 / Apps Script v149 (`apps-script/apps-script-v149.gs`):** modalidade **"Futebol"** (equipa principal). Site: cor em `01`, `SPORT_DURATION_MIN_` (05), `DEFAULT_QUESTION_TEMPLATES` e `MARCADORES_LABEL_SPORTS` (03), slugs em 18/37/`_worker.js`, `public/futebol.html`, `og/futebol.png`. Apps Script: `SOFA_SPORTS_["Futebol"]` (teamId 3002 = FC Porto, confirmado no Sofascore em 31/10/2026; liga = unique-tournament 238 «Liga Portugal Betclic», época 97436; as estatísticas do Sofascore repetem alguns nomes entre grupos → `sofaGuardarDetalhe_` ignora repetidos; no navegador o Sofascore só responde em `www.sofascore.com/api/v1/…`, `api.sofascore.com` dá 403 mas funciona no Apps Script), `SOFA_DET_SPORTS_` + `SOFA_DET_MAX_ST_` (26 estatísticas), `AVISOS_AUTO_GOLOS_`, `ALERTA_PRE_DESPORTOS_`, `ALERTA_AOVIVO_FONTES_`, classificação por `urlFn: sofaLigaUrl_("Futebol")` (descobre torneio/época nos jogos da equipa; `parseStandingsSofascore_(texto, comp, fase, sportZ)`). Teste: `testarFutebolAgora` (equipa, jogos, tabela, lances/estatísticas, onze inicial, plantel, etiquetas de notícias). **Por fazer** (depois do Registo): `PLANTEL_FCP_["Futebol"]` (classe/equipa do clube), notícias da equipa principal (`noticiasSportDasTags_` e etiqueta), onze inicial. Cache atual `dia22-cache-v310`.

**v234:** traduções de estatísticas de futebol em `GD_STAT_PT_` (`46-game-details.js`: remates, desarmes ganhos, recuperações, nota média…); cache atual `dia22-cache-v311`.

**Apps Script v150 (`apps-script/apps-script-v150.gs`, sem alterações ao site; cache `dia22-cache-v311`):** v149 + plantel do Futebol (`classe 1 / equipa 1`; a equipa 10 da mesma classe não é o plantel) + traduções das zonas «Europa League Qualification» / «Conference League Qualification». Registo de `testarFutebolAgora` (31/10/2026): equipa 3002 OK, tabela da Liga (18 equipas), 19 lances + 47 estatísticas, onze inicial. Notícias da equipa principal ainda por ligar (etiquetas vistas: `fcporto`, `campeonatonacional`).
