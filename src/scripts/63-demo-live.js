// ===================== MODO DEMONSTRAÇÃO «AO VIVO» (v247) =====================
// Abrir o site com ?demo=live acrescenta, só no teu ecrã, um jogo da Equipa A a decorrer (golos, cartão, estatísticas,
// onze inicial), para veres como fica o ao vivo sem esperar por um jogo real. Nada é gravado (nem no servidor nem na
// cópia local); sem o parâmetro, isto não faz nada.
function demoLiveRaw_(raw){
  try{
    if(!READONLY_MODE) return; // nunca em edição: um «guardar» levaria o jogo falso para o servidor
    if(!/[?&]demo=live(&|$)/.test(location.search)) return;
    if(!raw || !Array.isArray(raw.competitions)) return;
    const comp = raw.competitions.find(c=>(c.mode || "medals") === "matches" && !c.archived) || raw.competitions.find(c=>(c.mode || "medals") === "matches");
    if(!comp) return;
    window.__demoLive_ = true;
    const id = "demo-live", agora = Date.now(), ini = new Date(agora - 38 * 60000);
    const dia = ini.getFullYear() + "-" + String(ini.getMonth() + 1).padStart(2, "0") + "-" + String(ini.getDate()).padStart(2, "0");
    const hora = String(ini.getHours()).padStart(2, "0") + ":" + String(ini.getMinutes()).padStart(2, "0");
    raw.data = raw.data || {};
    const cd = raw.data[comp.id] = raw.data[comp.id] || { events: [], status: {} };
    cd.events = (cd.events || []).filter(e=>e.id !== id);
    cd.events.push({ id, day: dia, t: hora, sport: "Equipa A", athlete: "Demo FC", local: "casa", detail: "Campeonato", seq: 9999 });
    raw.cevLive = { updated: agora, jogos: { [id]: { estado: "vivo", golosFcp: 2, golosAdv: 1, parte: "2.ª parte", tempo: "63'" } } };
    const j = (nome, n, lado, pos)=>[nome, n, lado, pos];
    raw.onze = { [id]: { c: 1, f: ["4-3-3", "4-4-2"], j: [
      j("Diogo Costa", "99", 0, "G"), j("João Mário", "23", 0, "D"), j("Bednarek", "6", 0, "D"), j("Otávio", "4", 0, "M"), j("Zaidu", "12", 0, "D"),
      j("Alan Varela", "22", 0, "M"), j("Eustáquio", "6", 0, "M"), j("Nico", "10", 0, "M"), j("Galeno", "13", 0, "F"), j("Samu", "9", 0, "F"), j("Pepê", "11", 0, "F"),
      j("Guarda-redes", "1", 1, "G"), j("Defesa A", "2", 1, "D"), j("Defesa B", "3", 1, "D"), j("Defesa C", "4", 1, "D"), j("Defesa D", "5", 1, "D"),
      j("Médio A", "6", 1, "M"), j("Médio B", "8", 1, "M"), j("Médio C", "10", 1, "M"), j("Médio D", "7", 1, "M"), j("Avançado A", "9", 1, "F"), j("Avançado B", "11", 1, "F") ] } };
    raw.detalhes = { [id]: {
      inc: [["12", "G", 0, "Samu", "Galeno"], ["27", "CA", 1, "Defesa B"], ["41", "G", 1, "Avançado A", "Médio C"], ["55", "G", 0, "Pepê", "Nico"], ["60", "S", 0, "Eustáquio", "Alan Varela"]],
      st: [["Posse de bola", "58%", "42%"], ["Remates", "14", "6"], ["Remates enquadrados", "7", "3"], ["Cantos", "6", "2"], ["Faltas", "9", "12"], ["Cartões amarelos", "0", "1"]] } };
  }catch(e){}
}
