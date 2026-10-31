const DEFAULT_EVENTS = [
 {t:"07:00", sport:"Boules", athlete:"Hugo Dores", detail:"Petanca", phase:"Qualificação — Ronda 1", chain:"boules-hugo"},
 {t:"09:00", sport:"Natação", athlete:"Inês Henriques", detail:"400m", phase:"Eliminatórias — 1ª série", chain:"swim-ines-francisca"},
 {t:"09:00", approx:true, sport:"Natação", athlete:"Francisca Martins", detail:"400m", phase:"Eliminatórias — 2ª série", chain:"swim-ines-francisca"},
 {t:"09:13", approx:true, sport:"Natação", athlete:"Rodrigo Borges", detail:"400m", phase:"Eliminatórias — 2ª série", chain:"swim-rodrigo"},
 {t:"09:30", sport:"Natação", athlete:"Rafaela Azevedo", detail:"50m", phase:"Eliminatórias — 1ª série", chain:"swim-rafaela-mariana"},
 {t:"09:30", sport:"Boules", athlete:"Hugo Dores", detail:"Petanca", phase:"Qualificação — Ronda 2", chain:"boules-hugo"},
 {t:"09:30", sport:"Futebol", athlete:"Equipa Feminina", detail:"", phase:"Fase de Grupos"},
 {t:"09:30", approx:true, sport:"Natação", athlete:"Mariana Almeida", detail:"50m", phase:"Eliminatórias — 2ª série", chain:"swim-rafaela-mariana"},
 {t:"09:35", sport:"Wrestling", athlete:"João Simões", detail:"77kg", phase:"Oitavos de final", chain:"wrestling-joao"},
 {t:"09:36", sport:"Taekwondo", athlete:"Noah Garcia", detail:"-58kg", phase:"Oitavos de final", chain:"tkd-noah"},
 {t:"09:38", sport:"Natação", athlete:"Kevins Apseniece", detail:"50m", phase:"Eliminatórias — 1ª série", chain:"swim-kevins-vasco"},
 {t:"09:38", approx:true, sport:"Natação", athlete:"Vasco Morgado", detail:"50m", phase:"Eliminatórias — 3ª série", chain:"swim-kevins-vasco"},
 {t:"09:45", approx:true, sport:"Natação", athlete:"Camila Rebelo", detail:"200m", phase:"Eliminatórias — 2ª série", chain:"swim-camila"},
 {t:"09:53", sport:"Natação", athlete:"Ricardo Santos", detail:"200m", phase:"Eliminatórias — 1ª série", chain:"swim-ricardo"},
 {t:"09:55", sport:"Wrestling", athlete:"Miguel Santos", detail:"67kg", phase:"Oitavos de final", chain:"wrestling-miguel"},
 {t:"10:00", sport:"Taekwondo", athlete:"Ana Adrego", detail:"-57kg", phase:"Oitavos de final", chain:"tkd-ana"},
 {t:"10:00", sport:"Badminton", athlete:"Pares Mistos", detail:"", phase:"Oitavos de final", chain:"badminton-mistos"},
 {t:"10:01", sport:"Natação", athlete:"Ana Rodrigues", detail:"100m", phase:"Eliminatórias — 1ª série", chain:"swim-ana-rodrigues"},
 {t:"10:08", sport:"Ciclismo", athlete:"Raquel Queirós", detail:"Contra-relógio", phase:"Final"},
 {t:"10:09", sport:"Natação", athlete:"Gabriel Lopes", detail:"100m", phase:"Eliminatórias — 1ª série", chain:"swim-gabriel"},
 {t:"10:10", approx:true, cond:true, sport:"Wrestling", athlete:"João Simões", detail:"77kg", phase:"Quartos de final", chain:"wrestling-joao"},
 {t:"10:20", approx:true, cond:true, sport:"Wrestling", athlete:"Miguel Santos", detail:"67kg", phase:"Quartos de final", chain:"wrestling-miguel"},
 {t:"10:24", sport:"Ciclismo", athlete:"Beatriz Roxo", detail:"Contra-relógio", phase:"Final"},
 {t:"12:30", sport:"Ciclismo", athlete:"Tiago Antunes", detail:"Contra-relógio", phase:"Final"},
 {t:"12:50", sport:"Ciclismo", athlete:"Rafael Reis", detail:"Contra-relógio", phase:"Final"},
 {t:"13:00", sport:"Voleibol", athlete:"Equipa Masculina", detail:"", phase:"Fase de Grupos"},
 {t:"14:00", sport:"Taekwondo", athlete:"Kiara Barroso", detail:"-49kg", phase:"Quartos de final", chain:"tkd-kiara"},
 {t:"14:24", cond:true, sport:"Taekwondo", athlete:"Noah Garcia", detail:"-58kg", phase:"Quartos de final", chain:"tkd-noah"},
 {t:"14:48", cond:true, sport:"Taekwondo", athlete:"Ana Adrego", detail:"-57kg", phase:"Quartos de final", chain:"tkd-ana"},
 {t:"15:00", cond:true, sport:"Badminton", athlete:"Pares Mistos", detail:"", phase:"Quartos de final", chain:"badminton-mistos"},
 {t:"15:45", sport:"Boxe", athlete:"João Silva", detail:"-70kg", phase:"Oitavos de final"},
 {t:"16:00", cond:true, sport:"Wrestling", athlete:"João Simões", detail:"77kg", phase:"Meias-finais", chain:"wrestling-joao"},
 {t:"16:05", cond:true, sport:"Wrestling", athlete:"Miguel Santos", detail:"67kg", phase:"Meias-finais", chain:"wrestling-miguel"},
 {t:"16:30", cond:true, sport:"Taekwondo", athlete:"Kiara Barroso", detail:"-49kg", phase:"Meias-finais", chain:"tkd-kiara"},
 {t:"16:42", cond:true, sport:"Taekwondo", athlete:"Noah Garcia", detail:"-58kg", phase:"Meias-finais", chain:"tkd-noah"},
 {t:"16:54", cond:true, sport:"Taekwondo", athlete:"Ana Adrego", detail:"-57kg", phase:"Meias-finais", chain:"tkd-ana"},
 {t:"17:00", cond:true, sport:"Natação", athlete:"Rafaela Azevedo e Mariana Borges", detail:"50m", phase:"Final", chain:"swim-rafaela-mariana"},
 {t:"17:03", cond:true, sport:"Natação", athlete:"Kevins Apseniece e Vasco Morgado", detail:"50m", phase:"Final", chain:"swim-kevins-vasco"},
 {t:"17:06", cond:true, sport:"Natação", athlete:"Inês Henriques e Francisca Martins", detail:"400m", phase:"Final", chain:"swim-ines-francisca"},
 {t:"17:13", cond:true, sport:"Natação", athlete:"Rodrigo Borges", detail:"400m", phase:"Final", chain:"swim-rodrigo"},
 {t:"17:18", cond:true, sport:"Taekwondo", athlete:"Kiara Barroso", detail:"-49kg", phase:"Final", chain:"tkd-kiara"},
 {t:"17:30", cond:true, sport:"Taekwondo", athlete:"Noah Garcia", detail:"-58kg", phase:"Final", chain:"tkd-noah"},
 {t:"17:32", cond:true, sport:"Natação", athlete:"Camila Rebelo", detail:"200m", phase:"Final", chain:"swim-camila"},
 {t:"17:37", cond:true, sport:"Natação", athlete:"Ricardo Santos", detail:"200m", phase:"Final", chain:"swim-ricardo"},
 {t:"17:42", cond:true, sport:"Taekwondo", athlete:"Ana Adrego", detail:"-57kg", phase:"Final", chain:"tkd-ana"},
 {t:"17:54", cond:true, sport:"Natação", athlete:"Ana Rodrigues", detail:"100m", phase:"Final", chain:"swim-ana-rodrigues"},
 {t:"17:58", cond:true, sport:"Natação", athlete:"Gabriel Lopes", detail:"100m", phase:"Final", chain:"swim-gabriel"},
].map((e,i)=>({...e, id:"ev"+i, seq:i, day:"22"}));

let EVENTS = []; // populado a partir da Google Sheet (ou dos DEFAULT_EVENTS na primeira vez)

const SPORT_COLORS = {
  "Natação":"#4fb3e8",
  "Boules":"#c9a86a",
  "Futebol":"#3b6fe0",
  "Equipa A":"#3b6fe0",
  "Wrestling":"#d3564a",
  "Taekwondo":"#b98ee0",
  "Badminton":"#e3b23c",
  "Ciclismo":"#7ee0c4",
  "Voleibol":"#e3d65c",
  "Boxe":"#e05a7e",
  "Andebol":"#4ecdc4",
  "Basquetebol":"#e3a15c",
  "Hóquei Patins":"#8ce35c",
  "Futsal":"#5ce3b8",
  "Futebol Feminino":"#5cb8e3",
  "Equipa B":"#8c5ce3"
};

let STANDINGS = {}; // classificações por modalidade (vêm do Apps Script v94): { "Andebol": { comp, fase, source, updated, manual, cols:[], rows:[{p,t,c:[],me}] } }
const STORE_URL = "https://script.google.com/macros/s/AKfycbzsPW_XhIwE-fq9GGd9rn_wPQkkOoH__dbJ6MBvRIW3mZE_kiw2JT3HszxUqCIcgOC9pw/exec";

// ALL guarda TODAS as competições: { competitions:[{id,name}], data:{ [id]:{events:[...], status:{...}} } }
let ALL = { competitions: [], data: {} };
let activeCompId = null;

let state = {}; // { evId: {passou:'yes'|'no'|null, resultado:'', updatedAt:number} } — da competição ativa
let activeSport = "Todos";
let activeDay = "22";
let searchQuery = "";
let globalSearch = false;
let profileAthlete = null; // nome do atleta cuja "ficha" está aberta (ou null)
let weekOffset = 0; // 0 = semana atual, -1 = anterior, +1 = seguinte (na vista "Esta semana")
let pinnedCompId = null; // competição a abrir sempre neste dispositivo (preferência pessoal)
try{ pinnedCompId = localStorage.getItem("dia22-pinned-comp") || null; }catch(e){}
let hideCompleted = false;
let matchesViewFilter = "proximos"; // "todos" | "proximos" | "resultados" — só usado no Modo Modalidades
let compactMode = false;
let calendarGridMode = false; // vista de grelha mensal (só Modo Modalidades)
let gridSelectedDay = null; // dia do mês escolhido dentro da grelha (número)
let expandedIds = new Set(); // provas abertas manualmente enquanto em modo compacto

// Modo da competição ativa: "medals" (provas/medalhas, como sempre foi) ou
// "matches" (jogos por jornada, calendário mensal)
function currentCompMode(){
  const comp = ALL.competitions.find(c=>c.id===activeCompId);
  return (comp && comp.mode) || "medals";
}
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function monthLabel(monthKey){ // "2026-09" -> "Setembro 2026"
  const parts = (monthKey||"").split("-");
  const idx = parseInt(parts[1],10) - 1;
  return (MONTH_NAMES[idx] || monthKey) + " " + (parts[0]||"");
}
const WEEKDAY_NAMES = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
function formatFullDate(dateStr){ // "2026-09-15" -> "Terça, 15 Setembro"
  if(!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if(isNaN(d)) return dateStr;
  return WEEKDAY_NAMES[d.getDay()] + ", " + d.getDate() + " " + MONTH_NAMES[d.getMonth()];
}
function formatShortDate(dateStr){ // "2026-09-15" -> "15/09"
  if(!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if(isNaN(d)) return dateStr;
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0");
}
// Local do jogo em texto — trata "neutro" tal como casa/fora
function localLabel(local, style){
  if(local === "fora") return style==="short" ? "🚌 Fora" : "Fora";
  if(local === "neutro") return style==="short" ? "🏳️ Neutro" : "Neutro";
  return style==="short" ? "🏠 Casa" : "Casa";
}

