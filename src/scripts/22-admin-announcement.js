// ===================== ANÚNCIO DO ADMIN (topo da app, ambos os modos) =====================
function renderAnnouncementBanner(){
  const banner = document.getElementById("announcementBanner");
  const textEl = document.getElementById("announcementText");
  if(!ANNOUNCEMENT || !ANNOUNCEMENT.text || !ANNOUNCEMENT.text.trim()){
    banner.style.display = "none";
    return;
  }
  let dismissed = null;
  try{ dismissed = localStorage.getItem("dia22-announcement-dismissed"); }catch(e){}
  if(dismissed === ANNOUNCEMENT.updatedAt){
    banner.style.display = "none";
    return;
  }
  textEl.textContent = "📢 " + ANNOUNCEMENT.text;
  banner.style.display = "flex";
}
document.getElementById("announcementDismiss").onclick = ()=>{
  document.getElementById("announcementBanner").style.display = "none";
  try{ if(ANNOUNCEMENT) localStorage.setItem("dia22-announcement-dismissed", ANNOUNCEMENT.updatedAt); }catch(e){}
};

// Painel de administração para publicar/remover o anúncio — só visível em /edicao
function renderAnnouncementAdminPanel(){
  const panel = document.getElementById("announcementPanel");
  const currentText = (ANNOUNCEMENT && ANNOUNCEMENT.text) ? ANNOUNCEMENT.text : "";
  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">Aparece como um aviso discreto no topo da app, para todos (viewers e admin). Fica visível até alguém carregar "Ok", ou até publicares um novo.</div>
    <textarea id="announcementInput" rows="2" placeholder="Ex: Sábado há jogo importante às 15h!" style="width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text); resize:vertical;">${currentText}</textarea>
    <div class="add-btn-row" style="margin-top:10px;">
      <button class="add-save" id="announcementPublishBtn">Publicar</button>
      ${currentText ? `<button class="del-btn" id="announcementClearBtn" style="padding:8px 14px;">Remover aviso</button>` : ''}
      <button class="add-cancel" id="closeAnnouncementBtn">Fechar</button>
    </div>
  `;
  document.getElementById("announcementPublishBtn").onclick = async ()=>{
    const text = document.getElementById("announcementInput").value.trim();
    if(!text) return;
    await setAnnouncementRemote({ text: text, updatedAt: new Date().toISOString() });
  };
  const clearBtn = document.getElementById("announcementClearBtn");
  if(clearBtn) clearBtn.onclick = async ()=>{
    if(!confirm("Remover o aviso atual?")) return;
    await setAnnouncementRemote(null);
  };
  document.getElementById("closeAnnouncementBtn").onclick = ()=>{ panel.style.display = "none"; };
}
async function setAnnouncementRemote(value){
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setAnnouncement: value, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(result && result.ok === true){
      ANNOUNCEMENT = value;
      renderAnnouncementBanner();
      renderAnnouncementAdminPanel();
    }else{
      alert("⚠️ Não foi possível gravar: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede: " + e.message);
  }
}
document.getElementById("announcementBtn").onclick = ()=>{
  const panel = document.getElementById("announcementPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderAnnouncementAdminPanel();
};

