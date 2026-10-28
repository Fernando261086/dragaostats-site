// ===================== REEL DO DIA (v194) =====================
// Vídeo vertical 1080x1920 com os jogos de HOJE por realizar: abertura "Hoje há jogo(s)!", um ecrã por grupo de até 4 jogos e fecho com QR.
// Duas versões: normal e "Ao vivo" (selo AO VIVO só nos jogos com acompanhamento — tudo menos Futsal — e fecho "Acompanha em direto").
// Mesmo método do reel da semana (fotograma a fotograma, 55-webm-encode.js). Só em modo edição.

const DAY_REEL_INTRO_ = 3.6, DAY_REEL_OUTRO_ = 5, DAY_REEL_PER_SLIDE_ = 4;
function dayReelSlides_(games){
  const slides = [];
  for(let i = 0; i < games.length; i += DAY_REEL_PER_SLIDE_){ const g = games.slice(i, i + DAY_REEL_PER_SLIDE_); slides.push({ games: g, more: i > 0, dur: 3.8 + 1.8 * g.length }); }
  return slides;
}
function dayReelDuration_(games){ return DAY_REEL_INTRO_ + dayReelSlides_(games).reduce((a, sl)=>a + sl.dur, 0) + DAY_REEL_OUTRO_; }

// legenda curta para colar junto ao vídeo
function buildDayReelText_(games, live){
  const n = games.length;
  const sports = [];
  games.forEach(ev=>{ if(sports.indexOf(ev.sport) === -1) sports.push(ev.sport); });
  const linha = sports.map(s=>`${postSportEmoji_(s)} ${s}`).join(" · ");
  const tags = ["#FCPorto", "#DragaoStats"];
  sports.forEach(s=>{ const h = postSportHashtag_(s); if(h && tags.indexOf(h) === -1) tags.push(h); });
  const temLive = live && games.some(hasLiveCoverage_);
  return `💙 Hoje ${n === 1 ? "há 1 jogo" : "há " + n + " jogos"} do FC Porto!\n\n${linha}\n\n` +
    (temLive ? "🔴 Acompanha o resultado em direto em https://dragaostats.pt" : "Horas e onde ver em https://dragaostats.pt") + "\n\n" + tags.join(" ");
}

async function generateDayReel_(games, live){
  const W = 1080, H = 1920;
  const slides = dayReelSlides_(games);
  const TOTAL = dayReelDuration_(games);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // garante que as letras do site estão carregadas antes de desenhar
  try{ await Promise.all(["700 40px 'Archivo Narrow'", "500 40px 'Archivo Narrow'", "400 100px 'Bebas Neue'"].map(f=>document.fonts.load(f))); }catch(e){}
  // pré-carrega logo, QR e escudos
  let logo = null;
  try{ logo = await new Promise((res, rej)=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = rej; im.src = "header-emblem.png"; }); }catch(e){}
  let qr = null, qrCount = 0;
  try{ const q = qrcode(0, "M"); q.addData("https://dragaostats.pt"); q.make(); qrCount = q.getModuleCount(); qr = q; }catch(e){}
  const crests = {};
  const need = [];
  games.forEach(ev=>{ need.push([ev.sport, ev.athlete]); need.push([ev.sport, "FC Porto"]); });
  await Promise.all(need.map(async ([sport, name])=>{
    const k = sport + "|" + String(name || "").trim();
    if(k in crests) return;
    crests[k] = null;
    try{ crests[k] = (typeof crestImage_ === "function") ? await crestImage_(sport, name) : null; }catch(e){ crests[k] = null; }
  }));

  const ease = t=>1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const FONT = "'Archivo Narrow', sans-serif", DISPLAY = "'Bebas Neue', sans-serif";
  const rr = (x, y, w, h, r)=>{ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  // texto que encolhe até caber (nomes compridos)
  function fitText(txt, x, y, maxW, size, weight, align){
    let s = size;
    ctx.textAlign = align; ctx.font = `${weight} ${s}px ${FONT}`;
    while(ctx.measureText(txt).width > maxW && s > 22){ s -= 2; ctx.font = `${weight} ${s}px ${FONT}`; }
    let t = txt;
    while(ctx.measureText(t).width > maxW && t.length > 3){ t = t.slice(0, -2); }
    ctx.fillText(t === txt ? t : t.trim() + "…", x, y);
  }
  // título grande que encolhe para caber na largura do ecrã
  function bigText(txt, x, y, size, maxW){
    let s = size; ctx.font = `400 ${s}px ${DISPLAY}`;
    while(ctx.measureText(txt).width > maxW && s > 40){ s -= 6; ctx.font = `400 ${s}px ${DISPLAY}`; }
    ctx.fillText(txt, x, y);
  }
  function crestAt(img, cx, cy, size){
    if(!img) return;
    const k = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    ctx.drawImage(img, cx - w/2, cy - h/2, w, h);
  }
  function background(){
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#16294a"); g.addColorStop(1, "#0a1626");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function brand(){
    if(logo){ ctx.save(); ctx.beginPath(); ctx.arc(W/2 - 150, 150, 40, 0, Math.PI*2); ctx.clip(); ctx.drawImage(logo, W/2 - 190, 110, 80, 80); ctx.restore(); }
    ctx.fillStyle = "#eef2f8"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `700 32px ${FONT}`;
    ctx.fillText("DRAGÃO STATS", W/2 - 96, 150);
  }
  function livePill(xRight, cy){
    ctx.font = `700 26px ${FONT}`;
    const tw = ctx.measureText("AO VIVO").width, w = tw + 62, h = 44, x = xRight - w, y = cy - h/2;
    ctx.fillStyle = "#b84f0c"; rr(x, y, w, h, 22); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x + 25, cy, 8, 0, Math.PI*2); ctx.fill();
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("AO VIVO", x + 44, cy + 1);
    return x;
  }
  function drawIntro(lt){
    const a = ease(lt / 0.8), b = ease((lt - 0.5) / 0.8), c = ease((lt - 1.1) / 0.8);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#eef2f8"; bigText("HOJE HÁ", W/2, 820 + (1 - a) * 40, 170, 900); ctx.restore();
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = "#e3b23c"; bigText(games.length === 1 ? "JOGO!" : "JOGOS!", W/2, 1040 + (1 - b) * 40, 230, 900); ctx.restore();
    ctx.save(); ctx.globalAlpha = c; ctx.fillStyle = "#cdd8e8"; ctx.font = `600 44px ${FONT}`; ctx.fillText(dayShareDateLabel_(), W/2, 1150);
    const sportsN = new Set(games.map(g=>g.sport)).size;
    ctx.fillStyle = "#93a2bd"; ctx.font = `500 36px ${FONT}`; ctx.fillText(`${games.length} ${games.length === 1 ? "jogo" : "jogos"} · ${sportsN} ${sportsN === 1 ? "modalidade" : "modalidades"}`, W/2, 1210);
    if(live && games.some(hasLiveCoverage_)){ ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = `700 26px ${FONT}`; const w = ctx.measureText("AO VIVO").width + 62; livePill(W/2 + w/2, 1300); }
    ctx.restore();
  }
  function drawSlide(sl, lt){
    const aHead = ease(lt / 0.5);
    ctx.save(); ctx.globalAlpha = aHead; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#e3b23c"; bigText("JOGOS DE HOJE", W/2, 470 + (1 - aHead) * 30, 170, 900);
    ctx.fillStyle = "#cdd8e8"; ctx.font = `600 40px ${FONT}`; ctx.fillText(dayShareDateLabel_() + (sl.more ? " · continuação" : ""), W/2, 540);
    ctx.restore();
    const rowH = 250, gap = 26, top = 620;
    sl.games.forEach((ev, i)=>{
      const a = ease((lt - 0.35 - i * 0.18) / 0.5);
      if(a <= 0) return;
      const y = top + i * (rowH + gap) + (1 - a) * 50;
      const color = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 2;
      rr(70, y, 940, rowH, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; rr(70, y, 10, rowH, 5); ctx.fill();
      ctx.textBaseline = "middle";
      ctx.fillStyle = color; ctx.textAlign = "left"; ctx.font = `700 34px ${FONT}`; ctx.fillText((ev.sport || "").toUpperCase(), 112, y + 44);
      ctx.fillStyle = "#eef2f8"; ctx.textAlign = "right"; ctx.font = `700 46px ${FONT}`; ctx.fillText(ev.t || "", 974, y + 44);
      if(live && hasLiveCoverage_(ev)){ const tw = ctx.measureText(ev.t || "").width; livePill(974 - tw - 18, y + 44); }
      const t = postTeams_(ev);
      const cr = n=>crests[ev.sport + "|" + String(n).trim()] || null;
      const cy = y + 135;
      crestAt(cr(t.home), 142, cy, 72);
      ctx.fillStyle = "#eef2f8"; fitText(t.home, 196, cy, 290, 42, 700, "left");
      ctx.fillStyle = "#93a2bd"; ctx.textAlign = "center"; ctx.font = `600 30px ${FONT}`; ctx.fillText("vs", 540, cy);
      crestAt(cr(t.away), 938, cy, 72);
      ctx.fillStyle = "#eef2f8"; fitText(t.away, 884, cy, 290, 42, 700, "right");
      const det = [ev.detail, ev.phase].filter(Boolean).join(" · ");
      if(det){ ctx.fillStyle = "#93a2bd"; fitText(det, 112, y + 213, 820, 28, 500, "left"); }
      ctx.restore();
    });
  }
  function drawOutro(lt){
    const a = ease(lt / 0.7), b = ease((lt - 0.4) / 0.7);
    const liveOut = live && games.some(hasLiveCoverage_);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#eef2f8"; bigText(liveOut ? "ACOMPANHA EM DIRETO" : "ACOMPANHA TUDO", W/2, 760, 120, 900);
    ctx.fillStyle = "#c7d2e6"; ctx.font = `600 36px ${FONT}`; ctx.fillText(liveOut ? "Resultado ao vivo, na hora, no Dragão Stats" : "Calendários, resultados e classificações na hora", W/2, 830); ctx.restore();
    if(qr){
      ctx.save(); ctx.globalAlpha = b;
      const size = 340, pad = 22, x = W/2 - size/2, y = 930;
      ctx.fillStyle = "#ffffff"; rr(x - pad, y - pad, size + pad*2, size + pad*2, 20); ctx.fill();
      const cell = size / qrCount; ctx.fillStyle = "#0a1626";
      for(let r = 0; r < qrCount; r++) for(let c = 0; c < qrCount; c++) if(qr.isDark(r, c)) ctx.fillRect(x + c*cell, y + r*cell, cell + 0.5, cell + 0.5);
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = "#e3b23c"; ctx.font = `700 52px ${FONT}`; ctx.fillText("dragaostats.pt", W/2, 1400); ctx.restore();
  }
  // fundo + marca desenhados uma só vez e copiados em cada fotograma (muito mais rápido)
  const layer = document.createElement("canvas"); layer.width = W; layer.height = H;
  { const real = ctx; const lctx = layer.getContext("2d");
    // background()/brand() usam o ctx do canvas principal: desenhamos lá e copiamos
    real.clearRect(0, 0, W, H); background(); brand(); lctx.drawImage(canvas, 0, 0); real.clearRect(0, 0, W, H); }
  function draw(elapsed){
    ctx.clearRect(0, 0, W, H); ctx.drawImage(layer, 0, 0);
    if(elapsed < DAY_REEL_INTRO_){ drawIntro(elapsed); return; }
    let e2 = elapsed - DAY_REEL_INTRO_;
    for(const sl of slides){
      if(e2 < sl.dur){
        ctx.save();
        if(e2 > sl.dur - 0.3) ctx.globalAlpha = Math.max(0, (sl.dur - e2) / 0.3); // desvanece no fim do ecrã
        drawSlide(sl, e2);
        ctx.restore();
        return;
      }
      e2 -= sl.dur;
    }
    drawOutro(e2);
  }

  // 1.º: vídeo fotograma a fotograma (tempos exatos, sem saltos). 2.º (browsers antigos): gravação em tempo real.
  const setStatus = t=>{ const st = document.getElementById("dayReelStatus"); if(st) st.textContent = t; };
  let blob = null;
  try{
    blob = await webmEncodeFrames_(canvas, draw, TOTAL, 30, p=>setStatus(`🎬 A criar o vídeo… ${Math.round(p * 100)}%. Deixa esta página aberta até terminar.`));
  }catch(e){ blob = null; }
  if(!blob){
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9"
      : (MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm");
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    recorder.ondataavailable = e=>{ if(e.data && e.data.size > 0) chunks.push(e.data); };
    const finished = new Promise(res=>{ recorder.onstop = res; });
    const startTime = performance.now();
    recorder.start();
    (function loop(now){
      const elapsed = (now - startTime) / 1000;
      draw(Math.min(elapsed, TOTAL));
      if(elapsed < TOTAL) requestAnimationFrame(loop); else recorder.stop();
    })(startTime);
    await finished;
    blob = new Blob(chunks, { type: "video/webm" });
  }
  const fileName = `dragaostats-hoje${live ? "-aovivo" : ""}-${todayISO_()}.webm`;
  const file = new File([blob], fileName, { type: "video/webm" });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: "Dragão Stats" }); return; }catch(e){ /* cancelou: cai para descarregar */ }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
}


async function startDayReel_(live){
  const box = document.getElementById("dayReelBox");
  if(!box) return;
  const sb = document.getElementById("dayShareBox"); if(sb) sb.style.display = "none";
  const games = getDayShareGames_();
  box.style.display = "block";
  if(!games.length || (live && !games.some(hasLiveCoverage_))){ box.innerHTML = `<div class="medal-empty" style="margin-top:10px;">Não há jogos de hoje ${live ? "com acompanhamento ao vivo " : ""}por realizar para gerar o reel.</div>`; return; }
  const esc = s=>String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const secs = Math.ceil(dayReelDuration_(games));
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  box.innerHTML = `
    <div id="dayReelStatus" style="font-size:13px; color:var(--text-dim); margin:10px 0 8px;">🎬 A preparar o reel (${games.length} ${games.length === 1 ? "jogo" : "jogos"}, vídeo de cerca de ${secs} segundos)…</div>
    <div style="font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;">Legenda curta para colar</div>
    <textarea id="dayReelText" rows="7" style="${taStyle}">${esc(buildDayReelText_(games, live))}</textarea>
    <button class="add-save" id="dayReelCopyBtn" style="margin-top:6px;">Copiar</button>`;
  document.getElementById("dayReelCopyBtn").onclick = async ()=>{
    const ta = document.getElementById("dayReelText"), btn = document.getElementById("dayReelCopyBtn");
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent; btn.textContent = "Copiado ✓"; setTimeout(()=>{ btn.textContent = old; }, 1500);
  };
  const ids = ["dayReelBtn", "dayReelLiveBtn"];
  ids.forEach(id=>{ const b = document.getElementById(id); if(b) b.disabled = true; });
  try{
    await generateDayReel_(games, live);
    const st = document.getElementById("dayReelStatus"); if(st) st.textContent = "✅ Reel pronto (partilhado ou descarregado). Podes gravar outra vez com os botões acima.";
  }catch(e){
    const st = document.getElementById("dayReelStatus"); if(st) st.textContent = "Não foi possível gravar o reel neste aparelho. Tenta noutro browser (Chrome) ou no computador.";
  }
  ids.forEach(id=>{ const b = document.getElementById(id); if(b) b.disabled = false; });
}
