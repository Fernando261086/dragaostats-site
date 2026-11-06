// ===================== «SABIAS QUE» AUTOMÁTICOS (v266) =====================
// Factos calculados com os jogos que o site já tem (todas as competições em modo Modalidades, via h2hDoneAll_ de 66-head-to-head.js):
// séries de vitórias, invencibilidade, jogos sem sofrer golos, maior vitória da época, percentagem de vitórias e histórico com o próximo adversário.
// Misturados (um de cada, à vez) com os factos históricos fixos de DAILY_FACTS_ (06). Cartão no Início com «Outro» e «Partilhar» (texto ou imagem).
const AF_GOALS_ = new Set(["Equipa A", "Equipa B", "Futebol Feminino", "Futsal", "Hóquei Patins", "Futebol"]); // modalidades onde 0 golos sofridos é possível
const AF_BIG_ = { "Andebol": 8, "Basquetebol": 15, "Voleibol": 99 }; // diferença mínima para falar da «maior vitória» (voleibol: nunca)
let AF_IDX_ = 0, AF_CACHE_ = null;

function afSeq_(list, test){ let n = 0; for(let i = 0; i < list.length && test(list[i]); i++) n++; return n; }
function afPl_(n, um, varios){ return n + " " + (n === 1 ? um : varios); }

function autoFactsData_(){
  const out = [];
  try{
    if(typeof ALL === "undefined" || !ALL || typeof h2hDoneAll_ !== "function") return out;
    const sports = [];
    ALL.competitions.forEach(c=>{
      if(!c || c.mode !== "matches") return;
      const evs = c.id === activeCompId ? EVENTS : ((ALL.data[c.id] || {}).events || []);
      (evs || []).forEach(e=>{ if(e && e.sport && !sports.includes(e.sport)) sports.push(e.sport); });
    });
    let totV = 0, totJ = 0;
    sports.forEach(sp=>{
      const L = h2hDoneAll_(sp); // do mais recente para o mais antigo
      if(!L.length) return;
      const nome = sportShow_(sp);
      const vit = afSeq_(L, m=>m.tag === "win");
      if(vit >= 3) out.push({ sport: sp, w: 5 + vit, t: `No ${nome}, o FC Porto leva ${afPl_(vit, "vitória seguida", "vitórias seguidas")}.` });
      const semPerder = afSeq_(L, m=>m.tag !== "loss");
      if(semPerder >= 5 && semPerder > vit) out.push({ sport: sp, w: 3 + semPerder, t: `No ${nome}, o FC Porto não perde há ${semPerder} jogos.` });
      const casa = L.filter(m=>m.ev.local !== "fora");
      const semPerderCasa = afSeq_(casa, m=>m.tag !== "loss");
      if(semPerderCasa >= 4) out.push({ sport: sp, w: 2 + semPerderCasa, t: `No ${nome}, o FC Porto não perde em casa há ${semPerderCasa} jogos.` });
      if(AF_GOALS_.has(sp)){
        const limpa = afSeq_(L, m=>m.adv === 0);
        if(limpa >= 2) out.push({ sport: sp, w: 4 + limpa, t: `No ${nome}, o FC Porto leva ${limpa} jogos seguidos sem sofrer golos.` });
        const marca = afSeq_(L, m=>m.fcp > 0);
        if(marca >= 8) out.push({ sport: sp, w: 2 + marca / 2, t: `No ${nome}, o FC Porto marcou em ${marca} jogos seguidos.` });
      }
      // época atual (competição ativa)
      const ep = L.filter(m=>m.ativa);
      if(ep.length >= 5){
        const w = ep.filter(m=>m.tag === "win").length, pct = Math.round(w / ep.length * 100);
        if(pct >= 60) out.push({ sport: sp, w: 3, t: `No ${nome}, o FC Porto venceu ${w} dos ${ep.length} jogos desta época (${pct}%).` });
      }
      const lim = AF_BIG_[sp] || 3;
      let best = null;
      ep.forEach(m=>{ if(m.tag === "win" && m.fcp - m.adv >= lim && (!best || m.fcp - m.adv > best.fcp - best.adv)) best = m; });
      if(best && ep.length >= 3) out.push({ sport: sp, w: 3, t: `A maior vitória do FC Porto no ${nome} nesta época foi ${best.fcp}–${best.adv}, contra o ${best.ev.athlete}.` });
      ep.forEach(m=>{ totJ++; if(m.tag === "win") totV++; });
      // próximo adversário
      try{
        const agora = Date.now();
        const prox = EVENTS.filter(e=>e.sport === sp && e.athlete && !(getEv(e.id) || {}).resultado && pgWhen_(e) >= agora - 3 * 3600000).sort((a, b)=>pgWhen_(a) - pgWhen_(b))[0];
        if(prox){
          const ant = h2hMeetings_(prox);
          if(ant.length >= 2){
            const s = h2hStats_(ant);
            out.push({ sport: sp, w: 6, t: `O próximo jogo de ${nome} é com o ${prox.athlete}. Nos ${ant.length} jogos anteriores, o FC Porto tem ${afPl_(s.w, "vitória", "vitórias")}, ${afPl_(s.d, "empate", "empates")} e ${afPl_(s.l, "derrota", "derrotas")}.` });
          }
        }
      }catch(e){}
    });
    if(totJ >= 10) out.push({ sport: "", w: 2, t: `Nesta época, o FC Porto já venceu ${totV} dos ${totJ} jogos que o Dragão Stats acompanha, em ${sports.length} modalidades.` });
  }catch(e){}
  return out.sort((a, b)=>b.w - a.w);
}

// lista final: factos dos dados e históricos à vez (o que mais interessa primeiro, mas roda por dia)
function autoFacts_(){
  const sig = (typeof EVENTS !== "undefined" ? EVENTS.length : 0) + "|" + (typeof state === "object" && state ? Object.keys(state).length : 0) + "|" + todayISO_();
  if(AF_CACHE_ && AF_CACHE_.sig === sig) return AF_CACHE_.list;
  const dados = autoFactsData_().map(f=>({ k: "dados", sport: f.sport, t: f.t }));
  const hist = (typeof DAILY_FACTS_ !== "undefined" ? DAILY_FACTS_ : []).map(t=>({ k: "hist", sport: "", t: t }));
  const list = [];
  for(let i = 0; i < Math.max(dados.length, hist.length); i++){ if(dados[i]) list.push(dados[i]); if(hist[i]) list.push(hist[i]); }
  AF_CACHE_ = { sig: sig, list: list };
  return list;
}

function autoFactNow_(){
  const list = autoFacts_();
  if(!list.length) return null;
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return list[(doy + AF_IDX_) % list.length];
}

function autoFactHtml_(){
  try{
    if(typeof currentCompMode === "function" && currentCompMode() !== "matches") return "";
    const f = autoFactNow_(); if(!f) return "";
    const esc = homeEsc_;
    const cor = f.sport ? homeColor_(f.sport) : "#e3b23c";
    return `<div class="hv-panel af-card" style="--sc:${cor};"><div class="hv-panel-head"><h3><span class="af-ico">${uiIco_("bulb", 16)}</span> Sabias que</h3><button type="button" class="af-next" data-afnext="1">Outro ›</button></div>
      <div class="af-text">${esc(f.t)}</div>
      <div class="af-acts"><button type="button" class="hv-btn hv-btn-ghost af-btn" data-afshare="txt">Partilhar</button><button type="button" class="hv-btn hv-btn-ghost af-btn" data-afshare="img">Imagem</button></div></div>`;
  }catch(e){ return ""; }
}

// imagem 4:5 com o facto (para redes sociais)
function afWrap_(x, texto, maxW){
  const palavras = String(texto).split(/\s+/), linhas = []; let cur = "";
  palavras.forEach(p=>{ const t = cur ? cur + " " + p : p; if(x.measureText(t).width > maxW && cur){ linhas.push(cur); cur = p; } else cur = t; });
  if(cur) linhas.push(cur);
  return linhas;
}
async function autoFactImage_(f){
  const W = 1080, H = 1350;
  try{ await Promise.all([document.fonts.load('120px "Bebas Neue"'), document.fonts.load('600 56px Archivo')]); }catch(e){}
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0d1b2e"); g.addColorStop(1, "#08111f");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const cor = f.sport ? homeColor_(f.sport) : "#e3b23c";
  x.fillStyle = cor; x.fillRect(0, 0, W, 14);
  x.fillStyle = "#e3b23c"; x.textBaseline = "alphabetic";
  x.font = '120px "Bebas Neue", Impact, sans-serif'; x.fillText("SABIAS QUE?", 90, 250);
  x.fillStyle = cor; x.fillRect(90, 290, 140, 8);
  let tam = 72, linhas;
  const maxW = W - 180;
  for(; tam >= 44; tam -= 4){ x.font = `600 ${tam}px Archivo, Arial, sans-serif`; linhas = afWrap_(x, f.t, maxW); if(linhas.length * tam * 1.3 <= 760) break; }
  x.fillStyle = "#ffffff";
  let y = 420; linhas.forEach(l=>{ x.fillText(l, 90, y); y += tam * 1.3; });
  x.fillStyle = "#e3b23c"; x.font = '70px "Bebas Neue", Impact, sans-serif'; x.fillText("DRAGÃO STATS", 90, H - 150);
  x.fillStyle = "rgba(255,255,255,.75)"; x.font = '600 36px Archivo, Arial, sans-serif'; x.fillText("dragaostats.pt", 90, H - 95);
  return await new Promise(r=>c.toBlob(r, "image/png"));
}

function autoFactBind_(host){
  if(!host) return;
  const nx = host.querySelector("[data-afnext]");
  if(nx) nx.onclick = ()=>{ AF_IDX_++; if(typeof track_ === "function") track_("sq_outro"); if(typeof renderHomeView_ === "function") renderHomeView_(true); };
  host.querySelectorAll("[data-afshare]").forEach(b=>{
    b.onclick = async ()=>{
      const f = autoFactNow_(); if(!f) return;
      if(typeof track_ === "function") track_("sq_partilha_" + b.getAttribute("data-afshare"));
      if(b.getAttribute("data-afshare") === "img"){
        const blob = await autoFactImage_(f);
        if(blob && typeof shareDeliver_ === "function") shareDeliver_(blob, "sabias-que.png", "image/png");
        return;
      }
      const texto = "💡 Sabias que? " + f.t + "\n\nMais em https://dragaostats.pt";
      if(navigator.share){ try{ await navigator.share({ text: texto }); }catch(e){} return; }
      if(navigator.clipboard){ try{ await navigator.clipboard.writeText(texto); alert("Copiado! Já podes colar e enviar:\n" + texto); return; }catch(e){} }
      prompt("Copia isto:", texto);
    };
  });
}
