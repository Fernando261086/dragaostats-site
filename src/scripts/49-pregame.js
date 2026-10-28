// ===================== ANTES DO JOGO (v168) =====================
// Cartão na página de um jogo ainda por começar: forma recente do FC Porto na modalidade, último confronto com
// este adversário e posição de cada equipa na classificação. Tudo sai do que o site já tem (histórico e classificação).
let FORMAS = {}; // forma recente dos adversários ("Modalidade|Adversário" → [[V|E|D, oponente, placar],…]), do Apps Script v116
function pgNorm_(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
// palavras que não distinguem uma equipa de outra ("HC", "FC", "Club"…): ignoradas ao comparar nomes
const PG_GENERIC_ = new Set(["hc", "fc", "cf", "sc", "cd", "ac", "ad", "as", "sl", "bc", "bk", "cb", "hk", "rk", "kk", "sad", "club", "clube", "de", "do", "da", "dos", "the", "of", "handball", "basket", "basketball", "futsal", "volley", "volleyball", "hoquei", "hockey", "andebol"]);
function pgTokens_(s){ return pgNorm_(s).split(" ").filter(t=>t && t.length > 1 && !PG_GENERIC_.has(t)); }
function pgSameTeam_(a, b){
  const x = pgNorm_(a), y = pgNorm_(b);
  if(!x || !y) return false;
  if(x === y || (x.length >= 4 && y.length >= 4 && (x.indexOf(y) >= 0 || y.indexOf(x) >= 0))) return true;
  // "Veszprém HC" = "Telekom Veszprém": sem as palavras genéricas, todas as de um nome estão no outro
  const tx = pgTokens_(a), ty = pgTokens_(b);
  if(!tx.length || !ty.length) return false;
  const sub = (p, q)=>p.every(t=>q.indexOf(t) >= 0);
  return sub(tx, ty) || sub(ty, tx);
}
function pgWhen_(ev){ const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00"); return isNaN(d) ? 0 : d.getTime(); }
function pgDone_(ev){ const st = (typeof getEv === "function" && getEv(ev.id)) || {}; return (st.resultado && String(st.resultado).trim()) ? st : null; }
function pgTag_(st){ return st.resultTag === "win" ? "win" : st.resultTag === "loss" ? "loss" : st.resultTag === "draw" ? "draw" : ""; }
function pregameHtml_(ev){
  if(typeof EVENTS === "undefined") return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const feitos = EVENTS.filter(e=>e.id !== ev.id && e.sport === ev.sport && pgWhen_(e) < pgWhen_(ev) && pgDone_(e)).sort((a, b)=>pgWhen_(b) - pgWhen_(a));
  const blocos = [];

  // forma do FC Porto (últimos 5) e do adversário (Sofascore, v116)
  const nome = { win: "V", loss: "D", draw: "E" };
  const forma = feitos.filter(e=>pgTag_(pgDone_(e))).slice(0, 5).reverse();
  const fa = (typeof FORMAS === "object" && FORMAS) ? FORMAS[ev.sport + "|" + String(ev.athlete || "").trim()] : null;
  const cls = { V: "win", D: "loss", E: "draw" };
  const linhaFcp = forma.length >= 2 ? `<div class="pg-frow"><span class="pg-fname">FC Porto</span><span class="pg-form">${forma.map(e=>{ const tg = pgTag_(pgDone_(e)); return `<span class="hv-tag hv-tag-${tg}" title="${esc(e.athlete)} ${esc(pgDone_(e).resultado)}">${nome[tg]}</span>`; }).join("")}</span></div>` : "";
  const linhaAdv = (Array.isArray(fa) && fa.length >= 2) ? `<div class="pg-frow"><span class="pg-fname">${esc(ev.athlete)}</span><span class="pg-form">${fa.map(x=>`<span class="hv-tag hv-tag-${cls[x[0]] || ""}" title="${esc(x[1])} ${esc(x[2])}">${esc(x[0])}</span>`).join("")}</span></div>` : "";
  if(linhaFcp || linhaAdv) blocos.push(`<div class="pg-blk"><div class="pg-lbl">Forma recente</div>${linhaFcp}${linhaAdv}<div class="pg-sub">Últimos jogos, do mais antigo para o mais recente</div></div>`);

  // último confronto e balanço
  const diretos = feitos.filter(e=>pgSameTeam_(e.athlete, ev.athlete));
  if(diretos.length){
    const u = diretos[0], st = pgDone_(u), t = postTeams_(u);
    const bal = { win: 0, draw: 0, loss: 0 };
    diretos.forEach(e=>{ const tg = pgTag_(pgDone_(e)); if(tg) bal[tg]++; });
    const total = bal.win + bal.draw + bal.loss;
    blocos.push(`<div class="pg-blk"><div class="pg-lbl">Último confronto</div><div class="pg-last">${crestOnly_(u, t.home)}${esc(t.home)} <b>${esc(String(st.resultado).trim())}</b> ${crestNameEnd_(u, t.away)}</div><div class="pg-sub">${esc(formatShortDate(u.day))}${u.detail ? " · " + esc(u.detail) : ""}${total > 1 ? ` · Balanço: ${bal.win}V ${bal.draw}E ${bal.loss}D` : ""}</div></div>`);
  }

  // classificação (a da competição europeia/taça, se o adversário jogar no mesmo grupo; senão a do campeonato)
  const sComp = (typeof compStandingForGame_ === "function") ? compStandingForGame_(ev) : null;
  const s = sComp || ((typeof STANDINGS === "object" && STANDINGS) ? STANDINGS[ev.sport] : null);
  if(s && Array.isArray(s.rows) && s.rows.length){
    const me = s.rows.find(r=>r.me);
    const adv = s.rows.find(r=>!r.me && pgSameTeam_(r.t, ev.athlete));
    const iPts = (s.cols || []).indexOf("Pts");
    const cel = (r, nome)=>`<div class="pg-pos"><b>${esc(r.p)}.º</b><span>${esc(nome)}</span>${iPts >= 0 && r.c && r.c[iPts] != null ? `<i>${esc(r.c[iPts])} pts</i>` : ""}</div>`;
    const sub = [s.comp, sComp ? s.fase : ""].filter(Boolean).join(" · ");
    if(me && adv) blocos.push(`<div class="pg-blk"><div class="pg-lbl">Classificação</div><div class="pg-poss">${cel(me, "FC Porto")}<span class="pg-vs">vs</span>${cel(adv, ev.athlete)}</div>${sub ? `<div class="pg-sub">${esc(sub)}</div>` : ""}</div>`);
    else if(me) blocos.push(`<div class="pg-blk"><div class="pg-lbl">Classificação</div><div class="pg-poss">${cel(me, "FC Porto")}</div>${sub ? `<div class="pg-sub">${esc(sub)}</div>` : ""}</div>`);
  }
  if(!blocos.length) return "";
  return `<div class="hv-panel pg-card"><div class="hv-panel-head"><h3>Antes do jogo</h3></div>${blocos.join("")}</div>`;
}
