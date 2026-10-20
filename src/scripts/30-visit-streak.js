// ===================== STREAK DE VISITAS (dias seguidos a abrir o site) =====================
// Guardado só neste aparelho/browser (localStorage) — não sabe nada do servidor,
// por isso não é um contador "a sério" partilhado entre dispositivos, é só um
// empurrãozinho pessoal de hábito, como quem acende um fósforo todos os dias.
// Conta-se UMA VEZ por dia de calendário (hora local do aparelho), nunca a cada
// vez que a página sincroniza ou é recarregada no mesmo dia.

let visitStreakCount = null; // calculado uma única vez por carregamento da página

function todayLocalDateStr_(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

// Diferença em dias de calendário entre duas datas "AAAA-MM-DD" (nunca por horas,
// para não dar valores estranhos por causa de mudanças de hora/fuso).
function daysBetweenDateStrs_(a, b){
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  if(isNaN(da) || isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

function ensureVisitStreakComputed_(){
  if(visitStreakCount !== null) return visitStreakCount;
  const today = todayLocalDateStr_();
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem("dia22-visit-streak") || "null"); }catch(e){}

  let count;
  if(!saved || !saved.lastDate){
    count = 1;
  }else{
    const gap = daysBetweenDateStrs_(saved.lastDate, today);
    if(gap === 0){
      count = saved.count || 1; // já contado hoje, não mexe
    }else if(gap === 1){
      count = (saved.count || 0) + 1; // dia seguinte, segue a sequência
    }else{
      count = 1; // saltou um ou mais dias (ou relógio esquisito) — recomeça
    }
  }

  try{ localStorage.setItem("dia22-visit-streak", JSON.stringify({ count, lastDate: today })); }catch(e){}
  visitStreakCount = count;
  return count;
}

function renderVisitStreak_(){
  const el = document.getElementById("visitStreakBox");
  if(!el) return;
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  const count = ensureVisitStreakComputed_();
  if(count < 2){ el.style.display = "none"; return; } // só vale a pena mostrar a partir do 2º dia seguido
  el.style.display = "flex";
  el.innerHTML = `<div class="form-overview-title" style="cursor:default;">🔥 Já cá vens há ${count} dias seguidos!</div>`;
}
