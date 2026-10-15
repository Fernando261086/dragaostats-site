// ===================== QUIZ DO DRAGÃO — mini-quiz de curiosidades sobre o FC Porto
// nas várias modalidades. Reaproveita os mesmos factos já verificados usados no
// "Sabias que" (ver DAILY_FACTS_ em 06-daily-fact-and-light-question.js), só que
// em formato de pergunta. Só para diversão — sem pontuação guardada nem ranking,
// cada jogo é independente e nada é enviado ao servidor.
const QUIZ_QUESTIONS_ = [
  { q: "Em que ano o FC Porto foi campeão nacional de Andebol pela primeira vez?", opts: ["1938/39", "1945/46", "1955/56", "1926/27"], correct: 0 },
  { q: "No andebol de onze (extinto em 1974/75), quantos títulos venceu o FC Porto?", opts: ["28 em 40 edições", "20 em 40 edições", "28 em 50 edições", "15 em 40 edições"], correct: 0 },
  { q: "Em que ano nasceu a secção de Basquetebol do FC Porto?", opts: ["1926", "1938", "1955", "1947"], correct: 0 },
  { q: "Quantas vezes já venceu o FC Porto a Liga dos Campeões de Hóquei em Patins?", opts: ["4 vezes", "2 vezes", "6 vezes", "3 vezes"], correct: 0 },
  { q: "Em que ano nasceu a equipa de Voleibol feminino do FC Porto (com a Academia José Moreira)?", opts: ["2019", "2015", "2022", "2010"], correct: 0 },
  { q: "Quantos espectadores assistiram à apresentação da equipa sénior de Futebol Feminino, em 2024?", opts: ["31.093", "25.000", "18.500", "40.000"], correct: 0 },
  { q: "Quantos campeonatos nacionais de Andebol seguidos venceu o FC Porto entre 2008/09 e 2014/15?", opts: ["7 (heptacampeonato)", "5 (pentacampeonato)", "6 (hexacampeonato)", "4 (tetracampeonato)"], correct: 0 },
  { q: "De que ano é a secção de Hóquei em Patins do FC Porto?", opts: ["1955", "1926", "1938", "1965"], correct: 0 },
  { q: "Quantos títulos consecutivos de Hóquei em Patins venceu o FC Porto entre 2001/02 e 2010/11?", opts: ["10", "8", "12", "7"], correct: 0 },
  { q: "O título europeu de hóquei em patins de 2023 pôs fim a quantos anos de espera?", opts: ["33 anos", "25 anos", "40 anos", "20 anos"], correct: 0 },
  { q: "Em que época o FC Porto conquistou o seu 13º título de Basquetebol?", opts: ["2025/26", "2023/24", "2015/16", "2020/21"], correct: 0 },
  { q: "Como terminou o FC Porto o campeonato de Andebol na época 2020/21?", opts: ["100% vitorioso, sem perder um jogo", "Campeão com uma derrota", "Vice-campeão", "Campeão com dois empates"], correct: 0 }
];
const QUIZ_SIZE_ = 5;
let quizState_ = null; // { questions, index, score, answered }

function shuffle_(arr){
  const out = arr.slice();
  for(let i = out.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

function startQuiz_(){
  const chosen = shuffle_(QUIZ_QUESTIONS_).slice(0, Math.min(QUIZ_SIZE_, QUIZ_QUESTIONS_.length));
  // em cada pergunta, baralha também a ordem das opções (senão a correta estaria sempre na posição 0)
  const questions = chosen.map(q=>{
    const optsComIndice = q.opts.map((opt, i)=>({ opt, isCorrect: i === q.correct }));
    const baralhado = shuffle_(optsComIndice);
    return { q: q.q, opts: baralhado.map(o=>o.opt), correct: baralhado.findIndex(o=>o.isCorrect) };
  });
  quizState_ = { questions, index: 0, score: 0, answered: false };
  renderQuiz_();
}

function renderQuiz_(){
  const content = document.getElementById("quizContent");
  const overlay = document.getElementById("quizOverlay");
  if(!quizState_ || !content || !overlay) return;
  const { questions, index, score } = quizState_;

  if(index >= questions.length){
    const nota = score === questions.length ? "Pleno! 🏆" : score >= questions.length/2 ? "Nada mau! 👏" : "Da próxima sai melhor 💪";
    content.innerHTML = `
      <div class="medal-section-title">🧠 Fim do quiz!</div>
      <p style="font-size:15px; color:var(--text); margin:14px 0;">Acertaste <b style="color:var(--gold);">${score}</b> de <b>${questions.length}</b>. ${nota}</p>
      <button class="add-save" id="quizPlayAgainBtn" style="width:100%;">🔁 Jogar outra vez</button>
    `;
    overlay.style.display = "flex";
    document.getElementById("quizPlayAgainBtn").onclick = startQuiz_;
    return;
  }

  const q = questions[index];
  content.innerHTML = `
    <div style="font-size:11px; color:var(--text-dim); margin-bottom:8px;">Pergunta ${index+1} de ${questions.length} · Acertaste ${score}</div>
    <div class="medal-section-title" style="margin-bottom:14px; line-height:1.4;">${q.q}</div>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${q.opts.map((opt,i)=>`<button type="button" class="add-cancel" data-quiz-opt="${i}" style="text-align:left; width:100%; margin:0;">${opt}</button>`).join("")}
    </div>
  `;
  overlay.style.display = "flex";

  content.querySelectorAll('[data-quiz-opt]').forEach(btn=>{
    btn.onclick = ()=>{
      if(quizState_.answered) return;
      quizState_.answered = true;
      const chosenIdx = parseInt(btn.getAttribute('data-quiz-opt'),10);
      const acertou = chosenIdx === q.correct;
      if(acertou) quizState_.score++;
      content.querySelectorAll('[data-quiz-opt]').forEach(b=>{
        const i = parseInt(b.getAttribute('data-quiz-opt'),10);
        b.disabled = true;
        if(i === q.correct) b.style.cssText += "background:rgba(93,186,113,0.22); border-color:var(--green); color:var(--text);";
        else if(i === chosenIdx) b.style.cssText += "background:rgba(211,86,74,0.22); border-color:var(--red); color:var(--text);";
      });
      setTimeout(()=>{
        quizState_.index++;
        quizState_.answered = false;
        renderQuiz_();
      }, 1100);
    };
  });
}

document.getElementById("quizBtn").onclick = ()=>{
  document.getElementById("moreOptionsPanel").style.display = "none";
  startQuiz_();
};
document.getElementById("quizCloseBtn").onclick = ()=>{
  document.getElementById("quizOverlay").style.display = "none";
  quizState_ = null;
};
