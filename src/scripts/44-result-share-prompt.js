// ===================== "RESULTADO GUARDADO — PARTILHAR?" (v157) =====================
// Quando quem edita acaba de escrever um resultado (ao sair do campo), aparece uma folha em baixo
// com a imagem, o reel e o texto desse jogo prontos a usar — sem ter de ir ao menu 📤 do cartão.
// Só em modo edição, só quando o resultado mudou, e fecha-se com ✕. Não grava nada.
const resultPromptLast_ = {};
function resultShareText_(ev, st){
  const t = postTeams_(ev), score = String(st.resultado).trim();
  let tag = st.resultTag === "win" ? "Vitória" : st.resultTag === "loss" ? "Derrota" : st.resultTag === "draw" ? "Empate" : "";
  if(!tag){
    const m = score.match(/(\d+)\s*[-–:]\s*(\d+)/);
    if(m){
      const a = Number(m[1]), b = Number(m[2]), fcp = ev.local === "fora" ? b : a, adv = ev.local === "fora" ? a : b;
      tag = fcp > adv ? "Vitória" : fcp < adv ? "Derrota" : "Empate";
    }
  }
  const dp = [ev.detail, ev.phase].filter(Boolean).join(", ");
  const tags = ["#FCPorto", "#DragaoStats"], h = postSportHashtag_(ev.sport); if(h) tags.push(h);
  return `${postSportEmoji_(ev.sport)} ${sportShow_(ev.sport)} — ${t.home} ${score} ${t.away}${tag ? " (" + tag + ")" : ""}\n${dp ? dp + "\n" : ""}\nTodos os resultados e classificações em https://dragaostats.pt\n\n${tags.join(" ")}`;
}
// ---- v307: pré-geração. Ao guardar o resultado, a imagem, o reel e as legendas ficam a ser feitos em segundo plano;
// os botões da folha partilham logo (sem esperar) para o Instagram/Facebook, o Reddit e o TikTok.
// Só se guarda a última (um jogo de cada vez); a chave inclui o resultado, por isso se o resultado mudar faz-se de novo.
let PREGEN_ = null;
function pregenKey_(evId, res){ return evId + "|" + res; }
async function pregenFit_(srcBlob, k){
  const z = SHARE_SIZES_.find(x=>x.k === k) || SHARE_SIZES_[0];
  const { im, u } = await shareLoadImg_(srcBlob);
  try{
    const w = im.naturalWidth, h = im.naturalHeight;
    if(w === z.w && h === z.h) return srcBlob;
    return await shareCanvasBlob_(shareFit_(im, w, h, z.w, z.h));
  } finally { URL.revokeObjectURL(u); }
}
function pregenStart_(evId, res){
  const key = pregenKey_(evId, res);
  if(PREGEN_ && PREGEN_.key === key) return PREGEN_;
  const ev = EVENTS.find(e=>e.id === evId), st = getEv(evId) || {};
  const P = PREGEN_ = { key, evId, img: "wait", vid: "wait", files: {}, cap: {} };
  if(!ev) { P.img = P.vid = "err"; return P; }
  try{
    const c = gameCaption_(ev);
    P.cap = { ig: c, rd: shareNoHashtags_(c), tt: shareTikTok_(c) };
  }catch(e){ P.cap = { ig: "", rd: "", tt: "" }; }
  const cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
  (async ()=>{
    // 1.º a imagem (rápida), depois o reel (uns 13 s)
    try{
      const r = await shCapture_(()=>generateShareCard(ev, st, cor), 30000);
      const base = r.name.replace(/\.png$/, "");
      const ig = await pregenFit_(r.blob, "4x5"), rd = await pregenFit_(r.blob, "1x1");
      P.files.ig = new File([ig], base + "-4x5.png", { type: "image/png" });
      P.files.rd = new File([rd], base + "-1x1.png", { type: "image/png" });
      P.img = "ok";
    }catch(e){ P.img = "err"; }
    pregenPaint_(P);
    try{
      const r = await shCapture_(()=>generateShareReel(ev, st, cor), 120000);
      P.files.vid = new File([r.blob], r.name, { type: (typeof reelMime_ === "function" ? reelMime_(r.blob) : r.blob.type) || "video/mp4" });
      P.vid = "ok";
    }catch(e){ P.vid = "err"; }
    pregenPaint_(P);
  })();
  return P;
}
// põe cada botão no estado certo (a preparar / pronto / indisponível); chamada sempre que muda alguma coisa
function pregenPaint_(P){
  const el = document.getElementById("resultSharePrompt"); if(!el || !P || el.getAttribute("data-key") !== P.key) return;
  const set = (id, estado)=>{
    const b = el.querySelector('[data-pg="' + id + '"]'); if(!b) return;
    b.disabled = estado !== "ok";
    b.classList.toggle("rsp-wait", estado === "wait");
    const sm = b.querySelector("small"); if(sm) sm.textContent = (b.getAttribute("data-lab") || "") + (estado === "wait" ? " · a preparar…" : estado === "err" ? " · indisponível" : "");
  };
  set("ig", P.img); set("rd", P.img); set("igv", P.vid); set("tt", P.vid);
}
function pregenDownload_(file){
  const a = document.createElement("a"); const u = URL.createObjectURL(file);
  a.href = u; a.download = file.name; a.click(); setTimeout(()=>URL.revokeObjectURL(u), 5000);
}
// partilha SEM esperas antes do navigator.share (o telemóvel só aceita dentro do toque)
function pregenShare_(P, kind, note){
  const spec = { ig: [P.files.ig, P.cap.ig], igv: [P.files.vid, P.cap.ig], rd: [P.files.rd, P.cap.rd], tt: [P.files.vid, P.cap.tt] }[kind];
  if(!spec || !spec[0]) return;
  const file = spec[0], cap = spec[1] || "";
  try{ navigator.clipboard.writeText(cap).catch(()=>{}); }catch(e){}
  if(note) note.textContent = "Texto copiado ✓ — cola-o na legenda da publicação.";
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    navigator.share({ files: [file], title: "Dragão Stats", text: cap }).catch(e=>{ if(!e || e.name !== "AbortError") pregenDownload_(file); });
  }else pregenDownload_(file);
}
function closeResultPrompt_(){ const el = document.getElementById("resultSharePrompt"); if(el) el.remove(); }
function showResultSharePrompt_(evId){
  try{
    if(READONLY_MODE || currentCompMode() !== "matches") return;
    const ev = EVENTS.find(e=>e.id === evId); if(!ev) return;
    const st = getEv(evId) || {};
    const res = st.resultado && String(st.resultado).trim();
    if(!res || resultPromptLast_[evId] === res) return;
    resultPromptLast_[evId] = res;
    closeResultPrompt_();
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (x=>String(x));
    const t = postTeams_(ev), cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
    const el = document.createElement("div");
    el.id = "resultSharePrompt"; el.className = "rsp";
    const P = pregenStart_(evId, res);
    el.setAttribute("data-key", P.key);
    const bt1 = (id, nome, tipo)=>`<button type="button" data-pg="${id}" data-lab="${tipo}" disabled><b>${nome}</b><small>${tipo}</small></button>`;
    el.innerHTML = `<div class="rsp-top"><b>✅ Resultado guardado</b><button type="button" class="rsp-x" aria-label="Fechar">✕</button></div>
      <div class="rsp-match">${esc(t.home)} <b>${esc(res)}</b> ${esc(t.away)}</div>
      <div class="rsp-grid">${bt1("ig", "Instagram / Facebook", "🖼️ imagem")}${bt1("igv", "Instagram / Facebook", "🎬 reel")}${bt1("rd", "Reddit", "🖼️ imagem")}${bt1("tt", "TikTok", "🎬 reel")}</div>
      <div class="rsp-note" id="rspNote" aria-live="polite">Toca numa rede: o texto é copiado e abre-se a partilha.</div>
      <div class="rsp-btns"><button type="button" data-rsp="txt">📋 Copiar texto</button><button type="button" data-rsp="more">⚙️ Mais opções</button></div>`;
    document.body.appendChild(el);
    el.querySelector(".rsp-x").onclick = closeResultPrompt_;
    pregenPaint_(P);
    const note = el.querySelector("#rspNote");
    el.querySelectorAll("[data-pg]").forEach(b=>{ b.onclick = ()=>pregenShare_(P, b.getAttribute("data-pg"), note); });
    el.querySelector('[data-rsp="more"]').onclick = ()=>{ closeResultPrompt_(); openShareHub_({ scope: "jogo", evId, fmt: "img" }); };
    const bt = el.querySelector('[data-rsp="txt"]');
    bt.onclick = async ()=>{
      const txt = (typeof gameCaption_ === "function") ? gameCaption_(ev) : resultShareText_(ev, getEv(evId) || {});
      try{ await navigator.clipboard.writeText(txt); }catch(e){ prompt("Copia o texto:", txt); }
      bt.textContent = "Copiado ✓"; setTimeout(()=>{ bt.textContent = "📋 Copiar texto"; }, 1500);
    };
  }catch(e){}
}
// ao sair do campo de resultado (flushResultSave só faz algo se houve alteração) → oferece partilhar
(function(){
  const orig = flushResultSave;
  flushResultSave = function(eventId){
    const mudou = !!resultSaveTimers[eventId];
    const r = orig.apply(this, arguments);
    if(mudou) setTimeout(()=>showResultSharePrompt_(eventId), 300);
    return r;
  };
})();
