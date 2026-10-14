// ===================== RESUMO PESSOAL DE PROGNÓSTICOS =====================
// Só aparece se a modalidade "resultado exato" estiver mesmo a ser usada nesta
// competição — senão seria um banner sem sentido nenhum para quem nunca viu
// essa pergunta em jogo nenhum.
function renderPersonalPredictionBanner(matchesMode){
  const banner = document.getElementById("personalPredictionBanner");
  if(!matchesMode){ banner.style.display = "none"; return; }
  const usesPlacar = EVENTS.some(ev=> ev.predictionQuestion && (ev.predictionQuestion.type === "placar" || ev.predictionQuestion.type === "margem"));
  if(!usesPlacar){ banner.style.display = "none"; return; }

  const stats = buildPredictionStats();
  const myName = getCurrentPersonName();
  const myIndex = myName ? stats.findIndex(s=> s.name === myName) : -1;

  banner.style.display = "flex";
  banner.onclick = ()=>{
    const panel = document.getElementById("predictionRankingPanel");
    panel.style.display = "block";
    renderPredictionRankingPanel();
    panel.scrollIntoView({behavior:"smooth", block:"center"});
  };

  if(myIndex === -1){
    banner.innerHTML = `<div class="nmb-info">🎯 Ainda não fizeste nenhum prognóstico esta época — experimenta no próximo jogo!</div>`;
    return;
  }

  const me = stats[myIndex];
  const rank = myIndex + 1;
  const badges = badgesForStats(me);
  let positionLine;
  if(rank === 1){
    positionLine = `🥇 Estás em 1º lugar no ranking de prognósticos!`;
  }else{
    const above = stats[myIndex - 1];
    const pointsToNext = above.points - me.points;
    positionLine = `🔥 Estás em ${rank}º lugar no ranking de prognósticos${pointsToNext > 0 ? ` · faltam-te ${pointsToNext} ponto${pointsToNext===1?'':'s'} para o ${rank-1}º` : ' · empatado com quem está acima'}`;
  }
  banner.innerHTML = `
    <div class="nmb-info">
      ${positionLine}
      ${badges.length ? `<div style="margin-top:4px; font-size:12px; opacity:0.85;">${badges.join(' · ')}</div>` : ''}
    </div>
  `;
}

// Segunda-feira desta semana (00:00) até agora — a semana "em curso". Assim
// que passa a segunda seguinte, esta janela recomeça sozinha e o destaque
// muda naturalmente, sem precisar de nenhum estado guardado nem "fechar" nada
// manualmente.
function currentWeekRange(){
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = todayMidnight.getDay();
  const daysToMonday = (dow + 6) % 7;
  const monday = new Date(todayMidnight);
  monday.setDate(monday.getDate() - daysToMonday);
  return { start: monday, end: now };
}

function renderWeeklyTopPredictorBanner(matchesMode){
  const banner = document.getElementById("weeklyTopPredictorBanner");
  if(!banner) return;
  if(!matchesMode){ banner.style.display = "none"; return; }
  const usesRanking = EVENTS.some(ev=> ev.predictionQuestion && (ev.predictionQuestion.type === "placar" || ev.predictionQuestion.type === "margem"));
  if(!usesRanking){ banner.style.display = "none"; return; }

  const range = currentWeekRange();
  const weekStats = buildPredictionStats(range.start, range.end).filter(s=> s.points > 0);
  if(!weekStats.length){ banner.style.display = "none"; return; }

  const top = weekStats[0];
  const tied = weekStats.filter(s=> s.points === top.points);
  banner.style.display = "flex";
  banner.onclick = ()=>{
    const panel = document.getElementById("predictionRankingPanel");
    panel.style.display = "block";
    renderPredictionRankingPanel();
    panel.scrollIntoView({behavior:"smooth", block:"center"});
  };
  const nameText = tied.length > 1 ? tied.map(s=>s.name).join(" e ") : top.name;
  banner.innerHTML = `<div class="nmb-info">🌟 Melhor da semana no prognóstico: <b>${nameText}</b> (${top.points} pontos)</div>`;
}

