// ===================== IMAGEM PARA PARTILHAR (cartão de resultado) =====================
// Desenha um cartão quadrado (1080x1080, bom para Instagram/Reddit/WhatsApp) com
// o resultado do jogo, e oferece para descarregar (ou partilhar diretamente, em
// telemóveis que suportem). O texto do post continua a fazer-se à parte (como
// sempre), isto é só a imagem.
async function generateShareCard(ev, st, sportColor){
  const CARD = 1080;
  const BLUE = "#2f6fb8"; // azul perto do FC Porto, usado nos destaques do cartão de promoção
  const hasResult = !!(st.resultado && st.resultado.trim());
  const canvas = document.createElement("canvas");
  canvas.width = CARD; canvas.height = CARD;
  const ctx = canvas.getContext("2d");

  // fundo, mesmo tom escuro da app
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD);
  bgGrad.addColorStop(0, "#16294a");
  bgGrad.addColorStop(1, "#0a1626");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD, CARD);

  // logo + nome, no topo
  try{
    const logo = await new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = reject;
      img.src = "header-emblem.png";
    });
    ctx.save();
    ctx.beginPath();
    ctx.arc(90, 90, 42, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, 48, 48, 84, 84);
    ctx.restore();
  }catch(e){ /* sem logo, segue sem ela — não vale a pena travar a imagem por isto */ }
  ctx.fillStyle = "#eef2f8";
  ctx.font = "700 32px 'Archivo Narrow', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("DRAGÃO STATS", 150, 90);

  // badge da modalidade — ou "PROMOÇÃO"/jogo ainda por vir, no cartão de aviso
  ctx.font = "700 26px 'Archivo Narrow', sans-serif";
  const sportText = (ev.sport || "").toUpperCase();
  const sportW = ctx.measureText(sportText).width;
  const badgeX = CARD/2 - (sportW+56)/2, badgeY = 190, badgeH = 52;
  ctx.fillStyle = hasResult ? (sportColor || "#e3b23c") : BLUE;
  if(ctx.roundRect){
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, sportW+56, badgeH, 26);
    ctx.fill();
  }else{
    ctx.fillRect(badgeX, badgeY, sportW+56, badgeH); // browsers mais antigos sem roundRect — fica só sem cantos arredondados, sem partir a imagem
  }
  ctx.fillStyle = hasResult ? "#0a1626" : "#eef2f8";
  ctx.textAlign = "center";
  ctx.fillText(sportText, CARD/2, badgeY+badgeH/2+2);

  // Ordem dos nomes conforme o local: em casa o FC Porto aparece primeiro, fora
  // aparece em segundo — dispensa escrever "Casa"/"Fora" por extenso no cartão.
  const isAway = ev.local === "fora";
  const topName = isAway ? (ev.athlete || "") : "FC Porto";
  const bottomName = isAway ? "FC Porto" : (ev.athlete || "");

  ctx.textAlign = "center";
  ctx.fillStyle = "#eef2f8";
  ctx.font = "700 46px 'Archivo Narrow', sans-serif";
  wrapCenteredText(ctx, topName, CARD/2, 315, CARD-120);
  ctx.font = "600 30px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#93a2bd";
  ctx.fillText("vs", CARD/2, 368);
  ctx.font = "700 46px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#eef2f8";
  wrapCenteredText(ctx, bottomName, CARD/2, 418, CARD-120);

  if(hasResult){
    // placar, em destaque
    ctx.font = "800 100px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = sportColor || "#e3b23c";
    ctx.fillText(st.resultado.trim(), CARD/2, 545);

    // competição / fase
    const metaLine = [ev.detail, ev.phase, ev.venue].filter(Boolean).join(" · ");
    ctx.font = "500 26px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#93a2bd";
    wrapCenteredText(ctx, metaLine, CARD/2, 635, CARD-150);

    // data
    ctx.font = "500 23px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#93a2bd";
    ctx.fillText(formatFullDate(ev.day), CARD/2, 685);
  }else{
    // ainda não há resultado — em destaque fica a data e a hora, para promover
    // o jogo em vez do placar
    ctx.font = "600 36px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#eef2f8";
    ctx.fillText(formatFullDate(ev.day), CARD/2, 505);
    ctx.font = "800 100px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = BLUE;
    ctx.fillText(ev.t || "", CARD/2, 610);

    // competição / fase
    const metaLine = [ev.detail, ev.phase, ev.venue].filter(Boolean).join(" · ");
    ctx.font = "500 24px 'Archivo Narrow', sans-serif";
    ctx.fillStyle = "#93a2bd";
    wrapCenteredText(ctx, metaLine, CARD/2, 675, CARD-150);
  }

  // frase de destaque + QR code — em ambos os cartões, para trazer gente ao site
  ctx.font = "600 24px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#c7d2e6";
  wrapCenteredText(ctx, "📲 Acompanha os calendários, resultados e classificações na hora", CARD/2, 750, CARD-130);

  try{
    const qr = qrcode(0, "M");
    qr.addData("https://dragaostats.pt");
    qr.make();
    const modules = qr.getModuleCount();
    const qrSize = 170, qrPad = 12;
    const qrX = CARD/2 - qrSize/2, qrY = 815;
    if(ctx.roundRect){
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX-qrPad, qrY-qrPad, qrSize+qrPad*2, qrSize+qrPad*2, 12);
      ctx.fill();
    }else{
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX-qrPad, qrY-qrPad, qrSize+qrPad*2, qrSize+qrPad*2);
    }
    const cell = qrSize / modules;
    ctx.fillStyle = "#0a1626";
    for(let r=0; r<modules; r++){
      for(let c=0; c<modules; c++){
        if(qr.isDark(r,c)) ctx.fillRect(qrX + c*cell, qrY + r*cell, cell+0.5, cell+0.5);
      }
    }
  }catch(e){ /* biblioteca do QR pode falhar a carregar (sem rede) — a imagem segue sem QR, não é motivo para travar tudo */ }

  // rodapé
  ctx.font = "500 22px 'Archivo Narrow', sans-serif";
  ctx.fillStyle = "#5a6a88";
  ctx.fillText("dragaostats.pt", CARD/2, 1045);

  canvas.toBlob(async (blob)=>{
    if(!blob){ alert("⚠️ Não foi possível gerar a imagem."); return; }
    const fileName = `dragaostats-${(ev.sport||'jogo').toLowerCase().replace(/\s+/g,'-')}-${ev.day||''}.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try{ await navigator.share({ files: [file], title: "Dragão Stats" }); return; }
      catch(e){ /* pessoa cancelou a partilha ou o telemóvel recusou — cai para descarregar */ }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
  }, "image/png");
}

