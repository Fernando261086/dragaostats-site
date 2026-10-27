## v193 — Cabeçalho do modo edição mais baixo no telemóvel
- Só em edição e ecrãs ≤480 px: sem o subtítulo, título numa linha e "↻ agora/12s/3 min" em vez de "Atualizado agora mesmo". Cabeçalho de ~130 px para ~67 px; testado a 320/360/390/430 px. O público não muda. Cache `dia22-cache-v271`.

## v192 — Sem "Novidades", Início alinhado, imagem de partilha leve, cabeçalhos de segurança
- Removido o "Novidades": página, popup, ligação no rodapé e linha no menu "Mais" (o endereço antigo redireciona para o Início).
- Início no computador: o cartão "Ao vivo" ocupa a largura do conteúdo (marcador centrado) e já não há um vazio por baixo do cartão do jogo. Banner do resumo semanal: botões lado a lado no computador, a quebrar linha no telemóvel.
- Imagem de partilha (`og-image.png`) de 409 KB para 187 KB (o WhatsApp aceita bem até ~300 KB).
- `_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `build.js` limpa o `dist` antes de gerar. Cache `dia22-cache-v270`.

## v191 — Auditoria: contraste, acessibilidade e pequenos defeitos
- Contraste de cores (WCAG AA) corrigido: etiqueta "AO VIVO", marcador ao vivo, "atualizado há…", botão de notificações do banner, ligação de privacidade, posição nas Modalidades (tema claro), etiquetas roxas da Equipa B (tema escuro), vitórias no Histórico (tema claro).
- Banner do resumo semanal: os botões já não saem do cartão em ecrãs pequenos ("Agora não" aparecia cortado). Faixa "Toda a semana": texto já cabe a 360 px.
- Seletor de competição com nome acessível; título H1 invisível e zona principal marcada (leitores de ecrã e Google); `canonical` na página inicial; `twitter:card` nas páginas estáticas.
- Alvos de toque um pouco maiores ("Ver mais", reações).
- `sw.js`: só guarda em cache respostas boas (nunca um erro 404/500). Cache `dia22-cache-v269`.

## v190 — Site mais leve e SEO alinhado
- `node build.js` reduz agora espaços e comentários do código e do estilo (esbuild, sem mudar nomes): `index.html` de 777 KB para 593 KB (gzip 202 → 142 KB). Testado: mesmas páginas e o reel continua igual. `node build.js --no-min` gera a versão legível.
- Páginas de modalidade, Novidades e Social: endereço oficial (canonical, og:url, ligações e sitemap) sem `.html`, igual ao que o Cloudflare serve (antes apontava para um endereço que redireciona). Sitemap com data. Cache `dia22-cache-v268`.

## v189 — Reel da semana sem saltos nem paragens
- O vídeo passou a ser criado fotograma a fotograma (WebCodecs, 30 fps exatos) em vez de gravado em tempo real: fim dos saltos e das paragens de 1-2 s. Fundo e marca desenhados uma só vez; letras carregadas antes de desenhar. Ficheiro `55-webm-encode.js` (mux WebM próprio). Browsers sem WebCodecs usam a gravação antiga. Ecrãs: 3,8 s + 1,8 s por jogo, abertura 3,6 s, fecho 5 s. Cache `dia22-cache-v267`.

## v188 — Reel da semana mais comprido
- Cada ecrã (dia) dura 3,4 s + 1,6 s por jogo (antes 3,4 s fixos), abertura 3,4 s e fecho 4,6 s. Um dia com 1 jogo dá ~13 s; semanas cheias passam dos 30 s. Cache `dia22-cache-v266`.

## v187 — Pré-visualização por jogo, SEO e backup diário
- `public/_worker.js` (Cloudflare Pages; o `_routes.json` NÃO é suportado no upload por arrastar, por isso não existe): ao partilhar `/?comp=..&jogo=..` o título/descrição da pré-visualização passam a ser do jogo (ex.: "🤾 Andebol — FC Porto 31-28 Kiel (Vitória)"). Nas páginas de modalidade são injetados "Próximos jogos", "Classificação" e dados estruturados (SportsEvent). Dados do Apps Script com cache de 2 min; qualquer erro serve a página normal. Imagem og continua a genérica. Cache `dia22-cache-v265`.
- Apps Script v132: backup diário da Folha (cópia, últimas 14), teste `testarBackupDiarioAgora`; corrigida a chave do plantel do Hóquei ("Hóquei Patins").

## v186 — Logos das redes no rodapé
- "Segue o Dragão Stats": botões com o logo do Facebook e do Instagram (maiores, com contorno da cor de cada rede ao passar/tocar). Cache `dia22-cache-v264`.

## v185 — Reel da semana já não desaparece
- A sincronização periódica voltava a desenhar a vista "Esta semana" e apagava a caixa do reel (e da imagem + texto) a meio. Agora a caixa aberta mantém-se (incluindo a legenda que estejas a editar) e o botão do reel fica bloqueado enquanto grava. Ao mudar de semana a caixa fecha. Cache `dia22-cache-v263`.

## v184 — Modo de edição igual ao de ver
- Quem edita vê o mesmo que o público: abre no Início, barra de baixo com **Tabelas**, rodapé, Calendário, Histórico e pesquisa iguais, cartão de vitória no Início. Continuam só em edição: barra Gestão, "+ Adicionar prova", Reel e "para promover" na página do jogo. A contagem de uso continua só no modo de ver. Cache `dia22-cache-v262`.

## v183 — Arrumar o site
- Página do jogo: nomes das equipas já não se partem a meio da palavra (tamanho adapta-se aos nomes compridos).
- Rodapé (só público): newsletter só no Início; "Segue o Dragão Stats" (Facebook, Instagram, Apoiar) + links numa linha; "Forma recente" e "Recordes da época" só no Calendário.
- Calendário/Histórico (público): sem o filtro "Resultados", sem "Modalidades" e sem "•••"; a lupa abre a pesquisa do Início (uma só). Histórico sem a barra de pesquisa/filtros duplicada. "Mais" ganhou Marcadores, Calendário em grelha, A tua época e Novidades.
- Página de modalidade: sem cartão "Calendário" vazio.
- Início: bloco "Modalidades" (cada modalidade com o próximo jogo e a posição). Barra de baixo (público): Início, Calendário, Resultados, **Tabelas** (novo ecrã `54-standings-view.js`), Mais. Cache `dia22-cache-v261`.

## v182 — Ferramentas de publicação só para quem edita
- Página do jogo, para quem só vê: "Partilhar" e (jogo terminado) "Imagem do resultado". O **Reel** e as imagens/reels "para promover" ficam só em modo edição. Cache `dia22-cache-v260`.

## v181 — Partilha com resultado
- Página do jogo: o botão "Partilhar" envia agora o resultado no texto ("🤾 Andebol — FC Porto 31-28 Kiel (Vitória) · Vê o jogo completo: link"). Jogo terminado: cartão em destaque "Partilha este resultado" (Partilhar, Imagem, Reel) logo a seguir ao resultado.
- Início: depois de uma vitória (até 2 dias) cartão "Vitória! … Partilha com um amigo adepto" (✕ esconde-o para esse jogo). Contagem anónima: `partilhar_clique`, `convite_vitoria`. Cache `dia22-cache-v259`.

## v180
- Início: faixa **"Hoje joga"** (chips por modalidade com hora, "AO VIVO" ou resultado; toque abre o jogo). **Modalidade favorita** (★, guardada em `dia22-fav-sport`, o Início abre nela). **Contagem anónima de uso** (`track_` em `53-home-extras.js`, só quem vê, lotes de contagens por nome de ação). O convite para instalar já existia (banner a partir da 2.ª visita). Cache `dia22-cache-v258`.
- Apps Script **v131** (`apps-script-v131.gs`): `verificarSaudeFontes_` (email se uma fonte fica velha; teste `testarSaudeFontesAgora`), contagem de uso (`usoRegistar_`, `usoResumoAgora`, email semanal à segunda, `testarUsoAgora`).

## v179 — Abrir já preenchido, tema claro e toque
- Classificações, plantel, escudos, forma e cronologia ficam guardados no aparelho (`52-extras-cache.js`): a visita seguinte abre logo preenchida e o servidor atualiza depois. Na 1.ª visita há barras cinzentas (`skelHtml_`) em vez de "ainda não disponível".
- Ranking de Marcadores: no Basquetebol mostra a média por jogo; tocar num jogador abre a folha dele.
- Tema claro: página do jogo, folha do jogador, pesquisa e tabelas passam a ter contraste mínimo 4,5:1 (o escuro continua o principal). Botões, pílulas e ligações com pelo menos 44 px no telemóvel. Cache `dia22-cache-v257`.

## v178 — Marcadores linha a linha e atalho para escrever depois do jogo
- Jogo terminado (Feminino, Futsal, Equipa B): o cartão "Marcadores" conta cada golo escrito linha a linha. Em modo edição, jogo sem marcadores/estatísticas mostra "Adicionar marcadores/estatísticas" (abre o painel habitual). Cache `dia22-cache-v255`.

## v177 — Ao vivo no Início e resumo pós-jogo
- Cartão "ao vivo" do Início: 3 últimos acontecimentos (golos, cartões; cronologia do Sofascore quando existe) e botão "Ver jogo completo".
- Página do jogo terminado: "Como foi" (golos por minuto, FC Porto à esquerda; só em Feminino/Futsal/Equipa B com minutos escritos e sem cronologia automática) e "Classificação depois do jogo" (5 linhas à volta do FC Porto, J e Pts, ligação à tabela completa). Sem dados, as secções não aparecem. Cache `dia22-cache-v254`.

## v176 — Cartão do próximo jogo clicável + nomes de equipas
- O cartão do próximo jogo (Início e modalidade) abre a página do jogo ao tocar (os botões mantêm a função).
- Ligação de nomes de equipas mais tolerante (`pgSameTeam_` ignora "HC", "FC", "Club"…: "Veszprém HC" = "Telekom Veszprém"), para a tabela do grupo europeu aparecer em "Antes do jogo" e na página do jogo. Cache `dia22-cache-v253`.

## v175 — Médias e competições na folha do jogador
- Basquetebol: médias por jogo (total em pequeno). Todas as modalidades: bloco "Por competição" (Campeonato, Amigável…) quando há mais do que uma; Basquetebol com médias, as outras com totais. Competições juntas ignorando maiúsculas e acentos. Cache `dia22-cache-v252`.

## v174 — Estatísticas do jogador no plantel
- Tocar num jogador do Plantel abre uma folha com jogos, totais da época (golos, pontos, etc.) e jogo a jogo, a partir do que é registado em cada jogo (📊/⚽ e 👥). Ligação tolerante de nomes ("F. Moura" = "Francisco Jorge Moura"; um só nome só conta se for único no plantel). Só site, sem Apps Script novo. Cache `dia22-cache-v251`.

## v173 — Escudos nas classificações + Reel da semana (com Apps Script v126)
- Escudos das equipas nas tabelas de classificação (campeonato e competições europeias); o Apps Script v126 (`escudosComTabelas_`) acrescenta aos `escudos` as equipas que só aparecem nas tabelas. Escudos guardados reduzidos a 128px (`crestShrink_`). Teste: `testarEscudosTabelasAgora`.
- "🎬 Reel da semana" (modo edição, vista Esta semana; `51-week-reel.js`): vídeo vertical com abertura, um ecrã por dia (máx. 4 jogos, com escudos) e fecho com QR; partilha ou descarrega .webm. Legenda curta para colar (`buildWeekReelText_`). Cache `dia22-cache-v250`.

## v172 — Classificações das competições europeias e taças (com Apps Script v123)
- Separador "Classificação" da modalidade mostra, abaixo da tabela do campeonato, a tabela do grupo do FC Porto em cada competição europeia/taça (campo `classificacoesComp`). Página do jogo: "Classificação do grupo" com o adversário destacado; "Antes do jogo" usa essa tabela quando o adversário está no mesmo grupo. Cache `dia22-cache-v248`.

## v171 — Fotos no plantel (com Apps Script v121)
- Plantel com fotografia redonda e número em distintivo (autorizado pelo clube). Endereço da imagem vem da API do clube; ligado diretamente, nada é copiado. Sem foto ou se falhar: círculo com o número. Cache `dia22-cache-v247`.

## v170 — Plantel (com Apps Script v120)
- Separador "Plantel" na página de modalidade: jogadores agrupados por posição (número em círculo + nome) e equipa técnica, só texto (`50-squad.js`). Dados do site oficial do FC Porto via Apps Script (campo `plantel`). Só aparece o separador nas modalidades com plantel. Cache `dia22-cache-v246`.

## v169 — Forma do adversário (com Apps Script v116)
- "Antes do jogo" mostra também os últimos 5 resultados do adversário (campo `formas` do `doGet`). Cache `dia22-cache-v245`.

## v168 — Antes do jogo
- Página de um jogo ainda por começar: cartão "Antes do jogo" com forma do FC Porto (últimos 5), último confronto + balanço com o adversário e posição de cada equipa na classificação (`49-pregame.js`). Só aparece o que houver dados. Cache `dia22-cache-v244`.

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
