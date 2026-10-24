// ===================== PÁGINA DO JOGO (v152) =====================
// Ao carregar em "Ver jogo" / "Ver detalhes" / na faixa "Ao vivo agora": uma página só daquele jogo,
// com o resultado em grande (ao vivo, com minutos ou pontos do set; ou final), os sets, a informação e as ações.
// Endereço partilhável: ?comp=<competição>&jogo=<id> (o parâmetro "jogo" já abria o cartão certo a partir das notificações).
let gameEvId_ = null, gamePrevView_ = null, gameSig_ = "";

function openGamePage_(evId){
  const ev = EVENTS.find(e=>e.id === evId);
  if(!ev){ return false; }
  const cur = window.__curView_ || "inicio";
  if(cur !== "jogo") gamePrevView_ = cur;
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

function renderGamePage_(){
  const host = document.getElementById("gameView");
  if(!host || host.style.display === "none") return;
  const ev = EVENTS.find(e=>e.id === gameEvId_);
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  if(!ev){
    host.innerHTML = `<div class="gp"><div class="gp-top"><button type="button" class="gp-back" id="gpBack">‹ Voltar</button></div><div class="hv-empty" style="padding:28px 8px;">Este jogo já não está disponível.</div></div>`;
    host.querySelector("#gpBack").onclick = ()=>setView("inicio");
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
    sub = "Resultado em breve";
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
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpShare">↗ Partilhar</button>
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpImg">🖼️ ${resultado ? "Imagem do resultado" : "Imagem para promover"}</button>
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpReel">🎬 ${resultado ? "Reel do resultado" : "Reel para promover"}</button>
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpStats">📊 Estatísticas</button>
    ${classif}
    <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpCal">${READONLY_MODE ? "Ver no calendário" : "Editar no calendário"}</button>
  </div>`;

  const sig = JSON.stringify([ev.id, pill, sub, big, setsHtml, ev.watchUrl, detail, place, (typeof hasGameReminder_ === "function") ? hasGameReminder_(ev.id) : 0, resultado, (typeof notifyCtaShow_ === "function" && notifyCtaShow_())]);
  if(sig === gameSig_) return;
  gameSig_ = sig;

  const nomeA = esc(t.home), nomeB = esc(t.away);
  host.innerHTML = `<div class="gp" style="--sc:${color};">
    <div class="gp-top"><button type="button" class="gp-back" id="gpBack" aria-label="Voltar">‹ Voltar</button><span class="gp-sport">${esc(ev.sport)}</span></div>
    <div class="gp-hero${pillCls}">
      <div class="gp-pill-row"><span class="gp-pill">${liveData ? '<i class="hv-dot"></i>' : ""}${esc(pill)}</span></div>
      <div class="gp-teams">
        <div class="gp-team">${(typeof fcpNameHtml_ === "function") ? fcpNameHtml_(t.home) : nomeA}</div>
        <div class="gp-score">${big}</div>
        <div class="gp-team">${(typeof fcpNameHtml_ === "function") ? fcpNameHtml_(t.away) : nomeB}</div>
      </div>
      ${sub ? `<div class="gp-sub">${sub}</div>` : ""}
    </div>
    ${setsBlock}${(!fim && typeof notifyCtaHtml_ === "function") ? notifyCtaHtml_("jogo") : ""}${info}${acoes}
  </div>`;

  host.querySelector("#gpBack").onclick = ()=>{
    const v = gamePrevView_ && gamePrevView_ !== "jogo" ? gamePrevView_ : "inicio";
    setView(v); window.scrollTo(0, 0);
  };
  const sh = host.querySelector("#gpShare");
  if(sh) sh.onclick = async ()=>{
    const link = gameLink_(ev);
    const titulo = t.home + " vs " + t.away + " — " + ev.sport + (ev.t ? " (" + ev.t + ")" : "");
    if(navigator.share){ try{ await navigator.share({ title: titulo, url: link }); }catch(e){} }
    else if(navigator.clipboard){ try{ await navigator.clipboard.writeText(link); alert("Link copiado! Já podes colar e enviar:\n" + link); }catch(e){ prompt("Copia este link:", link); } }
    else prompt("Copia este link:", link);
  };
  const cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
  const bImg = host.querySelector("#gpImg"), bReel = host.querySelector("#gpReel"), bSt = host.querySelector("#gpStats");
  if(bImg) bImg.onclick = ()=>generateShareCard(ev, (typeof getEv === "function" && getEv(ev.id)) || {}, cor);
  if(bReel) bReel.onclick = ()=>generateShareReel(ev, (typeof getEv === "function" && getEv(ev.id)) || {}, cor);
  if(bSt) bSt.onclick = ()=>{ try{ statsOpenedFromWeekView = false; }catch(e){} openPlayerStatsPanel(ev); };
  if(typeof bindNotifyCta_ === "function") bindNotifyCta_(host, ()=>{ gameSig_ = ""; renderGamePage_(); });
  const cal = host.querySelector("#gpCal");
  if(cal) cal.onclick = ()=>goToEventCardCal_(ev.id);
  const tb = host.querySelector("#gpTable");
  if(tb) tb.onclick = ()=>{ if(typeof openSportPage_ === "function") openSportPage_(ev.sport, "classificacao"); };
  host.querySelectorAll("[data-remind]").forEach(b=>{ b.onclick = async ()=>{ await toggleGameReminder_(b.getAttribute("data-remind"), b); gameSig_ = ""; renderGamePage_(); }; });
}

// mantém a página viva: resultado, minutos e contagem decrescente
setInterval(()=>{ try{ renderGamePage_(); }catch(e){} }, 5000);
