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
  separadores Jogos/Classificação/Marcadores. Plantel **ainda não existe**.
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
  Futebol Feminino e Equipa B=fcporto.pt. **Futsal é manual** (modo edição, `setManualStandings`).
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
  Valores de `status` num jogo a decorrer AINDA DESCONHECIDOS (afinar `eqbEstado_` após o 1.º jogo real; guardados em `codigo`). Teste: `testarAoVivoEquipaBAgora`.
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
  texto/meta intactos. `public/social.html` **não** foi redesenhada.
- O título do cabeçalho é sempre "Dragão Stats" em modo Modalidades.
- Vistas de `setView()`: calendario, inicio, modalidade, medalhas,
  hoje-todas, estatisticas, historico, marcadores.

**Cuidados aprendidos:** usar `minmax(0,1fr)` em grelhas (senão há deslize
lateral no telemóvel); no modo edição verificar sempre overflow horizontal a
360/390/768px; subir a versão da cache em `public/sw.js` a cada publicação
(atual `dia22-cache-v233`); em telemóvel os widgets laterais aparecem
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

**Ainda por fazer:** Plantel; testar em produção as fontes reais (ao vivo de cada modalidade), o push do
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
