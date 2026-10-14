// ===================== "FORMA RECENTE" (últimos resultados por modalidade) =====================
// Só faz sentido no Modo Modalidades — é sobre jogos ganhos/empatados/perdidos,
// não sobre medalhas. Reaproveita getMatchResultTag, já usado no resto do site.
const FORM_RECENT_COUNT = 5;
function getRecentForm_(sport, n){
  n = n || FORM_RECENT_COUNT;
  return EVENTS
    .filter(ev=>ev.sport===sport)
    .map(ev=>({ ev, tag: getMatchResultTag(ev, getEv(ev.id)) }))
    .filter(x=>x.tag) // só jogos que já têm resultado (escrito ou percetível no texto)
    .sort((a,b)=>((a.ev.day||"")+(a.ev.t||"")).localeCompare((b.ev.day||"")+(b.ev.t||"")))
    .slice(-n)
    .map(x=>x.tag);
}
function formDotsHtml_(tags){
  if(!tags.length) return '<span style="font-size:11.5px; color:var(--text-dim);">ainda sem jogos com resultado</span>';
  return '<span class="form-strip">' + tags.map(t=>{
    const color = t==="win" ? "var(--green)" : t==="loss" ? "var(--red)" : "var(--text-dim)";
    const letter = t==="win" ? "V" : t==="loss" ? "D" : "E";
    return `<span class="form-dot" style="background:${color};">${letter}</span>`;
  }).join('') + '</span>';
}
// Dentro do filtro de uma modalidade (ao lado do "medalBadge")
function renderFormBadge(){
  const el = document.getElementById("formBadge");
  if(currentCompMode()!=="matches" || activeSport==="Todos"){ el.style.display = "none"; return; }
  el.innerHTML = "Forma recente: " + formDotsHtml_(getRecentForm_(activeSport));
  el.style.display = "block";
}
// Lista geral, uma linha por modalidade, visível quando o filtro está em "Todos"
// Fechado por defeito — poupa espaço antes do primeiro jogo; uma seta abre-o,
// e fica aberto enquanto a pessoa estiver no site (fecha-se de novo só ao recarregar).
let formOverviewOpen = false;
function renderFormOverview(){
  const el = document.getElementById("formOverview");
  if(currentCompMode()!=="matches" || activeSport!=="Todos"){ el.style.display = "none"; return; }
  const sports = getSportsPresent().filter(s=>s!=="Todos");
  if(!sports.length){ el.style.display = "none"; return; }
  el.innerHTML = `<div class="form-overview-title${formOverviewOpen ? ' open' : ''}">Forma recente <span class="fo-arrow">▾</span></div>` +
    `<div class="form-overview-chips${formOverviewOpen ? '' : ' collapsed'}">` +
    sports.map(sport=>`
      <div class="form-overview-row" data-form-sport="${sport.replace(/"/g,'&quot;')}">
        <span class="fo-sport">${sport}</span>
        ${formDotsHtml_(getRecentForm_(sport))}
      </div>
    `).join('') + '</div>';
  el.style.display = "flex";
  el.querySelector('.form-overview-title').onclick = ()=>{
    formOverviewOpen = !formOverviewOpen;
    renderFormOverview();
  };
  el.querySelectorAll('[data-form-sport]').forEach(row=>{
    row.onclick = ()=>{
      activeSport = row.getAttribute('data-form-sport');
      renderFilters(); renderProgress(); renderTimeline();
    };
  });
}

function updateMedalBadge(){
  renderFormBadge();
  renderFormOverview();
  renderDailyFact_();
  renderTrophyShelf_();
  applyClassicoFlourish_();
  if(currentCompMode()==="matches"){
    if(activeSport === "Todos"){
      // misturar modalidades diferentes não diz grande coisa — só mostra quando se filtra uma
      document.getElementById("medalBadge").textContent = "";
      return;
    }
    let w=0, d=0, l=0;
    EVENTS.filter(ev=>ev.sport===activeSport).forEach(ev=>{
      const r = getMatchResultTag(ev, getEv(ev.id));
      if(r==="win") w++; else if(r==="draw") d++; else if(r==="loss") l++;
    });
    document.getElementById("medalBadge").textContent = `✅${w} 🟰${d} ❌${l}`;
    return;
  }
  let gold=0, silver=0, bronze=0;
  EVENTS.forEach(e=>{
    const m = getEv(e.id).medal;
    if(m==='gold') gold++;
    else if(m==='silver') silver++;
    else if(m==='bronze') bronze++;
  });
  document.getElementById("medalBadge").textContent = `🥇${gold} 🥈${silver} 🥉${bronze}`;
}

// Próximo jogo (a sério, olhando para TODOS os jogos desta competição, não só
// para o mês atualmente aberto), com contagem de dias em destaque.
// Jogos já terminados há mais de 1 dia e ainda sem resultado escrito — fácil de
// esquecer ao longo de uma época longa.
function renderPendingResultsBanner(matchesMode){
  const banner = document.getElementById("pendingResultsBanner");
  // Isto é um lembrete para quem edita escrever o resultado em falta — não
  // diz nada a quem só vê o site, e só lhe ocupava o lugar mais visível do
  // ecrã com um aviso vermelho sem sentido nenhum para essa pessoa.
  if(READONLY_MODE || !matchesMode){ banner.style.display = "none"; return; }

  const now = new Date();
  const pending = EVENTS.filter(ev=>{
    if(!ev.day) return false;
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d)) return false;
    const hoursSince = (now - d) / 3600000;
    const st = getEv(ev.id);
    return hoursSince >= 24 && !st.resultTag && !(st.resultado && st.resultado.trim());
  });

  if(pending.length === 0){ banner.style.display = "none"; return; }

  banner.style.display = "flex";
  banner.innerHTML = `
    <div class="nmb-info">🔔 <b>${pending.length}</b> jogo${pending.length===1?'':'s'} já terminado${pending.length===1?'':'s'} sem resultado escrito</div>
    <div class="nmb-countdown">Ver histórico →</div>
  `;
  banner.onclick = ()=> setView("historico");
}

// Sequência atual (últimos resultados seguidos do mesmo tipo) — dá um toque de
// emoção extra, tipo "4 jogos sem perder" ou "3 vitórias seguidas"
