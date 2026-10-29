// ===================== TEMPO POR VISITA (v215) =====================
// Mede quanto tempo o site esteve À VISTA em cada visita registada no "Registo de acessos" e quantos ecrãs foram vistos.
// Sai do separador/minimiza → o relógio pára; volta → continua na mesma visita. Uma visita = a entrada do registo (amortecedor de 30 min).
// Só no link "só ver". Envia valores absolutos ao Apps Script v138 (logVisitTime). Para retirar: pôr VISIT_TIME_ON_ = false.
const VISIT_TIME_ON_ = true;
const VT_KEY_ = "dia22-visit-sess";
let vtSess_ = null, vtStart_ = 0, vtLastSent_ = 0, vtMarks_ = {};
function vtLoad_(){
  try{
    const o = JSON.parse(localStorage.getItem(VT_KEY_) || "null");
    if(o && o.t && o.name && (Date.now() - new Date(o.t).getTime()) < 30*60*1000) return o; // ainda é a mesma visita
  }catch(e){}
  return null;
}
function vtSave_(){ try{ if(vtSess_) localStorage.setItem(VT_KEY_, JSON.stringify(vtSess_)); }catch(e){} }
function visitTimeStart_(name, tIso){
  if(!VISIT_TIME_ON_ || !READONLY_MODE) return;
  vtSess_ = { name: name, t: tIso, secs: 0, views: 0 };
  vtSave_();
}
function vtActiveSecs_(){ return Math.round((vtSess_ ? vtSess_.secs : 0) + (vtStart_ ? (Date.now() - vtStart_) / 1000 : 0)); }
function vtSend_(final){
  try{
    if(!VISIT_TIME_ON_ || !READONLY_MODE || !vtSess_ || typeof STORE_URL === "undefined") return;
    if(vtStart_){ vtSess_.secs += (Date.now() - vtStart_) / 1000; vtStart_ = final ? 0 : Date.now(); }
    vtSave_();
    if(vtSess_.secs < 1) return;
    if(!final && Date.now() - vtLastSent_ < 20000) return;
    vtLastSent_ = Date.now();
    const body = JSON.stringify({ logVisitTime: { name: vtSess_.name, t: vtSess_.t, secs: Math.round(vtSess_.secs), views: vtSess_.views } });
    if(navigator.sendBeacon){ try{ if(navigator.sendBeacon(STORE_URL, new Blob([body], { type: "text/plain" }))) return; }catch(e){} }
    fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: true }).catch(()=>{});
  }catch(e){}
}
(function vtInit_(){
  if(!VISIT_TIME_ON_ || !READONLY_MODE) return;
  try{
    vtSess_ = vtLoad_(); // recarregou a página dentro da mesma visita: continua
    if(!document.hidden) vtStart_ = Date.now();
    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden) vtSend_(true);
      else { vtStart_ = Date.now(); }
    });
    window.addEventListener("pagehide", ()=>vtSend_(true));
    // contar ecrãs vistos: cada mudança de vista conta 1
    if(typeof setView === "function"){
      const orig = setView;
      setView = function(){ try{ if(vtSess_){ vtSess_.views = Math.min(99, (vtSess_.views || 0) + 1); } }catch(e){} return orig.apply(this, arguments); };
    }
    // envios intermédios aos 45 s, 3 min e 10 min (para o caso de o telemóvel não avisar quando a pessoa sai)
    setInterval(()=>{
      if(document.hidden || !vtSess_) return;
      const s = vtActiveSecs_();
      [45, 180, 600].forEach(m=>{ if(s >= m && !vtMarks_[vtSess_.t + m]){ vtMarks_[vtSess_.t + m] = 1; vtSend_(false); } });
    }, 5000);
  }catch(e){}
})();
// texto para o registo de acessos: "3 min · 4 ecrãs"
function visitTimeText_(e){
  if(!VISIT_TIME_ON_ || !e || !e.d) return "";
  const s = e.d, t = s < 60 ? s + " s" : (s < 3600 ? Math.round(s / 60) + " min" : (Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + " min"));
  return t + (e.v ? " · " + e.v + (e.v === 1 ? " ecrã" : " ecrãs") : "");
}
// resumo (escalões) de todas as visitas com tempo medido
function visitTimeSummaryHtml_(entries){
  if(!VISIT_TIME_ON_) return "";
  const l = (entries || []).filter(e=>e && e.d > 0 && (!e.type || e.type === "visit"));
  if(l.length < 3) return `<div style="font-size:12px; color:var(--text-dim); margin-bottom:8px;">⏱️ Tempo por visita: ainda poucos dados (${l.length} medidas).</div>`;
  const B = [["&lt; 10 s", 0, 10], ["10–30 s", 10, 30], ["30 s–1 min", 30, 60], ["1–3 min", 60, 180], ["3–10 min", 180, 600], ["&gt; 10 min", 600, 1e9]];
  const cnt = B.map(b=>l.filter(e=>e.d >= b[1] && e.d < b[2]).length);
  const sorted = l.map(e=>e.d).sort((a, b)=>a - b), med = sorted[Math.floor(sorted.length / 2)];
  const medTxt = med < 60 ? med + " s" : Math.round(med / 60) + " min";
  const v1 = l.filter(e=>(e.v || 0) <= 1).length, v23 = l.filter(e=>e.v >= 2 && e.v <= 3).length, v4 = l.filter(e=>e.v >= 4).length;
  const pc = n=>Math.round(100 * n / l.length) + "%";
  return `<div style="font-size:12px; color:var(--text-dim); margin-bottom:10px; line-height:1.5;">⏱️ <b>Tempo por visita</b> (${l.length} medidas, mediana ${medTxt}): ${B.map((b, i)=>`${b[0]} ${pc(cnt[i])}`).join(" · ")}<br>📱 Ecrãs vistos: 1 ecrã ${pc(v1)} · 2–3 ${pc(v23)} · 4 ou mais ${pc(v4)}</div>`;
}
