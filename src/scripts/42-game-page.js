// ===================== PÁGINA DO JOGO (v152) =====================
// Ao carregar em "Ver jogo" / "Ver detalhes" / na faixa "Ao vivo agora": uma página só daquele jogo,
// com o resultado em grande (ao vivo, com minutos ou pontos do set; ou final), os sets, a informação e as ações.
// Endereço partilhável: ?comp=<competição>&jogo=<id> (o parâmetro "jogo" já abria o cartão certo a partir das notificações).
let gameEvId_ = null, gamePrevView_ = null, gameSig_ = "";

function openGamePage_(evId){
  const ev = EVENTS.find(e=>e.id === evId);
  if(!ev){ return false; }
  if(!(window.__curView_ === "jogo" && gameEvId_ === evId)) navPush_();
  gameEvId_ = evId; gameSig_ = "";
  setView("jogo");
  window.scrollTo(0, 0);
  return true;
}

function gameLink_(ev){
  const url = new URL(location.href.split("?")[0].replace(/\/edicao\/?$/i, "/"));
  try{ if(typeof activeCompId !== "undefined" && activeCompId) url.searchParams.set("comp", activeCompId); }catch(e){}
  url.searchParams.set("jogo", ev.id);
  return url.toString();
}

function gameCountdown_(d){
  const ms = d - new Date();
  if(ms <= 0) return "";
  const min = Math.floor(ms / 60000), h = Math.floor(min / 60), dias = Math.floor(h / 24);
  if(dias >= 2) return "Daqui a " + dias + " dias";
  if(dias === 1) return "Amanhã";
  if(h >= 1) return "Começa dentro de " + h + " h " + String(min % 60).padStart(2, "0") + " min";
  return "Começa dentro de " + Math.max(1, min) + " min";
}

function crestSide_(ev, nome){
  try{ return (typeof crestOnly_ === "function") ? crestOnly_(ev, nome) : ""; }catch(e){ return ""; }
}

function renderGamePage_(){
  const host = document.getElementById("gameView");
  if(!host || host.style.display === "none") return;
  const ev = EVENTS.find(e=>e.id === gameEvId_);
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  if(!ev){
    host.innerHTML = `<div class="gp"><div class="gp-top"><button type="button" class="gp-back" id="gpBack">‹ Voltar</button></div><div class="hv-empty" style="padding:28px 8px;">Este jogo já não está disponível.</div></div>`;
    host.querySelector("#gpBack").onclick = ()=>navUiBack_();
    return;
  }
  const st = (typeof getEv === "function" && getEv(ev.id)) || {};
  const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
  const t = postTeams_(ev), fora = (typeof liveFora_ === "function") ? liveFora_(ev) : (ev.local === "fora");
  const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null;
  const liveData = !!(j && j.estado === "vivo");
  const resultado = (st.resultado && String(st.resultado).trim()) ? String(st.resultado).trim() : "";
  const fim = !liveData && !!resultado;
  const aDecorrer = !liveData && !fim && !isNaN(d) && d <= new Date() && (typeof isLiveNow_ === "function" && isLiveNow_(ev));
  const color = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#5BB4F0";
  const par = (a, b) => fora ? [b, a] : [a, b];

  // ---- resultado em grande
  let big = "", sub = "", pill = "", pillCls = "";
  if(liveData){
    pill = "AO VIVO"; pillCls = " is-live";
    if(j.golosFcp !== undefined){
      const g = par(j.golosFcp || 0, j.golosAdv || 0);
      big = `<span class="gp-n">${esc(g[0])}</span><span class="gp-sep">–</span><span class="gp-n">${esc(g[1])}</span>`;
      sub = [j.parte, j.tempo].filter(Boolean).join(" · ") || "A decorrer";
    }else{
      const s = par(j.setsFcp || 0, j.setsAdv || 0);
      big = `<span class="gp-n">${esc(s[0])}</span><span class="gp-sep">–</span><span class="gp-n">${esc(s[1])}</span>`;
      const sets = Array.isArray(j.sets) ? j.sets : [];
      if(sets.length){ const c = sets[sets.length - 1], p = par(c[0], c[1]); sub = sets.length + ".º set: " + p[0] + "-" + p[1]; }
      else sub = "A começar";
    }
  }else if(fim){
    pill = "Terminado";
    const tag = st.resultTag === "win" ? ["Vitória", "win"] : st.resultTag === "loss" ? ["Derrota", "loss"] : st.resultTag === "draw" ? ["Empate", "draw"] : null;
    big = `<span class="gp-final">${esc(resultado)}</span>`;
    sub = tag ? `<span class="gp-tag gp-tag-${tag[1]}">${tag[0]}</span>` : "";
  }else if(aDecorrer){
    pill = "A decorrer"; pillCls = " is-run";
    big = `<span class="gp-vs">vs</span>`;
    // v220: se devia haver ao vivo (começou há >20 min e não chegam dados), avisa em vez de parecer avariado
    const semAoVivo_ = (typeof hasLiveCoverage_ === "function") && hasLiveCoverage_(ev) && (Date.now() - d.getTime() > 20 * 60 * 1000);
    sub = semAoVivo_ ? "Ao vivo indisponível de momento — o resultado entra assim que for confirmado" : "Resultado em breve";
  }else{
    pill = gameCountdown_(d) || (isNaN(d) ? "" : "Agendado");
    big = `<span class="gp-time">${esc(ev.t || "--:--")}</span>`;
    sub = isNaN(d) ? "" : esc(homeLongDate_(d));
  }

  // ---- sets (voleibol): ao vivo [[fcp,adv],...] ou, no fim, os guardados à mão (ev.setScores)
  let setsHtml = "";
  if(liveData && Array.isArray(j.sets) && j.sets.length){
    setsHtml = j.sets.map((s, i)=>{ const p = par(s[0], s[1]); const emCurso = (i === j.sets.length - 1);
      return `<div class="gp-set${emCurso ? " is-cur" : ""}"><span>${i + 1}.º set${emCurso ? " · em curso" : ""}</span><b>${esc(p[0])} – ${esc(p[1])}</b></div>`; }).join("");
  }else if(Array.isArray(ev.setScores) && ev.setScores.some(x=>x && String(x).trim())){
    setsHtml = ev.setScores.map((s, i)=> (s && String(s).trim()) ? `<div class="gp-set"><span>${i + 1}.º set</span><b>${esc(String(s).trim().replace(/\s*[-–]\s*/, " – "))}</b></div>` : "").join("");
  }
  const setsBlock = setsHtml ? `<div class="gp-card"><h3>Sets</h3><div class="gp-sets">${setsHtml}</div></div>` : "";

  // ---- v159: jogo terminado → marcadores (estatística principal da modalidade), posição na classificação e reações
  let extraBlock = "";
  if(fim){
    let linhas = "";
    try{
      const main = (typeof getStatTypesFor === "function" ? getStatTypesFor(ev.sport) : ["Golos"])[0] || "Golos";
      const tot = {};
      const soGolos = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(ev.sport)); // Feminino/Futsal/Equipa B: cada linha é um golo
      (Array.isArray(ev.playerStats) ? ev.playerStats : []).forEach(p=>{
        if(!p || p.team === "adv" || !p.name || !String(p.name).trim()) return;
        const n = soGolos ? (Number(p.stats && p.stats.Golos) || 1) : (Number(p.stats && p.stats[main]) || 0);
        if(n > 0) tot[String(p.name).trim()] = (tot[String(p.name).trim()] || 0) + n;
      });
      const lista = Object.keys(tot).sort((a, b)=>tot[b] - tot[a]);
      if(lista.length) linhas += `<div class="gp-card"><h3>${main === "Golos" ? "Marcadores" : esc(main)}</h3><div class="gp-info">${lista.map(n=>`<div><i>${esc(n)}</i><b>${tot[n]}</b></div>`).join("")}</div></div>`;
      else if(!READONLY_MODE && !(typeof SET_SCORE_SPORTS !== "undefined" && SET_SCORE_SPORTS.has(ev.sport))){
        // v178: modo edição — jogo terminado sem marcadores/estatísticas: atalho para os escrever depois do jogo
        const golos = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(ev.sport));
        linhas += `<div class="gp-card"><h3>${golos ? "Marcadores" : "Estatísticas"}</h3><div class="gp-info"><div><i>Ainda sem ${golos ? "marcadores" : "estatísticas"} escritos neste jogo.</i></div></div><button type="button" class="hv-btn hv-btn-main gp-act" id="gpAddStats" style="width:100%;margin-top:8px;">${golos ? "⚽ Adicionar marcadores" : "📊 Adicionar estatísticas"}</button></div>`;
      }
    }catch(e){}
    // "Como foi": golos por minuto (FC Porto à esquerda, adversário à direita) a partir dos marcadores escritos à mão; só se houver minutos
    // e a cronologia automática (Sofascore) não existir — senão já aparece em "Cronologia". Sem dados, a secção não aparece.
    try{
      const temCron = !!(typeof DETALHES === "object" && DETALHES && DETALHES[ev.id] && Array.isArray(DETALHES[ev.id].inc) && DETALHES[ev.id].inc.length);
      const golos = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(ev.sport) && !temCron)
        ? (Array.isArray(ev.playerStats) ? ev.playerStats : []).filter(p=>p && p.minute != null && String(p.minute).trim() !== "").sort((x, y)=>(parseInt(x.minute, 10) || 0) - (parseInt(y.minute, 10) || 0)) : [];
      if(golos.length){
        linhas += `<div class="gp-card"><h3>Como foi</h3><div class="gp-como"><div class="gp-como-h"><span>FC Porto</span><span></span><span>${esc(homeOpp_(ev))}</span></div>${golos.map(g=>{
          const adv = g.team === "adv", nome = esc(String(g.name || "").trim());
          return `<div class="gp-como-r"><span class="gc-l">${adv ? "" : "Golo" + (nome ? " · " + nome : "")}</span><span class="gc-m">${esc(String(g.minute))}'</span><span class="gc-r">${adv ? "Golo" + (nome ? " · " + nome : "") : ""}</span></div>`;
        }).join("")}</div></div>`;
      }
    }catch(e){}
    linhas += (typeof miniStandingHtml_ === "function") ? miniStandingHtml_(ev) : "";
    if(typeof renderReactionBar === "function") linhas += `<div class="gp-card gp-react"><h3>O que achaste do jogo?</h3>${renderReactionBar(ev.id)}</div>`;
    extraBlock = linhas;
  }else if((liveData || aDecorrer) && typeof renderReactionBar === "function" && typeof REACTION_LIVE_ !== "undefined"){
    // v195: botões rápidos durante o jogo
    extraBlock = `<div class="gp-card gp-react gp-react-live"><h3>Como está a ser o jogo?</h3>${renderReactionBar(ev.id, REACTION_LIVE_)}</div>`;
  }

  // ---- informação
  const detail = [ev.detail, ev.phase].filter(Boolean).join(" · ");
  const place = [ev.venue, localLabel(ev.local)].filter(Boolean).join(" · ");
  const info = `<div class="gp-card"><h3>Informação</h3>
    <div class="gp-info">
      ${isNaN(d) ? "" : `<div><i>Data</i><b>${esc(homeLongDate_(d))}${ev.t ? " · " + esc(ev.t) : ""}</b></div>`}
      ${detail ? `<div><i>Competição</i><b>${esc(detail)}</b></div>` : ""}
      ${place ? `<div><i>Local</i><b>${esc(place)}</b></div>` : ""}
    </div></div>`;

  // ---- ações
  const futuro = !liveData && !fim && !aDecorrer && !isNaN(d) && d > new Date();
  const lembrete = (futuro && typeof hasGameReminder_ === "function")
    ? `<button type="button" class="hv-btn hv-btn-main gp-act${hasGameReminder_(ev.id) ? " is-on" : ""}" data-remind="${esc(ev.id)}">${hasGameReminder_(ev.id) ? "✓ Lembrete ativo" : "🔔 Lembrar-me"}</button>` : "";
  const classif = (typeof STANDINGS === "object" && STANDINGS && STANDINGS[ev.sport] && (STANDINGS[ev.sport].rows || []).length)
    ? `<button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpTable">🏆 Classificação</button>` : "";
  const acoes = `<div class="gp-actions">
    ${lembrete}
    ${ev.watchUrl ? `<a class="hv-btn hv-btn-main gp-act" href="${esc(ev.watchUrl)}" target="_blank" rel="noopener">📺 Ver transmissão</a>` : ""}
    ${(resultado && fim) ? "" : '<button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpShare">↗ Partilhar</button>'}
    ${(!resultado && !liveData) ? '<button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpIcs">📅 Adicionar ao calendário</button>' : ""}
    ${((resultado && fim) || READONLY_MODE) ? "" : `<button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpImg">🖼️ ${resultado ? "Imagem do resultado" : "Imagem para promover"}</button>
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpReel">🎬 ${resultado ? "Reel do resultado" : "Reel para promover"}</button>`}
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpStats">📊 Estatísticas</button>
    ${classif}
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpCal">${READONLY_MODE ? "Ver no calendário" : "Editar no calendário"}</button>
  </div>`;

  const partilhaCard = (resultado && fim) ? `<div class="gp-card gp-share"><h3>Partilha este resultado</h3><p class="gp-share-s">Mostra aos amigos adeptos como correu.</p><div class="gp-actions">
    <button type="button" class="hv-btn hv-btn-main gp-act" id="gpShare">↗ Partilhar</button>
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpImg">🖼️ Imagem do resultado</button>
    ${READONLY_MODE ? "" : '<button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpReel">🎬 Reel do resultado</button>'}</div></div>` : "";
  const sig = JSON.stringify([ev.id, pill, sub, big, setsHtml, ev.watchUrl, detail, place, (typeof hasGameReminder_ === "function") ? hasGameReminder_(ev.id) : 0, resultado, (typeof notifyCtaShow_ === "function" && notifyCtaShow_()), extraBlock.length, JSON.stringify((typeof REACTIONS === "object" && REACTIONS && REACTIONS[activeCompId] && REACTIONS[activeCompId][ev.id]) || null), JSON.stringify((typeof DETALHES === "object" && DETALHES && DETALHES[ev.id]) || null), (typeof crestId_ === "function" ? [crestId_(ev.sport, ev.athlete), crestId_(ev.sport, "FC Porto")].map(i=>i && crestCached_(i) ? 1 : 0).join("") : ""), JSON.stringify((typeof STANDINGS === "object" && STANDINGS && STANDINGS[ev.sport] && (STANDINGS[ev.sport].rows || []).find(r=>r.me)) || null)]);
  if(sig === gameSig_) return;
  gameSig_ = sig;

  const nomeA = esc(t.home), nomeB = esc(t.away);
  host.innerHTML = `<div class="gp" style="--sc:${color};">
    <div class="gp-top"><button type="button" class="gp-back" id="gpBack" aria-label="Voltar">‹ Voltar</button><span class="gp-sport">${esc(ev.sport)}</span></div>
    <div class="gp-hero${pillCls}">
      <div class="gp-pill-row"><span class="gp-pill">${liveData ? '<i class="hv-dot"></i>' : ""}${esc(pill)}</span></div>
      <div class="gp-teams${[t.home, t.away].some(n=>String(n).split(/\s+/).some(w=>w.length > 6)) ? " gp-teams-long" : ""}">
        <div class="gp-team">${crestSide_(ev, t.home)}${(typeof fcpNameHtml_ === "function") ? fcpNameHtml_(t.home) : nomeA}</div>
        <div class="gp-score">${big}</div>
        <div class="gp-team">${crestSide_(ev, t.away)}${(typeof fcpNameHtml_ === "function") ? fcpNameHtml_(t.away) : nomeB}</div>
      </div>
      ${sub ? `<div class="gp-sub">${sub}</div>` : ""}
    </div>
    ${partilhaCard}${setsBlock}${extraBlock}${(!fim && !liveData && !aDecorrer && typeof pregameHtml_ === "function") ? pregameHtml_(ev) : ""}${(typeof gameDetailsHtml_ === "function") ? gameDetailsHtml_(ev) : ""}${(typeof compStandingForGame_ === "function" && compStandingForGame_(ev)) ? standingsObjHtml_(compStandingForGame_(ev), { title: "Classificação do grupo", advName: ev.athlete, sport: ev.sport }) : ""}${(!fim && typeof notifyCtaHtml_ === "function") ? notifyCtaHtml_("jogo") : ""}${info}${acoes}
  </div>`;

  host.querySelector("#gpBack").onclick = ()=>navUiBack_();
  const icsBtn = host.querySelector("#gpIcs");
  if(icsBtn) icsBtn.onclick = ()=>addGameToCalendar_(ev);
  if(typeof pregameWire_ === "function") pregameWire_(host);
  const sh = host.querySelector("#gpShare");
  if(sh) sh.onclick = ()=>{ if(typeof track_ === "function") track_("partilhar_clique"); shareGameFan_(ev); };
  const cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
  const bImg = host.querySelector("#gpImg"), bReel = host.querySelector("#gpReel"), bSt = host.querySelector("#gpStats");
  if(bImg) bImg.onclick = ()=>generateShareCard(ev, (typeof getEv === "function" && getEv(ev.id)) || {}, cor);
  if(bReel) bReel.onclick = ()=>generateShareReel(ev, (typeof getEv === "function" && getEv(ev.id)) || {}, cor);
  if(bSt) bSt.onclick = ()=>{ try{ statsOpenedFromWeekView = false; }catch(e){} openPlayerStatsPanel(ev); };
  const bAdd = host.querySelector("#gpAddStats");
  if(bAdd) bAdd.onclick = ()=>{ try{ statsOpenedFromWeekView = false; }catch(e){} openPlayerStatsPanel(ev); };
  if(typeof bindNotifyCta_ === "function") bindNotifyCta_(host, ()=>{ gameSig_ = ""; renderGamePage_(); });
  const rb = host.querySelector(".gp-react");
  if(rb && typeof wireReactionBar === "function"){ try{ wireReactionBar(rb, ev.id); }catch(e){} }
  const cal = host.querySelector("#gpCal");
  if(cal) cal.onclick = ()=>goToEventCardCal_(ev.id);
  host.querySelectorAll("#gpTable, #gpTable2").forEach(tb=>{ tb.onclick = ()=>{ if(typeof openSportPage_ === "function") openSportPage_(ev.sport, "classificacao"); }; });
  host.querySelectorAll("[data-remind]").forEach(b=>{ b.onclick = async ()=>{ await toggleGameReminder_(b.getAttribute("data-remind"), b); gameSig_ = ""; renderGamePage_(); }; });
}

// mantém a página viva: resultado, minutos e contagem decrescente
setInterval(()=>{ try{ renderGamePage_(); }catch(e){} }, 5000);
