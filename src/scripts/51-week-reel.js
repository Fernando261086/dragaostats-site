// ===================== REEL DA SEMANA (v173) =====================
// Vídeo vertical 1080x1920 (Reels/Stories) com os jogos da semana ainda por realizar: abertura, um ecrã por dia (com escudos,
// modalidade, hora e competição) e fecho com QR. Mesmo método do reel de um jogo: grava o <canvas> com MediaRecorder, tudo no browser.
// Só aparece em modo edição, junto à "Imagem + texto para publicar".

// Legenda CURTA para o vídeo: o essencial numa olhada (o detalhe está no vídeo e no site).
function buildWeekReelText_(games, weekStart, weekEndDisplay){
  if(!games.length) return "";
  const count = {}, order = [];
  games.forEach(({ ev })=>{ if(!(ev.sport in count)){ count[ev.sport] = 0; order.push(ev.sport); } count[ev.sport]++; });
  order.sort((a, b)=>count[b] - count[a]);
  const n = games.length;
  const linhaModalidades = order.map(s=>`${postSportEmoji_(s)} ${s}${count[s] > 1 ? " ×" + count[s] : ""}`).join(" · ");
  const tags = ["#FCPorto", "#DragaoStats"];
  order.forEach(s=>{ const h = postSportHashtag_(s); if(h && tags.indexOf(h) === -1) tags.push(h); });
  return `💙 Esta semana ${n === 1 ? "há 1 jogo" : "há " + n + " jogos"} do FC Porto (${weekShareDateRangeLabel_(weekStart, weekEndDisplay)})!\n\n${linhaModalidades}\n\nHoras e onde ver em https://dragaostats.pt\n\n${tags.join(" ")}`;
}

// ecrãs do vídeo: abertura + um por dia (no máximo 4 jogos por ecrã) + fecho
const WEEK_REEL_INTRO_ = 3.4, WEEK_REEL_OUTRO_ = 4.6, WEEK_REEL_PER_SLIDE_ = 4;
// v187: cada ecrã dura conforme o número de jogos (tempo para ler tudo): 3,4 s + 1,6 s por jogo
function weekReelSlideDur_(n){ return 3.4 + 1.6 * n; }
function weekReelSlides_(games){
  const byDay = {};
  games.forEach(g=>{ (byDay[g.ev.day] = byDay[g.ev.day] || []).push(g); });
  const slides = [];
  Object.keys(byDay).sort().forEach(day=>{
    const list = byDay[day];
    for(let i = 0; i < list.length; i += WEEK_REEL_PER_SLIDE_) { const g = list.slice(i, i + WEEK_REEL_PER_SLIDE_); slides.push({ day, games: g, more: i > 0, dur: weekReelSlideDur_(g.length) }); }
  });
  return slides;
}
function weekReelDuration_(games){ return WEEK_REEL_INTRO_ + weekReelSlides_(games).reduce((a, sl)=>a + sl.dur, 0) + WEEK_REEL_OUTRO_; }

async function generateWeekReel_(games, weekStart, weekEndDisplay){
  const W = 1080, H = 1920;
  const slides = weekReelSlides_(games);
  const TOTAL = WEEK_REEL_INTRO_ + slides.reduce((a, sl)=>a + sl.dur, 0) + WEEK_REEL_OUTRO_;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // pré-carrega logo, QR e escudos
  let logo = null;
  try{ logo = await new Promise((res, rej)=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = rej; im.src = "header-emblem.png"; }); }catch(e){}
  let qr = null, qrCount = 0;
  try{ const q = qrcode(0, "M"); q.addData("https://dragaostats.pt"); q.make(); qrCount = q.getModuleCount(); qr = q; }catch(e){}
  const crests = {};
  const need = [];
  games.forEach(({ ev })=>{ need.push([ev.sport, ev.athlete]); need.push([ev.sport, "FC Porto"]); });
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
  function drawIntro(lt){
    const a = ease(lt / 0.8), b = ease((lt - 0.5) / 0.8), c = ease((lt - 1.1) / 0.8);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#eef2f8"; bigText("ESTA SEMANA", W/2, 820 + (1 - a) * 40, 170, 900); ctx.restore();
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = "#e3b23c"; bigText("NO DRAGÃO", W/2, 1040 + (1 - b) * 40, 230, 900); ctx.restore();
    ctx.save(); ctx.globalAlpha = c; ctx.fillStyle = "#cdd8e8"; ctx.font = `600 44px ${FONT}`; ctx.fillText(weekShareDateRangeLabel_(weekStart, weekEndDisplay), W/2, 1150);
    const sportsN = new Set(games.map(g=>g.ev.sport)).size;
    ctx.fillStyle = "#93a2bd"; ctx.font = `500 36px ${FONT}`; ctx.fillText(`${games.length} ${games.length === 1 ? "jogo" : "jogos"} · ${sportsN} ${sportsN === 1 ? "modalidade" : "modalidades"}`, W/2, 1215); ctx.restore();
  }
  function drawSlide(sl, lt){
    const d = new Date(sl.day + "T00:00:00");
    const aHead = ease(lt / 0.5);
    ctx.save(); ctx.globalAlpha = aHead; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#e3b23c"; bigText(WEEKDAY_NAMES[d.getDay()].toUpperCase(), W/2, 470 + (1 - aHead) * 30, 170, 900);
    ctx.fillStyle = "#cdd8e8"; ctx.font = `600 40px ${FONT}`; ctx.fillText(`${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}${sl.more ? " · continuação" : ""}`, W/2, 540);
    ctx.restore();
    const rowH = 250, gap = 26, top = 620;
    sl.games.forEach(({ ev }, i)=>{
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
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#eef2f8"; bigText("ACOMPANHA TUDO", W/2, 760, 120, 900);
    ctx.fillStyle = "#c7d2e6"; ctx.font = `600 36px ${FONT}`; ctx.fillText("Calendários, resultados e classificações na hora", W/2, 830); ctx.restore();
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
  function draw(elapsed){
    ctx.clearRect(0, 0, W, H); background(); brand();
    if(elapsed < WEEK_REEL_INTRO_){ drawIntro(elapsed); return; }
    let e2 = elapsed - WEEK_REEL_INTRO_;
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

  const blob = new Blob(chunks, { type: "video/webm" });
  const fileName = `dragaostats-semana-${(weekStart.getFullYear())}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}.webm`;
  const file = new File([blob], fileName, { type: "video/webm" });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: "Dragão Stats" }); return; }catch(e){ /* cancelou: cai para descarregar */ }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
}

// botão em "Esta semana" (modo edição): mostra a legenda curta e grava o vídeo
async function startWeekReel_(weekStart, weekEnd, weekEndDisplay){
  const box = document.getElementById("weekReelBox");
  if(!box) return;
  const games = getWeekShareGames_(weekStart, weekEnd);
  box.style.display = "block";
  box.dataset.week = String(weekOffset);
  if(!games.length){ box.innerHTML = `<div class="medal-empty" style="margin-top:10px;">Não há jogos por realizar nesta semana para gerar o reel.</div>`; return; }
  const esc = s=>String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const secs = Math.ceil(weekReelDuration_(games));
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  box.innerHTML = `
    <div id="weekReelStatus" style="font-size:13px; color:var(--text-dim); margin:10px 0 8px;">🎬 A gravar o reel (${games.length} ${games.length === 1 ? "jogo" : "jogos"}, cerca de ${secs} segundos)… Deixa esta página aberta e à vista até terminar.</div>
    <div style="font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;">Legenda curta para colar</div>
    <textarea id="weekReelText" rows="7" style="${taStyle}">${esc(buildWeekReelText_(games, weekStart, weekEndDisplay))}</textarea>
    <button class="add-save" id="weekReelCopyBtn" style="margin-top:6px;">Copiar</button>`;
  document.getElementById("weekReelCopyBtn").onclick = async ()=>{
    const ta = document.getElementById("weekReelText"), btn = document.getElementById("weekReelCopyBtn");
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent; btn.textContent = "Copiado ✓"; setTimeout(()=>{ btn.textContent = old; }, 1500);
  };
  const btnReel = document.getElementById("weekReelBtn");
  window.__weekReelBusy_ = true;
  if(btnReel) btnReel.disabled = true;
  try{
    await generateWeekReel_(games, weekStart, weekEndDisplay);
    const st = document.getElementById("weekReelStatus"); if(st) st.textContent = "✅ Reel pronto (partilhado ou descarregado). Podes gravar outra vez com o botão acima.";
  }catch(e){
    const st = document.getElementById("weekReelStatus"); if(st) st.textContent = "Não foi possível gravar o reel neste aparelho. Tenta noutro browser (Chrome) ou no computador.";
  }
  window.__weekReelBusy_ = false;
  const btnReel2 = document.getElementById("weekReelBtn");
  if(btnReel2) btnReel2.disabled = false;
}
