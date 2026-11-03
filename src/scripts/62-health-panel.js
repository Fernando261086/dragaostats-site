// ===================== PAINEL «🩺 SAÚDE» (v247, só modo edição) =====================
// Pede ao Apps Script (v157, ação getRelatorio, só admin) o relatório de saúde: último ciclo do ao vivo,
// fontes sem dados, erros recentes e uso anónimo. O botão «Copiar» serve para colar o texto numa conversa.
(function(){
  if(READONLY_MODE) return;
  const tog = document.getElementById("adminToolsToggle");
  if(!tog) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "healthBtn"; btn.className = "admin-tools-toggle share-hub-btn";
  btn.innerHTML = "🩺 Saúde";
  (document.getElementById("shareHubBtn") || tog).insertAdjacentElement("afterend", btn);
  btn.onclick = openHealthPanel_;
})();

function closeHealthPanel_(){ const el = document.getElementById("healthPanel"); if(el) el.remove(); document.body.classList.remove("share-hub-open"); }

async function openHealthPanel_(){
  if(document.getElementById("healthPanel")) return closeHealthPanel_();
  const el = document.createElement("div");
  el.id = "healthPanel"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Saúde do sistema">
    <div class="sh-top"><b>🩺 Saúde do sistema</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
    <pre class="hp-pre" id="hpText">A pedir o relatório…</pre>
    <div class="sh-btns"><button type="button" class="sh-b" id="hpCopy" disabled>📋 Copiar relatório</button><button type="button" class="sh-b" id="hpReload">🔄 Atualizar</button></div>
  </div>`;
  document.body.appendChild(el);
  document.body.classList.add("share-hub-open");
  el.querySelector(".sh-x").onclick = closeHealthPanel_;
  el.addEventListener("click", e=>{ if(e.target === el) closeHealthPanel_(); });
  const pre = el.querySelector("#hpText"), copy = el.querySelector("#hpCopy");
  async function load_(){
    pre.textContent = "A pedir o relatório…"; copy.disabled = true;
    try{
      const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ getRelatorio: true, adminPassword: getAdminPassword() }) });
      const j = await r.json();
      if(j && j.ok && j.texto){ pre.textContent = j.texto; copy.disabled = false; }
      else pre.textContent = "Sem resposta válida. É preciso o Apps Script v157 (ou mais recente) publicado e a password de admin certa.";
    }catch(e){ pre.textContent = "Não consegui falar com o Apps Script: " + e; }
  }
  copy.onclick = async ()=>{
    try{ await navigator.clipboard.writeText(pre.textContent); copy.textContent = "✅ Copiado"; }
    catch(e){ const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = "Seleciona e copia"; }
    setTimeout(()=>{ copy.textContent = "📋 Copiar relatório"; }, 2000);
  };
  el.querySelector("#hpReload").onclick = load_;
  load_();
}
