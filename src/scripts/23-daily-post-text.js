// ===================== TEXTO DO DIA (para copiar para Facebook/Instagram e Reddit) =====================
// Monta a BASE do post a partir dos jogos do dia desta competição — em português de
// Portugal, com hashtags para Facebook/Instagram e sem elas para o Reddit. É só o
// ponto de partida: o texto fica editável antes de copiares, e os posts especiais
// (reviravoltas, finais) continuam a pedir o teu toque.
let postTextDay = null;        // "YYYY-MM-DD" — por defeito, hoje
let postTextMode = "preview";  // "preview" (antevisão) | "results" (resultados)

function shiftISODay_(iso, n){
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function postSportEmoji_(sport){
  const s = (sport||"").toLowerCase();
  if(s.includes("andebol")) return "🤾";
  if(s.includes("basquet")) return "🏀";
  if(s.includes("hóquei") || s.includes("hoquei")) return "🏒";
  if(s.includes("volei")) return "🏐";
  if(s.includes("futsal") || s.includes("futebol") || s.includes("equipa b") || s.includes("equipa a")) return "⚽";
  return "🏅";
}
function postSportHashtag_(sport){
  const words = (sport||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/\s+/).filter(Boolean);
  return words.length ? "#" + words.map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join("") : "";
}
function postDayWords_(iso){
  const d = new Date(iso + "T00:00:00");
  const today = todayISO_();
  let rel = null;
  if(iso === today) rel = "hoje";
  else if(iso === shiftISODay_(today, 1)) rel = "amanhã";
  else if(iso === shiftISODay_(today, -1)) rel = "ontem";
  return { rel, weekday: WEEKDAY_NAMES[d.getDay()].toLowerCase(), dm: d.getDate() + " de " + MONTH_NAMES[d.getMonth()].toLowerCase() };
}
// mesma regra do cartão de partilha: em casa (ou neutro) o FC Porto aparece primeiro, fora aparece em segundo
function postTeams_(ev){
  const away = ev.local === "fora";
  return { home: away ? (ev.athlete||"") : "FC Porto", away: away ? "FC Porto" : (ev.athlete||"") };
}
// Título do jogo pela ordem em que se joga: "FC Porto vs X" em casa, "X vs FC Porto" fora.
function matchTitleText_(ev){ const t = postTeams_(ev); return t.home + " vs " + t.away; }
// Versão HTML (já escapada) com "FC Porto" marcado: se o título passar para duas linhas,
// fitMatchTitles_() troca "FC Porto" por "FCP" (ver 41-fit-match-titles.js)
function fcpNameHtml_(name){
  const e = String(name == null ? "" : name).replace(/[&<>"]/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  return name === "FC Porto" ? '<span class="fcp-name">FC Porto</span>' : e;
}
function matchTitleHtml_(ev){ const t = postTeams_(ev); const f = (typeof crestName_ === "function") ? (n=>crestName_(ev, n)) : fcpNameHtml_; const g = (typeof crestNameEnd_ === "function") ? (n=>crestNameEnd_(ev, n)) : f; return f(t.home) + " vs " + g(t.away); }
// Etiqueta "Neutro" (em campo neutro a ordem não diz onde se joga)
function matchNeutralTag_(ev){ return ev && ev.local === "neutro" ? ' <span class="neutro-tag">Neutro</span>' : ""; }
function buildPostTexts_(iso, mode){
  const games = EVENTS.filter(ev=>ev.day===iso).sort((a,b)=>(a.t||"99:99").localeCompare(b.t||"99:99"));
  const items = games.map(ev=>({ ev, st: getEv(ev.id) || {} }));
  const played = items.filter(x=>x.st.resultado && String(x.st.resultado).trim());
  const list = mode==="results" ? played : items;
  const missing = mode==="results" ? items.length - played.length : 0;
  const w = postDayWords_(iso);

  const tagFb = st => st.resultTag==="win" ? " ✅ Vitória" : st.resultTag==="loss" ? " ❌ Derrota" : st.resultTag==="draw" ? " ➖ Empate" : "";
  const tagRd = st => st.resultTag==="win" ? " (Vitória)" : st.resultTag==="loss" ? " (Derrota)" : st.resultTag==="draw" ? " (Empate)" : "";
  const detailPhase = ev => [ev.detail, ev.phase].filter(Boolean).join(", ");
  const compRd = ev => {
    if(!ev.detail) return ev.phase ? ", " + ev.phase : "";
    if(!ev.phase) return ", " + ev.detail;
    // se a fase já traz parênteses (ex: "2ª Jornada (Jogo em atraso)"), não os aninha
    return ev.phase.includes("(") ? ", " + ev.detail + ", " + ev.phase : ", " + ev.detail + " (" + ev.phase + ")";
  };

  let fb = "", rd = "";
  if(list.length){
    if(mode==="results"){
      fb += "📊 Resultados " + (w.rel ? "de " + w.rel : "de " + w.dm + " (" + w.weekday + ")") + ":\n\n";
      rd += "Resultados do FC Porto " + (w.rel ? w.rel : "a " + w.dm + " (" + w.weekday + ")") + ":\n\n";
    }else{
      fb += "💙 " + (w.rel ? "Jogos de " + w.rel + ", " + w.weekday + ":" : "Jogos de " + w.dm + " (" + w.weekday + "):") + "\n\n";
      rd += "Jogos do FC Porto " + (w.rel ? w.rel + ", " + w.weekday : "a " + w.dm + " (" + w.weekday + ")") + ":\n\n";
    }
    list.forEach(({ ev, st })=>{
      const t = postTeams_(ev);
      const emoji = postSportEmoji_(ev.sport);
      const dp = detailPhase(ev);
      if(mode==="results"){
        const score = String(st.resultado).trim();
        fb += emoji + " " + ev.sport + " — " + t.home + " " + score + " " + t.away + tagFb(st) + "\n";
        if(dp) fb += dp + "\n";
        fb += "\n";
        rd += ev.sport + ": " + t.home + " " + score + " " + t.away + tagRd(st) + compRd(ev) + "\n";
      }else{
        const when = [ev.t, ev.venue].filter(Boolean).join(", ");
        const meta = [dp, when].filter(Boolean).join(" — ");
        fb += emoji + " " + ev.sport + " — " + t.home + " vs " + t.away + "\n";
        if(meta) fb += meta + "\n";
        fb += "\n";
        rd += ev.sport + ": " + t.home + " - " + t.away + compRd(ev) + (ev.t ? ", " + ev.t : "") + (ev.venue ? ", " + ev.venue : "") + "\n";
      }
    });
    const tags = ["#FCPorto", "#DragaoStats"];
    list.forEach(({ ev })=>{ const h = postSportHashtag_(ev.sport); if(h && tags.indexOf(h)===-1) tags.push(h); });
    fb += (mode==="results" ? "Calendário e classificações em https://dragaostats.pt" : "Resultados em direto em https://dragaostats.pt") + "\n\n" + tags.join(" ");
    rd += "\n" + (mode==="results" ? "Classificações: https://dragaostats.pt" : "Resultados e classificações: https://dragaostats.pt");
  }
  return { fb, rd, total: items.length, shown: list.length, missing };
}

function renderPostTextPanel(){
  const panel = document.getElementById("postTextPanel");
  if(currentCompMode() !== "matches"){
    panel.innerHTML = `<div style="font-size:13px; color:var(--text-dim);">O texto do dia só funciona no Modo Modalidades — abre uma competição desse tipo.</div>`;
    return;
  }
  if(!postTextDay) postTextDay = todayISO_();
  const t = buildPostTexts_(postTextDay, postTextMode);
  const today = todayISO_();
  const isDay = n => postTextDay === shiftISODay_(today, n);
  const esc = str => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let hint = "";
  if(t.total === 0) hint = "Não há jogos marcados para este dia nesta competição.";
  else if(t.shown === 0) hint = "Ainda nenhum jogo deste dia tem resultado registado.";
  else if(t.missing > 0) hint = t.missing + (t.missing===1 ? " jogo ainda sem resultado (não incluído)." : " jogos ainda sem resultado (não incluídos).");
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  const labelStyle = "font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;";

  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">Gera a base do post do dia, em português de Portugal. Podes editar o texto antes de copiar.</div>
    <div class="add-btn-row" style="margin-bottom:8px;">
      <button class="chip ${isDay(-1)?'active':''}" id="ptDayYest" style="cursor:pointer;">Ontem</button>
      <button class="chip ${isDay(0)?'active':''}" id="ptDayToday" style="cursor:pointer;">Hoje</button>
      <button class="chip ${isDay(1)?'active':''}" id="ptDayTomorrow" style="cursor:pointer;">Amanhã</button>
      <input type="date" id="ptDayInput" value="${postTextDay}" style="background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:5px 8px; font-size:13px; color:var(--text);">
    </div>
    <div class="add-btn-row" style="margin-bottom:10px;">
      <button class="chip ${postTextMode==='preview'?'active':''}" id="ptModePreview" style="cursor:pointer;">Antevisão (jogos do dia)</button>
      <button class="chip ${postTextMode==='results'?'active':''}" id="ptModeResults" style="cursor:pointer;">Resultados</button>
    </div>
    ${hint ? `<div style="font-size:12px; color:var(--gold); margin-bottom:8px;">${hint}</div>` : ''}
    <div style="${labelStyle}">Facebook / Instagram (com hashtags)</div>
    <textarea id="ptFbText" rows="11" style="${taStyle}">${esc(t.fb)}</textarea>
    <button class="add-save" id="ptCopyFb" style="margin:6px 0 14px;">Copiar</button>
    <div style="${labelStyle}">Reddit (sem hashtags)</div>
    <textarea id="ptRdText" rows="7" style="${taStyle}">${esc(t.rd)}</textarea>
    <button class="add-save" id="ptCopyRd" style="margin-top:6px;">Copiar</button>
  `;

  const rerender = ()=> renderPostTextPanel();
  document.getElementById("ptDayYest").onclick = ()=>{ postTextDay = shiftISODay_(todayISO_(), -1); rerender(); };
  document.getElementById("ptDayToday").onclick = ()=>{ postTextDay = todayISO_(); rerender(); };
  document.getElementById("ptDayTomorrow").onclick = ()=>{ postTextDay = shiftISODay_(todayISO_(), 1); rerender(); };
  document.getElementById("ptDayInput").onchange = (e)=>{ if(e.target.value){ postTextDay = e.target.value; rerender(); } };
  document.getElementById("ptModePreview").onclick = ()=>{ postTextMode = "preview"; rerender(); };
  document.getElementById("ptModeResults").onclick = ()=>{ postTextMode = "results"; rerender(); };

  const copyFrom = async (taId, btnId)=>{
    const ta = document.getElementById(taId), btn = document.getElementById(btnId);
    try{ await navigator.clipboard.writeText(ta.value); }
    catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(()=>{ btn.textContent = old; }, 1500);
  };
  document.getElementById("ptCopyFb").onclick = ()=> copyFrom("ptFbText", "ptCopyFb");
  document.getElementById("ptCopyRd").onclick = ()=> copyFrom("ptRdText", "ptCopyRd");
}

document.getElementById("postTextBtn").onclick = ()=>{
  const panel = document.getElementById("postTextPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening){
    postTextDay = todayISO_();
    // se os jogos de hoje já têm todos resultado, abre logo em "Resultados"; senão, em "Antevisão"
    const todays = EVENTS.filter(ev=>ev.day===postTextDay);
    postTextMode = (todays.length && todays.every(ev=>{ const st = getEv(ev.id) || {}; return st.resultado && String(st.resultado).trim(); })) ? "results" : "preview";
    renderPostTextPanel();
  }
};

