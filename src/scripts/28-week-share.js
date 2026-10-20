// ===================== IMAGEM + TEXTO DA SEMANA (para publicar nas redes) =====================
// Pedido pelo Fernando: em vez de ter de pedir esta imagem manualmente todas as
// semanas, aparece um botão dentro de "Esta semana" (só para quem edita — nunca
// no link "só ver") que gera, ali mesmo no telemóvel/computador dele, uma imagem
// para partilhar com os jogos AINDA por realizar dessa semana, mais o texto já
// pronto a colar. Corre tudo no browser, com os dados que a página já tem — não
// depende de nada no servidor, por isso não tem o problema de automatizar isto
// a sério num sítio sem acesso à Sheet.

// Jogos da semana (todas as competições em Modo Modalidades) que ainda não têm
// resultado — é isto que interessa promover, tal como a imagem feita à mão.
function getWeekShareGames_(weekStart, weekEnd){
  const rows = [];
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [], status: {} };
    (compData.events || []).forEach(ev=>{
      if(!ev.day) return;
      const d = new Date(ev.day + "T00:00:00");
      if(isNaN(d) || d < weekStart || d >= weekEnd) return;
      const st = (compData.status && compData.status[ev.id]) || {};
      if(st.resultado && String(st.resultado).trim()) return; // já tem resultado — não é "por vir"
      rows.push({ ev, st });
    });
  });
  rows.sort((a,b)=>{
    if(a.ev.day !== b.ev.day) return a.ev.day < b.ev.day ? -1 : 1;
    return (a.ev.t||"99:99").localeCompare(b.ev.t||"99:99");
  });
  return rows;
}

function weekShareDateRangeLabel_(weekStart, weekEndDisplay){
  const sameMonth = weekStart.getMonth() === weekEndDisplay.getMonth();
  const mStart = MONTH_NAMES[weekStart.getMonth()].toLowerCase();
  const mEnd = MONTH_NAMES[weekEndDisplay.getMonth()].toLowerCase();
  return sameMonth
    ? `${weekStart.getDate()} a ${weekEndDisplay.getDate()} de ${mEnd}`
    : `${weekStart.getDate()} de ${mStart} a ${weekEndDisplay.getDate()} de ${mEnd}`;
}

// Texto pronto a colar — mesmo estilo/tom do "Texto do dia" (23-daily-post-text.js),
// em português de Portugal, com o link completo com "https://" à frente.
function buildWeekPostText_(games, weekStart, weekEndDisplay){
  if(!games.length) return "";
  const rangeLabel = weekShareDateRangeLabel_(weekStart, weekEndDisplay);
  let text = `💙 Jogos desta semana (${rangeLabel}):\n\n`;
  games.forEach(({ ev })=>{
    const emoji = postSportEmoji_(ev.sport);
    const t = postTeams_(ev);
    const dayLabel = WEEKDAY_NAMES[new Date(ev.day+"T00:00:00").getDay()].toLowerCase();
    const when = [dayLabel, ev.t].filter(Boolean).join(" ");
    const dp = [ev.detail, ev.phase].filter(Boolean).join(", ");
    text += `${emoji} ${ev.sport} — ${t.home} vs ${t.away}`;
    text += when ? ` — ${when}\n` : "\n";
    if(dp) text += dp + "\n";
    text += "\n";
  });
  const tags = ["#FCPorto", "#DragaoStats"];
  games.forEach(({ ev })=>{ const h = postSportHashtag_(ev.sport); if(h && tags.indexOf(h)===-1) tags.push(h); });
  text += "Acompanha tudo em https://dragaostats.pt\n\n" + tags.join(" ");
  return text;
}

// Imagem para partilhar (1080 de largura, altura ajusta-se ao nº de jogos) — mesmo
// estilo visual do cartão de resultado de um jogo (generateShareCard, em 02-share-card.js):
// fundo em gradiente escuro, dourado nos destaques, Bebas Neue + Archivo Narrow.
async function generateWeekShareCard_(games, weekStart, weekEndDisplay){
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
  ctx.fillText("JOGOS DA SEMANA", 70, 240);
  ctx.font = "600 24px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#cdd8e8";
  ctx.fillText(weekShareDateRangeLabel_(weekStart, weekEndDisplay), 72, 290);

  let y = headerH;
  games.forEach(({ ev })=>{
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

    const d = new Date(ev.day + "T00:00:00");
    const dayWord = WEEKDAY_NAMES[d.getDay()].slice(0,3).toUpperCase();
    ctx.textAlign = "left";
    ctx.fillStyle = "#eef2f8";
    ctx.font = "700 24px 'Archivo Narrow', sans-serif";
    ctx.fillText(`${dayWord} ${formatShortDate(ev.day)}`, rowX+26, rowY+rowRH/2-14);
    ctx.font = "500 17px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#9fb0c8";
    ctx.fillText(ev.t || "hora por confirmar", rowX+26, rowY+rowRH/2+16);

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

function renderWeekShareBox_(weekStart, weekEnd, weekEndDisplay){
  const box = document.getElementById("weekShareBox");
  if(!box) return;
  const games = getWeekShareGames_(weekStart, weekEnd);
  if(!games.length){
    box.innerHTML = `<div class="medal-empty" style="margin-top:10px;">Não há jogos por realizar nesta semana para gerar a imagem.</div>`;
    return;
  }
  const text = buildWeekPostText_(games, weekStart, weekEndDisplay);
  const esc = str => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  box.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin:10px 0 8px;">A gerar imagem (${games.length} jogo${games.length===1?'':'s'})…</div>
    <div id="weekShareImgPreview" style="margin-bottom:10px;"></div>
    <div class="add-btn-row" style="margin-bottom:12px;">
      <button class="add-save" id="weekShareDownloadBtn" disabled>⬇️ Descarregar imagem</button>
    </div>
    <div style="font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;">Texto para colar</div>
    <textarea id="weekShareText" rows="12" style="${taStyle}">${esc(text)}</textarea>
    <button class="add-save" id="weekShareCopyBtn" style="margin-top:6px;">Copiar</button>
  `;
  document.getElementById("weekShareCopyBtn").onclick = async ()=>{
    const ta = document.getElementById("weekShareText");
    const btn = document.getElementById("weekShareCopyBtn");
    try{ await navigator.clipboard.writeText(ta.value); }
    catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(()=>{ btn.textContent = old; }, 1500);
  };

  generateWeekShareCard_(games, weekStart, weekEndDisplay).then(({ canvas, blob })=>{
    const preview = document.getElementById("weekShareImgPreview");
    if(!preview) return; // a pessoa pode ter fechado a caixa entretanto
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.style.cssText = "max-width:100%; border-radius:10px; border:1px solid var(--line); display:block;";
    preview.innerHTML = "";
    preview.appendChild(img);
    const dlBtn = document.getElementById("weekShareDownloadBtn");
    if(dlBtn){
      dlBtn.disabled = false;
      dlBtn.onclick = ()=>{
        const fileName = `dragaostats-semana-${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}.png`;
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
