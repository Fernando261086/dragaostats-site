// ===================== BARRA DE GESTÃO RECOLHIDA (só modo edição) =====================
// Os ~17 ícones de administração ficam atrás de um botão "Gestão", para o ecrã de edição
// ficar limpo como o resto do site. Os botões continuam exatamente os mesmos (só escondidos por CSS).
(function(){
  if(READONLY_MODE) return;
  const row = document.querySelector("header .comp-row");
  const sel = document.getElementById("compSelect");
  if(!row || !sel) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "adminToolsToggle"; btn.className = "admin-tools-toggle";
  let collapsed = true;
  try{ collapsed = localStorage.getItem("dia22-admintools") !== "open"; }catch(e){}
  function paint_(){
    row.classList.toggle("tools-collapsed", collapsed);
    const n = ["feedbackBadge", "todoPanelBadge"].reduce((a, id)=>{
      const el = document.getElementById(id);
      const v = el && el.style.display !== "none" ? parseInt(el.textContent, 10) : 0;
      return a + (isNaN(v) ? 0 : v);
    }, 0);
    btn.innerHTML = '🛠️ Gestão <span class="att-caret">' + (collapsed ? "▾" : "▴") + "</span>" + (n ? '<span class="att-dot">' + n + "</span>" : "");
    btn.setAttribute("aria-expanded", String(!collapsed));
  }
  btn.onclick = ()=>{ collapsed = !collapsed; try{ localStorage.setItem("dia22-admintools", collapsed ? "closed" : "open"); }catch(e){} paint_(); };
  sel.insertAdjacentElement("afterend", btn);
  paint_();
  setInterval(paint_, 3000); // atualiza o número de coisas por tratar (feedback, resultados em falta)
})();
