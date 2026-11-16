// ===================== CONVITE PARA ATIVAR AS NOTIFICAÇÕES (v155) =====================
// Cartão no Início e na página do jogo, para quem só vê e ainda não tem os avisos ligados.
// Só promete o que existe: o resultado final (quando é publicado) e o lembrete 1 hora antes ("Lembrar-me").
// "Agora não" esconde o cartão 5 dias (não insiste em cada visita). Sem permissão pedida sozinha: só ao tocar.
function notifyCtaVariant_(){
  try{
    if(!READONLY_MODE || notificationsEnabled) return null;
    if("Notification" in window){ return Notification.permission === "default" ? "enable" : null; }
    if(typeof isIOSDevice === "function" && isIOSDevice() && !(typeof isStandaloneMode === "function" && isStandaloneMode())) return "ios";
  }catch(e){}
  return null;
}
function notifyCtaHidden_(){
  try{ const u = localStorage.getItem("dia22-notify-cta-until"); return !!(u && todayISO_() < u); }catch(e){ return false; }
}
function notifyCtaShow_(){ return !!notifyCtaVariant_() && !notifyCtaHidden_(); }
// v278: o «Agora não» é um só para todos os convites (cartão, aviso «Novo: ao vivo», barra de momento).
function notifyCtaSnooze_(dias){
  try{ localStorage.setItem("dia22-notify-cta-until", shiftISODay_(todayISO_(), dias || 5)); }catch(e){}
}
// v278: permissão recusada no browser → explica como voltar a ligar (antes: um alert() seco).
function notifyBlockedSheet_(){
  if(document.getElementById("nbSheet")) return;
  const el = document.createElement("div");
  el.id = "nbSheet"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Avisos bloqueados">
    <div class="sh-top"><b>Os avisos estão bloqueados</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
    <p class="ios-p">Este browser tem os avisos do Dragão Stats bloqueados. Para os ligar: toca no <b>cadeado</b> (ou nos três pontos) junto ao endereço, abre <b>Definições do site</b> ou <b>Permissões</b>, escolhe <b>Notificações</b> e põe <b>Permitir</b>. Depois volta cá e toca em «Ativar avisos».</p>
    <button type="button" class="hv-btn hv-btn-main nb-ok">Percebi</button>
  </div>`;
  document.body.appendChild(el);
  const close = ()=>el.remove();
  el.querySelector(".sh-x").onclick = close; el.querySelector(".nb-ok").onclick = close;
  el.addEventListener("click", e=>{ if(e.target === el) close(); });
}
let ncSeen_ = false;
// v306: próximo jogo marcado com hora e sem resultado, nos próximos 14 dias (só esses têm «aviso 1 hora antes»).
function ncNextGame_(){
  try{
    if(typeof EVENTS === "undefined") return null;
    const now = new Date(), lim = now.getTime() + 14 * 86400000;
    const hoje = (typeof todayISO_ === "function") ? todayISO_() : "";
    const amanha = (typeof shiftISODay_ === "function" && hoje) ? shiftISODay_(hoje, 1) : "";
    let best = null;
    EVENTS.forEach(ev=>{
      if(!ev || !ev.sport || !ev.day || !/^\d{1,2}:\d{2}$/.test(String(ev.t || ""))) return;
      const d = new Date(ev.day + "T" + String(ev.t).padStart(5, "0") + ":00");
      if(isNaN(d) || d <= now || d.getTime() > lim) return;
      const st = (typeof getEv === "function" && getEv(ev.id)) || {};
      if(st.resultado && String(st.resultado).trim()) return;
      if(typeof hasGameReminder_ === "function" && hasGameReminder_(ev.id)) return;
      if(!best || d < best.d) best = { ev, d };
    });
    if(!best) return null;
    const dias = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
    const dia = best.ev.day === hoje ? "hoje" : best.ev.day === amanha ? "amanhã" : dias[best.d.getDay()] + ", " + best.d.getDate() + "/" + (best.d.getMonth() + 1);
    best.quando = dia + " às " + String(best.ev.t).padStart(5, "0");
    return best;
  }catch(e){ return null; }
}
// v248: o texto muda com o momento (início, jogo ao vivo, antes do jogo, jogo terminado, link partilhado) e diz o que se recebe.
// state (só na página do jogo): "vivo" | "antes" | "fim"
function notifyCtaHtml_(ctx, state){
  if(!notifyCtaShow_()) return "";
  // v278: no Início, se o aviso «Novo: ao vivo» já traz o botão «Ativar avisos», não se repete o convite
  if(ctx === "inicio" && typeof liveIntroOffersNotify_ === "function" && liveIntroOffersNotify_()) return "";
  const ios = notifyCtaVariant_() === "ios";
  let titulo = "Não percas nenhum resultado";
  let txt = "Recebe um aviso quando o jogo começa, os golos das equipas de futebol e o resultado final.";
  if(ctx === "jogo"){
    if(state === "vivo"){ titulo = "Segue este jogo no telemóvel"; txt = "Recebe o resultado final e, nas equipas de futebol, os golos — mesmo com o site fechado."; }
    else if(state === "fim"){ titulo = "Queres saber o resultado do próximo jogo?"; txt = "Ativa os avisos e recebes quando o FC Porto começar a jogar e o resultado final."; }
    else { titulo = window.__linkedGame_ ? "Recebe o resultado deste jogo" : "Não percas este jogo"; txt = "Avisamos-te quando começar e quando houver resultado — mesmo com o site fechado."; }
  }
  // v306: no Início o convite fala do PRÓXIMO jogo (com hora) e o botão «Avisa-me» liga logo o «Lembrar-me» desse jogo.
  // Na semana anterior o cartão genérico teve 23 vistas e 0 toques, enquanto o «Lembrar-me» (pedido concreto) teve 3 toques e 3 permissões.
  let btn = `<button type="button" class="hv-btn hv-btn-main nc-yes" data-ncyes="1">${ios ? "Como instalar" : "Ativar avisos"}</button>`;
  if(ctx === "inicio"){
    const ng = ncNextGame_();
    if(ng){
      const es = typeof homeEsc_ === "function" ? homeEsc_ : (x=>String(x));
      const a = es(ng.ev.athlete || ""), fcp = "FC Porto";
      const nome = ng.ev.local === "fora" ? `${a} vs ${fcp}` : `${fcp} vs ${a}`;
      titulo = "Avisamos-te 1 hora antes do próximo jogo";
      txt = `${es(typeof sportShow_ === "function" ? sportShow_(ng.ev.sport) : ng.ev.sport)}: ${nome} · ${ng.quando}. Recebes o aviso mesmo com o site fechado, e o resultado final.`;
      if(!ios) btn = `<button type="button" class="hv-btn hv-btn-main nc-yes" data-ncremind="${es(ng.ev.id)}">Avisa-me</button>`;
    }
  }
  if(!ncSeen_){ ncSeen_ = true; try{ if(typeof track_ === "function") track_("nc_visto"); }catch(e){} }
  return `<div class="nc-card"><span class="nc-ico">🔔</span><div class="nc-body"><b class="nc-t">${titulo}</b><span class="nc-s">${txt}</span></div>
    <div class="nc-btns">${btn}<button type="button" class="nc-no" data-ncno="1" aria-label="Agora não">Agora não</button></div></div>`;
}
// iPhone/iPad: os avisos só funcionam com o site instalado no ecrã principal; explica-o num painel com 3 passos desenhados.
// v261: se o site está aberto dentro do Instagram/Facebook (que não deixam instalar), avisa para abrir primeiro no Safari e dá «Copiar link».
function iosEmApp_(){ try{ return /FBAN|FBAV|FB_IAB|Instagram|TikTok|Line\/|MicroMessenger|Snapchat/i.test(navigator.userAgent || ""); }catch(e){ return false; } }
function iosInstallSheet_(){
  if(document.getElementById("iosSheet")) return;
  const emApp = iosEmApp_();
  if(emApp){ try{ if(typeof track_ === "function") track_("nc_ios_safari"); }catch(e){} }
  const I = d => `<svg class="ios-ic" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const passos = [
    [I('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1"/>'), "Toca em <b>Partilhar</b>", "O quadrado com a seta para cima, na barra do Safari (em baixo, ou em cima no iPad)."],
    [I('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>'), "Escolhe <b>«Adicionar ao ecrã principal»</b>", "Desliza a lista para cima se não a vires. Toca em «Adicionar»."],
    [I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'), "Abre pelo <b>novo ícone</b> e toca em «Ativar avisos»", "Tem de ser a partir do ícone no ecrã, não pelo Safari."]
  ];
  const el = document.createElement("div");
  el.id = "iosSheet"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Instalar no iPhone">
    <div class="sh-top"><b>Avisos no iPhone</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
    ${emApp ? `<div class="ios-warn"><b>Primeiro, abre no Safari.</b> Estás a ver o site dentro de outra app (Instagram, Facebook…), e essas não deixam instalar. <button type="button" class="hv-btn hv-btn-main ios-copy">Copiar o link</button><span class="ios-copied" hidden>Link copiado — cola-o no Safari.</span></div>` : ""}
    <p class="ios-p">No iPhone os avisos só funcionam com o Dragão Stats instalado no ecrã principal. São 3 passos e demora meio minuto:</p>
    <div class="ios-steps">${passos.map((p, i)=>`<div class="ios-step"><span class="ios-n">${i + 1}</span>${p[0]}<div><b class="ios-t">${p[1]}</b><span class="ios-s">${p[2]}</span></div></div>`).join("")}</div>
  </div>`;
  document.body.appendChild(el);
  const close = ()=>el.remove();
  el.querySelector(".sh-x").onclick = close;
  el.addEventListener("click", e=>{ if(e.target === el) close(); });
  const cp = el.querySelector(".ios-copy");
  if(cp) cp.onclick = async ()=>{
    const url = "https://dragaostats.pt";
    try{ await navigator.clipboard.writeText(url); }catch(e){ try{ prompt("Copia o link e abre-o no Safari:", url); }catch(x){} }
    const ok = el.querySelector(".ios-copied"); if(ok) ok.hidden = false;
  };
}
// v261: convite no momento certo — um aviso curto em baixo, uma vez por sessão, quando o adepto abre um jogo que o FC Porto ganhou ou que está a decorrer.
// Respeita o «Agora não» (5 dias) e só aparece a quem ainda pode ligar os avisos.
function notifyMoment_(kind){
  try{
    if(!notifyCtaShow_() || document.getElementById("ncMoment")) return;
    try{ if(sessionStorage.getItem("dia22-nm")) return; }catch(e){}
    const ios = notifyCtaVariant_() === "ios";
    const txt = kind === "vivo" ? "Segue este jogo no telemóvel, mesmo com o site fechado." : "Vitória do FC Porto! Queres que te avisemos do próximo jogo?";
    setTimeout(()=>{
      if(!notifyCtaShow_() || document.getElementById("ncMoment")) return;
      // se o cartão de convite da própria página já está à vista, não repete o aviso
      const cartao = document.querySelector("#gameView .nc-card");
      if(cartao){ const r = cartao.getBoundingClientRect(); if(r.top < window.innerHeight - 90 && r.bottom > 0) return; }
      try{ sessionStorage.setItem("dia22-nm", "1"); }catch(e){}
      const el = document.createElement("div");
      el.id = "ncMoment"; el.className = "nc-moment"; el.setAttribute("role", "status");
      el.innerHTML = `<span class="nm-t">${txt}</span><button type="button" class="hv-btn hv-btn-main nm-yes">${ios ? "Como instalar" : "Ativar avisos"}</button><button type="button" class="nm-no" aria-label="Fechar">✕</button>`;
      document.body.appendChild(el);
      try{ if(typeof track_ === "function") track_("nc_momento"); }catch(e){}
      el.querySelector(".nm-no").onclick = ()=>{ el.remove(); try{ localStorage.setItem("dia22-notify-cta-until", shiftISODay_(todayISO_(), 5)); }catch(e){} };
      el.querySelector(".nm-yes").onclick = async ()=>{
        el.remove();
        if(ios){ try{ track_("nc_ios_ajuda"); }catch(e){} iosInstallSheet_(); return; }
        try{ track_("nc_momento_sim"); }catch(e){}
        try{ await enableNotifications(); }catch(e){}
        try{ if(typeof renderGamePage_ === "function"){ gameSig_ = ""; renderGamePage_(); } }catch(e){}
      };
      setTimeout(()=>{ const x = document.getElementById("ncMoment"); if(x) x.remove(); }, 20000);
    }, 1600);
  }catch(e){}
}
function bindNotifyCta_(host, rerender){
  host.querySelectorAll("[data-ncyes]").forEach(b=>{ b.onclick = async ()=>{
    if(notifyCtaVariant_() === "ios"){ try{ track_("nc_ios_ajuda"); }catch(e){} iosInstallSheet_(); return; }
    try{ track_("nc_clique"); }catch(e){}
    await enableNotifications();
    try{ rerender(); }catch(e){}
  }; });
  host.querySelectorAll("[data-ncremind]").forEach(b=>{ b.onclick = async ()=>{
    try{ track_("nc_lembrar"); }catch(e){}
    try{ await toggleGameReminder_(b.getAttribute("data-ncremind"), b); }catch(e){}
    try{ rerender(); }catch(e){}
  }; });
  host.querySelectorAll("[data-ncno]").forEach(b=>{ b.onclick = ()=>{
    try{ track_("nc_agora_nao"); }catch(e){}
    try{ localStorage.setItem("dia22-notify-cta-until", shiftISODay_(todayISO_(), 5)); }catch(e){}
    try{ rerender(); }catch(e){}
  }; });
}
// botão pequeno no cartão «AO VIVO» (delegado: o cartão é redesenhado a cada 15 s)
document.addEventListener("click", async e=>{
  const b = e.target.closest && e.target.closest("[data-ncquick]");
  if(!b) return;
  e.stopPropagation(); e.preventDefault();
  if(notifyCtaVariant_() === "ios"){ try{ track_("nc_ios_ajuda"); }catch(x){} iosInstallSheet_(); return; }
  try{ track_("nc_ao_vivo"); }catch(x){}
  try{ await enableNotifications(); }catch(x){}
  try{ if(typeof renderLiveNowBanner_ === "function") renderLiveNowBanner_(); }catch(x){}
}, true);

// v304: 1.ª vez que o iPhone abre a app JÁ instalada (ecrã principal). O passo 3 do guia era onde mais gente se perdia:
// instala, abre o ícone e ninguém lhe diz para ligar os avisos (no iPhone a permissão só pode ser pedida a partir da app).
// Uma só vez por aparelho (a app instalada tem armazenamento próprio, separado do Safari); ignora o «Agora não» do Safari.
function iosAppWelcome_(){
  try{
    if(!READONLY_MODE || typeof isIOSDevice !== "function" || !isIOSDevice() || !isStandaloneMode()) return;
    if(!("Notification" in window) || Notification.permission !== "default" || notificationsEnabled) return;
    try{ if(localStorage.getItem("dia22-ios-welcome")) return; }catch(e){}
    const boot = document.getElementById("bootScreen");
    if(boot || document.getElementById("ncMoment")){ if(!iosAppWelcome_.n || iosAppWelcome_.n < 8){ iosAppWelcome_.n = (iosAppWelcome_.n || 0) + 1; setTimeout(iosAppWelcome_, 1500); } return; }
    try{ localStorage.setItem("dia22-ios-welcome", String(Date.now())); }catch(e){}
    const el = document.createElement("div");
    el.id = "ncMoment"; el.className = "nc-moment"; el.setAttribute("role", "status");
    el.innerHTML = `<span class="nm-t">App instalada! Liga os avisos para saberes quando o FC Porto joga e o resultado final.</span><button type="button" class="hv-btn hv-btn-main nm-yes">Ativar avisos</button><button type="button" class="nm-no" aria-label="Fechar">✕</button>`;
    document.body.appendChild(el);
    try{ if(typeof track_ === "function") track_("ios_app_boas_vindas"); }catch(e){}
    el.querySelector(".nm-no").onclick = ()=>{ el.remove(); };
    el.querySelector(".nm-yes").onclick = async ()=>{
      el.remove();
      try{ track_("ios_app_ativar"); }catch(e){}
      try{ await enableNotifications(); }catch(e){}
      try{ if(typeof renderHomeView_ === "function") renderHomeView_(true); }catch(e){}
    };
    setTimeout(()=>{ const x = document.getElementById("ncMoment"); if(x) x.remove(); }, 30000);
  }catch(e){}
}
setTimeout(iosAppWelcome_, 3500);
