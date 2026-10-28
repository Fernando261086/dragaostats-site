// ===================== CRONOLOGIA E ESTATÍSTICAS DO JOGO (v162) =====================
// Vêm do Apps Script v112 (campo "detalhes" do doGet, lido do Sofascore): golos, cartões, substituições e estatísticas.
// É só informação para ver — nunca altera o resultado nem os marcadores oficiais, que continuam a ser escritos à mão.
let DETALHES = {};
// v205: tradução para português do que o Sofascore envia em inglês (estatísticas e tipos de lance). O que não estiver aqui fica como veio.
const GD_STAT_PT_ = {
  "shooting efficiency":"Eficácia de remate","wing goals":"Golos de ala","7 meters":"Livres de 7 m","7 metres":"Livres de 7 m","7m":"Livres de 7 m","saves":"Defesas","2 min penalty":"Exclusões de 2 min","2 min penalties":"Exclusões de 2 min","2 minute suspensions":"Exclusões de 2 min",
  "yellow cards":"Cartões amarelos","red cards":"Cartões vermelhos","blue cards":"Cartões azuis","goal streak":"Sequência de golos","goals in powerplay":"Golos em superioridade","goals in power play":"Golos em superioridade","steals":"Roubos de bola","technical faults":"Faltas técnicas","technical fouls":"Faltas técnicas",
  "fast break goals":"Golos de contra-ataque","fastbreak goals":"Golos de contra-ataque","breakthrough goals":"Golos de penetração","6m goals":"Golos de 6 m","9m goals":"Golos de 9 m","pivot goals":"Golos de pivô","blocks":"Bloqueios","turnovers":"Perdas de bola","timeouts":"Desconto de tempo","time-outs":"Desconto de tempo","time outs":"Desconto de tempo","assists":"Assistências","goals":"Golos","shots":"Remates","shots on target":"Remates enquadrados","total shots":"Remates","fouls":"Faltas","disqualifications":"Desqualificações","suspensions":"Exclusões",
  "ball possession":"Posse de bola","possession":"Posse de bola","big chances":"Grandes oportunidades","total shots ":"Remates","shots off target":"Remates ao lado","blocked shots":"Remates bloqueados","shots inside box":"Remates dentro da área","shots outside box":"Remates fora da área","corner kicks":"Cantos","corners":"Cantos","offsides":"Foras de jogo","free kicks":"Livres","throw-ins":"Lançamentos de linha lateral","goalkeeper saves":"Defesas do guarda-redes","goal kicks":"Pontapés de baliza","passes":"Passes","accurate passes":"Passes certos","tackles":"Desarmes","interceptions":"Intercepções","clearances":"Cortes","duels":"Duelos","ground duels":"Duelos no chão","aerial duels":"Duelos aéreos","dribbles":"Dribles","crosses":"Cruzamentos","long balls":"Bolas longas","final third entries":"Entradas no último terço","touches in penalty area":"Toques na área","hit woodwork":"Bolas nos ferros","expected goals":"Golos esperados","big chances missed":"Grandes oportunidades falhadas","big chances scored":"Grandes oportunidades marcadas","penalties":"Penáltis","own goals":"Autogolos","substitutions":"Substituições",
  "aces":"Ases","service errors":"Erros de serviço","attack points":"Pontos de ataque","block points":"Pontos de bloco","points won":"Pontos ganhos","max points in a row":"Máx. de pontos seguidos"
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
  const d = (DETALHES && typeof DETALHES === "object") ? DETALHES[ev.id] : null;
  if(!d) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const inc = Array.isArray(d.inc) ? d.inc : [], st = Array.isArray(d.st) ? d.st : [];
  if(!inc.length && !st.length) return "";
  const icone = {G:"⚽", GP:"⚽", AG:"⚽", CA:"🟨", CV:"🟥", CA2:"🟥", S:"🔄", O:"•"};
  let html = "";
  if(inc.length){
    const linhas = inc.slice().reverse().map(x=>{
      const min = esc(x[0]), tipo = x[1], lado = x[2] === 1 ? "adv" : "fcp", nome = esc(x[3] || ""), extra = esc(x[4] || "");
      let txt = "";
      if(tipo === "S") txt = `<b>↑ ${nome}</b>${extra ? ` <i>↓ ${extra}</i>` : ""}`;
      else if(tipo === "GP") txt = `<b>${nome}</b> <i>(penálti)</i>`;
      else if(tipo === "AG") txt = `<b>${nome}</b> <i>(auto-golo)</i>`;
      else if(tipo === "G") txt = `<b>${nome}</b>${extra ? ` <i>(ass. ${extra})</i>` : ""}`;
      else if(tipo === "CA2") txt = `<b>${nome}</b> <i>(2.º amarelo)</i>`;
      else txt = `<b>${nome}</b>${extra ? ` <i>${esc(gdTr_(x[4] || "", GD_INC_PT_))}</i>` : ""}`;
      if(!nome && !extra){ const rotulo = { G:"Golo", GP:"Golo de penálti", AG:"Auto-golo", CA:"Cartão amarelo", CV:"Cartão vermelho", CA2:"2.º amarelo", S:"Substituição" }[tipo]; if(rotulo) txt = `<b>${rotulo}</b>`; }
      else if(!nome && tipo === "G") txt = `<b>Golo</b>${extra ? ` <i>(ass. ${extra})</i>` : ""}`;
      return `<div class="gd-row gd-${lado}"><span class="gd-min">${min}'</span><span class="gd-ic">${icone[tipo] || "•"}</span><span class="gd-tx">${txt}</span></div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Cronologia</h3><div class="gd-list">${linhas}</div></div>`;
  }
  if(st.length){
    const linhas = st.map(x=>{
      const a = parseFloat(String(x[1]).replace(",", ".")) || 0, b = parseFloat(String(x[2]).replace(",", ".")) || 0, tot = a + b;
      const pa = tot > 0 ? Math.round(a / tot * 100) : 50;
      return `<div class="gd-st"><div class="gd-st-t"><b>${esc(x[1])}</b><span>${esc(gdTr_(x[0], GD_STAT_PT_))}</span><b>${esc(x[2])}</b></div><div class="gd-bar"><i style="width:${pa}%"></i></div></div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Estatísticas</h3>${linhas}</div>`;
  }
  return html + `<div class="gd-src">Cronologia e estatísticas: Sofascore, podem ter atraso. O resultado oficial é o do site.</div>`;
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
