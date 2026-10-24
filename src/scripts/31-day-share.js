// ===================== IMAGEM + TEXTO DO DIA (para publicar nas redes) =====================
// Mesma ideia da imagem da semana/mês (28-week-share.js, 29-month-share.js), mas
// só para os jogos de HOJE — pedido pelo Fernando para promover o dia de jogo(s)
// nas redes sociais de manhã. Usa EVENTS (a competição aberta agora), tal como o
// banner "Adversário do dia" já faz, para a imagem nunca mostrar algo diferente
// do que está ali ao lado.

// Jogos de hoje ainda sem resultado — é o que faz sentido promover antes de
// começarem (mesmo critério "por vir" do week-share).
function getDayShareGames_(){
  return getTodaysGames_().filter(ev=>{
    const st = getEv(ev.id);
    return !(st.resultado && String(st.resultado).trim());
  });
}

// v156: jogos de hoje JÁ com resultado — para a imagem/texto "Resultados de hoje".
function getDayResultGames_(){
  return getTodaysGames_().filter(ev=>{
    const st = getEv(ev.id);
    return !!(st.resultado && String(st.resultado).trim());
  }).sort((a, b)=>String(a.t || "").localeCompare(String(b.t || "")));
}
let dayShareMode_ = "jogos"; // "jogos" (por realizar) | "resultados"
function dayResultTagText_(ev){
  const st = getEv(ev.id) || {};
  return st.resultTag === "win" ? "Vitória" : st.resultTag === "loss" ? "Derrota" : st.resultTag === "draw" ? "Empate" : "";
}
function buildDayResultsText_(games){
  if(!games.length) return "";
  let text = `💙 Resultados de hoje (${dayShareDateLabel_()}):\n\n`;
  games.forEach(ev=>{
    const st = getEv(ev.id) || {};
    const t = postTeams_(ev);
    const tag = dayResultTagText_(ev);
    text += `${postSportEmoji_(ev.sport)} ${ev.sport} — ${t.home} ${String(st.resultado).trim()} ${t.away}${tag ? ' (' + tag + ')' : ''}\n`;
  });
  const tags = ["#FCPorto", "#DragaoStats"];
  games.forEach(ev=>{ const h = postSportHashtag_(ev.sport); if(h && tags.indexOf(h)===-1) tags.push(h); });
  text += "\nTodos os resultados e classificações em https://dragaostats.pt\n\n" + tags.join(" ");
  return text;
}

function dayShareDateLabel_(){
  const d = new Date();
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
}

// Texto pronto a colar — mesmo tom/estilo do texto da semana, com link completo.
function buildDayPostText_(games){
  if(!games.length) return "";
  let text = `💙 Jogos de hoje (${dayShareDateLabel_()}):\n\n`;
  games.forEach(ev=>{
    const emoji = postSportEmoji_(ev.sport);
    const t = postTeams_(ev);
    const dp = [ev.detail, ev.phase].filter(Boolean).join(", ");
    text += `${emoji} ${ev.sport} — ${t.home} vs ${t.away}${ev.t ? ' — ' + ev.t : ''}\n`;
    if(dp) text += dp + "\n";
  });
  const tags = ["#FCPorto", "#DragaoStats"];
  games.forEach(ev=>{ const h = postSportHashtag_(ev.sport); if(h && tags.indexOf(h)===-1) tags.push(h); });
  text += "\nAcompanha tudo em https://dragaostats.pt\n\n" + tags.join(" ");
  return text;
}

// Imagem para partilhar — mesmo esqueleto visual do cartão da semana/mês.
async function generateDayShareCard_(games, modo){
  const resultados = modo === "resultados";
  const W = 1080;
  const rowH = 150, headerH = 380, footerH = 150;
  const H = headerH + games.length*rowH + footerH;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#16294a");
  bgGrad.addColorStop(1, "#0a1626");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  try{
    const logo = await new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = reject;
      img.src = "header-emblem.png";
    });
    ctx.save();
    ctx.beginPath();
    ctx.arc(106, 106, 42, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, 64, 64, 84, 84);
    ctx.restore();
  }catch(e){ /* sem logo, segue sem ela */ }

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#eef2f8";
  ctx.font = "700 30px 'Archivo Narrow', sans-serif";
  ctx.fillText("DRAGÃO STATS", 166, 96);
  ctx.font = "500 18px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#9fb0c8";
  ctx.fillText("Jogos e resultados das modalidades do FC Porto", 166, 124);

  ctx.font = "400 92px 'Bebas Neue', sans-serif";
  ctx.fillStyle = "#e3b23c";
  const titulo = resultados ? "RESULTADOS DE HOJE" : "JOGOS DE HOJE";
  let tam = 92; while(tam > 40 && ctx.measureText(titulo).width > W - 140){ tam -= 4; ctx.font = `400 ${tam}px 'Bebas Neue', sans-serif`; }
  ctx.fillText(titulo, 70, 240);
  ctx.font = "600 24px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#cdd8e8";
  ctx.fillText(dayShareDateLabel_(), 72, 290);

  let y = headerH;
  games.forEach(ev=>{
    const color = SPORT_COLORS[ev.sport] || "#e3b23c";
    const rowY = y + 18, rowX = 70, rowW = W - 140, rowRH = rowH - 36;

    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    if(ctx.roundRect){
      ctx.beginPath(); ctx.roundRect(rowX, rowY, rowW, rowRH, 14); ctx.fill(); ctx.stroke();
    }else{
      ctx.fillRect(rowX, rowY, rowW, rowRH);
    }
    ctx.fillStyle = color;
    ctx.fillRect(rowX, rowY, 6, rowRH);

    ctx.textAlign = "left";
    if(resultados){
      const stR = getEv(ev.id) || {};
      ctx.fillStyle = color;
      ctx.font = "400 54px 'Bebas Neue', sans-serif";
      ctx.fillText(String(stR.resultado).trim(), rowX+26, rowY+rowRH/2-8);
      ctx.font = "600 17px 'Archivo Narrow', sans-serif";
      ctx.fillStyle = "#9fb0c8";
      ctx.fillText(dayResultTagText_(ev) || localLabel(ev.local), rowX+26, rowY+rowRH/2+30);
    }else{
      ctx.fillStyle = "#eef2f8";
      ctx.font = "700 24px 'Archivo Narrow', sans-serif";
      ctx.fillText(ev.t || "hora por confirmar", rowX+26, rowY+rowRH/2-14);
      ctx.font = "500 17px 'Archivo Narrow', sans-serif";
      ctx.fillStyle = "#9fb0c8";
      ctx.fillText(localLabel(ev.local), rowX+26, rowY+rowRH/2+16);
    }

    const badgeText = (ev.sport||"").toUpperCase();
    ctx.font = "700 14px 'Archivo Narrow', sans-serif";
    const badgeW = ctx.measureText(badgeText).width + 28;
    const badgeX = rowX+210, badgeY = rowY+18;
    ctx.fillStyle = color;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, 30, 15); ctx.fill(); }
    else ctx.fillRect(badgeX, badgeY, badgeW, 30);
    ctx.fillStyle = "#0a1626";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, badgeX+badgeW/2, badgeY+16);

    const t = postTeams_(ev);
    ctx.textAlign = "left";
    ctx.font = "700 27px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#eef2f8";
    const oppText = `${t.home} – ${t.away}`;
    const oppMaxW = rowW - 260;
    let oppFit = oppText;
    while(ctx.measureText(oppFit).width > oppMaxW && oppFit.length > 3){ oppFit = oppFit.slice(0, -4) + "…"; }
    ctx.fillText(oppFit, rowX+210, rowY+rowRH/2+16);

    const metaText = [ev.detail, ev.phase].filter(Boolean).join(" · ");
    if(metaText){
      ctx.font = "400 15px 'Archivo', sans-serif";
      ctx.fillStyle = "#9fb0c8";
      let metaFit = metaText;
      while(ctx.measureText(metaFit).width > oppMaxW && metaFit.length > 3){ metaFit = metaFit.slice(0, -4) + "…"; }
      ctx.fillText(metaFit, rowX+210, rowY+rowRH-20);
    }
    y += rowH;
  });

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath(); ctx.moveTo(70, y+20); ctx.lineTo(W-70, y+20); ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "700 26px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#e3b23c";
  ctx.fillText("dragaostats.pt", 70, y+64);
  ctx.textAlign = "right";
  ctx.font = "400 16px 'Archivo', sans-serif";
  ctx.fillStyle = "#9fb0c8";
  ctx.fillText("Projeto de adeptos, sem ligação oficial ao FC Porto", W-70, y+64);

  return new Promise(resolve=>{
    canvas.toBlob(blob=>resolve({ canvas, blob }), "image/png");
  });
}

function renderDayShareBox_(){
  const box = document.getElementById("dayShareBox");
  if(!box) return;
  const resultados = dayShareMode_ === "resultados";
  const games = resultados ? getDayResultGames_() : getDayShareGames_();
  if(!games.length){
    box.innerHTML = `<div class="medal-empty" style="margin-top:10px;">${resultados ? "Ainda não há resultados de hoje para gerar a imagem." : "Não há jogos de hoje por realizar para gerar a imagem."}</div>`;
    return;
  }
  const text = resultados ? buildDayResultsText_(games) : buildDayPostText_(games);
  const esc = str => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  box.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin:10px 0 8px;">A gerar imagem (${games.length} jogo${games.length===1?'':'s'})…</div>
    <div id="dayShareImgPreview" style="margin-bottom:10px;"></div>
    <div class="add-btn-row" style="margin-bottom:12px;">
      <button class="add-save" id="dayShareDownloadBtn" disabled>⬇️ Descarregar imagem</button>
    </div>
    <div style="font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;">Texto para colar</div>
    <textarea id="dayShareText" rows="10" style="${taStyle}">${esc(text)}</textarea>
    <button class="add-save" id="dayShareCopyBtn" style="margin-top:6px;">Copiar</button>
  `;
  document.getElementById("dayShareCopyBtn").onclick = async ()=>{
    const ta = document.getElementById("dayShareText");
    const btn = document.getElementById("dayShareCopyBtn");
    try{ await navigator.clipboard.writeText(ta.value); }
    catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(()=>{ btn.textContent = old; }, 1500);
  };

  generateDayShareCard_(games, dayShareMode_).then(({ canvas, blob })=>{
    const preview = document.getElementById("dayShareImgPreview");
    if(!preview) return; // a pessoa pode ter fechado a caixa entretanto
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.style.cssText = "max-width:100%; border-radius:10px; border:1px solid var(--line); display:block;";
    preview.innerHTML = "";
    preview.appendChild(img);
    const dlBtn = document.getElementById("dayShareDownloadBtn");
    if(dlBtn){
      dlBtn.disabled = false;
      dlBtn.onclick = ()=>{
        const fileName = `dragaostats-${resultados ? "resultados" : "hoje"}-${todayISO_()}.png`;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
      };
    }
    const hint = box.querySelector("div");
    if(hint) hint.textContent = `Imagem pronta (${games.length} jogo${games.length===1?'':'s'}) — podes descarregar ou partilhar diretamente.`;
  }).catch(()=>{
    const hint = box.querySelector("div");
    if(hint) hint.textContent = "⚠️ Não foi possível gerar a imagem.";
  });
}

// Botão só para editores, mostrado junto ao banner "Adversário do dia" quando há
// jogo(s) hoje por realizar — mesmo padrão dos botões da semana/mês.
function renderDayShareToggle_(){
  const el = document.getElementById("dayShareToggleRow");
  if(!el) return;
  const nJogos = (READONLY_MODE || currentCompMode() !== "matches") ? 0 : getDayShareGames_().length;
  const nRes = (READONLY_MODE || currentCompMode() !== "matches") ? 0 : getDayResultGames_().length;
  if(!nJogos && !nRes){
    el.style.display = "none";
    const box = document.getElementById("dayShareBox");
    if(box){ box.style.display = "none"; box.innerHTML = ""; }
    return;
  }
  el.style.display = "flex";
  const wire = (id, modo, n)=>{
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.style.display = n ? "" : "none";
    if(btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.onclick = ()=>{
      const box = document.getElementById("dayShareBox");
      const opening = box.style.display === "none" || dayShareMode_ !== modo;
      dayShareMode_ = modo;
      box.style.display = opening ? "block" : "none";
      if(opening) renderDayShareBox_();
    };
  };
  wire("dayShareBtn", "jogos", nJogos);
  wire("dayShareResBtn", "resultados", nRes);
}
