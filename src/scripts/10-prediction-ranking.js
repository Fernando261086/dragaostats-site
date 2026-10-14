// ===================== RANKING DE PROGNÓSTICOS (perguntas tipo "resultado exato") =====================
// Lê um texto tipo "3-1", "3 - 1" ou "3x1" e devolve os dois números — para não
// depender de as pessoas escreverem exatamente no mesmo formato.
function parseScorePair(str){
  const m = String(str||"").match(/(\d+)\D+(\d+)/);
  if(!m) return null;
  return [parseInt(m[1],10), parseInt(m[2],10)];
}

// 3 pontos = acertou o resultado exato; 1 ponto = acertou quem ganhava (ou o
// empate), mas não o resultado certo; 0 = errou por completo.
//
// O prognóstico é sempre guardado como "FCP - adversário" (é assim que aparece
// no formulário). O resultado escrito pelo admin segue a convenção "casa -
// fora" (a mesma do resto da app — ver parseMatchResult). Quando o FC Porto
// joga fora, estas duas ordens ficam trocadas: sem esta conversão, um
// prognóstico certo podia ser avaliado como errado. "local" vem de ev.local.
function computePlacarPoints(guessStr, actualStr, local){
  const g = parseScorePair(guessStr), a = parseScorePair(actualStr);
  if(!g || !a) return 0;
  const aOurs = local === "casa" ? a[0] : a[1];
  const aTheirs = local === "casa" ? a[1] : a[0];
  if(g[0]===aOurs && g[1]===aTheirs) return 3;
  const outcome = (ours, theirs)=> ours>theirs ? "W" : ours<theirs ? "L" : "D";
  return outcome(g[0],g[1]) === outcome(aOurs,aTheirs) ? 1 : 0;
}

// Percorre todos os jogos desta competição com pergunta "placar" e resultado já
// escrito, soma os pontos de cada pessoa, e devolve por ordem decrescente.
// Percorre os jogos por ordem cronológica e vai vendo, pessoa a pessoa, quantos
// acertos seguidos leva (qualquer pontuação > 0 conta como acerto) — um erro
// (0 pontos) zera o streak dessa pessoa. Só olha para quem participou nesse jogo.
// Um único cálculo que serve tanto o ranking (🏆) como o resumo pessoal (a
// seguir) e as conquistas — para nunca haver duas contas ligeiramente
// diferentes do mesmo streak/pontuação em sítios diferentes da app.
function buildPredictionStats(rangeStart, rangeEnd){
  const scored = EVENTS
    .filter(ev=>{
      const q = ev.predictionQuestion;
      if(!q || (q.type !== "placar" && q.type !== "margem")) return false;
      if(rangeStart || rangeEnd){
        const d = new Date(ev.day + "T" + (ev.t||"00:00") + ":00");
        if(isNaN(d)) return false;
        if(rangeStart && d < rangeStart) return false;
        if(rangeEnd && d >= rangeEnd) return false;
      }
      const st = getEv(ev.id);
      if(q.type === "placar") return !!(st.resultado && st.resultado.trim());
      return !!st.resultTag; // margem: o selo Vitória/Empate/Derrota é que manda
    })
    .map(ev=> ({ ev: ev, st: getEv(ev.id) }))
    .sort((a,b)=> new Date(a.ev.day+"T"+(a.ev.t||"00:00")) - new Date(b.ev.day+"T"+(b.ev.t||"00:00")));

  const stats = {}; // nome -> {points, totalPredictions, currentStreak, bestStreak}
  const ensure = (name)=> stats[name] || (stats[name] = {points:0, totalPredictions:0, currentStreak:0, bestStreak:0});

  scored.forEach(({ev, st})=>{
    const type = ev.predictionQuestion.type;
    const data = (PREDICTIONS[activeCompId] && PREDICTIONS[activeCompId][ev.id]) || {};
    const nameToGuess = {};
    Object.keys(data).forEach(guess=>{
      predictionNames(data[guess]).forEach(name=>{ nameToGuess[name] = guess; });
    });
    Object.keys(nameToGuess).forEach(name=>{
      const guess = nameToGuess[name];
      const pts = type === "placar"
        ? computePlacarPoints(guess, st.resultado, ev.local)
        : computeMargemPoints(guess, st.resultTag, st.resultado);
      const s = ensure(name);
      s.totalPredictions += 1;
      s.points += pts;
      if(pts > 0){
        s.currentStreak += 1;
        if(s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
      }else{
        s.currentStreak = 0;
      }
    });
  });

  return Object.entries(stats)
    .map(([name, s])=> Object.assign({name: name}, s))
    .sort((a,b)=> b.points - a.points);
}

// Conquistas simples, calculadas a partir das mesmas estatísticas — fixas
// (uma vez ganhas, não se perdem, mesmo que o streak atual quebre depois).
function badgesForStats(s){
  const badges = [];
  if(s.points > 0) badges.push("🎯 Primeira vitória");
  if(s.bestStreak >= 5) badges.push("🔥 5 seguidos");
  if(s.totalPredictions >= 10) badges.push("💯 10 prognósticos");
  return badges;
}

function renderPredictionRankingPanel(){
  const panel = document.getElementById("predictionRankingPanel");
  const stats = buildPredictionStats();
  const rowsHtml = stats.length
    ? stats.map((s,i)=>{
        const medal = i===0 ? "🥇" : i===1 ? "🥈" : i===2 ? "🥉" : "";
        const streakHtml = s.currentStreak >= 2 ? ` <span style="color:var(--accent-bright);">🔥${s.currentStreak}</span>` : "";
        const badges = badgesForStats(s);
        const badgesHtml = badges.length ? `<div style="font-size:10.5px; color:var(--text-dim); margin-top:2px;">${badges.join(' · ')}</div>` : "";
        return `<div style="padding:6px 0; border-bottom:1px solid var(--line);">
          <div style="display:flex; justify-content:space-between;">
            <span style="font-size:13px; color:var(--text);">${medal} ${s.name}${streakHtml}</span>
            <span style="font-size:13px; color:var(--gold-dim); font-weight:700;">${s.points} pts</span>
          </div>
          ${badgesHtml}
        </div>`;
      }).join("")
    : `<div class="medal-empty">Ainda sem jogos com pergunta de "resultado exato" e resultado escrito.</div>`;

  panel.innerHTML = `
    <div class="medal-section-title">🎯 Ranking de prognósticos</div>
    <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px;">"Resultado exato": 3 pontos por acertar em cheio, 1 por acertar só o vencedor. "Vencedor e margem": 2 pontos por acertar vencedor+margem, 1 só pelo vencedor. 🔥 = acertos seguidos.</div>
    ${rowsHtml}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-cancel" id="closePredictionRankingBtn">Fechar</button>
    </div>
  `;
  document.getElementById("closePredictionRankingBtn").onclick = ()=>{ panel.style.display = "none"; };
}
document.getElementById("predictionRankingBtn").onclick = ()=>{
  const panel = document.getElementById("predictionRankingPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderPredictionRankingPanel();
};

