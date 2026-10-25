// ===================== ADICIONAR AO CALENDÁRIO (v165) =====================
// Gera um ficheiro .ics com o jogo (e um alarme 1 hora antes) e abre-o no calendário do telemóvel ou do computador.
// Tudo é feito no próprio aparelho: não passa por nenhum servidor.
function icsEsc_(s){ return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsStamp_(d){ return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0") + "T" + String(d.getUTCHours()).padStart(2, "0") + String(d.getUTCMinutes()).padStart(2, "0") + "00Z"; }
function gameIcsText_(ev){
  const ini = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
  if(isNaN(ini)) return "";
  const dur = ev.sport === "Futebol Feminino" || ev.sport === "Equipa B" ? 120 : (ev.sport === "Hóquei Patins" ? 90 : 120);
  const fim = new Date(ini.getTime() + dur * 60000);
  const t = (typeof postTeams_ === "function") ? postTeams_(ev) : { home: "FC Porto", away: ev.athlete };
  const titulo = ev.sport + ": " + t.home + " vs " + t.away;
  const link = (typeof gameLink_ === "function") ? gameLink_(ev) : "https://dragaostats.pt";
  const desc = [ev.detail, ev.phase, ev.watchUrl ? "Ver: " + ev.watchUrl : "", link].filter(Boolean).join("\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dragão Stats//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", "UID:" + ev.id + "@dragaostats.pt", "DTSTAMP:" + icsStamp_(new Date()), "DTSTART:" + icsStamp_(ini), "DTEND:" + icsStamp_(fim),
    "SUMMARY:" + icsEsc_(titulo), "LOCATION:" + icsEsc_(ev.venue || ""), "DESCRIPTION:" + icsEsc_(desc), "URL:" + link,
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc_(titulo), "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function addGameToCalendar_(ev){
  const txt = gameIcsText_(ev);
  if(!txt){ alert("Não foi possível criar o evento deste jogo."); return; }
  try{
    const blob = new Blob([txt], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jogo-fc-porto.ics";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ try{ document.body.removeChild(a); URL.revokeObjectURL(url); }catch(e){} }, 4000);
  }catch(e){ alert("Não foi possível abrir o calendário neste aparelho."); }
}
