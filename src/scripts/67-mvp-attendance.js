// ===================== JOGADOR DO JOGO + «FUI AO JOGO» (v264) =====================
// Os dois reutilizam a gravação das reações (linha reservada "__reactions__" do Apps Script, que aceita qualquer chave): não há Apps Script novo.
//   voto → chave "mvp:<nome do jogador>"      presença → chave "fui"      (o nome enviado é só "·", para a linha não crescer)
// No aparelho fica guardado (localStorage) o voto e os jogos a que a pessoa foi; o voto não se pode mudar (o servidor só soma).
const MVP_PREFIX_ = "mvp:";
const MVP_DIAS_ = 7;           // depois de 7 dias a votação fecha (continua a mostrar o resultado)
const MVP_LS_ = "dia22-mvp";
const FUI_LS_ = "dia22-fui";
function lsObj_(k){ try{ const o = JSON.parse(localStorage.getItem(k) || "{}"); return (o && typeof o === "object") ? o : {}; }catch(e){ return {}; } }
function lsObjSet_(k, o){ try{ localStorage.setItem(k, JSON.stringify(o)); }catch(e){} }
function reacEv_(ev){ return (typeof REACTIONS === "object" && REACTIONS && REACTIONS[activeCompId] && REACTIONS[activeCompId][ev.id]) || {}; }
function reacAdd_(ev, chave){
  if(!REACTIONS[activeCompId]) REACTIONS[activeCompId] = {};
  if(!REACTIONS[activeCompId][ev.id]) REACTIONS[activeCompId][ev.id] = {};
  const cur = reactionNames(REACTIONS[activeCompId][ev.id][chave]); cur.push("·");
  REACTIONS[activeCompId][ev.id][chave] = cur; // otimista: já se vê no ecrã
}

// ---- quem pode receber votos: primeiro as fontes certas (onze, fichas), depois o que foi escrito à mão, por fim o plantel
function mvpCandidates_(ev){
  const out = [];
  const igual = (a, b)=> (typeof sqNameMatch_ === "function") ? (sqNameMatch_(a, b) || sqNameMatch_(b, a)) : (pgNorm_(a) === pgNorm_(b));
  const add = (n, num, pos)=>{
    n = String(n == null ? "" : n).trim(); if(!n) return;
    if(out.some(x=>igual(x.n, n))) return;
    out.push({ n: n, num: num, pos: pos });
  };
  const nosso = x=>x && x[2] !== 1; // lado 1 = adversário
  try{
    const o = (typeof ONZE === "object" && ONZE) ? ONZE[ev.id] : null;
    if(o && Array.isArray(o.j)) o.j.filter(nosso).forEach(x=>add(x[0], x[1], x[3]));
    [typeof FICHA === "object" ? FICHA : null, typeof BASKET === "object" ? BASKET : null, typeof DETALHES === "object" ? DETALHES : null].forEach(src=>{
      const d = src && src[ev.id];
      if(d && Array.isArray(d.jg)) d.jg.filter(nosso).forEach(x=>add(x[0], x[1]));
    });
  }catch(e){}
  if(out.length >= 5) return out;
  try{
    (Array.isArray(ev.presentes) ? ev.presentes : []).forEach(n=>add(n));
    (Array.isArray(ev.playerStats) ? ev.playerStats : []).forEach(p=>{ if(p && p.team !== "adv") add(p.name); });
  }catch(e){}
  if(out.length >= 5) return out;
  try{
    const pl = (typeof PLANTEL === "object" && PLANTEL) ? PLANTEL[ev.sport] : null;
    if(pl && Array.isArray(pl.j)) pl.j.forEach(x=>add(x[1], x[0], x[2]));
  }catch(e){}
  return out;
}

function mvpVotes_(ev){
  const d = reacEv_(ev), out = [];
  Object.keys(d).forEach(k=>{
    if(k.indexOf(MVP_PREFIX_) !== 0) return;
    const c = reactionCount(d[k]);
    if(c > 0) out.push({ n: k.slice(MVP_PREFIX_.length), c: c });
  });
  return out.sort((a, b)=>b.c - a.c || a.n.localeCompare(b.n));
}

function mvpOpen_(ev){
  const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
  return !isNaN(d) && (Date.now() - d.getTime()) <= MVP_DIAS_ * 86400000;
}

function mvpHtml_(ev){
  try{
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
    const votos = mvpVotes_(ev), total = votos.reduce((s, x)=>s + x.c, 0);
    const meu = lsObj_(MVP_LS_)[ev.id] || "";
    const cands = mvpCandidates_(ev);
    const podeVotar = READONLY_MODE && !meu && mvpOpen_(ev) && cands.length >= 2;
    if(!podeVotar && !votos.length) return "";
    if(podeVotar){
      return `<div class="gp-card mvp-card"><h3>Jogador do jogo</h3>
        <div class="mvp-sub">Quem foi o melhor do FC Porto? Toca e confirma — só se vota uma vez.</div>
        <div class="mvp-grid">${cands.map(c=>`<button type="button" class="mvp-pick" data-mvpv="${esc(c.n)}">${c.num != null && c.num !== "" ? `<i>${esc(c.num)}</i>` : ""}<span>${esc(c.n)}</span></button>`).join("")}</div>
        <button type="button" class="hv-btn hv-btn-main mvp-ok" id="mvpOk" disabled>Escolhe um jogador</button></div>`;
    }
    const top = votos.slice(0, 5), max = top[0].c;
    return `<div class="gp-card mvp-card"><h3>Jogador do jogo</h3>
      <div class="mvp-sub">${total} ${total === 1 ? "voto" : "votos"} dos adeptos${meu ? " · o teu voto: <b>" + esc(meu) + "</b>" : ""}${!READONLY_MODE ? " · só os adeptos votam" : ""}</div>
      <div class="mvp-res">${top.map((x, i)=>`<div class="mvp-r${i === 0 ? " is-top" : ""}${meu && pgNorm_(meu) === pgNorm_(x.n) ? " is-me" : ""}"><span class="mvp-rn">${i === 0 ? "★ " : ""}${esc(x.n)}</span><span class="mvp-rb"><i style="width:${Math.max(6, Math.round(x.c / max * 100))}%"></i></span><b>${Math.round(x.c / total * 100)}%</b></div>`).join("")}</div>
      ${READONLY_MODE ? `<button type="button" class="hv-btn hv-btn-ghost mvp-share" id="mvpShare">↗ Partilhar</button>` : ""}</div>`;
  }catch(e){ return ""; }
}

// ---- Fui ao jogo
function fuiMine_(){ const o = lsObj_(FUI_LS_); return Object.keys(o).map(k=>Object.assign({ id: k }, o[k])); }
function fuiHtml_(ev){
  try{
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d) || d.getTime() > Date.now()) return ""; // só depois de o jogo começar
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
    const n = reactionCount(reacEv_(ev)["fui"]);
    const meu = !!lsObj_(FUI_LS_)[ev.id];
    if(!READONLY_MODE) return n ? `<div class="gp-card fui-card"><h3>Estiveram no jogo</h3><div class="fui-n"><b>${n}</b> ${n === 1 ? "adepto marcou" : "adeptos marcaram"} presença</div></div>` : "";
    const meus = fuiMine_().filter(x=>x.c === activeCompId);
    const daMod = meus.filter(x=>x.s === ev.sport).length;
    const stats = meu ? `<div class="fui-stats"><div><b>${meus.length}</b><span>${meus.length === 1 ? "jogo visto" : "jogos vistos"} esta época</span></div><div><b>${daMod}</b><span>em ${esc(sportShow_(ev.sport))}</span></div></div>` : "";
    return `<div class="gp-card fui-card"><h3>${meu ? "Estiveste neste jogo" : "Estiveste no jogo?"}</h3>
      ${meu ? `<div class="fui-ok">✓ Presença marcada${n > 1 ? " · mais " + (n - 1) + (n === 2 ? " adepto" : " adeptos") + " marcaram" : ""}</div>${stats}`
            : `<div class="fui-sub">${n ? n + (n === 1 ? " adepto já marcou" : " adeptos já marcaram") + " presença. " : ""}Marca e fica com a conta dos jogos que viste ao vivo.</div><button type="button" class="hv-btn hv-btn-main" id="fuiBtn">🏟️ Estive neste jogo</button>`}</div>`;
  }catch(e){ return ""; }
}

function mvpWire_(host, ev){
  if(!host) return;
  const rerender = ()=>{ try{ gameSig_ = ""; renderGamePage_(); }catch(e){} };
  let escolha = "";
  const ok = host.querySelector("#mvpOk");
  host.querySelectorAll("[data-mvpv]").forEach(b=>{
    b.onclick = ()=>{
      escolha = b.getAttribute("data-mvpv");
      host.querySelectorAll("[data-mvpv]").forEach(x=>x.classList.toggle("sel", x === b));
      if(ok){ ok.disabled = false; ok.textContent = "Votar em " + escolha; }
    };
  });
  if(ok) ok.onclick = ()=>{
    if(!escolha) return;
    ok.disabled = true;
    const o = lsObj_(MVP_LS_); o[ev.id] = escolha; lsObjSet_(MVP_LS_, o);
    reacAdd_(ev, MVP_PREFIX_ + escolha);
    sendReaction(ev.id, MVP_PREFIX_ + escolha, "·");
    if(typeof track_ === "function") track_("mvp_voto");
    rerender();
  };
  const sh = host.querySelector("#mvpShare");
  if(sh) sh.onclick = async ()=>{
    const v = mvpVotes_(ev); if(!v.length) return;
    const t = postTeams_(ev), st = (typeof getEv === "function" && getEv(ev.id)) || {};
    const texto = "⭐ Jogador do jogo, segundo os adeptos: " + v[0].n + " (" + v[0].c + (v[0].c === 1 ? " voto" : " votos") + ")\n" + t.home + " " + String(st.resultado || "").trim() + " " + t.away + "\nVota também: " + gameLink_(ev);
    if(typeof track_ === "function") track_("mvp_partilha");
    if(navigator.share){ try{ await navigator.share({ title: "Jogador do jogo", text: texto }); }catch(e){} return; }
    if(navigator.clipboard){ try{ await navigator.clipboard.writeText(texto); alert("Copiado! Já podes colar e enviar:\n" + texto); return; }catch(e){} }
    prompt("Copia isto:", texto);
  };
  const fui = host.querySelector("#fuiBtn");
  if(fui) fui.onclick = ()=>{
    fui.disabled = true;
    const o = lsObj_(FUI_LS_); o[ev.id] = { s: ev.sport, d: ev.day, c: activeCompId }; lsObjSet_(FUI_LS_, o);
    reacAdd_(ev, "fui");
    sendReaction(ev.id, "fui", "·");
    if(typeof track_ === "function") track_("fui_ao_jogo");
    rerender();
  };
}
