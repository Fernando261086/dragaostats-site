// ===================== REEL PARA PARTILHAR (vídeo curto do resultado) =====================
// Mesma ideia do cartão de imagem acima, mas em vídeo vertical 1080x1920 (Reels/
// Stories), com os elementos a entrar em sequência. Grava o próprio <canvas> com
// MediaRecorder — não depende de nenhum servidor nem de bibliotecas de vídeo.
async function generateShareReel(ev, st, sportColor){
  const W = 1080, H = 1920;
  const BLUE = "#2f6fb8";
  const hasResult = !!(st.resultado && st.resultado.trim());
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // pré-carrega tudo o que não muda frame a frame (logo + QR), tal como no cartão
  let logo = null;
  try{
    logo = await new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = reject;
      img.src = "header-emblem.png";
    });
  }catch(e){ /* sem logo, segue sem ela */ }

  let qrModules = null, qrCount = 0;
  try{
    const qr = qrcode(0, "M");
    qr.addData("https://dragaostats.pt");
    qr.make();
    qrCount = qr.getModuleCount();
    qrModules = qr;
  }catch(e){ /* sem QR, segue sem ele */ }

  const isAway = ev.local === "fora";
  const topName = isAway ? (ev.athlete || "") : "FC Porto";
  const bottomName = isAway ? "FC Porto" : (ev.athlete || "");
  const sportText = (ev.sport || "").toUpperCase();
  const metaLine = [ev.detail, ev.phase, ev.venue].filter(Boolean).join(" · ");

  // easing simples: entra rápido, desacelera no fim — fica mais suave que linear
  const easeOut = (t)=> 1 - Math.pow(1-Math.max(0, Math.min(1, t)), 3);
  // devolve 0→1 consoante o tempo decorrido esteja dentro de [from, to] (em segundos)
  const phase = (elapsed, from, to)=> easeOut((elapsed-from) / (to-from));

  function draw(elapsed){
    ctx.clearRect(0, 0, W, H);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#16294a");
    bgGrad.addColorStop(1, "#0a1626");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // marca, no topo (fade-in)
    const aBrand = phase(elapsed, 0, 0.5);
    if(aBrand > 0){
      ctx.save();
      ctx.globalAlpha = aBrand;
      if(logo){
        ctx.save();
        ctx.beginPath();
        ctx.arc(W/2 - 160, 360, 42, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, W/2 - 160 - 42, 360 - 42, 84, 84);
        ctx.restore();
      }
      ctx.fillStyle = "#eef2f8";
      ctx.font = "700 32px 'Archivo Narrow', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("DRAGÃO STATS", W/2 - 100, 360);
      ctx.restore();
    }

    // badge da modalidade (fade + leve zoom)
    const aBadge = phase(elapsed, 0.35, 0.85);
    if(aBadge > 0){
      ctx.save();
      ctx.globalAlpha = aBadge;
      ctx.font = "700 28px 'Archivo Narrow', sans-serif";
      const sportW = ctx.measureText(sportText).width;
      const badgeScale = 0.85 + aBadge*0.15;
      const badgeY = 480, badgeH = 54;
      ctx.translate(W/2, badgeY+badgeH/2);
      ctx.scale(badgeScale, badgeScale);
      ctx.translate(-W/2, -(badgeY+badgeH/2));
      const badgeX = W/2 - (sportW+56)/2;
      ctx.fillStyle = hasResult ? (sportColor || "#e3b23c") : BLUE;
      if(ctx.roundRect){
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, sportW+56, badgeH, 27);
        ctx.fill();
      }else{
        ctx.fillRect(badgeX, badgeY, sportW+56, badgeH);
      }
      ctx.fillStyle = hasResult ? "#0a1626" : "#eef2f8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sportText, W/2, badgeY+badgeH/2+2);
      ctx.restore();
    }

    // nomes das equipas — entram de lados opostos
    const aTop = phase(elapsed, 0.7, 1.3);
    if(aTop > 0){
      ctx.save();
      ctx.globalAlpha = aTop;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#eef2f8";
      ctx.font = "700 52px 'Archivo Narrow', sans-serif";
      wrapCenteredText(ctx, topName, W/2 + (1-aTop)*(-140), 650, W-160);
      ctx.restore();
    }
    const aVs = phase(elapsed, 0.9, 1.3);
    if(aVs > 0){
      ctx.save();
      ctx.globalAlpha = aVs;
      ctx.textAlign = "center";
      ctx.font = "600 32px 'Archivo Narrow', sans-serif";
      ctx.fillStyle = "#93a2bd";
      ctx.fillText("vs", W/2, 720);
      ctx.restore();
    }
    const aBottom = phase(elapsed, 1.0, 1.6);
    if(aBottom > 0){
      ctx.save();
      ctx.globalAlpha = aBottom;
      ctx.textAlign = "center";
      ctx.fillStyle = "#eef2f8";
      ctx.font = "700 52px 'Archivo Narrow', sans-serif";
      wrapCenteredText(ctx, bottomName, W/2 + (1-aBottom)*(140), 790, W-160);
      ctx.restore();
    }

    if(hasResult){
      // placar — entra com um pequeno "pop" (escala a passar de 1.0)
      const aScore = phase(elapsed, 2.2, 2.9);
      if(aScore > 0){
        ctx.save();
        const overshoot = 1 + Math.sin(aScore*Math.PI) * 0.12 * (1-aScore);
        ctx.globalAlpha = Math.min(1, aScore*1.4);
        ctx.translate(W/2, 980);
        ctx.scale(overshoot, overshoot);
        ctx.translate(-W/2, -980);
        ctx.textAlign = "center";
        ctx.font = "800 150px 'Archivo Narrow', sans-serif";
        ctx.fillStyle = sportColor || "#e3b23c";
        ctx.fillText(st.resultado.trim(), W/2, 1010);
        ctx.restore();
      }
      const aMeta = phase(elapsed, 2.9, 3.3);
      if(aMeta > 0){
        ctx.save();
        ctx.globalAlpha = aMeta;
        ctx.textAlign = "center";
        ctx.font = "500 28px 'Archivo Narrow', sans-serif";
        ctx.fillStyle = "#93a2bd";
        wrapCenteredText(ctx, metaLine, W/2, 1130, W-180);
        ctx.font = "500 24px 'Archivo Narrow', sans-serif";
        ctx.fillText(formatFullDate(ev.day), W/2, 1180);
        ctx.restore();
      }
    }else{
      // ainda não há resultado — data e hora, a promover o jogo
      const aDate = phase(elapsed, 2.2, 2.7);
      if(aDate > 0){
        ctx.save();
        ctx.globalAlpha = aDate;
        ctx.textAlign = "center";
        ctx.font = "600 38px 'Archivo Narrow', sans-serif";
        ctx.fillStyle = "#eef2f8";
        ctx.fillText(formatFullDate(ev.day), W/2, 920);
        ctx.restore();
      }
      const aTime = phase(elapsed, 2.5, 3.1);
      if(aTime > 0){
        ctx.save();
        ctx.globalAlpha = Math.min(1, aTime*1.4);
        ctx.textAlign = "center";
        ctx.font = "800 150px 'Archivo Narrow', sans-serif";
        ctx.fillStyle = BLUE;
        ctx.fillText(ev.t || "", W/2, 1050);
        ctx.restore();
      }
      const aMeta = phase(elapsed, 3.1, 3.5);
      if(aMeta > 0){
        ctx.save();
        ctx.globalAlpha = aMeta;
        ctx.textAlign = "center";
        ctx.font = "500 26px 'Archivo Narrow', sans-serif";
        ctx.fillStyle = "#93a2bd";
        wrapCenteredText(ctx, metaLine, W/2, 1130, W-180);
        ctx.restore();
      }
    }

    // frase + QR — entram juntos, perto do fim
    const aFooter = phase(elapsed, 3.8, 4.3);
    if(aFooter > 0){
      ctx.save();
      ctx.globalAlpha = aFooter;
      ctx.textAlign = "center";
      ctx.font = "600 26px 'Archivo Narrow', sans-serif";
      ctx.fillStyle = "#c7d2e6";
      wrapCenteredText(ctx, "📲 Acompanha os calendários, resultados e classificações na hora", W/2, 1360, W-170);

      if(qrModules){
        const qrSize = 200, qrPad = 14;
        const qrX = W/2 - qrSize/2, qrY = 1410;
        ctx.fillStyle = "#ffffff";
        if(ctx.roundRect){
          ctx.beginPath();
          ctx.roundRect(qrX-qrPad, qrY-qrPad, qrSize+qrPad*2, qrSize+qrPad*2, 14);
          ctx.fill();
        }else{
          ctx.fillRect(qrX-qrPad, qrY-qrPad, qrSize+qrPad*2, qrSize+qrPad*2);
        }
        const cell = qrSize / qrCount;
        ctx.fillStyle = "#0a1626";
        for(let r=0; r<qrCount; r++){
          for(let c=0; c<qrCount; c++){
            if(qrModules.isDark(r,c)) ctx.fillRect(qrX + c*cell, qrY + r*cell, cell+0.5, cell+0.5);
          }
        }
      }

      ctx.font = "500 24px 'Archivo Narrow', sans-serif";
      ctx.fillStyle = "#5a6a88";
      ctx.fillText("dragaostats.pt", W/2, 1680);
      ctx.restore();
    }
  }

  // grava o canvas durante a animação + uma pequena pausa no fim, para quem
  // publicar o vídeo ter meio segundo de "respiro" antes de acabar
  const ANIM_END = 4.3, HOLD = 0.7, TOTAL = ANIM_END + HOLD;

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : (MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm");
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e)=>{ if(e.data && e.data.size > 0) chunks.push(e.data); };

  const finished = new Promise((resolve)=>{ recorder.onstop = resolve; });

  const startTime = performance.now();
  recorder.start();
  function frameLoop(now){
    const elapsed = (now - startTime) / 1000;
    draw(Math.min(elapsed, ANIM_END));
    if(elapsed < TOTAL){
      requestAnimationFrame(frameLoop);
    }else{
      recorder.stop();
    }
  }
  requestAnimationFrame(frameLoop);

  await finished;

  const blob = new Blob(chunks, { type: "video/webm" });
  const fileName = `dragaostats-${(ev.sport||'jogo').toLowerCase().replace(/\s+/g,'-')}-${ev.day||''}.webm`;
  const file = new File([blob], fileName, { type: "video/webm" });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: "Dragão Stats" }); return; }
    catch(e){ /* pessoa cancelou a partilha ou o telemóvel recusou — cai para descarregar */ }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
}

// Escreve texto centrado, quebrando para uma segunda linha se não couber na
// largura disponível — evita que nomes de equipas compridos saiam do cartão.
function wrapCenteredText(ctx, text, cx, y, maxWidth){
  if(!text) return;
  if(ctx.measureText(text).width <= maxWidth){ ctx.fillText(text, cx, y); return; }
  const words = text.split(" ");
  let line1 = "", line2 = "";
  for(const w of words){
    if(ctx.measureText((line1 ? line1+" " : "")+w).width <= maxWidth) line1 += (line1 ? " " : "") + w;
    else line2 += (line2 ? " " : "") + w;
  }
  ctx.fillText(line1, cx, y-24);
  ctx.fillText(line2, cx, y+24);
}

// Diz se uma prova/jogo pertence ao "separador" atualmente selecionado — no modo
// Modalidades isso é o MÊS (ev.day é uma data completa "YYYY-MM-DD"), no modo
// normal continua a ser o dia exato, tal como sempre foi.
function belongsToActiveDay(ev){
  if(currentCompMode()==="matches") return (ev.day||"").slice(0,7) === activeDay;
  return ev.day === activeDay;
}

function getSportsPresent(){
  return ["Todos", ...Array.from(new Set(EVENTS.filter(belongsToActiveDay).map(e=>e.sport)))];
}
function getDaysPresent(){
  if(currentCompMode()==="matches"){
    // separadores por MÊS (chave "YYYY-MM"), ordenados cronologicamente
    const months = Array.from(new Set(EVENTS.map(e=>(e.day||"").slice(0,7)).filter(Boolean)));
    return months.sort();
  }
  const days = Array.from(new Set(EVENTS.map(e=>e.day)));
  // Ordena pela ordem em que cada dia começou a ser usado (não só pelo número) —
  // assim "dia 1" de um mês novo aparece depois de "dia 31" do mês anterior,
  // em vez de saltar para o início por o número ser mais pequeno.
  const firstSeq = {};
  EVENTS.forEach(e=>{
    if(firstSeq[e.day] === undefined || (e.seq||0) < firstSeq[e.day]) firstSeq[e.day] = e.seq||0;
  });
  return days.sort((a,b)=> (firstSeq[a]||0) - (firstSeq[b]||0));
}

// Escolhe o dia/mês inicial a mostrar: no Modo Modalidades, dá sempre prioridade
// ao MÊS ATUAL a sério (se houver jogos nele), em vez de simplesmente "o mês mais
// recente com dados" — senão, assim que se adicionam jogos de um mês futuro, a
// app passava a abrir sempre nesse mês, mesmo estando ainda no mês anterior.
function defaultDayFor(days){
  if(!days.length) return String(new Date().getDate());
  if(currentCompMode()==="matches"){
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0");
    if(days.includes(thisMonth)) return thisMonth;
  }else{
    // Modo Medalhas: "dia" é o número do dia do mês (ex: "22"). Se o dia de
    // hoje tiver dados nesta competição, abre logo nele — só cai para o
    // último dia da lista quando hoje ainda não está (competição que só
    // começa no futuro) ou já passou (competição já terminada).
    const todayNum = String(new Date().getDate());
    if(days.includes(todayNum)) return todayNum;
  }
  return days[days.length-1];
}
// Escolhe uma competição não arquivada por defeito (cai para qualquer uma se não houver nenhuma ativa)
function firstActiveOrAny(){
  // no modo "só ver", nunca pode calhar numa competição do Modo Medalhas
  const pool = READONLY_MODE ? ALL.competitions.filter(c=>(c.mode||"medals")==="matches") : ALL.competitions;
  const found = pool.find(c=>!c.archived);
  return (found || pool[0] || ALL.competitions[0]).id;
}

function minutesOf(t){
  const m = /^(\d{1,2}):(\d{2})/.exec((t||"").trim());
  return m ? (parseInt(m[1],10)*60 + parseInt(m[2],10)) : 0;
}
function sortEvents(){
  if(!Array.isArray(EVENTS)) EVENTS = []; // rede de segurança: nunca deixar rebentar aqui
  EVENTS.sort((a,b)=>{
    // No Modo Modalidades, "day" é uma data completa (AAAA-MM-DD) — nesse caso, a
    // data manda sempre primeiro; só compara a hora quando é o mesmo dia (ou quando
    // "day" é só um número de dia, como no Modo Medalhas, que continua igual a sempre)
    const aFullDate = /^\d{4}-\d{2}-\d{2}$/.test(a.day||"");
    const bFullDate = /^\d{4}-\d{2}-\d{2}$/.test(b.day||"");
    if(aFullDate && bFullDate && a.day !== b.day){
      return a.day < b.day ? -1 : 1;
    }
    return minutesOf(a.t)-minutesOf(b.t) || (a.seq-b.seq);
  });
}
function nextSeq(){
  return EVENTS.reduce((max,e)=>Math.max(max, e.seq||0), 0) + 1;
}

// Vai buscar TUDO à Sheet numa só chamada. Reconhece automaticamente o formato antigo
// (uma só competição) e converte-o para o novo formato multi-competição, sem perder nada.
async function fetchAll(){
  try{
    // cache:'no-store' + um parâmetro que muda sempre, para o browser nunca guardar
    // esta resposta em cache e mostrar dados antigos sem darmos por isso
    // 10s de limite: sem isto, uma resposta lenta do Apps Script deixa a app presa
    // no ecrã inicial para sempre, sem nunca chegar a mostrar nada (nem um erro)
    const ctrl = new AbortController();
    const timeoutId = setTimeout(()=> ctrl.abort(), 10000);
    let r;
    try{
      r = await fetch(STORE_URL + "?_=" + Date.now(), { method: 'GET', cache: 'no-store', signal: ctrl.signal });
    }finally{
      clearTimeout(timeoutId);
    }
    if(!r.ok) return { ok:false, all:null };
    const raw = await r.json();
    if(raw && Array.isArray(raw.competitions)){
      // atualiza os links de classificação com o que o servidor tem — mas nunca
      // enquanto o painel de edição estiver aberto, para não apagar algo que a
      // pessoa ainda esteja a escrever/acabou de acrescentar sem ter guardado
      const sportLinksPanelOpen = document.getElementById("sportLinksPanel")
        && document.getElementById("sportLinksPanel").style.display !== "none";
      if(raw.sportLinks && typeof raw.sportLinks === "object" && !sportLinksPanelOpen){
        SPORT_LINKS = { ...DEFAULT_SPORT_LINKS, ...raw.sportLinks };
        cacheSportLinksLocally();
      }
      if(raw.statTypes && typeof raw.statTypes === "object"){
        const merged = { ...DEFAULT_STAT_TYPES };
        Object.keys(raw.statTypes).forEach(sport=>{
          merged[sport] = Array.from(new Set([...(merged[sport]||[]), ...raw.statTypes[sport]]));
        });
        STAT_TYPES = merged;
      }
      // A lista de passwords de admin (ADMIN_AUTH) já não vem aqui — o servidor
      // deixou de a mandar neste pedido geral (que qualquer visitante faz,
      // incluindo quem só tem o link "só ver"). Ver ensureAdminAuthenticated()
      // e renderAccessManagePanel(), que a tratam agora cada um à sua vez,
      // sempre com a password já validada no servidor primeiro. hasAdminAuth é
      // só o sim/não de "existe alguma password configurada" (ver init()).
      if(typeof raw.hasAdminAuth === "boolean") HAS_ADMIN_AUTH = raw.hasAdminAuth;
      if(Array.isArray(raw.visitLog)) VISIT_LOG = raw.visitLog;
      if(Array.isArray(raw.feedback)){ FEEDBACK_LOG = raw.feedback; checkFeedbackUpdates(); checkMyFeedbackReplies(); }
      if(raw.reactions && typeof raw.reactions === "object") REACTIONS = raw.reactions;
      if(raw.competitionOptions && typeof raw.competitionOptions === "object") COMPETITION_OPTIONS = raw.competitionOptions;
      if(raw.predictions && typeof raw.predictions === "object") PREDICTIONS = raw.predictions;
      if(raw.questionTemplates && typeof raw.questionTemplates === "object"){
        const mergedQ = { ...DEFAULT_QUESTION_TEMPLATES };
        Object.keys(raw.questionTemplates).forEach(sport=>{
          mergedQ[sport] = raw.questionTemplates[sport]; // o servidor manda sempre, já inclui as por defeito que sobrevivem
        });
        QUESTION_TEMPLATES = mergedQ;
      }
      if(raw.announcement !== undefined){ ANNOUNCEMENT = raw.announcement; renderAnnouncementBanner(); }
      if(raw.poll !== undefined){ POLL = raw.poll; renderPollWidget(); }
      const goodAll = { competitions: raw.competitions, data: raw.data || {} };
      try{ localStorage.setItem("dia22-last-good-data", JSON.stringify({ at: Date.now(), all: goodAll })); }catch(e){}
      return { ok:true, all: goodAll, migrated:false };
    }
    if(raw && raw.legacy){
      // formato antigo (só existia uma competição) — migra automaticamente
      const migrated = {
        competitions: [{ id:"taranto2026", name:"Jogos do Mediterrâneo 2026" }],
        data: {
          "taranto2026": {
            events: Array.isArray(raw.events) ? raw.events : [],
            status: (raw.status && typeof raw.status === "object" && !Array.isArray(raw.status)) ? raw.status : {}
          }
        }
      };
      return { ok:true, all: migrated, migrated:true };
    }
    return { ok:true, all: { competitions: [], data: {} }, migrated:false };
  }catch(e){
    console.error("Falha ao carregar:", e);
    return { ok:false, all:null };
  }
}

async function persistAll(retryCount){
  retryCount = retryCount || 0;
  try{
    // NUNCA envia a lista de competições numa gravação normal (marcar/adicionar/editar
    // uma prova) — só as ações dedicadas de criar/eliminar competição o fazem. Isto evita
    // que qualquer estado local estranho da lista de competições corrompa os nomes na Sheet.
    // Usa sempre a EVENTS/state mais atuais (em vez de confiar em ALL.data, que podia
    // ficar desatualizado se algo mais tivesse mudado a lista entretanto).
    const payload = {
      compId: activeCompId,
      compData: { events: EVENTS, status: state },
      adminPassword: getAdminPassword()
    };
    ALL.data[activeCompId] = payload.compData; // mantém ALL.data sempre igual ao que foi enviado
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      const errMsg = (result && result.error) || "resposta inesperada do servidor";
      // "Demasiadas gravações ao mesmo tempo" costuma resolver-se sozinha — tenta de
      // novo automaticamente antes de incomodar com um alerta
      const isBusyError = /demasiadas grava/i.test(errMsg);
      if(isBusyError && retryCount < 3){
        await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
        return persistAll(retryCount + 1);
      }
      console.error("Gravação falhou:", result);
      alert("⚠️ A gravação falhou: " + errMsg);
    }
    markSynced();
  }catch(e){
    console.error("Falha ao guardar:", e);
    alert("⚠️ Erro de rede ao gravar: " + e.message);
  }
}

// Estas duas funções mantêm o mesmo nome de sempre — só passaram a gravar
// dentro da competição ativa, em vez de irem direto à Sheet.
async function saveEvents(){
  if(!activeCompId) return;
  ALL.data[activeCompId] = ALL.data[activeCompId] || { events:[], status:{} };
  ALL.data[activeCompId].events = EVENTS;
  await persistAll();
}
async function saveState(){
  if(!activeCompId) return;
  ALL.data[activeCompId] = ALL.data[activeCompId] || { events:[], status:{} };
  ALL.data[activeCompId].status = state;
  await persistAll();
}

function loadActiveCompetition(){
  const comp = ALL.data[activeCompId] || { events:[], status:{} };
  EVENTS = Array.isArray(comp.events) ? comp.events : [];
  state = (comp.status && typeof comp.status === "object" && !Array.isArray(comp.status)) ? comp.status : {};
}

// Junta a lista de provas remota com a local: mantém tudo o que já veio da Sheet,
// mais qualquer prova acrescentada localmente que ainda não chegou lá. Isto NUNCA
// escreve nada na Sheet sozinho — só evita que a leitura automática (a cada poucos
// segundos) apague visualmente uma prova que acabou de ser gravada mas cuja escrita
// ainda não tinha terminado no preciso momento em que essa leitura aconteceu.
function mergeEvents(remoteEvents){
  const remoteIds = new Set(remoteEvents.map(e=>e.id));
  const localOnly = EVENTS.filter(e=>!remoteIds.has(e.id));
  return [...remoteEvents, ...localOnly];
}

// Junta o estado remoto com o local: em cada prova, ganha sempre a marcação mais recente.
function mergeState(remote){
  const merged = {...remote};
  Object.keys(state).forEach(id=>{
    const local = state[id];
    const rem = remote[id];
    if(!rem || (local.updatedAt||0) >= (rem.updatedAt||0)){
      merged[id] = local;
    }
  });
  return merged;
}
function getEv(id){ return state[id] || {passou:null, resultado:""}; }
// Considera-se "marcada" se tiver Passou/Não, medalha OU resultado preenchido —
// nem toda a prova precisa de Passou/Não (ex: finais diretas só têm medalha/resultado)
function isMarked(ev){
  const st = getEv(ev.id);
  return !!st.passou || !!st.medal || !!st.resultTag || !!(st.resultado && st.resultado.trim());
}

// Verifica se uma prova fica inativa por eliminação numa fase anterior do mesmo atleta/equipa
function isEliminated(ev){
  const evMin = minutesOf(ev.t);
  return EVENTS.some(other =>
    other.day === ev.day &&
    other.athlete === ev.athlete &&
    other.sport === ev.sport &&
    (minutesOf(other.t) < evMin || (minutesOf(other.t)===evMin && (other.seq||0) < (ev.seq||0))) &&
    getEv(other.id).passou === "no"
  );
}
// Uma prova está "resolvida" se estiver marcada OU se ficou inativa por eliminação anterior
// (não precisa de marcação manual — já não vai acontecer)
// Dá 2 dias de margem antes de "Esconder concluídas" tirar mesmo uma prova de
// vista — sem isto, um resultado saído agora mesmo desaparecia na hora, e
// alguém a entrar numa segunda-feira já não via os resultados do fim de semana.
function isCompletedGracePeriodOver(ev){
  const d = new Date(ev.day + "T00:00:00");
  if(isNaN(d)) return true; // sem data válida, aplica a regra normal (esconde já)
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffDays = Math.floor((today - d) / (1000*60*60*24));
  return diffDays > 2;
}
function isResolved(ev){
  return isMarked(ev) || isEliminated(ev);
}
function setEv(id, patch){
  state[id] = {...getEv(id), ...patch, updatedAt: Date.now()};
  saveState();
  renderProgress();
}
// Igual ao setEv, mas sem gravar logo no servidor — usado pelo campo de
// resultado, que chama scheduleResultSave à parte (ver mais acima) para
// agrupar as teclas rápidas numa única gravação.
function setEvLocal(id, patch){
  state[id] = {...getEv(id), ...patch, updatedAt: Date.now()};
  renderProgress();
}

function renderCompetitionSelector(){
  const sel = document.getElementById("compSelect");
  sel.innerHTML = "";
  // no modo "só ver", só as competições do Modo Modalidades ficam visíveis — o
  // Modo Medalhas fica reservado só para quem edita
  let active = ALL.competitions.filter(c=>!c.archived);
  if(READONLY_MODE) active = active.filter(c=>(c.mode||"medals")==="matches");
  active.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    if(c.id === activeCompId) opt.selected = true;
    sel.appendChild(opt);
  });
  // se a competição atual estiver arquivada (ex: outro dispositivo arquivou-a), mostra-a
  // mesmo assim para não desaparecer o ecrã sem aviso, mas o botão de arquivar reflete isso
  const activeComp = ALL.competitions.find(c=>c.id===activeCompId);
  if(activeComp && activeComp.archived && !active.find(c=>c.id===activeCompId) && (!READONLY_MODE || (activeComp.mode||"medals")==="matches")){
    const opt = document.createElement("option");
    opt.value = activeComp.id;
    opt.textContent = activeComp.name + " (arquivada)";
    opt.selected = true;
    sel.appendChild(opt);
  }

  const archived = ALL.competitions.filter(c=>c.archived);
  document.getElementById("showArchivedBtn").style.display = archived.length ? "" : "none";
  document.getElementById("archiveCompBtn").textContent = (activeComp && activeComp.archived) ? "📤" : "📥";
  document.getElementById("archiveCompBtn").title = (activeComp && activeComp.archived) ? "Repor esta competição" : "Arquivar competição";

  // no modo "só ver", se só houver uma competição disponível, não faz sentido
  // mostrar um menu de escolha com uma opção só — mostra antes o nome dela
  // diretamente no título, e esconde o seletor
  const compRow = document.getElementById("compSelect").closest(".comp-row");
  const brandTitleEl = document.querySelector(".brand-title");
  if(READONLY_MODE && active.length === 1){
    if(compRow) compRow.style.display = "none";
    if(brandTitleEl) brandTitleEl.textContent = active[0].name;
  }else{
    if(compRow) compRow.style.display = "";
    if(brandTitleEl) brandTitleEl.textContent = "Competições e Resultados";
  }

  const archSel = document.getElementById("archivedSelect");
  archSel.innerHTML = "";
  archived.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    archSel.appendChild(opt);
  });
}

// Paleta de cores de destaque — cada competição recebe uma cor conforme a sua posição
// na lista (sem precisar de guardar isso no servidor, evita mexer no Apps Script outra vez)
const COMP_PALETTES = [
  { gold:"#e3b23c", dim:"#a9863a" }, // âmbar (cor original)
  { gold:"#4fb3e8", dim:"#3a7fa8" }, // azul
  { gold:"#6bc47a", dim:"#4a8a55" }, // verde
  { gold:"#e05a7e", dim:"#a83f5c" }, // rosa/vermelho
  { gold:"#b98ee0", dim:"#8a68a8" }, // roxo
  { gold:"#e3873c", dim:"#a8632c" }, // laranja
];
// 6 formas de emblema diferentes, uma por posição na lista (acompanha a cor)
const EMBLEM_SHAPES = [
  // 0 — três anéis (original)
  `<circle cx="24" cy="24" r="15" fill="none" stroke="var(--gold)" stroke-width="3"/>
   <circle cx="40" cy="24" r="15" fill="none" stroke="var(--text)" stroke-width="3"/>
   <circle cx="32" cy="40" r="15" fill="none" stroke="var(--gold-dim)" stroke-width="3"/>`,
  // 1 — hexágono
  `<polygon points="32,6 54,19 54,45 32,58 10,45 10,19" fill="none" stroke="var(--gold)" stroke-width="3"/>
   <polygon points="32,18 44,25 44,39 32,46 20,39 20,25" fill="none" stroke="var(--gold-dim)" stroke-width="2.5"/>`,
  // 2 — losango
  `<polygon points="32,4 60,32 32,60 4,32" fill="none" stroke="var(--gold)" stroke-width="3"/>
   <polygon points="32,18 46,32 32,46 18,32" fill="none" stroke="var(--text)" stroke-width="2.5"/>`,
  // 3 — estrela de cinco pontas
  `<polygon points="32,4 39,24 60,24 43,37 49,58 32,46 15,58 21,37 4,24 25,24"
     fill="none" stroke="var(--gold)" stroke-width="3" stroke-linejoin="round"/>`,
  // 4 — escudo
  `<path d="M32 4 L54 12 V30 C54 46 44 56 32 60 C20 56 10 46 10 30 V12 Z"
     fill="none" stroke="var(--gold)" stroke-width="3" stroke-linejoin="round"/>
   <path d="M32 16 L46 21 V30 C46 40 39 47 32 50 C25 47 18 40 18 30 V21 Z"
     fill="none" stroke="var(--gold-dim)" stroke-width="2" stroke-linejoin="round"/>`,
  // 5 — medalha (círculo + fita)
  `<path d="M22 6 L32 26 L42 6" fill="none" stroke="var(--gold-dim)" stroke-width="4" stroke-linecap="round"/>
   <circle cx="32" cy="38" r="20" fill="none" stroke="var(--gold)" stroke-width="3.5"/>
   <circle cx="32" cy="38" r="11" fill="none" stroke="var(--text)" stroke-width="2"/>`,
];

// Emblema próprio (original, sem copiar nenhum símbolo oficial) para competições em
// Modo Modalidades — escudo nas cores do clube, com 5 bolas a representar as modalidades
// (hóquei em patins, andebol, voleibol, basquetebol, futsal)
// Modalidades conhecidas do Modo Modalidades + link da classificação geral de cada uma.
// Guardado neste dispositivo (localStorage) — editável através do botão "⚙️ Ligações".
const DEFAULT_SPORT_LINKS = {
  "Andebol": "https://www.zerozero.pt/competicao/i-divisao-andebol",
  "Hóquei Patins": "https://www.zerozero.pt/competicao/i-divisao-hoquei-patins",
  "Basquetebol": "https://www.zerozero.pt/competicao/liga-portuguesa-basquetebol",
  "Voleibol": "https://www.zerozero.pt/competicao/i-divisao-feminina-voleibol",
  "Futsal": "https://www.zerozero.pt/edicao/iii-divisao-futsal-serie-a-2026-27/223755"
};
// Nomes de estatística já conhecidos por modalidade — ponto de partida razoável,
// mas cresce sozinho: ao acrescentares uma estatística nova num jogo, fica
// disponível também nos jogos seguintes dessa modalidade (e sincroniza com o outro dispositivo).
const DEFAULT_STAT_TYPES = {
  "Futebol": ["Golos", "Assistências"],
  "Futsal": ["Golos", "Assistências"],
  "Hóquei Patins": ["Golos"],
  "Andebol": ["Golos"],
  "Voleibol": ["Pontos"],
  "Basquetebol": ["Pontos", "Ressaltos", "Assistências", "Desarmes", "Turnovers"]
};
let STAT_TYPES = { ...DEFAULT_STAT_TYPES };

// Perguntas-modelo de prognóstico, por modalidade — cada uma tem um tipo ("simnao"
// ou "livre") e um texto, que pode ter um espaço em branco {jogador} ou {numero}
// para se preencher ao escolher a pergunta para um jogo específico.
const DEFAULT_QUESTION_TEMPLATES = {
  "Futebol Feminino": [
    { type: "livre", text: "Match Predictor — qual vai ser o resultado?" },
    { type: "simnao", text: "Jogo sem sofrer golos?" },
    { type: "simnao", text: "Alguém bisa?" },
    { type: "simnao", text: "Temos hat-trick?" }
  ],
  "Futsal": [
    { type: "livre", text: "Match Predictor — qual vai ser o resultado?" },
    { type: "simnao", text: "Jogo sem sofrer golos?" },
    { type: "simnao", text: "Alguém bisa?" },
    { type: "simnao", text: "Temos hat-trick?" }
  ],
  "Equipa B": [
    { type: "livre", text: "Match Predictor — qual vai ser o resultado?" },
    { type: "simnao", text: "Jogo sem sofrer golos?" },
    { type: "simnao", text: "Alguém bisa?" },
    { type: "simnao", text: "Temos hat-trick?" }
  ],
  "Andebol": [
    { type: "simnao", text: "Superamos os 30 golos?" },
    { type: "livre", text: "Quem vai ser o melhor marcador do jogo?" },
    { type: "simnao", text: "Algum jogador chega aos 10 golos na partida?" },
    { type: "livre", text: "Quantos jogadores irão marcar 5 ou mais golos?" }
  ],
  "Basquetebol": [
    { type: "livre", text: "Quem vai ser o melhor pontuador da equipa?" },
    { type: "simnao", text: "Toca a campainha dos 100 pontos?" },
    { type: "simnao", text: "A equipa faz mais de 15 assistências?" },
    { type: "livre", text: "Quantos desarmes faz o {jogador} hoje?" }
  ],
  "Hóquei Patins": [
    { type: "livre", text: "Match Predictor — qual vai ser o resultado?" },
    { type: "livre", text: "Quantos golos faz a equipa no jogo?" },
    { type: "livre", text: "Quem vai ser o melhor marcador do jogo?" },
    { type: "simnao", text: "Alguém faz hat-trick?" }
  ],
  "Voleibol": [
    { type: "simnao", text: "Vitória sem perder sets?" },
    { type: "livre", text: "Match Predictor — quantos sets, e com que resultado?" },
    { type: "simnao", text: "A equipa sofre menos de {numero} pontos no jogo?" }
  ]
};
let QUESTION_TEMPLATES = JSON.parse(JSON.stringify(DEFAULT_QUESTION_TEMPLATES));

function getQuestionTemplatesFor(sport){
  return QUESTION_TEMPLATES[sport] || [];
}

async function saveQuestionTemplates(){
  try{
    await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setQuestionTemplates: QUESTION_TEMPLATES, adminPassword: getAdminPassword() })
    });
  }catch(e){ /* falha silenciosa — tenta-se de novo na próxima gravação */ }
}
// Começa com uma cópia local (rápida a carregar / funciona offline), mas quem manda
// a sério é o servidor — fetchAll() substitui isto assim que a resposta chegar, para
// ficar sincronizado entre os dois dispositivos.
let SPORT_LINKS = { ...DEFAULT_SPORT_LINKS };
let COMPETITION_OPTIONS = {}; // { modalidade: ["Campeonato Nacional", "Amigável", ...] } — deixa a "Competição" de cada jogo de ser texto livre
let VIEWER_AUTH = {}; // password -> nome, para quem só pode ver (sincronizado com o servidor) — já não é usado para bloquear, só ficou guardado de uma abordagem anterior
let ADMIN_AUTH = {}; // password -> nome, para poder EDITAR (protege o link normal, fora do "só ver")
                     // só é preenchido depois de login (ensureAdminAuthenticated) ou dentro do
                     // painel de gerir acessos (renderAccessManagePanel) — nunca vem do fetch geral
let HAS_ADMIN_AUTH = false; // só diz se existe ALGUMA password configurada (sim/não) — usado para
                            // decidir se vale a pena sequer pedir login; nunca tem a lista em si
let VISIT_LOG = []; // registo de acessos (só para consulta pela administração)
let FEEDBACK_LOG = []; // bugs/sugestões reportados (só para consulta pela administração)
let REACTIONS = {}; // reações rápidas (👏🔥😢) por prova — { compId: { eventId: { emoji: contagem } } } — vem numa linha reservada própria no Apps Script (v34), nunca mexe em EVENTS
let PREDICTIONS = {}; // prognósticos (Vitória/Empate/Derrota) por prova — { compId: { eventId: { opção: contagem } } } — linha reservada própria (v37), nunca mexe em EVENTS
let ANNOUNCEMENT = null; // aviso do admin no topo — { text, updatedAt } (v35)
let POLL = null; // sondagem rápida do admin — { question, options:[...], votes:{}, updatedAt } (v35)
let CURRENT_VIEWER_NAME = null; // nome de quem está autenticado como "só ver" (se aplicável)
try{
  const savedLinks = localStorage.getItem("dia22-sport-links");
  if(savedLinks) SPORT_LINKS = { ...DEFAULT_SPORT_LINKS, ...JSON.parse(savedLinks) };
}catch(e){}

function cacheSportLinksLocally(){
  try{ localStorage.setItem("dia22-sport-links", JSON.stringify(SPORT_LINKS)); }catch(e){}
}

async function saveSportLinks(){
  cacheSportLinksLocally(); // guarda já uma cópia local, mesmo que a rede falhe
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setSportLinks: SPORT_LINKS, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      alert("⚠️ Não foi possível sincronizar as ligações com o servidor (ficaram guardadas só aqui): " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede — as ligações ficaram guardadas só neste aparelho por agora: " + e.message);
  }
}

async function saveCompetitionOptions(){
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setCompetitionOptions: COMPETITION_OPTIONS, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      alert("⚠️ Não foi possível sincronizar as competições com o servidor (ficaram guardadas só aqui): " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede — as competições ficaram guardadas só neste aparelho por agora: " + e.message);
  }
}

// Se ainda não houver lista guardada para esta modalidade, arranca com os nomes
// que já foram escritos nos jogos existentes (para não perder o que já lá está)
function ensureCompetitionOptionsFor(sport){
  if(Array.isArray(COMPETITION_OPTIONS[sport]) && COMPETITION_OPTIONS[sport].length > 0) return COMPETITION_OPTIONS[sport];
  const found = new Set();
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(ev.sport === sport && ev.detail && ev.detail.trim()) found.add(ev.detail.trim());
    });
  });
  COMPETITION_OPTIONS[sport] = Array.from(found).sort();
  return COMPETITION_OPTIONS[sport];
}

// Ao usar-se um nome de estatística novo para uma modalidade, fica disponível para
// sempre nessa modalidade (e sincronizado com o outro dispositivo)
async function saveStatTypes(){
  try{
    await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setStatTypes: STAT_TYPES, adminPassword: getAdminPassword() })
    });
  }catch(e){ /* falha silenciosa — não é crítico, tenta-se de novo na próxima gravação */ }
}

function getStatTypesFor(sport){
  return STAT_TYPES[sport] || STAT_TYPES["_generico_"] || ["Golos"];
}

// Para modalidades onde só se costuma registar quem marcou, "Marcadores" é mais
// intuitivo do que "Estatísticas do jogo" (que soa a algo mais completo/técnico)
const MARCADORES_LABEL_SPORTS = new Set(["Futebol Feminino", "Futsal", "Equipa B"]);
// Voleibol não tem estatísticas de jogadoras, só a pontuação de cada set
const SET_SCORE_SPORTS = new Set(["Voleibol"]);
function playerStatsCardLabel(sport){
  if(SET_SCORE_SPORTS.has(sport)) return "🏐 Pontuação dos Sets";
  return MARCADORES_LABEL_SPORTS.has(sport) ? "⚽ Marcadores" : "📊 Estatísticas do jogo";
}

const MATCHES_EMBLEM = `
  <path d="M32 4 L54 13 V30 C54 46 44 56 32 60 C20 56 10 46 10 30 V13 Z"
     fill="#0b3d91" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M10 30 L32 21 L54 30" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.55"/>
  <circle cx="20" cy="23" r="4.3" fill="#ffffff"/>
  <path d="M17 23 L23 23 M20 20 L20 26" stroke="#0b3d91" stroke-width="1"/>
  <circle cx="44" cy="23" r="4.3" fill="#ffffff"/>
  <path d="M41.3 21 Q44 24 46.7 21 M41.3 25 Q44 22 46.7 25" stroke="#0b3d91" stroke-width="1" fill="none"/>
  <circle cx="16" cy="38" r="4.3" fill="#ffffff"/>
  <path d="M12.5 36.5 L19.5 39.5 M12.5 39.5 L19.5 36.5" stroke="#0b3d91" stroke-width="1"/>
  <circle cx="48" cy="38" r="4.3" fill="#ffffff"/>
  <path d="M45.5 35.5 Q48 38 45.5 40.5 M50.5 35.5 Q48 38 50.5 40.5" stroke="#0b3d91" stroke-width="1" fill="none"/>
  <circle cx="32" cy="47" r="4.8" fill="#ffffff"/>
  <polygon points="32,44 33.4,46.2 36,46.4 34,48 34.6,50.6 32,49.2 29.4,50.6 30,48 28,46.4 30.6,46.2"
     fill="#0b3d91"/>
`;

function applyCompTheme(id){
  const comp = ALL.competitions.find(c=>c.id===id);
  const svg = document.getElementById("emblemSvg");
  const img = document.getElementById("emblemImg");
  const subEl = document.querySelector(".brand-sub");
  const disclaimerEl = document.getElementById("brandDisclaimer");
  if(comp && comp.mode === "matches"){
    // Modo Modalidades tem sempre o mesmo emblema/cores próprias, não varia por posição
    document.documentElement.style.setProperty("--gold", "#4fb3e8"); // azul claro, legível como texto e como fundo (com --gold-text escuro por cima) — antes era um azul quase preto (#0b3d91), ilegível sobre o fundo dos painéis, que também é escuro
    document.documentElement.style.setProperty("--gold-dim", "#3a7fa8"); // versão mais discreta, mas ainda clara o suficiente para se ler (usado em botões, gráficos, links) — antes era quase invisível (#082a66)
    document.documentElement.style.setProperty("--gold-text", "#0a1a30"); // o fundo azul passou a ser claro, por isso o texto por cima tem de ser escuro (antes era branco, porque o fundo era escuro)
    document.documentElement.style.setProperty("--accent-bright", "#5ab0f5"); // destaque legível (ex: modalidade no "Próximo jogo")
    document.documentElement.style.setProperty("--label-muted", "#93a2bd"); // cabeçalhos de data, legíveis mas discretos
    if(svg) svg.style.display = "none";
    if(img) img.style.display = "block";
    if(subEl) subEl.textContent = "Jogos e resultados das modalidades do FC Porto";
    if(disclaimerEl) disclaimerEl.style.display = "block";
    return;
  }
  const idx = ALL.competitions.findIndex(c=>c.id===id);
  const safeIdx = idx>=0 ? idx : 0;
  const pal = COMP_PALETTES[safeIdx % COMP_PALETTES.length];
  document.documentElement.style.setProperty("--gold", pal.gold);
  document.documentElement.style.setProperty("--gold-dim", pal.dim);
  document.documentElement.style.setProperty("--gold-text", "#20140a"); // fundo claro/dourado volta a texto escuro
  document.documentElement.style.setProperty("--accent-bright", pal.gold);
  document.documentElement.style.setProperty("--label-muted", pal.dim);
  if(img) img.style.display = "none";
  if(svg){ svg.style.display = "block"; svg.innerHTML = EMBLEM_SHAPES[safeIdx % EMBLEM_SHAPES.length]; }
  if(subEl) subEl.textContent = "Acompanhamento de resultados e medalhas";
  if(disclaimerEl) disclaimerEl.style.display = "none";
}

async function switchToCompetition(id){
  // última linha de defesa: no modo "só ver", nunca deixa entrar numa competição
  // do Modo Medalhas, seja qual for o caminho que tentou lá chegar
  if(READONLY_MODE){
    const targetComp = ALL.competitions.find(c=>c.id===id);
    if(targetComp && (targetComp.mode||"medals") !== "matches"){
      id = firstActiveOrAny();
    }
  }
  activeCompId = id;
  loadActiveCompetition();
  sortEvents();
  applyCompTheme(id);
  weekOffset = 0;
  updateModeVisibleTabs();
  const days = getDaysPresent();
  activeDay = defaultDayFor(days);
  activeSport = "Todos";
  matchesViewFilter = "proximos";
  document.getElementById("dayNum").textContent = activeDay;
  document.getElementById("fDia").placeholder = "Dia (ex: " + activeDay + ")";
  renderCompetitionSelector();
  renderDayTabs();
  renderFilters();
  renderProgress();
  renderTimeline();
}

// No Modo Modalidades não fazem sentido os separadores de Medalhas/Estatísticas
// (não há medalhas nem passou/não em jogos) — escondem-se sozinhos
function updateModeVisibleTabs(){
  const matches = currentCompMode()==="matches";
  const isPinned = pinnedCompId === activeCompId;
  document.getElementById("pinCompBtn").classList.toggle("active", isPinned);
  document.getElementById("pinCompBtn").title = isPinned ? "Já é a competição fixa (toca para desmarcar)" : "Abrir sempre nesta competição";
  document.getElementById("viewMedalsBtn").style.display = matches ? "none" : "";
  document.getElementById("viewStatsBtn").style.display = matches ? "none" : "";
  document.getElementById("viewHistoryBtn").style.display = matches ? "" : "none";
  document.getElementById("viewLeaderboardBtn").style.display = matches ? "" : "none";
  document.getElementById("summaryBtn").textContent = matches ? "📋 Resumo da semana (falado)" : "📋 Resumo do dia (falado)";
  document.getElementById("sportLinksBtn").style.display = matches ? "" : "none";
  document.getElementById("gridToggleBtn").style.display = matches ? "" : "none";
  document.getElementById("predictionRankingBtn").style.display = matches ? "" : "none";
  document.getElementById("hideCompletedBtn").style.display = matches ? "none" : "";
  document.getElementById("matchesFilterTodosBtn").style.display = matches ? "" : "none";
  document.getElementById("matchesFilterProximosBtn").style.display = matches ? "" : "none";
  document.getElementById("matchesFilterResultadosBtn").style.display = matches ? "" : "none";
  document.querySelectorAll('[data-matches-filter]').forEach(b=>{
    b.classList.toggle('active', b.getAttribute('data-matches-filter') === matchesViewFilter);
  });
  document.getElementById("viewTodayAllBtn").textContent = matches ? "🌍 Esta semana" : "🌍 Hoje";
  const medalsVisible = document.getElementById("medalsView").style.display !== "none";
  const statsVisible = document.getElementById("statsView").style.display !== "none";
  const historyVisible = document.getElementById("historyView").style.display !== "none";
  const todayAllVisible = document.getElementById("todayAllView").style.display !== "none";
  if(matches && (medalsVisible || statsVisible)){
    setView("calendario");
  }
  if(!matches && historyVisible){
    setView("calendario");
  }
  if(todayAllVisible && !profileAthlete && !globalSearch){
    renderTodayAllView(); // atualiza logo, para não ficar com o texto/conteúdo do modo anterior
  }
}

function renderDayTabs(){
  const box = document.getElementById("dayTabs");
  box.innerHTML = "";
  const isMatches = currentCompMode()==="matches";
  const todayNum = new Date().getDate();
  const todayMonthKey = new Date().toISOString().slice(0,7);
  getDaysPresent().forEach(d=>{
    const b = document.createElement("button");
    b.className = "day-tab" + (d===activeDay ? " active":"");
    if(isMatches){
      b.innerHTML = monthLabel(d) + (d===todayMonthKey ? ' <span class="today-dot">Este mês</span>' : "");
    }else{
      b.innerHTML = "Dia " + d + (parseInt(d,10)===todayNum ? ' <span class="today-dot">Hoje</span>' : "");
    }
    b.onclick = ()=>{
      activeDay = d;
      activeSport = "Todos";
      gridSelectedDay = null;
      document.getElementById("dayNum").textContent = d;
      renderDayTabs();
      renderFilters();
      renderProgress();
      renderTimeline();
    };
    box.appendChild(b);
  });
}

function renderFilters(){
  const box = document.getElementById("filters");
  box.innerHTML = "";
  getSportsPresent().forEach(s=>{
    const b = document.createElement("button");
    b.className = "chip" + (s===activeSport ? " active":"");
    b.textContent = s;
    b.onclick = ()=>{
      activeSport = s;
      box.classList.remove("open"); // fecha o menu sanduíche no telemóvel ao escolher
      document.getElementById("filterToggleBtn").textContent = "☰ Modalidades";
      renderFilters();
      renderProgress();
      renderTimeline();
    };
    box.appendChild(b);
  });
}

function renderProgress(){
  const dayEvents = EVENTS.filter(belongsToActiveDay);
  const total = dayEvents.length;
  const marked = dayEvents.filter(isResolved).length;
  document.getElementById("progressFill").style.width = (total ? marked/total*100 : 0)+"%";
  const label = currentCompMode()==="matches" ? "com resultado" : "marcadas";
  document.getElementById("progressLabel").textContent = `${marked} / ${total} ${label}`;
  updateMedalBadge();
}

// Interpreta o resultado escrito (texto livre, ex: "2-1") como Vitória/Empate/Derrota,
// assumindo a convenção "casa - fora" e usando o campo Local de cada jogo para saber
// de que lado está o FC Porto.
function parseMatchResult(ev, resultado){
  if(!resultado) return null;
  const m = resultado.match(/(\d+)\s*[-–:]\s*(\d+)/);
  if(!m) return null;
  const a = parseInt(m[1],10), b = parseInt(m[2],10);
  const local = ev.local || "casa";
  const ours = local === "casa" ? a : b;
  const theirs = local === "casa" ? b : a;
  if(ours > theirs) return "win";
  if(ours < theirs) return "loss";
  return "draw";
}

// Se a pessoa escolheu manualmente Vitória/Empate/Derrota, é isso que vale — só se
// não tiver escolhido é que se tenta adivinhar a partir do texto do resultado.
function getMatchResultTag(ev, st){
  if(st && (st.resultTag === "win" || st.resultTag === "draw" || st.resultTag === "loss")) return st.resultTag;
  return parseMatchResult(ev, st && st.resultado);
}

// Para quem só vê o site (Modo Modalidades): em vez de mostrar a caixa de
// resultado e os botões Vitória/Empate/Derrota desativados (interface pensada
// para quem edita), mostra só o resultado em texto, já com destaque de cor.
// Sem resultado ainda, não mostra nada — o jogo aparece só como "por realizar".
function renderReadonlyMatchResultHtml_(ev, st){
  const tag = getMatchResultTag(ev, st);
  const resultText = (st.resultado && st.resultado.trim()) || '';
  if(!tag && !resultText) return '';
  const label = tag === 'win' ? '✅ Vitória' : tag === 'loss' ? '❌ Derrota' : tag === 'draw' ? '🟰 Empate' : '';
  const color = tag === 'win' ? 'var(--green)' : tag === 'loss' ? 'var(--red)' : 'var(--text-dim)';
  return `<div class="result-display" style="color:${color};">${[label, resultText].filter(Boolean).join(' · ')}</div>`;
}

