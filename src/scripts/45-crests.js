// ===================== ESCUDOS DOS ADVERSÁRIOS (v160) =====================
// O Apps Script (v109) diz, no campo "escudos", qual é a equipa do Sofascore de cada adversário ("Modalidade|Adversário" → id)
// e entrega a imagem em base64 em STORE_URL?escudo=<id>. A imagem fica guardada neste aparelho (localStorage), por isso
// só se pede uma vez. Se algo falhar, não aparece escudo e o site fica exatamente como estava.
let ESCUDOS = {};
function crestId_(sport, adv){
  try{ return (ESCUDOS && ESCUDOS[sport + "|" + String(adv || "").trim()]) || null; }catch(e){ return null; }
}
function crestCached_(id){
  try{ return localStorage.getItem("dia22-crest-" + id) || ""; }catch(e){ return ""; }
}
const crestPending_ = {};
function crestEnsure_(id){
  if(!id) return Promise.resolve("");
  const c = crestCached_(id);
  if(c) return Promise.resolve(c);
  if(crestPending_[id]) return crestPending_[id];
  crestPending_[id] = fetch(STORE_URL + (STORE_URL.indexOf("?") >= 0 ? "&" : "?") + "escudo=" + encodeURIComponent(id))
    .then(r=>r.json())
    .then(j=>{
      const img = (j && j.ok && typeof j.img === "string" && j.img.indexOf("data:image/") === 0) ? j.img : "";
      if(img){ try{ localStorage.setItem("dia22-crest-" + id, img); }catch(e){} }
      return img;
    })
    .catch(()=>"")
    .then(img=>{ delete crestPending_[id]; return img; });
  return crestPending_[id];
}
// <img> do escudo; se a imagem ainda não está no aparelho, vai buscá-la e preenche-se sozinho
function crestHtml_(sport, adv, cls){
  const id = crestId_(sport, adv);
  if(!id) return "";
  const c = crestCached_(id);
  if(c) return `<img class="crest ${cls || ""}" src="${c}" alt="" data-crest="${id}">`;
  crestEnsure_(id).then(img=>{
    if(!img) return;
    document.querySelectorAll('img.crest[data-crest="' + id + '"]').forEach(el=>{ el.src = img; el.style.visibility = ""; });
  });
  return `<img class="crest ${cls || ""}" alt="" data-crest="${id}" style="visibility:hidden" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">`;
}
// para desenhar em canvas: devolve um Image carregado ou null
async function crestImage_(sport, adv){
  const id = crestId_(sport, adv);
  if(!id) return null;
  const src = await crestEnsure_(id);
  if(!src) return null;
  return await new Promise(res=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = ()=>res(null); im.src = src; });
}
