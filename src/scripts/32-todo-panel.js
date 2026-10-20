// ===================== "O QUE FALTA FAZER" (painel único, só para quem edita) =====================
// Junta num só sítio o que antes estava espalhado por botões diferentes: jogos já
// passados sem resultado escrito (em TODAS as competições em Modo Modalidades,
// tal como o separador "Esta semana" já olha para todas) e feedback/reportes
// ainda sem resposta. Não pede nada novo ao servidor — usa dados já carregados.

// Filtro compatível com renderCrossCompetitionList (já usado em "Esta semana"):
// um jogo conta como "por escrever" quando já passou a hora marcada e ainda não
// tem resultado escrito, só em competições públicas (Modo Modalidades).
function isPendingResultFilter_(ev, compId){
  const comp = ALL.competitions.find(c=>c.id===compId);
  if(!comp || (comp.mode||"medals") !== "matches") return false;
  if(!ev.day || !ev.t) return false;
  const evDate = new Date(ev.day + "T" + ev.t + ":00");
  if(isNaN(evDate) || evDate >= new Date()) return false;
  const compData = ALL.data[compId] || {};
  const st = (compData.status && compData.status[ev.id]) || {};
  return !(st.resultado && String(st.resultado).trim());
}

function countPendingResults_(){
  let count = 0;
  ALL.competitions.filter(c=>!c.archived).forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{ if(isPendingResultFilter_(ev, c.id)) count++; });
  });
  return count;
}

function countFeedbackWithoutReply_(){
  return FEEDBACK_LOG.filter(e=>!e.reply).length;
}

// Chamado a cada ciclo de renderização (tal como o resto da barra lateral) —
// mantém o número da bolinha sempre atual, sem pedir nada novo ao servidor.
function renderTodoPanelBadge_(){
  const btn = document.getElementById("todoPanelBtn");
  const badge = document.getElementById("todoPanelBadge");
  if(!btn || !badge) return;
  if(READONLY_MODE){ btn.style.display = "none"; return; }
  const total = countPendingResults_() + countFeedbackWithoutReply_();
  if(total > 0){
    badge.textContent = total > 9 ? "9+" : String(total);
    badge.style.display = "inline-block";
  }else{
    badge.style.display = "none";
  }
}

function renderTodoFeedbackList_(){
  const el = document.getElementById("todoFeedbackList");
  if(!el) return;
  const pending = FEEDBACK_LOG.filter(e=>!e.reply).sort((a,b)=> (b.t||"").localeCompare(a.t||""));
  if(!pending.length){
    el.innerHTML = `<div class="medal-empty">Sem feedback por responder — tudo em dia! 🎉</div>`;
    return;
  }
  el.innerHTML = pending.map(e=>{
    const typeLabel = e.type === "sugestao" ? "💡 Sugestão" : "🐛 Bug";
    const when = e.t ? new Date(e.t).toLocaleString("pt-PT") : "";
    const msg = String(e.message || "").slice(0, 160);
    return `<div class="compact-line" style="cursor:pointer;" data-fb-t="${e.t}">
      <div class="cl-row1">
        <span class="c-sport">${typeLabel}</span>
        <span class="c-athlete">${e.name || "Anónimo"}</span>
      </div>
      <div class="cl-row2">
        <span class="c-detail">${msg}</span>
        <span class="c-phase">${when}</span>
      </div>
    </div>`;
  }).join("");
  // tocar num reporte leva diretamente ao painel de feedback (onde já existe toda
  // a lógica de responder) — não duplica esse formulário aqui, só aponta para lá
  el.querySelectorAll("[data-fb-t]").forEach(row=>{
    row.onclick = ()=>{
      document.getElementById("todoPanel").style.display = "none";
      document.getElementById("feedbackAdminBtn").click();
    };
  });
}

function renderTodoPanel_(){
  const resultsEl = document.getElementById("todoPendingResultsList");
  if(resultsEl){
    renderCrossCompetitionList(resultsEl, isPendingResultFilter_, "Sem resultados por escrever — tudo em dia! 🎉");
  }
  renderTodoFeedbackList_();
}

document.getElementById("todoPanelBtn").onclick = ()=>{
  const panel = document.getElementById("todoPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening){
    panel.innerHTML = `
      <div class="medal-section-title">🗓️ Resultados por escrever</div>
      <div id="todoPendingResultsList"></div>
      <div class="medal-section-title" style="margin-top:14px;">💬 Feedback por responder</div>
      <div id="todoFeedbackList"></div>
      <div class="add-btn-row" style="margin-top:14px;">
        <button class="add-cancel" id="closeTodoPanelBtn">Fechar</button>
      </div>
    `;
    renderTodoPanel_();
    document.getElementById("closeTodoPanelBtn").onclick = ()=>{ panel.style.display = "none"; };
  }
};
