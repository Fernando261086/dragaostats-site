// ===================== PAINEL «📣 PARTILHAR» (v237, refeito na v249) =====================
// Um único sítio (só modo edição) para tudo o que se publica nas redes: imagem, reel e texto de um JOGO, de um DIA ou da SEMANA.
// Fluxo: 1) o quê  2) imagem ou reel  3) tamanho para a rede  → pré-visualização + legenda pronta (Instagram/Facebook ou Reddit)
// + botões Copiar / Partilhar / Descarregar. Os geradores antigos (02, 03, 28, 31, 51, 56) são reutilizados tal e qual: entregam o
// ficheiro através de shareDeliver_(), que dentro do painel o apanha (window.__shareCapture_) em vez de partilhar/descarregar logo.
// Os atalhos antigos (página do jogo, "Resultado guardado", "Esta semana", botão do dia) abrem este painel já preparado.

// ---- entrega central de um ficheiro gerado (imagem ou vídeo)
async function shareDeliver_(blob, fileName, mime){
  const cap = window.__shareCapture_;
  if(cap){ window.__shareCapture_ = null; cap(blob, fileName); return; }
  const file = new File([blob], fileName, { type: mime || blob.type || "application/octet-stream" });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: "Dragão Stats" }); return; }
    catch(e){ /* cancelou ou o telemóvel recusou — cai para descarregar */ }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
}

// ---- tamanhos por rede (imagens). Os reels são sempre 9:16 (Reels e Stories do Instagram e do Facebook).
const SHARE_SIZES_ = [
  { k: "4x5",  w: 1080, h: 1350, rat: "4:5",  nome: "Feed Instagram e Facebook", dica: "recomendado" },
  { k: "1x1",  w: 1080, h: 1080, rat: "1:1",  nome: "Quadrado", dica: "Reddit, WhatsApp" },
  { k: "9x16", w: 1080, h: 1920, rat: "9:16", nome: "Stories", dica: "Instagram e Facebook" }
];
// coloca a imagem inteira no tamanho pedido; o que sobra é preenchido com a própria imagem muito desfocada e escurecida
function shareFit_(src, sw, sh, W, H){
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const k = 10, sm = document.createElement("canvas"); sm.width = k; sm.height = Math.max(2, Math.round(k * H / W));
  const sx = sm.getContext("2d"), cs = Math.max(sm.width / sw, sm.height / sh);
  sx.drawImage(src, (sm.width - sw * cs) / 2, (sm.height - sh * cs) / 2, sw * cs, sh * cs);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  x.drawImage(sm, 0, 0, W, H);
  x.fillStyle = "rgba(8,16,32,.62)"; x.fillRect(0, 0, W, H);
  const s = Math.min(W / sw, H / sh), dw = sw * s, dh = sh * s;
  x.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return c;
}
function shareLoadImg_(blob){
  return new Promise((res, rej)=>{ const u = URL.createObjectURL(blob), im = new Image(); im.onload = ()=>{ res({ im, u }); }; im.onerror = ()=>{ URL.revokeObjectURL(u); rej(new Error("img")); }; im.src = u; });
}
function shareCanvasBlob_(c){ return new Promise(res=>c.toBlob(b=>res(b), "image/png")); }

// ---- legendas
function shareNoHashtags_(t){ return String(t).split("\n").filter(l=>!/^\s*(#\S+\s*)+$/.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").trim(); }
function gameCaption_(ev){
  const st = (typeof getEv === "function" && getEv(ev.id)) || {}, score = String(st.resultado || "").trim();
  const tags = ["#FCPorto", "#DragaoStats"], h = postSportHashtag_(ev.sport); if(h) tags.push(h);
  const s = shareTextFan_(ev), dp = [ev.detail, ev.phase].filter(Boolean).join(", ");
  if(score){
    const body = s.texto.replace(/\nVê o jogo completo:$/, "");
    return `${body}${dp ? "\n" + dp : ""}\n\nTodos os resultados e classificações em https://dragaostats.pt\n\n${tags.join(" ")}`;
  }
  let l = s.titulo;
  if(dp) l += "\n" + dp;
  try{
    const w = postDayWords_(ev.day), cap = x=>x.charAt(0).toUpperCase() + x.slice(1);
    l += `\n📅 ${cap(w.rel || w.weekday)}, ${w.dm}${ev.t ? " às " + ev.t : ""}`;
    if((ev.watchName || ev.watchUrl) && typeof watchLabel_ === "function") l += `\n📺 ${watchLabel_(ev)}`;
  }catch(e){}
  return `${l}\n\nAcompanha tudo em https://dragaostats.pt\n\n${tags.join(" ")}`;
}

// ---- estado do painel
let SHARE_S_ = null;
const shE_ = s=>String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shDay_(S){
  DAY_SHARE_DATE_ = (S.day === todayISO_()) ? "" : S.day;
  return { jogos: getDayShareGames_(), live: getDayLiveGames_(), res: getDayResultGames_(), all: dayShareEvents_() };
}
function shWeek_(S){
  const now = new Date();
  const ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + S.wk * 7);
  const we = new Date(ws); we.setDate(ws.getDate() + 7);
  const wd = new Date(we); wd.setDate(we.getDate() - 1);
  return { ws, we, wd, games: getWeekShareGames_(ws, we) };
}
function shSelKey_(S){ return [S.scope, S.day, S.evId, S.dayKind, S.wk, S.fmt].join("|"); }

(function(){
  if(READONLY_MODE) return;
  const tog = document.getElementById("adminToolsToggle");
  if(!tog) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "shareHubBtn"; btn.className = "admin-tools-toggle share-hub-btn";
  btn.innerHTML = "📣 Partilhar";
  tog.insertAdjacentElement("afterend", btn);
  btn.onclick = ()=>openShareHub_();
})();

function closeShareHub_(){
  const el = document.getElementById("shareHub");
  if(SHARE_S_ && SHARE_S_.url){ try{ URL.revokeObjectURL(SHARE_S_.url); }catch(e){} }
  if(SHARE_S_){ SHARE_S_.token++; }
  if(el) el.remove();
  document.body.classList.remove("share-hub-open");
  window.__shareHubOpen_ = false; window.__shareCapture_ = null;
  DAY_SHARE_DATE_ = "";
  try{ renderDayShareToggle_(); }catch(e){}
}

// opts: { scope: "jogo"|"dia"|"semana", evId, day, dayKind: "jogos"|"live"|"res", weekOffset, fmt: "img"|"reel" }
function openShareHub_(opts){
  opts = (opts && opts.scope) ? opts : null;
  const exists = !!document.getElementById("shareHub");
  if(exists && !opts) return closeShareHub_();
  const hoje = todayISO_();
  let size = "4x5"; try{ const v = localStorage.getItem("dia22-share-size"); if(SHARE_SIZES_.some(z=>z.k === v)) size = v; }catch(e){}
  if(SHARE_S_ && SHARE_S_.url){ try{ URL.revokeObjectURL(SHARE_S_.url); }catch(e){} }
  const prevTok = SHARE_S_ ? SHARE_S_.token : 0;
  const o = opts || {};
  let day = o.day || hoje;
  if(o.evId){ const ev0 = EVENTS.find(e=>e.id === o.evId); if(ev0 && ev0.day) day = ev0.day; }
  SHARE_S_ = { scope: o.scope || "dia", day, evId: o.evId || "", dayKind: o.dayKind || "", wk: (o.weekOffset != null ? o.weekOffset : weekOffset), fmt: o.fmt || "img",
    size, rede: "ig", srcBlob: null, srcName: "", out: null, url: "", busy: false, token: prevTok + 1, key: "", caption: "", capReddit: "" };
  window.__shareHubOpen_ = true;
  if(!exists){
    const el = document.createElement("div");
    el.id = "shareHub"; el.className = "sh-overlay";
    el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Partilhar">
      <div class="sh-top"><b>📣 Partilhar</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
      <div id="shCtl"></div>
      <div id="shOut" class="sh-out"></div>
    </div>`;
    document.body.appendChild(el);
    document.body.classList.add("share-hub-open");
    el.querySelector(".sh-x").onclick = closeShareHub_;
    el.addEventListener("click", e=>{ if(e.target === el) closeShareHub_(); });
  }else{ shOut_().innerHTML = ""; }
  shPaint_();
}
function shOut_(){ return document.getElementById("shOut"); }

// escolhas que dependem do que existe (jogo por defeito, tipo de dia por defeito, formato possível)
function shNormalize_(S){
  if(S.scope === "jogo"){
    const d = shDay_(S);
    if(!S.evId || !d.all.some(e=>e.id === S.evId)){
      const comRes = d.all.find(e=>{ const st = getEv(e.id) || {}; return st.resultado && String(st.resultado).trim(); });
      S.evId = (comRes || d.all[0] || {}).id || "";
    }
    return { d, ev: d.all.find(e=>e.id === S.evId) || null, n: S.evId ? 1 : 0 };
  }
  if(S.scope === "dia"){
    const d = shDay_(S);
    if(!S.dayKind || (S.dayKind === "jogos" && !d.jogos.length) || (S.dayKind === "live" && !d.live.length) || (S.dayKind === "res" && !d.res.length)){
      S.dayKind = d.jogos.length ? "jogos" : (d.res.length ? "res" : "jogos");
    }
    const list = S.dayKind === "live" ? d.live : S.dayKind === "res" ? d.res : d.jogos;
    if(S.dayKind === "res" && S.fmt === "reel") S.fmt = "img"; // não existe reel de resultados do dia
    return { d, list, n: list.length };
  }
  const w = shWeek_(S);
  return { w, n: w.games.length };
}

function shPaint_(){
  const S = SHARE_S_, ctl = document.getElementById("shCtl"); if(!S || !ctl) return;
  const hoje = todayISO_(), N = shNormalize_(S);
  const chip = (on, attrs, txt, dis)=>`<button type="button" class="sh-chip${on ? " on" : ""}"${dis ? " disabled" : ""} ${attrs}>${txt}</button>`;
  let h = `<div class="sh-sec">1 · O que queres partilhar?</div><div class="sh-days">` +
    [["jogo", "⚽ Um jogo"], ["dia", "📅 Um dia"], ["semana", "🗓️ A semana"]].map(x=>chip(S.scope === x[0], `data-scope="${x[0]}"`, x[1])).join("") + `</div>`;
  if(S.scope === "semana"){
    const lab = (S.wk === 0 ? "Esta semana" : S.wk === -1 ? "Semana passada" : S.wk === 1 ? "Próxima semana" : "Semana " + (S.wk > 0 ? "+" : "") + S.wk);
    h += `<div class="sh-days" style="margin-top:8px">` + [[-1, "Passada"], [0, "Esta semana"], [1, "Próxima"]].map(x=>chip(S.wk === x[0], `data-wk="${x[0]}"`, x[1])).join("") + `</div>
      <div class="sh-date">${shE_(lab)}: ${shE_(weekShareDateRangeLabel_(N.w.ws, N.w.wd))} · ${N.n ? N.n + (N.n === 1 ? " jogo por realizar" : " jogos por realizar") : "sem jogos por realizar"}</div>`;
  }else{
    const quick = [["Ontem", dayShareAddDays_(hoje, -1)], ["Hoje", hoje], ["Amanhã", dayShareAddDays_(hoje, 1)]];
    h += `<div class="sh-days" style="margin-top:8px">` + quick.map(q=>chip(q[1] === S.day, `data-d="${q[1]}"`, q[0])).join("") +
      `<input type="date" id="shDateIn" class="sh-in" value="${S.day}"></div><div class="sh-date">${shE_(dayShareDateLabel_())}</div>`;
    if(S.scope === "jogo"){
      const all = N.d.all;
      h += all.length ? `<div class="sh-games">` + all.map(e=>{
        const st = getEv(e.id) || {}, sc = String(st.resultado || "").trim(), t = postTeams_(e);
        return `<button type="button" class="sh-game${e.id === S.evId ? " on" : ""}" data-ev="${shE_(e.id)}"><span>${shE_(e.t || "--:--")}</span><b>${postSportEmoji_(e.sport)} ${shE_(e.sport)}</b><em>${shE_(t.home)} ${shE_(sc || "vs")} ${shE_(t.away)}</em></button>`;
      }).join("") + `</div>` : `<div class="medal-empty">Não há jogos neste dia.</div>`;
    }else{
      const kinds = [["jogos", "Por realizar", N.d.jogos.length], ["live", "🔴 Com Ao vivo", N.d.live.length], ["res", "🏆 Resultados", N.d.res.length]];
      h += `<div class="sh-days">` + kinds.map(k=>chip(S.dayKind === k[0], `data-dk="${k[0]}"`, `${k[1]} <small>(${k[2]})</small>`, !k[2])).join("") + `</div>`;
    }
  }
  const canReel = N.n > 0 && !(S.scope === "dia" && S.dayKind === "res");
  h += `<div class="sh-sec">2 · Imagem ou reel?</div><div class="sh-days">` +
    chip(S.fmt === "img", `data-fmt="img"`, "🖼️ Imagem + texto", !N.n) + chip(S.fmt === "reel", `data-fmt="reel"`, "🎬 Reel + texto", !canReel) + `</div>`;
  if(S.fmt === "img"){
    h += `<div class="sh-sec">3 · Tamanho</div><div class="sh-sizes">` + SHARE_SIZES_.map(z=>
      `<button type="button" class="sh-size${S.size === z.k ? " on" : ""}" data-size="${z.k}"><b>${z.rat}</b><span>${z.nome}</span><small>${z.dica} · ${z.w}×${z.h}</small></button>`).join("") + `</div>`;
  }else{
    h += `<div class="sh-sec">3 · Tamanho</div><div class="sh-note">Vertical <b>9:16</b> (1080×1920): é o formato certo para Reels e Stories do Instagram e do Facebook. Sai sem música; junta a música da própria rede ao publicar.</div>`;
  }
  h += `<div class="sh-act">` + (S.fmt === "reel" ? `<button type="button" class="hv-btn hv-btn-main" id="shGo"${S.busy || !canReel ? " disabled" : ""}>${S.out && S.out.kind === "vid" ? "🎬 Criar outra vez" : "🎬 Criar o reel"}</button>` : "") + `</div>`;
  ctl.innerHTML = h;
  ctl.querySelectorAll("[data-scope]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.scope = b.getAttribute("data-scope"); shChanged_(); }; });
  ctl.querySelectorAll("[data-wk]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.wk = Number(b.getAttribute("data-wk")); shChanged_(); }; });
  ctl.querySelectorAll("[data-d]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.day = b.getAttribute("data-d"); S.evId = ""; shChanged_(); }; });
  const di = ctl.querySelector("#shDateIn"); if(di) di.onchange = e=>{ if(S.busy || !e.target.value) return; S.day = e.target.value; S.evId = ""; shChanged_(); };
  ctl.querySelectorAll("[data-ev]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.evId = b.getAttribute("data-ev"); shChanged_(); }; });
  ctl.querySelectorAll("[data-dk]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.dayKind = b.getAttribute("data-dk"); shChanged_(); }; });
  ctl.querySelectorAll("[data-fmt]").forEach(b=>{ b.onclick = ()=>{ if(S.busy) return; S.fmt = b.getAttribute("data-fmt"); shChanged_(); }; });
  ctl.querySelectorAll("[data-size]").forEach(b=>{ b.onclick = ()=>{ S.size = b.getAttribute("data-size"); try{ localStorage.setItem("dia22-share-size", S.size); }catch(e){} shPaint_(); if(S.srcBlob && S.out && S.out.kind === "img") shShowImg_(); }; });
  const go = ctl.querySelector("#shGo"); if(go) go.onclick = ()=>shGenerate_();
  // imagem: gera sozinha; reel: espera pelo botão (demora)
  if(S.fmt === "img" && N.n && S.key !== shSelKey_(S)) shGenerate_();
}
function shChanged_(){
  const S = SHARE_S_;
  if(S.key !== shSelKey_(S)){ S.token++; S.key = ""; S.srcBlob = null; S.out = null; if(S.url){ try{ URL.revokeObjectURL(S.url); }catch(e){} S.url = ""; } const o = shOut_(); if(o) o.innerHTML = ""; }
  shPaint_();
}

// apanha o ficheiro que um gerador antigo entregaria (em vez de partilhar/descarregar já)
function shCapture_(fn, ms){
  return new Promise((res, rej)=>{
    const t = setTimeout(()=>{ window.__shareCapture_ = null; rej(new Error("timeout")); }, ms || 300000);
    window.__shareCapture_ = (blob, name)=>{ clearTimeout(t); res({ blob, name }); };
    Promise.resolve().then(fn).catch(e=>{ clearTimeout(t); window.__shareCapture_ = null; rej(e); });
  });
}

async function shGenerate_(){
  const S = SHARE_S_; if(!S || S.busy) return;
  const N = shNormalize_(S); if(!N.n) return;
  const my = ++S.token, key = shSelKey_(S), reel = S.fmt === "reel";
  S.busy = true; S.key = key; S.out = null;
  const out = shOut_();
  const sid = S.scope === "dia" ? "dayReelStatus" : S.scope === "semana" ? "weekReelStatus" : "shStatus";
  out.innerHTML = `<div class="sh-status" id="${sid}">${reel ? "🎬 A criar o reel… Deixa esta página aberta até terminar." : "A gerar a imagem…"}</div>`;
  shPaint_();
  try{
    let blob, name, caption;
    const cor = (typeof SPORT_COLORS !== "undefined" && N.ev && SPORT_COLORS[N.ev.sport]) || "#e3b23c";
    if(S.scope === "jogo"){
      const ev = N.ev, st = getEv(ev.id) || {};
      const r = await shCapture_(()=> reel ? generateShareReel(ev, st, cor) : generateShareCard(ev, st, cor), reel ? 120000 : 30000);
      blob = r.blob; name = r.name; caption = gameCaption_(ev);
    }else if(S.scope === "dia"){
      const live = S.dayKind === "live", list = N.list;
      DAY_SHARE_DATE_ = (S.day === todayISO_()) ? "" : S.day;
      if(reel){
        const r = await shCapture_(()=>generateDayReel_(list, live), 300000);
        blob = r.blob; name = r.name; caption = buildDayReelText_(list, live);
      }else{
        const mode = S.dayKind === "res" ? "resultados" : live ? "jogos-live" : "jogos";
        const r = await generateDayShareCard_(list, mode);
        blob = r.blob; name = `dragaostats-${S.dayKind === "res" ? "resultados" : live ? "hoje-aovivo" : "hoje"}-${S.day}.png`;
        caption = S.dayKind === "res" ? buildDayResultsText_(list) : buildDayPostText_(list, live);
      }
    }else{
      const w = N.w;
      if(reel){
        const r = await shCapture_(()=>generateWeekReel_(w.games, w.ws, w.wd), 300000);
        blob = r.blob; name = r.name; caption = buildWeekReelText_(w.games, w.ws, w.wd);
      }else{
        const r = await generateWeekShareCard_(w.games, w.ws, w.wd);
        blob = r.blob; name = `dragaostats-semana-${w.ws.getFullYear()}-${String(w.ws.getMonth() + 1).padStart(2, "0")}-${String(w.ws.getDate()).padStart(2, "0")}.png`;
        caption = buildWeekPostText_(w.games, w.ws, w.wd);
      }
    }
    if(my !== S.token) return; // mudou-se de escolha entretanto
    if(!blob) throw new Error("sem ficheiro");
    S.srcBlob = blob; S.srcName = name; S.caption = caption; S.capReddit = shareNoHashtags_(caption);
    if(reel) shShowVid_(); else await shShowImg_();
  }catch(e){
    if(my === S.token){ const o = shOut_(); if(o) o.innerHTML = `<div class="sh-status">${reel ? "Não foi possível criar o reel neste aparelho. Tenta noutro browser (Chrome) ou no computador." : "⚠️ Não foi possível gerar a imagem."}</div>`; }
  }
  if(my === S.token){ S.busy = false; shPaint_(); }
}

async function shShowImg_(){
  const S = SHARE_S_; if(!S || !S.srcBlob) return;
  const z = SHARE_SIZES_.find(x=>x.k === S.size) || SHARE_SIZES_[0];
  const my = S.token;
  const { im, u } = await shareLoadImg_(S.srcBlob);
  let blob;
  try{
    const w = im.naturalWidth, hh = im.naturalHeight;
    if(w === z.w && hh === z.h) blob = S.srcBlob;
    else blob = await shareCanvasBlob_(shareFit_(im, w, hh, z.w, z.h));
  } finally { URL.revokeObjectURL(u); }
  if(my !== S.token) return;
  if(S.url){ try{ URL.revokeObjectURL(S.url); }catch(e){} }
  S.url = URL.createObjectURL(blob);
  S.out = { kind: "img", blob, name: S.srcName.replace(/\.png$/, "") + "-" + z.k + ".png", mime: "image/png", label: `${z.w}×${z.h} · ${z.rat} · ${z.nome}` };
  shRenderOut_();
}
function shShowVid_(){
  const S = SHARE_S_; if(!S || !S.srcBlob) return;
  if(S.url){ try{ URL.revokeObjectURL(S.url); }catch(e){} }
  S.url = URL.createObjectURL(S.srcBlob);
  S.out = { kind: "vid", blob: S.srcBlob, name: S.srcName, mime: S.srcBlob.type || "video/webm", label: "1080×1920 · 9:16 · Reels e Stories" };
  shRenderOut_();
}
function shRenderOut_(){
  const S = SHARE_S_, o = shOut_(); if(!S || !S.out || !o) return;
  const v = S.out;
  o.innerHTML = `<div class="sh-prev">${v.kind === "img" ? `<img src="${S.url}" alt="Pré-visualização">` : `<video src="${S.url}" controls playsinline loop></video>`}</div>
    <div class="sh-meta">✅ Pronto · ${shE_(v.label)}</div>
    <div class="sh-sec">Legenda</div>
    <div class="sh-days"><button type="button" class="sh-chip${S.rede === "ig" ? " on" : ""}" data-rede="ig">Instagram / Facebook</button><button type="button" class="sh-chip${S.rede === "rd" ? " on" : ""}" data-rede="rd">Reddit (sem #)</button></div>
    <textarea id="shCap" class="sh-cap" rows="9">${shE_(S.rede === "rd" ? S.capReddit : S.caption)}</textarea>
    <div class="sh-btnrow"><button type="button" class="hv-btn hv-btn-ghost" id="shCopy">📋 Copiar texto</button><button type="button" class="hv-btn hv-btn-main" id="shShare">↗ Partilhar</button><button type="button" class="hv-btn hv-btn-ghost" id="shDl">⬇️ Descarregar</button></div>
    <div class="sh-note">«Partilhar» copia o texto primeiro: cola-o na legenda da publicação (o Instagram ignora o texto enviado com o ficheiro).</div>`;
  o.querySelectorAll("[data-rede]").forEach(b=>{ b.onclick = ()=>{ S.rede = b.getAttribute("data-rede"); shRenderOut_(); }; });
  const cap = o.querySelector("#shCap");
  const copy = async ()=>{ try{ await navigator.clipboard.writeText(cap.value); return true; }catch(e){ cap.select(); try{ return document.execCommand("copy"); }catch(e2){ return false; } } };
  o.querySelector("#shCopy").onclick = async function(){ const b = this, old = b.textContent; await copy(); b.textContent = "Copiado ✓"; setTimeout(()=>{ b.textContent = old; }, 1500); };
  o.querySelector("#shDl").onclick = ()=>{ const a = document.createElement("a"); a.href = S.url; a.download = v.name; a.click(); };
  o.querySelector("#shShare").onclick = async ()=>{
    copy(); // dentro do gesto do clique
    const f = new File([v.blob], v.name, { type: v.mime });
    if(navigator.canShare && navigator.canShare({ files: [f] })){
      try{ await navigator.share({ files: [f], title: "Dragão Stats", text: cap.value }); return; }
      catch(e){ if(e && e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = S.url; a.download = v.name; a.click();
  };
  try{ o.scrollIntoView({ behavior: "smooth", block: "nearest" }); }catch(e){}
}
