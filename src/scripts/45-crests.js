// ===================== ESCUDOS DOS ADVERSÁRIOS (v160) =====================
// O Apps Script (v109) diz, no campo "escudos", qual é a equipa do Sofascore de cada adversário ("Modalidade|Adversário" → id)
// e entrega a imagem em base64 em STORE_URL?escudo=<id>. A imagem fica guardada neste aparelho (localStorage), por isso
// só se pede uma vez. Se algo falhar, não aparece escudo e o site fica exatamente como estava.
let ESCUDOS = {};
function crestId_(sport, adv){
  try{
    if(String(adv || "").trim() === "FC Porto") return (ESCUDOS && (ESCUDOS["FCP|" + sport] || ESCUDOS["FCP|*"])) || null; // o do FC Porto (v164)
    return (ESCUDOS && ESCUDOS[sport + "|" + String(adv || "").trim()]) || null;
  }catch(e){ return null; }
}
function crestCached_(id){
  try{ return localStorage.getItem("dia22-crest-" + id) || ""; }catch(e){ return ""; }
}
// v173: reduz o escudo a 128 px (WebP quando o aparelho deixa, senão PNG) antes de o guardar — de ~36 KB para poucos KB, para caberem
// muitos escudos no armazenamento do browser. Se algo falhar, guarda o original.
function crestShrink_(src){
  return new Promise(res=>{
    try{
      const im = new Image();
      im.onload = ()=>{
        try{
          const m = Math.max(im.naturalWidth, im.naturalHeight) || 1;
          if(m <= 128){ res(src); return; }
          const k = 128 / m, w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(im, 0, 0, w, h);
          let out = c.toDataURL("image/webp", 0.9);
          if(out.indexOf("data:image/webp") !== 0) out = c.toDataURL("image/png");
          res(out && out.length < src.length ? out : src);
        }catch(e){ res(src); }
      };
      im.onerror = ()=>res(src);
      im.src = src;
    }catch(e){ res(src); }
  });
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
      if(!img) return "";
      return crestShrink_(img).then(small=>{ try{ localStorage.setItem("dia22-crest-" + id, small); }catch(e){} return small; });
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

// v163: escudo + nome em linhas e listas (só o do adversário; o FC Porto fica como estava)
function crestOnly_(ev, name){
  try{
    if(!ev) return "";
    const n = String(name).trim();
    return (n === "FC Porto" || n === String(ev.athlete || "").trim()) ? crestHtml_(ev.sport, n) : "";
  }catch(e){ return ""; }
}
function crestName_(ev, name){ return crestOnly_(ev, name) + fcpNameHtml_(name); }
// v197: segunda equipa do resultado ("FC Porto 3-4 Caxinas 🛡"): o escudo vai para o fim, longe do resultado
function crestNameEnd_(ev, name){ const c = crestOnly_(ev, name); return fcpNameHtml_(name) + (c ? `<span class="crest-end">${c}</span>` : ""); }
