// ===================== CRONOLOGIA E ESTATÍSTICAS DO JOGO (v162) =====================
// Vêm do Apps Script v112 (campo "detalhes" do doGet, lido do Sofascore): golos, cartões, substituições e estatísticas.
// É só informação para ver — nunca altera o resultado nem os marcadores oficiais, que continuam a ser escritos à mão.
let DETALHES = {};
let BASKET = {}; // v250: Basquetebol só pelo Sofascore (Apps Script v163, campo "basket" do doGet): { evId: {t, f: 1 = terminado, c: 1 = FC Porto em casa, q: [[fcp,adv] por quarto], g: vantagem do FC Porto minuto a minuto, st: [[nome,fcp,adv]], jg: [[nome,camisola,lado,min,pts,res,ass,rou,+/-,nota,lanç,3p,ll,perdas,bloq,faltas,res.ataque,titular]], pl: [[segundo,lado,pts,nome,fcp,adv]] } }
const BK_OPEN_ = {}, BK_SORT_ = {};
let FICHA = {}; // v252: fichas de jogadores e gráficos (Apps Script v165, campo "ficha"): { evId: {t, f, k: "A"|"F"|"V", g: [gráfico], jg: [[nome,camisola,lado,min,…]], vs: [[vantagem ponto a ponto] por set], vp: [[pts FC Porto, pts adv] por set]} }
let ASSIST = {}; // v244: assistências por jogo (Apps Script v156): { evId: [nome do assistente, …] } — só jogos acompanhados automaticamente
let ONZE = {}; // v243: onze inicial por jogo (Apps Script v155): { evId: { c: 1 = confirmado, f: [formação FC Porto, formação adversário], j: [[nome, camisola, lado, posição G|D|M|F]] } }
const GD_OPEN_ = {}; // v207: jogos com o "Lance a lance" aberto por inteiro
// v205: tradução para português do que o Sofascore envia em inglês (estatísticas e tipos de lance). O que não estiver aqui fica como veio.
const GD_STAT_PT_ = {
  "shooting efficiency":"Eficácia de remate","wing goals":"Golos de ala","7 meters":"Livres de 7 m","7 metres":"Livres de 7 m","7m":"Livres de 7 m","saves":"Defesas","2 min penalty":"Exclusões de 2 min","2 min penalties":"Exclusões de 2 min","2 minute suspensions":"Exclusões de 2 min",
  "yellow cards":"Cartões amarelos","red cards":"Cartões vermelhos","blue cards":"Cartões azuis","goal streak":"Sequência de golos","goals in powerplay":"Golos em superioridade","goals in power play":"Golos em superioridade","steals":"Roubos de bola","technical faults":"Faltas técnicas","technical fouls":"Faltas técnicas",
  "fast break goals":"Golos de contra-ataque","fastbreak goals":"Golos de contra-ataque","breakthrough goals":"Golos de penetração","6m goals":"Golos de 6 m","9m goals":"Golos de 9 m","pivot goals":"Golos de pivô","blocks":"Bloqueios","turnovers":"Perdas de bola","timeouts":"Desconto de tempo","time-outs":"Desconto de tempo","time outs":"Desconto de tempo","assists":"Assistências","goals":"Golos","shots":"Remates","shots on target":"Remates enquadrados","total shots":"Remates","fouls":"Faltas","disqualifications":"Desqualificações","suspensions":"Exclusões",
  "ball possession":"Posse de bola","possession":"Posse de bola","big chances":"Grandes oportunidades","total shots ":"Remates","shots off target":"Remates ao lado","blocked shots":"Remates bloqueados","shots inside box":"Remates dentro da área","shots outside box":"Remates fora da área","corner kicks":"Cantos","corners":"Cantos","offsides":"Foras de jogo","free kicks":"Livres","throw-ins":"Lançamentos de linha lateral","goalkeeper saves":"Defesas do guarda-redes","goal kicks":"Pontapés de baliza","passes":"Passes","accurate passes":"Passes certos","tackles":"Desarmes","interceptions":"Intercepções","clearances":"Cortes","duels":"Duelos","ground duels":"Duelos no chão","aerial duels":"Duelos aéreos","dribbles":"Dribles","crosses":"Cruzamentos","long balls":"Bolas longas","final third entries":"Entradas no último terço","touches in penalty area":"Toques na área","hit woodwork":"Bolas nos ferros","expected goals":"Golos esperados","big chances missed":"Grandes oportunidades falhadas","big chances scored":"Grandes oportunidades marcadas","penalties":"Penáltis","own goals":"Autogolos","substitutions":"Substituições",
  "aces":"Ases","service errors":"Erros de serviço","attack points":"Pontos de ataque","block points":"Pontos de bloco","points won":"Pontos ganhos","max points in a row":"Máx. de pontos seguidos",
  "total shots":"Remates","average rating":"Nota média","fouled in final third":"Faltas sofridas no terço final","final third phase":"Fase no terço final","dispossessed":"Bolas perdidas","tackles won":"Desarmes ganhos","total tackles":"Desarmes","recoveries":"Recuperações de bola","errors lead to a shot":"Erros que deram remate","errors lead to a goal":"Erros que deram golo","goals prevented":"Golos evitados","punches":"Socos","high claims":"Saídas a cruzamentos",
  "free throws":"Lances livres","points in the paint":"Pontos na área","fast break points":"Pontos de contra-ataque","second chance points":"Pontos de segunda oportunidade","points off turnovers":"Pontos após perdas","bench points":"Pontos do banco","timeout":"Desconto de tempo","largest lead":"Maior vantagem","longest scoring run":"Maior sequência de pontos","scoring run":"Sequência de pontos","lead changes":"Mudanças na liderança","times tied":"Empates","fouls":"Faltas","team rebounds":"Ressaltos de equipa","points":"Pontos","free throws made":"Lances livres marcados","2 pointers":"2 pontos","3 pointers":"Triplos","field goals":"Lançamentos","rebounds":"Ressaltos","defensive rebounds":"Ressaltos defensivos","offensive rebounds":"Ressaltos ofensivos","time spent in lead":"Tempo na liderança","lead changes":"Mudanças na liderança","biggest lead":"Maior vantagem"
};
const GD_INC_PT_ = {
  "suspension":"Exclusão","suspension twominutes":"Exclusão de 2 minutos","twominutes":"2 minutos","two minutes":"2 minutos","suspension 2 minutes":"Exclusão de 2 minutos","disqualification":"Desqualificação","red card":"Cartão vermelho","yellow card":"Cartão amarelo","blue card":"Cartão azul","timeout":"Desconto de tempo","time-out":"Desconto de tempo","penalty":"Penálti","penalty missed":"Penálti falhado","missed penalty":"Penálti falhado","seven meter":"Livre de 7 m","seven meter missed":"Livre de 7 m falhado","goal":"Golo","own goal":"Autogolo","substitution":"Substituição","injury":"Lesão","var":"VAR"
};
function gdTr_(txt, map){
  const t = String(txt == null ? "" : txt).trim(); if(!t) return t;
  const k = t.toLowerCase().replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
  const k2 = t.toLowerCase().replace(/\s+/g, " ").trim();
  if(map[k2]) return map[k2];
  if(map[k]) return map[k];
  // frase composta (ex.: "suspension twoMinutes"): traduz palavra a palavra se todas forem conhecidas
  const ws = k.split(" "), out = [];
  for(const w of ws){ if(map[w]) out.push(map[w]); else return t; }
  return out.join(" ");
}

function gameDetailsHtml_(ev){
  const fk = (typeof fichaHtml_ === "function") ? fichaHtml_(ev) : ""; // v252: ficha de jogadores e gráficos (Andebol, Futebol, Voleibol)
  if(ev.sport === "Basquetebol" && BASKET && BASKET[ev.id] && typeof basketHtml_ === "function"){ const b = basketHtml_(ev); if(b) return b; }
  const d = (DETALHES && typeof DETALHES === "object") ? DETALHES[ev.id] : null;
  if(!d) return fk;
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const inc = Array.isArray(d.inc) ? d.inc : [], st = Array.isArray(d.st) ? d.st : [], jg = Array.isArray(d.jg) ? d.jg : [];
  if(!inc.length && !st.length && !jg.length) return fk;
  const hoq = ev.sport === "Hóquei Patins", golo = hoq ? "🏒" : "⚽"; // v230: hóquei (cronologia do hoqueipatins.pt)
  const mn = m=>(/\d$/.test(String(m)) ? esc(m) + "'" : esc(m)); // "Intervalo" não leva apóstrofo
  const icone = {G:golo, GP:golo, AG:golo, CA:"🟨", CV:"🟥", CA2:"🟥", S:"🔄", O:"•"};
  let html = "";
  if(inc.length){
    // v207: "Lance a lance" em duas colunas — quem joga em casa à esquerda, quem joga fora à direita; resultado corrido nos golos
    const t = (typeof postTeams_ === "function") ? postTeams_(ev) : { home: "FC Porto", away: ev.athlete || "" };
    const fcpEsq = ev.local !== "fora"; // o FC Porto fica à esquerda quando joga em casa (ou em campo neutro)
    const GOLOS = { G: 1, GP: 1, AG: 1 };
    let sE = 0, sD = 0;
    const itens = inc.map(x=>{
      const tipo = x[1], ehFcp = x[2] !== 1, esq = (ehFcp === fcpEsq);
      let placar = "";
      if(GOLOS[tipo]){ if(esq) sE++; else sD++; placar = sE + "–" + sD; }
      return { x, esq, placar };
    });
    const total = itens.length, LIM = 10, aberto = !!GD_OPEN_[ev.id];
    const linhas = itens.slice().reverse().map((it, k)=>{
      const x = it.x, tipo = x[1];
      const min = esc(x[0]), nome = esc(x[3] || ""), extra = esc(x[4] || "");
      let txt = "";
      if(tipo === "S") txt = `<b>↑ ${nome}</b>${extra ? ` <i>↓ ${extra}</i>` : ""}`;
      else if(tipo === "GP") txt = `<b>${nome}</b> <i>(penálti)</i>`;
      else if(tipo === "AG") txt = `<b>${nome}</b> <i>(auto-golo)</i>`;
      else if(tipo === "G") txt = `<b>${nome}</b>${extra ? ` <i>(ass. ${extra})</i>` : ""}`;
      else if(tipo === "CA2") txt = `<b>${nome}</b> <i>(2.º amarelo)</i>`;
      else txt = `<b>${nome}</b>${extra ? ` <i>${esc(gdTr_(x[4] || "", GD_INC_PT_))}</i>` : ""}`;
      if(!nome && !extra){ const rotulo = { G:"Golo", GP:"Golo de penálti", AG:"Auto-golo", CA:"Cartão amarelo", CV:"Cartão vermelho", CA2:"2.º amarelo", S:"Substituição" }[tipo]; if(rotulo) txt = `<b>${rotulo}</b>`; }
      else if(!nome && tipo === "G") txt = `<b>Golo</b>${extra ? ` <i>(ass. ${extra})</i>` : ""}`;
      const ic = `<span class="gd-ic">${icone[tipo] || "•"}</span>`;
      const cel = it.esq ? `<span class="gd-c gd-l">${ic}<span class="gd-tx">${txt}</span></span><span class="gd-mid"><b class="gd-min">${mn(x[0])}</b>${it.placar ? `<em class="gd-sc">${it.placar}</em>` : ""}</span><span class="gd-c"></span>`
                         : `<span class="gd-c"></span><span class="gd-mid"><b class="gd-min">${mn(x[0])}</b>${it.placar ? `<em class="gd-sc">${it.placar}</em>` : ""}</span><span class="gd-c gd-r"><span class="gd-tx">${txt}</span>${ic}</span>`;
      return `<div class="gd-row3${k >= LIM ? " gd-hide" : ""}">${cel}</div>`;
    }).join("");
    const cab = `<div class="gd-head"><span class="gd-hl">${typeof crestName_ === "function" ? crestName_(ev, t.home) : esc(t.home)}</span><span></span><span class="gd-hr">${typeof crestNameEnd_ === "function" ? crestNameEnd_(ev, t.away) : esc(t.away)}</span></div>`;
    const btn = total > LIM ? `<button type="button" class="gd-toggle" data-gdev="${esc(ev.id)}" data-n="${total}">${aberto ? "Ver menos" : `Ver todos (${total})`}</button>` : "";
    html += `<div class="gp-card${aberto ? " gd-open" : ""}"><h3>Lance a lance</h3>${cab}<div class="gd-list">${linhas}</div>${btn}</div>`;
  }
  if(st.length){
    const linhas = st.map(x=>{
      const num = v=>{ v = String(v == null ? "" : v); const pc = v.match(/\((\d+)%\)/); if(pc) return parseFloat(pc[1]); const mm = v.match(/^(\d+):(\d\d)$/); if(mm) return (+mm[1]) * 60 + (+mm[2]); return parseFloat(v.replace(",", ".")) || 0; }; // v235: "14/16 (87%)" usa a percentagem; "26:03" são segundos
      const a = num(x[1]), b = num(x[2]), tot = a + b;
      const pa = tot > 0 ? Math.round(a / tot * 100) : 50;
      return `<div class="gd-st"><div class="gd-st-t"><b>${esc(x[1])}</b><span>${esc(gdTr_(x[0], GD_STAT_PT_))}</span><b>${esc(x[2])}</b></div><div class="gd-bar"><i style="width:${pa}%"></i></div></div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Estatísticas</h3>${linhas}</div>`;
  }
  if(jg.length){
    // v235 (Basquetebol): ficha de cada jogador — [nome, camisola, lado(0=FC Porto), min, pts, res, ass, rou, +/-, nota, lançamentos]
    const t = (typeof postTeams_ === "function") ? postTeams_(ev) : { home: "FC Porto", away: ev.athlete || "" };
    const tab = (lado, nomeEq)=>{
      const rows = jg.filter(x=>(x[2] === 1 ? 1 : 0) === lado);
      if(!rows.length) return "";
      const pm = v=>(v === "" || v == null) ? "" : (v > 0 ? "+" + v : String(v));
      return `<div class="gd-jg-t">${esc(nomeEq)}</div><div class="gd-jg-w"><table class="gd-jg"><thead><tr><th>Jogador</th><th>Min</th><th>Pts</th><th>Res</th><th>Ass</th><th>Rou</th><th>Lanç.</th><th>+/−</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x[1] ? `<i>${esc(x[1])}</i> ` : ""}${esc(x[0])}</td><td>${esc(x[3])}</td><td><b>${esc(x[4])}</b></td><td>${esc(x[5])}</td><td>${esc(x[6])}</td><td>${esc(x[7])}</td><td>${esc(x[10] || "")}</td><td>${esc(pm(x[8]))}</td></tr>`).join("")}</tbody></table></div>`;
    };
    html += `<div class="gp-card"><h3>Jogadores</h3>${tab(0, "FC Porto")}${tab(1, ev.athlete || t.away || "Adversário")}</div>`;
  }
  return html + fk + `<div class="gd-src">Cronologia e estatísticas: ${hoq ? "hoqueipatins.pt" : "Sofascore"}, podem ter atraso. O resultado oficial é o do site.</div>`;
}

// v243: onze inicial (Equipa A, Feminino, Equipa B). Aparece assim que o Sofascore tem o onze (provável ou confirmado) e fica no jogo depois.
function onzeHtml_(ev){
  const o = (ONZE && typeof ONZE === "object") ? ONZE[ev.id] : null;
  if(o && o.hq && Array.isArray(o.j) && o.j.length >= 8) return hqFichaHtml_(ev, o);
  if(!o || !Array.isArray(o.j) || o.j.length < 10) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const linhas = [["G", "GR"], ["D", "Defesas"], ["M", "Médios"], ["F", "Avançados"]];
  const lado = (n, nome)=>{
    const js = o.j.filter(x=>(x[2] === 1 ? 1 : 0) === n);
    if(!js.length) return "";
    const form = o.f && o.f[n] ? ` <i>${esc(o.f[n])}</i>` : "";
    const por = {}; js.forEach(x=>{ const k = linhas.some(l=>l[0] === x[3]) ? x[3] : "F"; (por[k] = por[k] || []).push(x); });
    return `<div class="gd-onze-t"><div class="gd-onze-n">${esc(nome)}${form}</div>${linhas.filter(l=>por[l[0]]).map(l=>`<div class="gd-onze-l"><span class="gd-onze-pos">${l[1]}</span><span class="gd-onze-ps">${por[l[0]].map(x=>`<span class="gd-onze-p">${x[1] ? `<i>${esc(x[1])}</i>` : ""}${esc(x[0])}</span>`).join("")}</span></div>`).join("")}</div>`;
  };
  const adv = (typeof homeOpp_ === "function") ? homeOpp_(ev) : (ev.athlete || "Adversário");
  return `<div class="hv-panel gd-onze"><div class="hv-panel-head"><h3>Onze inicial</h3><span class="gd-onze-tag ${o.c ? "ok" : ""}">${o.c ? "Confirmado" : "Provável"}</span></div><div class="gd-onze-g">${lado(0, "FC Porto")}${lado(1, adv)}</div></div>`;
}

// v271: hóquei em patins — ficha de jogo do hoqueipatins.pt (cinco inicial + suplentes + treinadores). j: [nome, camisola, lado, "G"|"C", titular 1/0, capitão 1/0]
function hqFichaHtml_(ev, o){
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const adv = (typeof homeOpp_ === "function") ? homeOpp_(ev) : (ev.athlete || "Adversário");
  const pl = x=>`<span class="gd-onze-p">${x[1] ? `<i>${esc(x[1])}</i>` : ""}${esc(x[0])}${x[5] ? " (C)" : ""}${x[3] === "G" ? " · GR" : ""}</span>`;
  const lado = (n, nome)=>{
    const js = o.j.filter(x=>(x[2] === 1 ? 1 : 0) === n);
    if(!js.length) return "";
    const ord = (a, b)=>(a[3] === "G" ? 0 : 1) - (b[3] === "G" ? 0 : 1);
    const ini = js.filter(x=>x[4]).sort(ord), sup = js.filter(x=>!x[4]).sort(ord);
    const tr = (o.tr && o.tr[n]) ? o.tr[n].map(t=>esc(t[0]) + (t[1] && !/^treinador$/i.test(t[1]) ? ` <i>${esc(t[1])}</i>` : "")).join(" · ") : "";
    const lin = (t, l)=>l.length ? `<div class="gd-onze-l"><span class="gd-onze-pos">${t}</span><span class="gd-onze-ps">${l.map(pl).join("")}</span></div>` : "";
    return `<div class="gd-onze-t"><div class="gd-onze-n">${esc(nome)}</div>${lin("Cinco inicial", ini)}${lin("Suplentes", sup)}${tr ? `<div class="gd-onze-l"><span class="gd-onze-pos">Treinador</span><span class="gd-onze-ps">${tr}</span></div>` : ""}</div>`;
  };
  return `<div class="hv-panel gd-onze"><div class="hv-panel-head"><h3>Ficha de jogo</h3><span class="gd-onze-tag ok">hoqueipatins.pt</span></div><div class="gd-onze-g">${lado(0, "FC Porto")}${lado(1, adv)}</div></div>`;
}

// v177: últimos acontecimentos no cartão "ao vivo" do Início (3 mais recentes da cronologia, se houver)
function liveRecentHtml_(ev){
  const d = (DETALHES && typeof DETALHES === "object") ? DETALHES[ev.id] : null;
  const inc = d && Array.isArray(d.inc) ? d.inc.filter(x=>x && x[1] && x[1] !== "O" && x[1] !== "S").slice(-3).reverse() : [];
  if(!inc.length) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const icone = {G:"⚽", GP:"⚽", AG:"⚽", CA:"🟨", CV:"🟥", CA2:"🟥"};
  const rot = {G:"Golo", GP:"Golo de penálti", AG:"Auto-golo", CA:"Cartão amarelo", CV:"Cartão vermelho", CA2:"2.º amarelo"};
  return `<div class="hv-live-ev"><div class="hv-live-ev-t">Últimos acontecimentos</div>${inc.map(x=>{
    const lado = x[2] === 1 ? (typeof homeOpp_ === "function" ? homeOpp_(ev) : "Adversário") : "FC Porto";
    return `<div class="hv-live-row"><span class="hv-live-min">${esc(x[0])}'</span><span>${icone[x[1]] || "•"}</span><span class="hv-live-tx">${esc(rot[x[1]] || "Lance")} · ${esc(lado)}${x[3] ? " <i>" + esc(x[3]) + "</i>" : ""}</span></div>`;
  }).join("")}</div>`;
}

// v207: botão "Ver todos / Ver menos" do "Lance a lance" (delegado, porque a página do jogo volta a desenhar-se sozinha)
document.addEventListener("click", e=>{
  const b = e.target && e.target.closest ? e.target.closest(".gd-toggle") : null;
  if(!b) return;
  const id = b.getAttribute("data-gdev");
  GD_OPEN_[id] = !GD_OPEN_[id];
  const card = b.closest(".gp-card");
  if(card) card.classList.toggle("gd-open", !!GD_OPEN_[id]);
  b.textContent = GD_OPEN_[id] ? "Ver menos" : "Ver todos (" + b.getAttribute("data-n") + ")";
});


// ===================== BASQUETEBOL (v250) =====================
// Ecrã de jogo ao estilo Sofascore, com os dados do Apps Script v163: parciais por quarto, gráfico da vantagem, lance a lance, jogadores (ordenáveis) e estatísticas.
// Cada bloco só aparece se houver dados. Lado 0 = FC Porto, 1 = adversário.
function basketHtml_(ev){
  const d = BASKET && BASKET[ev.id]; if(!d || typeof d !== "object") return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const adv = ev.athlete || "Adversário";
  const q = Array.isArray(d.q) ? d.q : [], g = Array.isArray(d.g) ? d.g : [], st = Array.isArray(d.st) ? d.st : [], jg = Array.isArray(d.jg) ? d.jg : [], pl = Array.isArray(d.pl) ? d.pl : [];
  let html = "";
  // parciais
  if(q.length){
    const nomeQ = i=>(i < 4 ? (i + 1) + "º" : (q.length - 4 > 1 ? "Pr." + (i - 3) : "Pr."));
    const tot = [0, 0]; q.forEach(x=>{ tot[0] += Number(x[0]) || 0; tot[1] += Number(x[1]) || 0; });
    const cab = q.map((x, i)=>`<th>${nomeQ(i)}</th>`).join("");
    const lin = (nome, k)=>`<tr><td>${esc(nome)}</td>${q.map(x=>`<td>${esc(x[k])}</td>`).join("")}<td><b>${tot[k]}</b></td></tr>`;
    html += `<div class="gp-card"><h3>Por quartos</h3><div class="gd-jg-w"><table class="gd-jg bk-q"><thead><tr><th></th>${cab}<th>Total</th></tr></thead><tbody>${lin("FC Porto", 0)}${lin(adv, 1)}</tbody></table></div></div>`;
  }
  // gráfico da vantagem
  if(g.length >= 3){
    const W = 300, H = 90, mid = H / 2, mx = Math.max(6, ...g.map(v=>Math.abs(v)));
    const pts = g.map((v, i)=>[(i / (g.length - 1) * W).toFixed(1), (mid - v / mx * (mid - 6)).toFixed(1)]);
    const linha = pts.map(p=>p.join(",")).join(" ");
    const area = `0,${mid} ${linha} ${W},${mid}`;
    const ult = g[g.length - 1];
    html += `<div class="gp-card"><h3>Vantagem ao longo do jogo</h3><svg class="bk-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico da vantagem"><defs><clipPath id="bkUp${esc(ev.id)}"><rect x="0" y="0" width="${W}" height="${mid}"/></clipPath><clipPath id="bkDn${esc(ev.id)}"><rect x="0" y="${mid}" width="${W}" height="${mid}"/></clipPath></defs><polygon points="${area}" class="bk-up" clip-path="url(#bkUp${esc(ev.id)})"/><polygon points="${area}" class="bk-dn" clip-path="url(#bkDn${esc(ev.id)})"/><line x1="0" y1="${mid}" x2="${W}" y2="${mid}" class="bk-zero"/><polyline points="${linha}" class="bk-line"/></svg><div class="bk-leg"><span class="bk-l-up">▲ FC Porto à frente</span><span class="bk-l-dn">▼ ${esc(adv)} à frente</span></div></div>`;
  }
  // lance a lance
  if(pl.length){
    const LIM = 12, aberto = !!BK_OPEN_[ev.id], fcpEsq = ev.local !== "fora";
    const t = (typeof postTeams_ === "function") ? postTeams_(ev) : { home: "FC Porto", away: adv };
    const Q = 600, OT = 300;
    const rel = sec=>{ // segundos do jogo → "1º 4:32" (tempo que falta no quarto)
      let n, ini, dur;
      if(sec <= 4 * Q){ n = Math.max(1, Math.ceil(sec / Q)); ini = (n - 1) * Q; dur = Q; }
      else { const k = Math.max(1, Math.ceil((sec - 4 * Q) / OT)); n = 4 + k; ini = 4 * Q + (k - 1) * OT; dur = OT; }
      const falta = Math.max(0, Math.round(dur - (sec - ini)));
      return (n <= 4 ? n + "º" : "Pr." + (n - 4)) + " " + Math.floor(falta / 60) + ":" + String(falta % 60).padStart(2, "0");
    };
    const rows = pl.slice().reverse();
    const linhas = rows.map((x, k)=>{
      const ehFcp = x[1] === 0, esq = (ehFcp === fcpEsq);
      const placar = fcpEsq ? x[4] + "–" + x[5] : x[5] + "–" + x[4];
      const txt = `<b>${esc(x[3])}</b> <i>+${x[2]}</i>`;
      const mid = `<span class="gd-mid"><b class="gd-min">${esc(rel(x[0]))}</b><em class="gd-sc">${esc(placar)}</em></span>`;
      const cel = esq ? `<span class="gd-c gd-l"><span class="gd-tx">${txt}</span></span>${mid}<span class="gd-c"></span>` : `<span class="gd-c"></span>${mid}<span class="gd-c gd-r"><span class="gd-tx">${txt}</span></span>`;
      return `<div class="gd-row3 bk-row${x[2] === 3 ? " bk-tri" : ""}${k >= LIM ? " gd-hide" : ""}">${cel}</div>`;
    }).join("");
    const cab = `<div class="gd-head"><span class="gd-hl">${typeof crestName_ === "function" ? crestName_(ev, t.home) : esc(t.home)}</span><span></span><span class="gd-hr">${typeof crestNameEnd_ === "function" ? crestNameEnd_(ev, t.away) : esc(t.away)}</span></div>`;
    const btn = rows.length > LIM ? `<button type="button" class="gd-toggle bk-toggle" data-bkev="${esc(ev.id)}" data-n="${rows.length}">${aberto ? "Ver menos" : `Ver todos (${rows.length})`}</button>` : "";
    html += `<div class="gp-card${aberto ? " gd-open" : ""}"><h3>Cestos, lance a lance</h3>${cab}<div class="gd-list">${linhas}</div>${btn}</div>`;
  }
  // jogadores
  if(jg.length){
    const COLS = [["Min",3],["Pts",4],["Res",5],["Ass",6],["Rou",7],["Lanç.",10],["3P",11],["LL",12],["Per",13],["Blq",14],["Fal",15],["+/−",8]];
    const pm = v=>(v === "" || v == null) ? "" : (v > 0 ? "+" + v : String(v));
    const tab = (lado, nome)=>{
      const rows = jg.filter(x=>(x[2] === 1 ? 1 : 0) === lado);
      if(!rows.length) return "";
      const th = COLS.map(c=>`<th class="bk-th" data-bkc="${c[1]}" data-bkl="${lado}">${c[0]}</th>`).join("");
      const body = rows.map(x=>`<tr>${[`<td>${x[1] ? `<i>${esc(x[1])}</i> ` : ""}${esc(x[0])}${x[17] ? "" : ""}</td>`].concat(COLS.map(c=>{ const v = x[c[1]]; return c[1] === 8 ? `<td>${esc(pm(v))}</td>` : (c[1] === 4 ? `<td><b>${esc(v)}</b></td>` : `<td>${esc(v == null ? "" : v)}</td>`); })).join("")}</tr>`).join("");
      return `<div class="gd-jg-t">${esc(nome)}</div><div class="gd-jg-w"><table class="gd-jg bk-jg" data-bkev="${esc(ev.id)}" data-bkl="${lado}"><thead><tr><th>Jogador</th>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
    };
    html += `<div class="gp-card"><h3>Jogadores</h3><div class="bk-hint">Toca num título para ordenar.</div>${tab(0, "FC Porto")}${tab(1, adv)}</div>`;
  }
  // estatísticas
  if(st.length){
    const num = v=>{ v = String(v == null ? "" : v); const pc = v.match(/\((\d+)%\)/); if(pc) return parseFloat(pc[1]); const mm = v.match(/^(\d+):(\d\d)$/); if(mm) return (+mm[1]) * 60 + (+mm[2]); return parseFloat(v.replace(",", ".")) || 0; };
    const linhas = st.map(x=>{ const a = num(x[1]), b = num(x[2]), tot = Math.abs(a) + Math.abs(b), pa = tot > 0 ? Math.round(Math.abs(a) / tot * 100) : 50; return `<div class="gd-st"><div class="gd-st-t"><b>${esc(x[1])}</b><span>${esc(gdTr_(x[0], GD_STAT_PT_))}</span><b>${esc(x[2])}</b></div><div class="gd-bar"><i style="width:${pa}%"></i></div></div>`; }).join("");
    html += `<div class="gp-card"><h3>Estatísticas</h3>${linhas}</div>`;
  }
  if(!html) return "";
  return html + `<div class="gd-src">Dados do jogo: Sofascore, podem ter atraso. O resultado oficial é o do site.</div>`;
}
document.addEventListener("click", function(e){
  const b = e.target && e.target.closest ? e.target.closest(".bk-toggle") : null;
  if(b){
    const id = b.getAttribute("data-bkev"); BK_OPEN_[id] = !BK_OPEN_[id];
    const card = b.closest(".gp-card"); if(card) card.classList.toggle("gd-open", !!BK_OPEN_[id]);
    b.textContent = BK_OPEN_[id] ? "Ver menos" : "Ver todos (" + b.getAttribute("data-n") + ")";
    return;
  }
  const th = e.target && e.target.closest ? e.target.closest(".bk-th") : null;
  if(!th) return;
  const table = th.closest("table"), idx = th.cellIndex, k = (table.getAttribute("data-bkev") || "") + "|" + (table.getAttribute("data-bkl") || "");
  const cur = BK_SORT_[k], dir = (cur && cur.c === idx && cur.d === 1) ? -1 : 1;
  BK_SORT_[k] = { c: idx, d: dir };
  const tb = table.tBodies[0], rows = Array.from(tb.rows);
  const val = r=>{ const v = parseFloat(String((r.cells[idx] || {}).textContent || "").replace("−", "-").replace("+", "")); return isFinite(v) ? v : -999; };
  rows.sort((a, b)=>(val(b) - val(a)) * dir).forEach(r=>tb.appendChild(r));
  table.querySelectorAll(".bk-th").forEach(h=>h.classList.remove("bk-asc", "bk-desc"));
  th.classList.add(dir === 1 ? "bk-desc" : "bk-asc");
});


// ===================== FICHAS E GRÁFICOS (v252) =====================
// Andebol (Champions): ficha dos jogadores + gráfico da vantagem; Futebol (Equipa A/B, Feminino): ficha com nota + pressão; Voleibol: ponto a ponto por set.
const FK_COLS_ = {
  A: [["Golos",4],["Rem",5],["7m",6],["Ass",7],["Rou",8],["Blq",9],["2'",10],["Def",11]],
  F: [["Min",3],["G",4],["Ass",5],["Rem",6],["Pas",7],["Des",8],["Due",9],["Nota",10]]
};
function fkGraphSvg_(id, g, W, H){
  const mid = H / 2, mx = Math.max(4, ...g.map(v=>Math.abs(v)));
  const pts = g.map((v, i)=>[(i / Math.max(1, g.length - 1) * W).toFixed(1), (mid - v / mx * (mid - 4)).toFixed(1)]);
  const linha = pts.map(p=>p.join(",")).join(" "), area = `0,${mid} ${linha} ${W},${mid}`;
  return `<svg class="bk-graph" style="height:${H + 20}px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"><defs><clipPath id="fkU${id}"><rect x="0" y="0" width="${W}" height="${mid}"/></clipPath><clipPath id="fkD${id}"><rect x="0" y="${mid}" width="${W}" height="${mid}"/></clipPath></defs><polygon points="${area}" class="bk-up" clip-path="url(#fkU${id})"/><polygon points="${area}" class="bk-dn" clip-path="url(#fkD${id})"/><line x1="0" y1="${mid}" x2="${W}" y2="${mid}" class="bk-zero"/><polyline points="${linha}" class="bk-line"/></svg>`;
}
function fichaHtml_(ev){
  const d = FICHA && FICHA[ev.id]; if(!d || typeof d !== "object") return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const adv = ev.athlete || "Adversário", sid = String(ev.id).replace(/[^\w-]/g, "");
  const g = Array.isArray(d.g) ? d.g : [], jg = Array.isArray(d.jg) ? d.jg : [], vs = Array.isArray(d.vs) ? d.vs : [], vp = Array.isArray(d.vp) ? d.vp : [];
  let html = "";
  // gráfico: andebol = vantagem; futebol = pressão do jogo (Sofascore)
  if(g.length >= 3 && (d.k === "A" || d.k === "F")){
    const titulo = d.k === "A" ? "Vantagem ao longo do jogo" : "Pressão ao longo do jogo";
    html += `<div class="gp-card"><h3>${titulo}</h3>${fkGraphSvg_(sid, g, 300, 90)}<div class="bk-leg"><span class="bk-l-up">▲ FC Porto ${d.k === "A" ? "à frente" : "por cima"}</span><span class="bk-l-dn">▼ ${esc(adv)} ${d.k === "A" ? "à frente" : "por cima"}</span></div></div>`;
  }
  // voleibol: ponto a ponto, set a set
  if(d.k === "V" && vs.length){
    const linhas = vs.map((s, i)=>{
      const f = vp[i] || [0, 0];
      return `<div class="fk-set"><div class="fk-set-t"><b>Set ${i + 1}</b><span>${esc(f[0])}–${esc(f[1])}</span></div>${s.length >= 2 ? fkGraphSvg_(sid + "s" + i, [0].concat(s), 200, 50) : ""}</div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Ponto a ponto</h3><div class="bk-hint">Vantagem do FC Porto durante cada set.</div>${linhas}<div class="bk-leg"><span class="bk-l-up">▲ FC Porto à frente</span><span class="bk-l-dn">▼ ${esc(adv)} à frente</span></div></div>`;
  }
  // ficha dos jogadores
  const COLS = FK_COLS_[d.k];
  if(COLS && jg.length){
    const pj = typeof gJog_ === "function" ? gJog_(ev.sport, true, true) : "Jogadores";
    const tab = (lado, nome)=>{
      const rows = jg.filter(x=>(x[2] === 1 ? 1 : 0) === lado);
      if(!rows.length) return "";
      const th = COLS.map(c=>`<th class="bk-th" data-bkc="${COLS.indexOf(c) + 1}">${c[0]}</th>`).join("");
      const body = rows.map(x=>`<tr><td>${x[1] ? `<i>${esc(x[1])}</i> ` : ""}${esc(x[0])}</td>${COLS.map(c=>{ const v = x[c[1]]; return `<td>${esc(v == null || v === 0 && c[0] === "Nota" ? "" : (v === 0 ? "–" : v))}</td>`; }).join("")}</tr>`).join("");
      return `<div class="gd-jg-t">${esc(nome)}</div><div class="gd-jg-w"><table class="gd-jg bk-jg"><thead><tr><th>Jogador</th>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
    };
    const a = tab(0, "FC Porto"), b = tab(1, adv);
    if(a || b) html += `<div class="gp-card"><h3>${esc(pj)}</h3><div class="bk-hint">Toca num título para ordenar.</div>${a}${b}</div>`;
  }
  return html;
}
