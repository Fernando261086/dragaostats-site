// ===================== IMAGEM DE PARTILHA DO LINK DO JOGO (v261) =====================
// Quando quem edita guarda um resultado, o site gera um cartaz 1200x630 (escudos + resultado) e envia-o ao Apps Script (v172),
// que o guarda no Drive. O _worker.js usa-o como og:image do link do jogo: no WhatsApp/Facebook o link aparece com o resultado.
// Só em modo edição. Guarda em ev.ogImg (id do ficheiro) e ev.ogRes (o resultado a que a imagem corresponde).
async function ogCardJpeg_(ev){
  const st = (typeof getEv === "function" && getEv(ev.id)) || {};
  const res = String(st.resultado || "").trim();
  if(!res) return null;
  const W = 1200, H = 630;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#5bb4f0";
  const kind = (typeof resultKind_ === "function") ? resultKind_(ev, st) : "";
  try{ await document.fonts.load("120px 'Bebas Neue'"); }catch(e){}
  const F = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif", B = "'Archivo', Arial, sans-serif";
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a1a3c"); g.addColorStop(1, kind === "win" ? "#1a4fb0" : "#12306e");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = cor; x.fillRect(0, 0, 16, H);
  const t = (typeof postTeams_ === "function") ? postTeams_(ev) : { home: "FC Porto", away: ev.athlete || "" };
  // topo
  x.textBaseline = "alphabetic"; x.textAlign = "left";
  x.fillStyle = cor; x.font = "700 30px " + B;
  x.fillText(sportShow_(String(ev.sport || "")).toUpperCase(), 56, 74);
  const det = [ev.detail, ev.phase].filter(Boolean).join(" · ");
  if(det){ x.fillStyle = "rgba(255,255,255,.75)"; x.font = "400 26px " + B; x.fillText(det, 56, 112); }
  x.textAlign = "right"; x.fillStyle = "rgba(255,255,255,.7)"; x.font = "700 26px " + B; x.fillText("dragaostats.pt", W - 56, 74);
  // escudos
  const drawCrest = async (nome, cx)=>{
    const R = 118, cy = 290;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fillStyle = "rgba(255,255,255,.96)"; x.fill(); x.clip();
    let im = null; try{ im = (typeof crestImage_ === "function") ? await crestImage_(ev.sport, nome) : null; }catch(e){}
    if(im && im.width){ const s = Math.min((R * 1.5) / im.width, (R * 1.5) / im.height); x.drawImage(im, cx - im.width * s / 2, cy - im.height * s / 2, im.width * s, im.height * s); }
    else{ x.fillStyle = "#15439b"; x.textAlign = "center"; const ini = nome === "FC Porto" ? "FCP" : String(nome).trim().charAt(0).toUpperCase(); x.font = "400 " + (ini.length > 1 ? 96 : 130) + "px " + F; x.fillText(ini, cx, cy + 36); }
    x.restore();
    x.textAlign = "center"; x.fillStyle = "#fff"; x.font = "400 54px " + F;
    let n = String(nome); while(x.measureText(n).width > 330 && n.length > 6) n = n.slice(0, -2); if(n !== String(nome)) n = n.trim() + "…";
    x.fillText(n.toUpperCase(), cx, 470);
  };
  await drawCrest(t.home, 220); await drawCrest(t.away, W - 220);
  // resultado
  x.textAlign = "center"; x.fillStyle = kind === "win" ? "#ffd75e" : "#fff";
  let fs = 190; x.font = "400 " + fs + "px " + F;
  while(x.measureText(res).width > 400 && fs > 90){ fs -= 10; x.font = "400 " + fs + "px " + F; }
  x.fillText(res, W / 2, 330);
  // selo
  const word = kind === "win" ? "VITÓRIA" : kind === "loss" ? "DERROTA" : kind === "draw" ? "EMPATE" : "TERMINADO";
  x.font = "700 30px " + B;
  const pw = x.measureText(word).width + 56;
  x.fillStyle = kind === "win" ? "rgba(255,215,94,.18)" : "rgba(255,255,255,.14)";
  const px = W / 2 - pw / 2, py = 372, ph = 52, r = 26;
  x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + pw, py, px + pw, py + ph, r); x.arcTo(px + pw, py + ph, px, py + ph, r); x.arcTo(px, py + ph, px, py, r); x.arcTo(px, py, px + pw, py, r); x.fill();
  x.fillStyle = kind === "win" ? "#ffd75e" : "#fff"; x.fillText(word, W / 2, py + 37);
  // rodapé
  x.fillStyle = "rgba(255,255,255,.6)"; x.font = "400 26px " + B;
  const d = new Date(ev.day + "T00:00:00");
  const MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  x.fillText(isNaN(d) ? "" : d.getDate() + " de " + MES[d.getMonth()] + " · Projeto de adeptos, sem ligação oficial ao FC Porto", W / 2, 590);
  const url = c.toDataURL("image/jpeg", 0.82);
  return url.replace(/^data:image\/jpeg;base64,/, "");
}
async function ogCardPublish_(evId, forcar){
  try{
    if(READONLY_MODE || typeof currentCompMode !== "function" || currentCompMode() !== "matches") return false;
    const ev = EVENTS.find(e=>e.id === evId); if(!ev) return false;
    const st = getEv(evId) || {}; const res = String(st.resultado || "").trim();
    if(!res || (!forcar && ev.ogImg && ev.ogRes === res)) return false;
    const jpeg = await ogCardJpeg_(ev); if(!jpeg) return false;
    const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ saveOgImage: { evId: ev.id, jpeg }, adminPassword: getAdminPassword() }) });
    const j = await r.json();
    if(!j || !j.ok || !j.id) return false;
    const cur = EVENTS.find(e=>e.id === evId); if(!cur) return false;
    cur.ogImg = j.id; cur.ogRes = res;
    await saveEvents();
    return true;
  }catch(e){ return false; }
}
// depois de guardar um resultado (junta-se ao aviso «Resultado guardado»), cria a imagem do link sozinho
(function(){
  const orig = flushResultSave;
  flushResultSave = function(eventId){
    const mudou = !!resultSaveTimers[eventId];
    const r = orig.apply(this, arguments);
    if(mudou) setTimeout(()=>{ ogCardPublish_(eventId, false); }, 2500);
    return r;
  };
})();
