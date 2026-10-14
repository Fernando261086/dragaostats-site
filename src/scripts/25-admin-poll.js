// ===================== ENQUETE RÁPIDA DO ADMIN (ambos os modos) =====================
let pollResultsExpanded = false; // se os resultados da sondagem estão abertos (não persiste ao fechar a app)

function renderPollWidget(){
  const wrap = document.getElementById("pollBanner");
  if(!POLL || !POLL.question){
    wrap.style.display = "none";
    return;
  }
  let votedOption = null;
  try{ votedOption = JSON.parse(localStorage.getItem("dia22-poll-vote-" + POLL.updatedAt) || "null"); }catch(e){}
  const votes = POLL.votes || {};
  const totalVotes = Object.values(votes).reduce((a,b)=>a+b, 0);
  const canVote = !votedOption && READONLY_MODE; // só quem só vê vota — quem edita nunca vota, só consulta

  if(canVote){
    const opts = POLL.options || [];
    // com muitas opções, uma parede de botões fica pesada e um pouco "obrigatória"
    // à vista — a partir de 7, passa a um menu de seleção, mais leve e compacto
    const useDropdown = opts.length > 6;
    if(useDropdown){
      wrap.innerHTML = `<div style="font-size:13px; font-weight:600; color:var(--text); margin-bottom:8px;">🗳️ ${POLL.question}</div>
        <div style="display:flex; gap:8px;">
          <select id="pollSelectInput" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:7px 9px; font-size:13px; color:var(--text);">
            <option value="" disabled selected style="background:#0d1b2e; color:#eef2f8;">Escolhe uma opção...</option>
            ${opts.map(opt=>`<option value="${opt.replace(/"/g,'&quot;')}" style="background:#0d1b2e; color:#eef2f8;">${opt}</option>`).join("")}
          </select>
          <button id="pollSelectVoteBtn" class="add-save" style="padding:7px 16px; white-space:nowrap;">Votar</button>
        </div>
        <input type="text" id="pollSelectOtherInput" maxlength="200" placeholder="Escreve a tua resposta..." style="display:none; width:100%; margin-top:8px; background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:7px 9px; font-size:13px; color:var(--text); box-sizing:border-box;">`;
      // quando escolhe "Outra" no menu, aparece a caixa de texto por baixo — o
      // mesmo botão "Votar" passa a exigir texto escrito, em vez de votar logo
      document.getElementById("pollSelectInput").onchange = (e)=>{
        document.getElementById("pollSelectOtherInput").style.display = (e.target.value.trim().toLowerCase() === "outra") ? "block" : "none";
      };
      document.getElementById("pollSelectVoteBtn").onclick = ()=>{
        const option = document.getElementById("pollSelectInput").value;
        if(!option) return; // ainda não escolheu nada — não força ninguém a votar
        if(option.trim().toLowerCase() === "outra"){
          const text = document.getElementById("pollSelectOtherInput").value.trim();
          if(!text) return; // escolheu "Outra" mas ainda não escreveu nada
          try{ localStorage.setItem("dia22-poll-vote-" + POLL.updatedAt, JSON.stringify("Outra")); }catch(e){}
          if(!POLL.votes) POLL.votes = {};
          POLL.votes["Outra"] = (POLL.votes["Outra"] || 0) + 1; // otimista
          if(!Array.isArray(POLL.otherAnswers)) POLL.otherAnswers = [];
          POLL.otherAnswers.push({ id: "local-" + Date.now(), text: text });
          renderPollWidget();
          fetch(STORE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ submitPollOther: { pollId: POLL.updatedAt, text: text } })
          }).catch(()=>{});
          return;
        }
        try{ localStorage.setItem("dia22-poll-vote-" + POLL.updatedAt, JSON.stringify(option)); }catch(e){}
        if(!POLL.votes) POLL.votes = {};
        POLL.votes[option] = (POLL.votes[option] || 0) + 1; // otimista
        renderPollWidget();
        fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ votePoll: { pollId: POLL.updatedAt, option: option } })
        }).catch(()=>{});
      };
      wrap.style.display = "block";
      return;
    }
    // "Outra" (escrita assim, tal e qual, por ti no admin) fica reservada: em vez
    // de um botão normal, mostra uma caixa de texto — quem vota escreve a própria
    // resposta, em vez de escolher uma já pronta
    const normalOpts = opts.filter(opt => opt.trim().toLowerCase() !== "outra");
    const hasOtherOpt = normalOpts.length !== opts.length;
    const buttons = normalOpts.map(opt=>`<button class="poll-vote-btn" data-option="${opt}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:7px 12px; font-size:13px; color:var(--text); cursor:pointer;">${opt}</button>`).join("");
    wrap.innerHTML = `<div style="font-size:13px; font-weight:600; color:var(--text); margin-bottom:8px;">🗳️ ${POLL.question}</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">${buttons}</div>
      ${hasOtherOpt ? `<div style="display:flex; gap:8px; margin-top:8px;">
        <input type="text" id="pollOtherInput" maxlength="200" placeholder="Outra resposta..." style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:7px 9px; font-size:13px; color:var(--text);">
        <button id="pollOtherBtn" class="add-save" style="padding:7px 16px; white-space:nowrap;">Enviar</button>
      </div>` : ''}`;
    wrap.querySelectorAll('.poll-vote-btn').forEach(btn=>{
      btn.onclick = ()=>{
        const option = btn.dataset.option;
        try{ localStorage.setItem("dia22-poll-vote-" + POLL.updatedAt, JSON.stringify(option)); }catch(e){}
        if(!POLL.votes) POLL.votes = {};
        POLL.votes[option] = (POLL.votes[option] || 0) + 1; // otimista
        renderPollWidget();
        fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ votePoll: { pollId: POLL.updatedAt, option: option } })
        }).catch(()=>{});
      };
    });
    if(hasOtherOpt){
      document.getElementById("pollOtherBtn").onclick = ()=>{
        const input = document.getElementById("pollOtherInput");
        const text = input.value.trim();
        if(!text) return; // não força ninguém a escrever nada
        try{ localStorage.setItem("dia22-poll-vote-" + POLL.updatedAt, JSON.stringify("Outra")); }catch(e){}
        if(!POLL.votes) POLL.votes = {};
        POLL.votes["Outra"] = (POLL.votes["Outra"] || 0) + 1; // otimista
        if(!Array.isArray(POLL.otherAnswers)) POLL.otherAnswers = [];
        POLL.otherAnswers.push({ id: "local-" + Date.now(), text: text }); // otimista, o id a sério vem do servidor
        renderPollWidget();
        fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ submitPollOther: { pollId: POLL.updatedAt, text: text } })
        }).catch(()=>{});
      };
    }
    wrap.style.display = "block";
    return;
  }

  // já votou, ou é o admin a consultar — resumo compacto + botão para abrir os resultados,
  // em vez de despejar logo a sondagem toda (pior ainda quando tem muitas opções)
  const summaryBits = [];
  if(votedOption) summaryBits.push(`✓ Respondeste: <b style="color:var(--text);">${votedOption}</b>`);
  summaryBits.push(`${totalVotes} voto${totalVotes===1?'':'s'} no total`);

  const detailsHtml = pollResultsExpanded ? (POLL.options || []).map(opt=>{
    const count = votes[opt] || 0;
    const pct = totalVotes > 0 ? Math.round((count/totalVotes)*100) : 0;
    const isMine = opt === votedOption;
    return `<div style="margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; font-size:12.5px; color:${isMine?'var(--gold)':'var(--text-dim)'}; margin-bottom:2px;">
        <span>${isMine?'✓ ':''}${opt}</span><span>${count} (${pct}%)</span>
      </div>
      <div style="background:rgba(255,255,255,0.06); border-radius:4px; height:6px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:${isMine?'var(--gold)':'var(--gold-dim)'};"></div>
      </div>
    </div>`;
  }).join("") : "";

  // respostas escritas na opção "Outra" — visíveis a todos quando os resultados
  // estão abertos; o 🗑️ só aparece em /edicao, para tirar as que não encaixarem
  const otherAnswers = Array.isArray(POLL.otherAnswers) ? POLL.otherAnswers : [];
  const otherAnswersHtml = (pollResultsExpanded && otherAnswers.length) ? `
    <div style="margin:4px 0 8px; padding-top:6px; border-top:1px dashed var(--line);">
      <div style="font-size:11px; color:var(--text-dim); margin-bottom:5px;">Respostas escritas em "Outra":</div>
      ${otherAnswers.map(a => `
        <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text); padding:3px 0;">
          <span style="flex:1;">💬 ${String(a.text).replace(/</g,'&lt;')}</span>
          ${!READONLY_MODE ? `<button class="poll-other-del" data-id="${a.id}" title="Apagar esta resposta" style="background:none; border:none; color:var(--red); cursor:pointer; font-size:13px; padding:2px 4px; flex-shrink:0;">🗑️</button>` : ''}
        </div>
      `).join("")}
    </div>` : "";

  wrap.innerHTML = `<div style="font-size:13px; font-weight:600; color:var(--text); margin-bottom:6px;">🗳️ ${POLL.question}</div>
    <div style="font-size:11.5px; color:var(--text-dim); margin-bottom:8px;">${summaryBits.join(" · ")}</div>
    ${detailsHtml}
    ${otherAnswersHtml}
    <button id="pollToggleResultsBtn" class="add-cancel" style="width:100%; padding:7px; font-size:12px;">${pollResultsExpanded ? "Esconder resultados ▴" : "📊 Ver resultados ▾"}</button>
  `;
  document.getElementById("pollToggleResultsBtn").onclick = ()=>{
    pollResultsExpanded = !pollResultsExpanded;
    renderPollWidget();
  };
  wrap.querySelectorAll(".poll-other-del").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      POLL.otherAnswers = (POLL.otherAnswers || []).filter(a => a.id !== id); // otimista
      renderPollWidget();
      fetch(STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ deletePollOther: { id: id }, adminPassword: getAdminPassword() })
      }).catch(()=>{});
    };
  });
  wrap.style.display = "block";
}

// Painel de administração para publicar/terminar a sondagem — só visível em /edicao
let pollOptionCount = 4; // quantos campos de opção mostrar — cresce com "+ Adicionar opção"
