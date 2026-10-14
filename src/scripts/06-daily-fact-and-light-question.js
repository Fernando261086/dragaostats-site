// ===================== FACTO DO DIA (2) — só em dias sem jogo nenhum =====================
// Só factos já confirmados por pesquisa (não datas exatas de aniversário, que não
// temos verificadas) — roda um por dia, de forma previsível, consoante o dia do ano.
const DAILY_FACTS_ = [
  "O FC Porto foi o primeiro campeão nacional de sempre de Andebol, em 1938/39 — jogava-se então a onze, não a sete.",
  "No andebol de onze (extinto em 1974/75), o FC Porto venceu 28 títulos em 40 edições do campeonato.",
  "A secção de Basquetebol do FC Porto nasceu em 1926, por iniciativa de apenas três jogadores.",
  "O FC Porto já venceu a Liga dos Campeões de Hóquei em Patins 4 vezes — a mais recente em 2026, ao bater o Barcelona por 3-1, em Coimbra.",
  "A equipa de Voleibol feminino do FC Porto só nasceu em 2019, em parceria com a Academia José Moreira — e já leva 5 títulos nacionais.",
  "A equipa sénior de Futebol Feminino do FC Porto só foi criada em 2024. No jogo de apresentação, venceu o União de Leiria por 9-0, com 31.093 espectadores no Estádio do Dragão — recorde nacional de assistência no futebol feminino.",
  "Entre 2008/09 e 2014/15, o FC Porto venceu sete campeonatos nacionais de Andebol seguidos — o heptacampeonato, recorde nacional de títulos consecutivos.",
  "A secção de Hóquei em Patins do FC Porto remonta a 1955.",
  "O FC Porto detém o recorde nacional de hóquei em patins com 10 títulos de campeão consecutivos, entre 2001/02 e 2010/11.",
  "O título europeu de hóquei em patins conquistado em 2023 pôs fim a uma espera de 33 anos desde a conquista anterior.",
  "Em 1951/52 e 1952/53, o FC Porto venceu dois campeonatos nacionais de Basquetebol seguidos, depois de já ter sido campeão da 2ª divisão em 1947/48 e 1949/50.",
  "Em 2015/16, o FC Porto bateu o Benfica na final e conquistou o seu 12º título da Liga Portuguesa de Basquetebol.",
  "Na época 2025/26, o FC Porto venceu o Benfica por 3-1 na final do playoff e somou o seu 13º título de campeão em Basquetebol.",
  "Em 2026, o FC Porto lançou a primeira equipa sénior masculina de Futsal da sua história, a competir na 3ª Divisão Nacional.",
  "Na época 2020/21, o FC Porto sagrou-se campeão nacional de Andebol com um registo 100% vitorioso, sem perder um único jogo.",
  "A secção masculina de Voleibol do FC Porto já foi 9 vezes campeã nacional, entre 1968/69 e 1987/88, além de 6 Taças de Portugal.",
  "Em 2025/26, o FC Porto bateu o Sporting de Braga por 3-1 na final do playoff e tirou ao Benfica o título nacional de Voleibol feminino.",
  "Antes de competir sob o nome FC Porto, a equipa de Voleibol feminino já tinha sido 3 vezes campeã nacional como AJM/FC Porto, em parceria com a Academia José Moreira."
];
function renderDailyFact_(){
  const el = document.getElementById("dailyFactBox");
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  if(getTodaysGames_().length > 0){ el.style.display = "none"; return; } // só em dias mortos
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const fact = DAILY_FACTS_[dayOfYear % DAILY_FACTS_.length];
  el.classList.add("daily-fact-box");
  el.innerHTML = `<span class="dfb-badge">💡 Sabias que</span><div class="dfb-text">${fact}</div>`;
  el.style.display = "flex";
}

// ===================== PERGUNTA LEVE DO DIA (6) — só para rir, sem pontos nem ranking,
// e sem nada guardado no servidor; só local, no telemóvel de quem responde =====
const LIGHT_QUESTIONS_ = [
  { q: "O que vai decidir o jogo de hoje?", opts: ["Defesa", "Ataque", "Sorte", "O árbitro 😅"] },
  { q: "Como vai ser o resultado?", opts: ["Sofrido", "Tranquilo", "Emocionante", "Imprevisível"] },
  { q: "O que é mais provável acontecer hoje?", opts: ["Golo/ponto logo no início", "Reviravolta", "Jogo equilibrado", "Goleada"] }
];
const LIGHT_REACTIONS_ = ["Boa escolha! 👍", "Interessante... vamos ver! 👀", "Gostei dessa! 😄", "Também podia ser! 🤔"];
function renderLightQuestion_(){
  const el = document.getElementById("lightQuestionBox");
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  if(getTodaysUpcomingGames_().length === 0){ el.style.display = "none"; return; } // só em dias de jogo
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const picked = LIGHT_QUESTIONS_[dayOfYear % LIGHT_QUESTIONS_.length];
  const today = todayISO_();
  let answered = null;
  try{ const saved = JSON.parse(localStorage.getItem("dia22-light-answer") || "null"); if(saved && saved.day === today) answered = saved.opt; }catch(e){}
  el.innerHTML = `<div class="form-overview-title" style="cursor:default;">🎲 ${picked.q}</div>` +
    `<div class="form-overview-chips">` +
    picked.opts.map(o=>`<button type="button" class="form-overview-row" data-light-opt="${o.replace(/"/g,'&quot;')}" style="border:none; font-family:inherit;${answered===o ? ' background:rgba(227,178,60,0.18); border:1px solid var(--gold-dim);' : ''}">${o}</button>`).join('') +
    '</div>' +
    (answered ? `<div style="font-size:11.5px; color:var(--gold); margin-top:4px;">${LIGHT_REACTIONS_[dayOfYear % LIGHT_REACTIONS_.length]}</div>` : '');
  el.style.display = "flex";
  if(!answered){
    el.querySelectorAll('[data-light-opt]').forEach(btn=>{
      btn.onclick = ()=>{
        try{ localStorage.setItem("dia22-light-answer", JSON.stringify({ day: today, opt: btn.getAttribute("data-light-opt") })); }catch(e){}
        renderLightQuestion_();
      };
    });
  }
}

// ===================== HUMOR DO DRAGÃO (5) — um pequeno selo sobre o emblema =====
// Não temos ilustrações novas do dragão, por isso é só um emoji pequeno no canto,
// não o desenho em si. Consoante o último resultado jogado.
function renderDragonMood_(){
  const badge = document.getElementById("dragonMoodBadge");
  if(!badge) return;
  if(currentCompMode() !== "matches"){ badge.style.display = "none"; return; }
  const last = findLastPlayedResult_();
  let emoji, label;
  if(!last){ emoji = "😴"; label = "Ainda sem jogos jogados"; }
  else if(last.tag === "win"){ emoji = "😄"; label = "Última: vitória!"; }
  else if(last.tag === "loss"){ emoji = "😤"; label = "Última: derrota"; }
  else{ emoji = "😐"; label = "Última: empate"; }
  badge.textContent = emoji;
  badge.title = label;
  badge.style.display = "block";
}

