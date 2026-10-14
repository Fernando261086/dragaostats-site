// ===================== NOTIFICAÇÃO ESPONTÂNEA (avisa toda a gente, na hora) =====================
// Diferente do anúncio (📢, que fica visível no topo até alguém fechar) — isto
// dispara logo uma notificação a sério (push), como as automáticas, mas com o
// texto que o admin quiser. Ex: "Hoje há jogo de Andebol às 20h!"
function renderPushNowPanel(){
  const panel = document.getElementById("pushNowPanel");
  const isMatches = currentCompMode() === "matches";
  const now = new Date();
  const nearbyEvents = isMatches ? EVENTS.filter(ev=>{
    if(!ev.day) return false;
    const d = new Date(ev.day + "T" + (ev.t||"00:00") + ":00");
    if(isNaN(d)) return false;
    const diffDays = (d - now) / 86400000;
    return diffDays >= -4 && diffDays <= 4;
  }).sort((a,b)=> new Date(a.day+"T"+(a.t||"00:00")) - new Date(b.day+"T"+(b.t||"00:00"))) : [];
  const eventOptionsHtml = nearbyEvents.map(ev=>
    `<option value="${ev.id}">${formatShortDate(ev.day)} · ${ev.sport} · vs ${ev.athlete}</option>`
  ).join("");

  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">Envia uma notificação a sério a quem tiver os avisos ligados (chega mesmo com a app fechada).</div>
    <div class="add-btn-row" style="margin-bottom:10px;">
      <button class="chip active" id="pushModeNowBtn" style="cursor:pointer;">Enviar agora</button>
      <button class="chip" id="pushModeLaterBtn" style="cursor:pointer;">Agendar para depois</button>
    </div>
    <input id="pushNowTitle" type="text" placeholder="Título (ex: 🏐 Jogo hoje!)" maxlength="100" style="width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); margin-bottom:8px;">
    <textarea id="pushNowBody" rows="2" placeholder="Ex: Hoje há jogo de Andebol às 20h!" maxlength="500" style="width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical;"></textarea>
    ${isMatches ? `<select id="pushNowEventSelect" class="gate-input" style="width:100%; margin-top:8px;">
      <option value="">Sem jogo associado (abre só a página inicial)</option>
      ${eventOptionsHtml}
    </select>
    <div style="font-size:11px; color:var(--text-dim); opacity:0.75; margin-top:3px;">Se escolheres um jogo, quem carregar na notificação vai parar direto ao cartão desse jogo (só mostra jogos de ±4 dias desta competição).</div>` : ''}
    <input id="pushScheduleAt" type="datetime-local" style="display:none; width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); margin-top:8px;">
    <div class="add-btn-row" style="margin-top:10px;">
      <button class="add-save" id="pushNowSendBtn">Enviar agora</button>
      <button class="add-cancel" id="closePushNowBtn">Fechar</button>
    </div>
    <div id="scheduledPushList" style="margin-top:16px; border-top:1px solid var(--line); padding-top:12px;"></div>
    <div style="margin-top:12px; border-top:1px solid var(--line); padding-top:12px;">
      <button class="add-cancel" id="toggleSentHistoryBtn" style="font-size:11.5px; padding:5px 10px;">📜 Ver histórico de notificações enviadas</button>
      <div id="sentPushHistoryList" style="display:none; margin-top:10px;"></div>
    </div>
  `;

  let scheduleMode = false; // false = enviar já, true = agendar para uma hora
  const setMode = (later)=>{
    scheduleMode = later;
    document.getElementById("pushModeNowBtn").classList.toggle("active", !later);
    document.getElementById("pushModeLaterBtn").classList.toggle("active", later);
    document.getElementById("pushScheduleAt").style.display = later ? "" : "none";
    document.getElementById("pushNowSendBtn").textContent = later ? "Agendar" : "Enviar agora";
  };
  document.getElementById("pushModeNowBtn").onclick = ()=> setMode(false);
  document.getElementById("pushModeLaterBtn").onclick = ()=> setMode(true);

  document.getElementById("pushNowSendBtn").onclick = async ()=>{
    const title = document.getElementById("pushNowTitle").value.trim() || "Dragão Stats";
    const body = document.getElementById("pushNowBody").value.trim();
    if(!body) return;
    const btn = document.getElementById("pushNowSendBtn");
    const evSelect = document.getElementById("pushNowEventSelect");
    const evId = evSelect ? evSelect.value : "";
    const evLabel = (evSelect && evId) ? evSelect.options[evSelect.selectedIndex].textContent : "";

    if(scheduleMode){
      const whenLocal = document.getElementById("pushScheduleAt").value; // ex: "2026-09-20T20:00"
      if(!whenLocal){ alert("Escolhe a data e hora."); return; }
      const sendAtDate = new Date(whenLocal);
      if(isNaN(sendAtDate) || sendAtDate <= new Date()){ alert("Escolhe uma data/hora no futuro."); return; }
      btn.disabled = true; btn.textContent = "A agendar...";
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ scheduleCustomPush: { title: title, body: body, sendAt: sendAtDate.toISOString(), evId: evId || null, compId: evId ? activeCompId : null, evLabel: evId ? evLabel : null }, adminPassword: getAdminPassword() })
        });
        const result = await r.json().catch(()=>null);
        if(result && result.ok === true){
          document.getElementById("pushNowTitle").value = "";
          document.getElementById("pushNowBody").value = "";
          document.getElementById("pushScheduleAt").value = "";
          loadScheduledPushList();
        }else{
          alert("⚠️ Não foi possível agendar: " + (result && result.error ? result.error : "erro desconhecido"));
        }
      }catch(e){
        alert("⚠️ Erro de rede: " + e.message);
      }
      btn.disabled = false; btn.textContent = "Agendar";
      return;
    }

    if(!confirm("Enviar já esta notificação a toda a gente com avisos ligados?")) return;
    btn.disabled = true; btn.textContent = "A enviar...";
    try{
      const r = await fetch(STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sendCustomPush: { title: title, body: body, evId: evId || null, compId: evId ? activeCompId : null }, adminPassword: getAdminPassword() })
      });
      const result = await r.json().catch(()=>null);
      if(result && result.ok === true){
        document.getElementById("pushNowPanel").style.display = "none";
      }else{
        alert("⚠️ Não foi possível enviar: " + (result && result.error ? result.error : "erro desconhecido"));
      }
    }catch(e){
      alert("⚠️ Erro de rede: " + e.message);
    }
    btn.disabled = false; btn.textContent = "Enviar agora";
  };
  document.getElementById("closePushNowBtn").onclick = ()=>{ panel.style.display = "none"; };
  document.getElementById("toggleSentHistoryBtn").onclick = ()=>{
    const box = document.getElementById("sentPushHistoryList");
    const opening = box.style.display === "none";
    box.style.display = opening ? "block" : "none";
    if(opening) loadSentPushHistory();
  };

  loadScheduledPushList();
}

async function loadSentPushHistory(){
  const box = document.getElementById("sentPushHistoryList");
  if(!box) return;
  box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">A ir buscar o histórico...</div>`;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getSentPushHistory: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Não foi possível ir buscar o histórico.</div>`;
      return;
    }
    const history = (result.history || []).slice().reverse(); // mais recente primeiro
    if(!history.length){
      box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">Ainda não foi enviada nenhuma notificação.</div>`;
      return;
    }
    box.innerHTML = history.map(h=>{
      const d = new Date(h.sentAt);
      const when = isNaN(d) ? h.sentAt : d.toLocaleString("pt-PT");
      return `<div style="padding:6px 0; border-bottom:1px solid var(--line);">
        <div style="font-size:12.5px; color:var(--text); font-weight:600;">${h.title}</div>
        <div style="font-size:11.5px; color:var(--text-dim);">${h.body}</div>
        <div style="font-size:11px; color:var(--gold-dim); margin-top:2px;">🕒 ${when}</div>
      </div>`;
    }).join("");
  }catch(e){
    box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Erro de rede ao ir buscar o histórico.</div>`;
  }
}

async function loadScheduledPushList(){
  const list = document.getElementById("scheduledPushList");
  if(!list) return;
  list.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">A ver agendamentos...</div>`;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getScheduledPush: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      list.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Não foi possível ir buscar os agendamentos.</div>`;
      return;
    }
    const scheduled = (result.scheduled || []).slice().sort((a,b)=> new Date(a.sendAt) - new Date(b.sendAt));
    if(!scheduled.length){
      list.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">Sem notificações agendadas.</div>`;
      return;
    }
    list.innerHTML = `<div style="font-size:12px; color:var(--text-dim); margin-bottom:8px;">Agendadas (${scheduled.length}):</div>` +
      scheduled.map(s=>{
        const d = new Date(s.sendAt);
        const when = isNaN(d) ? s.sendAt : d.toLocaleString("pt-PT");
        return `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--line);">
          <div style="min-width:0;">
            <div style="font-size:12.5px; color:var(--text); font-weight:600;">${s.title}</div>
            <div style="font-size:11.5px; color:var(--text-dim);">${s.body}</div>
            <div style="font-size:11px; color:var(--gold-dim); margin-top:2px;">🕒 ${when}</div>
            ${s.evLabel ? `<div style="font-size:11px; color:var(--accent-bright); margin-top:2px;">🔗 ${s.evLabel}</div>` : ''}
          </div>
          <button class="add-cancel cancel-scheduled-push-btn" data-id="${s.id}" style="flex-shrink:0; padding:4px 10px; font-size:11.5px;">Cancelar</button>
        </div>`;
      }).join("");
    list.querySelectorAll(".cancel-scheduled-push-btn").forEach(btn=>{
      btn.onclick = async ()=>{
        if(!confirm("Cancelar esta notificação agendada?")) return;
        btn.disabled = true; btn.textContent = "...";
        try{
          const r = await fetch(STORE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ cancelScheduledPush: { id: btn.dataset.id }, adminPassword: getAdminPassword() })
          });
          const result = await r.json().catch(()=>null);
          if(result && result.ok === true) loadScheduledPushList();
          else alert("⚠️ Não foi possível cancelar.");
        }catch(e){
          alert("⚠️ Erro de rede: " + e.message);
        }
      };
    });
  }catch(e){
    list.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Erro de rede ao ir buscar os agendamentos.</div>`;
  }
}

document.getElementById("pushNowBtn").onclick = ()=>{
  const panel = document.getElementById("pushNowPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderPushNowPanel();
};

