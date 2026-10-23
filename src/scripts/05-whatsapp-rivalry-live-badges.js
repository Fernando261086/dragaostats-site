// ===================== PARTILHAR NO WHATSAPP (um toque, por jogo) =====================
function buildWhatsAppShareText_(ev, st){
  const dateLabel = formatFullDate(ev.day);
  const hasResult = !!(st && st.resultado && st.resultado.trim());
  const t = postTeams_(ev); // mesma convenção casa/fora de 23-daily-post-text.js — fora, o FC Porto aparece em segundo
  const line = hasResult
    ? `${ev.sport}: ${t.home} vs ${t.away} (${st.resultado.trim()}) — ${dateLabel}`
    : `${ev.sport}: ${t.home} vs ${t.away} — ${dateLabel}${ev.t ? ', ' + ev.t : ''}`;
  return encodeURIComponent(line + "\n\nSegue tudo em dragaostats.pt");
}

// ===================== CONFRONTO DIRETO (histórico contra o mesmo adversário) =====
// Conta todos os outros jogos já com resultado, na mesma modalidade, contra o
// mesmo nome de adversário (exclui o próprio jogo que se está a ver).
function getHeadToHeadRecord_(sport, athlete, excludeId){
  let w=0,d=0,l=0;
  EVENTS.forEach(ev=>{
    if(ev.sport!==sport || ev.athlete!==athlete || ev.id===excludeId) return;
    const tag = getMatchResultTag(ev, getEv(ev.id));
    if(tag==="win") w++; else if(tag==="draw") d++; else if(tag==="loss") l++;
  });
  return { w, d, l, total: w+d+l };
}

// ===================== "AO VIVO" (0) — duração estimada por modalidade, só para dar =====
// a sensação de "isto está a decorrer agora"; não é um placar ao vivo a sério.
const SPORT_DURATION_MIN_ = {
  "Andebol": 75, "Basquetebol": 110, "Hóquei Patins": 70, "Voleibol": 110,
  "Futebol Feminino": 100, "Futsal": 70, "Equipa B": 100
};
// ===================== "AO VIVO" (1) — marcador a sério, vindo da CEV =====================
// O Apps Script lê o site oficial da CEV de minuto a minuto durante os jogos de voleibol
// e guarda o marcador; o site recebe-o junto com o resto, em cada sincronização.
// (a variável CEV_LIVE está declarada em 03-share-reel.js, junto das outras como PREDICTIONS)
// Devolve o marcador do jogo, ou null se não houver — ou se os dados já forem antigos,
// para nunca mostrar como "ao vivo" algo que ficou parado.
function cevLiveFor_(ev){
  if(!ev || !CEV_LIVE || !CEV_LIVE.jogos || !CEV_LIVE.updated) return null;
  if(Math.abs(Date.now() - CEV_LIVE.updated) > 5 * 60 * 1000) return null;
  const j = CEV_LIVE.jogos[ev.id];
  return (j && typeof j === "object") ? j : null;
}
// Texto do marcador, ex.: "FC Porto 1-0 Cajasol · 2.º set: 12-9"
function cevLiveText_(ev, j){
  if(!j) return "";
  const adv = ev.athlete || "Adversário";
  if(j.golosFcp !== undefined){ // jogos de golos/pontos (ex.: hóquei): "FC Porto 3-2 Adversário · 1.ª parte 12:30"
    const t = [j.parte, j.tempo].filter(Boolean).join(" ");
    return "FC Porto " + (j.golosFcp||0) + "-" + (j.golosAdv||0) + " " + adv + (t ? " · " + t : "");
  }
  let txt = "FC Porto " + (j.setsFcp||0) + "-" + (j.setsAdv||0) + " " + adv;
  const sets = Array.isArray(j.sets) ? j.sets : [];
  if(sets.length){
    const last = sets[sets.length - 1];
    txt += " · " + sets.length + ".º set: " + last[0] + "-" + last[1];
  }
  return txt;
}
// Cartão "Ao vivo agora" no topo de todas as vistas. Mostra todos os jogos que a CEV (voleibol) ou o
// hoqueipatins.pt (hóquei, v95) tem a decorrer, com dados frescos. Desaparece sozinho quando o jogo acaba
// ou quando os dados deixam de chegar.
function liveEsc_(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function renderLiveNowBanner_(){
  const host = document.getElementById("liveNowBanner");
  if(!host) return;
  const fresh = CEV_LIVE && CEV_LIVE.jogos && CEV_LIVE.updated && Math.abs(Date.now() - CEV_LIVE.updated) <= 5 * 60 * 1000;
  const ids = fresh ? Object.keys(CEV_LIVE.jogos).filter(id => CEV_LIVE.jogos[id] && CEV_LIVE.jogos[id].estado === "vivo") : [];
  if(!ids.length){ host.style.display = "none"; host.innerHTML = ""; return; }
  const secs = Math.max(0, Math.round((Date.now() - CEV_LIVE.updated) / 1000));
  const ago = secs < 90 ? ("há " + secs + " s") : ("há " + Math.round(secs / 60) + " min");
  host.innerHTML = ids.map(id => {
    const j = CEV_LIVE.jogos[id];
    const sets = Array.isArray(j.sets) ? j.sets : [];
    let setsHtml = "A começar";
    const porGolos = j.golosFcp !== undefined;
    if(porGolos){
      const t = [j.parte, j.tempo].filter(Boolean).join(" ");
      setsHtml = t ? "<b>" + liveEsc_(t) + "</b>" : "A decorrer";
    } else if(sets.length){
      const cur = sets[sets.length - 1];
      const prev = sets.slice(0, -1).map((s, i) => (i + 1) + ".º " + s[0] + "-" + s[1]).join(" · ");
      setsHtml = "<b>" + sets.length + ".º set: " + cur[0] + "-" + cur[1] + "</b>" + (prev ? " · " + liveEsc_(prev) : "");
    }
    return `<div class="live-now-card" data-live-ev="${liveEsc_(id)}">
      <div class="live-now-top"><span class="live-flag">AO VIVO</span><span class="live-now-sport">${liveEsc_(j.sport || "")}${(()=>{ const e = (typeof EVENTS !== "undefined") ? EVENTS.find(x=>x.id===id) : null; return e && e.detail ? " · " + liveEsc_(e.detail) : ""; })()}</span><span class="live-now-upd">atualizado ${ago}</span></div>
      <div class="live-now-row">
        <span class="live-now-team">FC Porto</span>
        <span class="live-now-score">${porGolos ? (j.golosFcp||0) : (j.setsFcp||0)} – ${porGolos ? (j.golosAdv||0) : (j.setsAdv||0)}</span>
        <span class="live-now-team away">${liveEsc_(j.adv || "Adversário")}</span>
      </div>
      <div class="live-now-sets">${setsHtml}</div>
    </div>`;
  }).join("");
  host.style.display = "block";
  host.querySelectorAll("[data-live-ev]").forEach(el => {
    el.onclick = () => {
      const evId = el.getAttribute("data-live-ev");
      if(typeof EVENTS !== "undefined" && EVENTS.some(e => e.id === evId)) goToEventCard(evId);
    };
  });
}
setInterval(renderLiveNowBanner_, 15000); // mantém o "atualizado há…" certo e faz o cartão sumir se os dados pararem
function isLiveNow_(ev){
  if(!ev || !ev.day || !ev.t) return false;
  const start = new Date(ev.day + "T" + ev.t + ":00");
  if(isNaN(start)) return false;
  const durMin = SPORT_DURATION_MIN_[ev.sport] || 90;
  const end = new Date(start.getTime() + durMin * 60000);
  const now = new Date();
  return now >= start && now <= end;
}

function computeCurrentStreak(sport){
  const now = new Date();
  const played = EVENTS.filter(ev=>{
    if(!ev.day) return false;
    if(sport && ev.sport !== sport) return false; // só a mesma modalidade — misturar não faz sentido
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    return !isNaN(d) && d < now;
  }).map(ev=>({ ev, r: getMatchResultTag(ev, getEv(ev.id)) }))
    .filter(x=>x.r)
    .sort((a,b)=>{
      const da = new Date(a.ev.day+"T"+(a.ev.t||"00:00")+":00");
      const db = new Date(b.ev.day+"T"+(b.ev.t||"00:00")+":00");
      return db - da;
    });

  if(played.length === 0) return null;

  const lastResult = played[0].r;
  let count = 0;
  for(const x of played){
    if(x.r === lastResult) count++;
    else break;
  }
  if(count < 2) return null;

  if(lastResult === "win") return `🔥 ${count} vitórias seguidas`;
  if(lastResult === "loss") return `📉 ${count} derrotas seguidas`;
  return `🟰 ${count} empates seguidos`;
}

// Vai diretamente ao cartão de um jogo já dentro da competição ativa (assume
// que EVENTS já é da competição certa) — muda o mês em exibição se preciso,
// abre a vista de calendário e desliza até ao cartão, com um breve destaque
// para a pessoa perceber logo qual é.
function goToEventCard(evId){
  const ev = EVENTS.find(e=>e.id===evId);
  if(!ev) return;
  const isMatches = currentCompMode() === "matches";
  activeDay = isMatches ? (ev.day||"").slice(0,7) : ev.day;
  document.getElementById("dayNum").textContent = activeDay;
  renderDayTabs();
  renderTimeline();
  setView("calendario");
  setTimeout(()=>{
    const el = document.getElementById("ev-card-" + evId);
    if(!el) return;
    el.scrollIntoView({behavior:"smooth", block:"center"});
    el.classList.add("jump-highlight");
    setTimeout(()=> el.classList.remove("jump-highlight"), 2400);
  }, 60);
}

// O texto principal do banner é sempre por dias ("Amanhã", "Daqui a X dias") —
// simples e sem confundir ("34h" não é óbvio que é só "depois de amanhã"). Nas
// últimas 24h antes do jogo, aparece por baixo, mais pequena, a contagem fina
// em horas/minutos — essa sim, vale a pena ver ao segundo.
function formatCountdownMain(diffDays){
  if(diffDays <= 0) return "É hoje!";
  if(diffDays === 1) return "Amanhã";
  return `Daqui a ${diffDays} dias`;
}
function formatCountdownPrecise(nextDate, now){
  const diffMs = nextDate - now;
  if(diffMs <= 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  if(diffMin < 60) return `Começa daqui a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if(diffH < 24) return `Começa daqui a ${diffH}h${remMin>0 ? ' '+remMin+'min' : ''}`;
  return null;
}

// "Adversário do dia" — destaque visível o dia INTEIRO sempre que há um ou mais
// jogos marcados para hoje, seja qual for o adversário (não só clássicos), e
// continua visível mesmo depois de o jogo já ter começado ou terminado.
