// ===================== IMAGEM + TEXTO DO MÊS (para publicar nas redes) =====================
// Mesma ideia da imagem da semana (28-week-share.js), mas um resumo do mês atual:
// jogos JÁ JOGADOS este mês, com resultado — o retrato do mês, não os jogos por vir.
// Aparece no separador "Histórico" (só para quem edita), reaproveitando a mesma
// competição/EVENTS que esse separador já mostra, tal como renderHistoryView faz.

// Jogos deste mês com resultado escrito — usa EVENTS (a competição aberta agora),
// igual ao que o separador Histórico já lista, para o resumo nunca mostrar algo
// diferente do que a pessoa está a ver ali ao lado.
function getMonthShareGames_(monthStart, monthEnd){
  const rows = [];
  EVENTS.forEach(ev=>{
    if(!ev.day) return;
    const d = new Date(ev.day + "T00:00:00");
    if(isNaN(d) || d < monthStart || d >= monthEnd) return;
    const st = getEv(ev.id);
    if(!st.resultado || !String(st.resultado).trim()) return; // só jogos já com resultado
    rows.push({ ev, st, tag: getMatchResultTag(ev, st) });
  });
  rows.sort((a,b)=> a.ev.day === b.ev.day ? (a.ev.t||"").localeCompare(b.ev.t||"") : (a.ev.day < b.ev.day ? -1 : 1));
  return rows;
}

function monthShareMonthLabel_(monthStart){
  return MONTH_NAMES[monthStart.getMonth()] + " " + monthStart.getFullYear();
}

function monthShareTally_(games){
  let w=0, d=0, l=0;
  games.forEach(({tag})=>{
    if(tag==="win") w++;
    else if(tag==="draw") d++;
    else if(tag==="loss") l++;
  });
  return { w, d, l };
}

// Texto pronto a colar — mesmo tom/estilo do texto da semana, com link completo.
function buildMonthPostText_(games, monthStart){
  if(!games.length) return "";
  const monthLabel = monthShareMonthLabel_(monthStart).toLowerCase();
  const { w, d, l } = monthShareTally_(games);
  let text = `💙 Resumo de ${monthLabel}:\n\n`;
  text += `✅ ${w} vitória${w===1?'':'s'} · 🟰 ${d} empate${d===1?'':'s'} · ❌ ${l} derrota${l===1?'':'s'}\n\n`;
  games.forEach(({ ev, st, tag })=>{
    const emoji = postSportEmoji_(ev.sport);
    const t = postTeams_(ev);
    const tagEmoji = tag==="win" ? "✅" : tag==="loss" ? "❌" : tag==="draw" ? "🟰" : "";
    text += `${emoji} ${ev.sport} — ${t.home} ${st.resultado.trim()} ${t.away}${tagEmoji ? ' ' + tagEmoji : ''}\n`;
  });
  const tags = ["#FCPorto", "#DragaoStats"];
  games.forEach(({ ev })=>{ const h = postSportHashtag_(ev.sport); if(h && tags.indexOf(h)===-1) tags.push(h); });
  text += "\nAcompanha tudo em https://dragaostats.pt\n\n" + tags.join(" ");
  return text;
}

// Imagem para partilhar — mesmo esqueleto visual do cartão da semana (fundo em
// gradiente escuro, dourado, Bebas Neue + Archivo Narrow), mas cada linha mostra
// o RESULTADO do jogo (com a cor certa: verde/vermelho/cinza) em vez da hora.
async function generateMonthShareCard_(games, monthStart){
  const W = 1080;
  const rowH = 140, headerH = 420, footerH = 150;
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
  ctx.fillText("RESUMO DO MÊS", 70, 240);
  ctx.font = "600 24px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#cdd8e8";
  ctx.fillText(monthShareMonthLabel_(monthStart), 72, 290);

  const { w, d, l } = monthShareTally_(games);
  ctx.font = "700 32px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#4caf7d";
  const wText = `✅ ${w}V`;
  ctx.fillText(wText, 72, 350);
  const wWidth = ctx.measureText(wText).width;
  ctx.fillStyle = "#e3b23c";
  const dText = `  🟰 ${d}E`;
  ctx.fillText(dText, 72 + wWidth, 350);
  const dWidth = ctx.measureText(dText).width;
  ctx.fillStyle = "#e05c5c";
  ctx.fillText(`  ❌ ${l}D`, 72 + wWidth + dWidth, 350);

  let y = headerH;
  games.forEach(({ ev, st, tag })=>{
    const color = SPORT_COLORS[ev.sport] || "#e3b23c";
    const resultColor = tag==="win" ? "#4caf7d" : tag==="loss" ? "#e05c5c" : "#9fb0c8";
    const rowY = y + 14, rowX = 70, rowW = W - 140, rowRH = rowH - 28;

    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    if(ctx.roundRect){
      ctx.beginPath(); ctx.roundRect(rowX, rowY, rowW, rowRH, 14); ctx.fill(); ctx.stroke();
    }else{
      ctx.fillRect(rowX, rowY, rowW, rowRH);
    }
    ctx.fillStyle = resultColor;
    ctx.fillRect(rowX, rowY, 6, rowRH);

    ctx.textAlign = "left";
    ctx.fillStyle = "#9fb0c8";
    ctx.font = "600 16px 'Archivo Narrow', sans-serif";
    ctx.fillText(formatShortDate(ev.day), rowX+26, rowY+28);

    const badgeText = (ev.sport||"").toUpperCase();
    ctx.font = "700 13px 'Archivo Narrow', sans-serif";
    const badgeW = ctx.measureText(badgeText).width + 24;
    const badgeX = rowX+150, badgeY = rowY+13;
    ctx.fillStyle = color;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, 28, 14); ctx.fill(); }
    else ctx.fillRect(badgeX, badgeY, badgeW, 28);
    ctx.fillStyle = "#0a1626";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, badgeX+badgeW/2, badgeY+15);

    const t = postTeams_(ev);
    ctx.textAlign = "left";
    ctx.font = "700 26px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#eef2f8";
    const oppText = `${t.home} ${st.resultado.trim()} ${t.away}`;
    const oppMaxW = rowW - 190;
    let oppFit = oppText;
    while(ctx.measureText(oppFit).width > oppMaxW && oppFit.length > 3){ oppFit = oppFit.slice(0, -4) + "…"; }
    ctx.fillText(oppFit, rowX+26, rowY+rowRH-20);

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

function renderMonthShareBox_(){
  const box = document.getElementById("monthShareBox");
  if(!box) return;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const games = getMonthShareGames_(monthStart, monthEnd);
  if(!games.length){
    box.innerHTML = `<div class="medal-empty" style="margin-top:10px;">Ainda sem jogos com resultado este mês para gerar o resumo.</div>`;
    return;
  }
  const text = buildMonthPostText_(games, monthStart);
  const esc = str => String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const taStyle = "width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical; font-family:inherit;";
  box.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin:10px 0 8px;">A gerar imagem (${games.length} jogo${games.length===1?'':'s'})…</div>
    <div id="monthShareImgPreview" style="margin-bottom:10px;"></div>
    <div class="add-btn-row" style="margin-bottom:12px;">
      <button class="add-save" id="monthShareDownloadBtn" disabled>⬇️ Descarregar imagem</button>
    </div>
    <div style="font-size:12px; font-weight:700; color:var(--text-dim); margin:4px 0 4px;">Texto para colar</div>
    <textarea id="monthShareText" rows="12" style="${taStyle}">${esc(text)}</textarea>
    <button class="add-save" id="monthShareCopyBtn" style="margin-top:6px;">Copiar</button>
  `;
  document.getElementById("monthShareCopyBtn").onclick = async ()=>{
    const ta = document.getElementById("monthShareText");
    const btn = document.getElementById("monthShareCopyBtn");
    try{ await navigator.clipboard.writeText(ta.value); }
    catch(e){ ta.select(); try{ document.execCommand("copy"); }catch(e2){} }
    const old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(()=>{ btn.textContent = old; }, 1500);
  };

  generateMonthShareCard_(games, monthStart).then(({ canvas, blob })=>{
    const preview = document.getElementById("monthShareImgPreview");
    if(!preview) return; // a pessoa pode ter fechado a caixa entretanto
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.style.cssText = "max-width:100%; border-radius:10px; border:1px solid var(--line); display:block;";
    preview.innerHTML = "";
    preview.appendChild(img);
    const dlBtn = document.getElementById("monthShareDownloadBtn");
    if(dlBtn){
      dlBtn.disabled = false;
      dlBtn.onclick = ()=>{
        const fileName = `dragaostats-mes-${monthStart.getFullYear()}-${String(monthStart.getMonth()+1).padStart(2,"0")}.png`;
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
