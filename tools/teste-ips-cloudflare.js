// Worker de TESTE (não é o site). Serve para ver se as fontes de dados do Dragão Stats
// respondem a pedidos que saem do Cloudflare (o Apps Script usa IPs da Google).
// Colar num Worker novo, abrir o endereço dele e copiar o resultado.
//   /            -> testa com o agente do Apps Script
//   /?ua=browser -> testa com um agente de navegador
const FONTES = [
  ["Sofascore (api.)", "https://api.sofascore.com/api/v1/team/3002/events/next/0"],
  ["Sofascore (www.)", "https://www.sofascore.com/api/v1/team/3002/events/last/0"],
  ["Sofascore tabela Futsal", "https://api.sofascore.com/api/v1/tournament/112814/season/102039/standings/total"],
  ["Sofascore escudo/pesquisa", "https://api.sofascore.com/api/v1/search/all?q=benfica"],
  ["FPA andebol", "https://portal.fpa.pt/prova/10016/"],
  ["FPV voleibol ao vivo", "https://portugalvoleibol.com/classificacao/api/live.php?status=all"],
  ["FPB basquetebol", "https://www.fpb.pt/classificacao/11440"],
  ["Hóquei tabela", "https://hoqueipatins.pt/liga/1-divisao-regular/"],
  ["Hóquei ao vivo", "https://live.hoqueipatins.pt/api/updates"],
  ["Liga Portugal (iCal Equipa B)", "https://www.ligaportugal.pt/calendars-ics/fc_porto_b.ics"],
  ["FC Porto API notícias", "https://api.app.fcporto.pt/v2/news?limit=20"],
  ["FC Porto API plantel", "https://api.app.fcporto.pt/v2/sportClasses/1/teamsSquads?team=1"],
  ["fcporto.pt notícias", "https://www.fcporto.pt/pt/noticias"],
  ["Tennis Explorer", "https://www.tennisexplorer.com/ranking/atp-men/?country=portugal"],
  ["WTA ranking", "https://api.wtatennis.com/tennis/players/ranked?page=0&pageSize=10&nationality=POR&type=rankSingles&metric=SINGLES"],
  ["CEV (site)", "https://www.cev.eu/"],
  ["zerozero (bloqueia a Google)", "https://www.zerozero.pt/"],
  ["FPF (bloqueia a Google)", "https://resultados.fpf.pt/"],
];
const UA = {
  gas: "Mozilla/5.0 (compatible; Google-Apps-Script)",
  browser: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
};
const SINAIS = /just a moment|cf-chl|captcha|incapsula|access denied|attention required|are you a robot|unusual traffic/i;

async function um(nome, url, ua) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": ua, "Accept": "*/*", "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(10000) });
    const buf = await r.arrayBuffer();
    const ini = new TextDecoder().decode(buf.slice(0, 1500));
    const desafio = SINAIS.test(ini);
    const veredito = r.status === 200 && !desafio ? "OK" : (r.status === 403 || r.status === 429 || desafio ? "BLOQUEADO" : "ESTRANHO");
    return { nome, estado: r.status, veredito, kb: Math.round(buf.byteLength / 1024), ms: Date.now() - t0, tipo: (r.headers.get("content-type") || "").split(";")[0], desafio };
  } catch (e) {
    return { nome, estado: 0, veredito: "SEM RESPOSTA", erro: String(e && e.message || e).slice(0, 80), ms: Date.now() - t0 };
  }
}

export default {
  async fetch(request) {
    const u = new URL(request.url);
    const modo = u.searchParams.get("ua") === "browser" ? "browser" : "gas";
    let onde = "";
    try { onde = (await (await fetch("https://www.cloudflare.com/cdn-cgi/trace")).text()).split("\n").filter(l => /^(colo|loc|ip)=/.test(l)).join(" "); } catch (e) { onde = "?"; }
    const res = await Promise.all(FONTES.map(([n, url]) => um(n, url, UA[modo])));
    const resumo = res.reduce((a, r) => (a[r.veredito] = (a[r.veredito] || 0) + 1, a), {});
    return new Response(JSON.stringify({ quando: new Date().toISOString(), agente: modo, saidaCloudflare: onde, resumo, resultados: res }, null, 1), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  },
};
