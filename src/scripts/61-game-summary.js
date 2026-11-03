// ===================== RESUMO DO JOGO (v245) =====================
// Pequeno texto escrito automaticamente na página de um jogo terminado, só com dados que o site já tem:
// resultado, golos (marcadores escritos à mão com minuto, ou a cronologia do Sofascore), sequência de resultados e classificação.
// Se só der para dizer o resultado, não aparece (já está no topo da página).
function gameSummary_(ev){
  try{
    const st = (typeof getEv === "function" && getEv(ev.id)) || {};
    const m = String(st.resultado || "").match(/(\d+)\s*[-–:xX]\s*(\d+)/);
    if(!m) return "";
    const t = postTeams_(ev), fcpCasa = t.home === "FC Porto";
    const a = Number(m[fcpCasa ? 1 : 2]), b = Number(m[fcpCasa ? 2 : 1]);
    const tag = a > b ? "win" : (a < b ? "loss" : "draw");
    const adv = String(ev.athlete || "").trim() || "o adversário";
    const local = ev.local === "fora" ? ", fora" : (ev.local === "neutro" ? "" : ", em casa");
    const comp = [ev.detail, ev.phase].filter(Boolean).join(" · ");
    const frases = [];
    frases.push((tag === "win" ? `Vitória do FC Porto frente a ${adv} por ${a}-${b}` : tag === "loss" ? `Derrota do FC Porto frente a ${adv} por ${a}-${b}` : `Empate (${a}-${b}) do FC Porto frente a ${adv}`) + local + (comp ? ` (${comp})` : "") + ".");

    // golos por ordem: [{ min, lado (0 = FC Porto, 1 = adversário), nome, ag }]
    const soGolos = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(ev.sport));
    let golos = [];
    if(soGolos){
      const manual = (Array.isArray(ev.playerStats) ? ev.playerStats : []).filter(p=>p && p.minute != null && String(p.minute).trim() !== "");
      if(manual.length){
        golos = manual.map(p=>({ min: String(p.minute).trim(), lado: p.team === "adv" ? 1 : 0, nome: String(p.name || "").trim() }));
      }else{
        const d = (typeof DETALHES === "object" && DETALHES) ? DETALHES[ev.id] : null;
        if(d && Array.isArray(d.inc)) golos = d.inc.filter(x=>x && (x[1] === "G" || x[1] === "GP" || x[1] === "AG")).map(x=>({ min: String(x[0]), lado: x[2] === 1 ? 1 : 0, nome: x[1] === "AG" ? "" : String(x[3] || "").trim(), ag: x[1] === "AG" }));
      }
      golos.sort((x, y)=>(parseInt(x.min, 10) || 0) - (parseInt(y.min, 10) || 0));
      // só conta se bater certo com o resultado (senão há golos por registar e a história sairia errada)
      if(golos.length !== a + b) golos = [];
    }
    if(golos.length){
      const g1 = golos[0];
      frases.push(g1.lado === 0 ? `O FC Porto adiantou-se aos ${g1.min}'${g1.nome ? `, por ${g1.nome}` : ""}.` : `${adv} adiantou-se aos ${g1.min}'.`);
      if(tag === "win" && g1.lado === 1) frases.push("Os dragões deram a volta ao resultado.");
      else if(tag === "draw" && g1.lado === 1) frases.push("Os dragões recuperaram de uma desvantagem.");
      const por = {};
      golos.filter(g=>g.lado === 0 && g.nome).forEach(g=>{ (por[g.nome] = por[g.nome] || []).push(g.min); });
      const nomes = Object.keys(por);
      if(nomes.length){
        const mins = n=>por[n].map(x=>x + "'").join(", ");
        const junta = l=>l.length === 1 ? l[0] : l.slice(0, -1).join(", ") + " e " + l[l.length - 1];
        if(nomes.length === 1){
          const n = nomes[0], k = por[n].length;
          frases.push(k === 3 ? `${n} fez um hat-trick (${mins(n)}).` : k === 2 ? `${n} bisou (${mins(n)}).` : k > 3 ? `${n} marcou ${k} golos (${mins(n)}).` : `Marcou ${n} (${mins(n)}).`);
        }else{
          const todosUm = nomes.every(n=>por[n].length === 1);
          frases.push((todosUm ? "Marcaram " : "Golos de ") + junta(nomes.map(n=>`${n} (${mins(n)})`)) + ".");
        }
      }
    }

    // sequência (todas as competições da modalidade)
    try{
      const antes = (typeof EVENTS !== "undefined" ? EVENTS : []).filter(e=>e.id !== ev.id && e.sport === ev.sport && pgWhen_(e) < pgWhen_(ev) && pgDone_(e) && pgTag_(pgDone_(e))).sort((x, y)=>pgWhen_(y) - pgWhen_(x));
      let n = 1; for(const e of antes){ if(pgTag_(pgDone_(e)) === tag) n++; else break; }
      if(tag === "win" && n >= 3) frases.push(`É a ${n}.ª vitória consecutiva.`);
      else if(tag === "loss" && n >= 2) frases.push(`É a ${n}.ª derrota consecutiva.`);
      else if(tag === "win" && antes.length && pgTag_(pgDone_(antes[0])) === "loss") frases.push("Regresso às vitórias depois de uma derrota.");
    }catch(e){}

    // classificação: só se a tabela já foi atualizada depois do jogo
    try{
      const s = (typeof STANDINGS === "object" && STANDINGS && (typeof isLeagueGame_ !== "function" || isLeagueGame_(ev))) ? STANDINGS[ev.sport] : null;
      const fim = pgWhen_(ev) + ((typeof SPORT_DURATION_MIN_ !== "undefined" && SPORT_DURATION_MIN_[ev.sport]) || 90) * 60000;
      if(s && Array.isArray(s.rows) && s.updated && Number(s.updated) >= fim && Date.now() - fim < 3 * 86400000){ // só nos 3 dias a seguir ao jogo (depois a tabela já é de outra jornada)
        const me = s.rows.find(r=>r.me), iPts = (s.cols || []).indexOf("Pts");
        if(me && me.p) frases.push(`Na classificação, o FC Porto ocupa o ${me.p}.º lugar${iPts >= 0 && me.c && me.c[iPts] != null ? ` com ${me.c[iPts]} pontos` : ""}.`);
      }
    }catch(e){}

    return frases.length >= 2 ? frases.join(" ") : "";
  }catch(e){ return ""; }
}
function gameSummaryHtml_(ev){
  const txt = gameSummary_(ev);
  if(!txt) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  return `<div class="gp-card gp-resumo"><h3>Resumo</h3><p>${esc(txt)}</p></div>`;
}
