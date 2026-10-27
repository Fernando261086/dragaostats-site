// v188 — vídeo fotograma a fotograma (WebCodecs) com tempos exatos, sem depender da velocidade do telemóvel.
// Desenha cada fotograma pela ordem (t = i/fps), codifica em VP9/VP8 e junta tudo num .webm (mux mínimo, escrito aqui).
// Devolve um Blob, ou null se o browser não tiver WebCodecs (aí o chamador usa a gravação em tempo real).

function webmUint_(n){ const a = []; do{ a.unshift(n % 256); n = Math.floor(n / 256); }while(n > 0); return a; }
function webmSize_(len){
  if(len < 0x7f) return [0x80 | len];
  if(len < 0x0fffffff) return [0x10 | (len >>> 24), (len >>> 16) & 255, (len >>> 8) & 255, len & 255];
  const a = [0x01]; for(let i = 6; i >= 0; i--) a.push(Math.floor(len / Math.pow(2, 8 * i)) % 256); return a;
}
function webmEl_(idBytes, payload){
  const parts = Array.isArray(payload) && payload.length && !(typeof payload[0] === "number") ? payload : [payload];
  let len = 0; const norm = parts.map(p=>{ const u = (p instanceof Uint8Array) ? p : new Uint8Array(p); len += u.length; return u; });
  const head = new Uint8Array(idBytes.concat(webmSize_(len)));
  const out = new Uint8Array(head.length + len); out.set(head, 0);
  let o = head.length; norm.forEach(u=>{ out.set(u, o); o += u.length; });
  return out;
}
function webmUintEl_(id, n){ return webmEl_(id, webmUint_(n)); }
function webmStrEl_(id, s){ return webmEl_(id, Array.from(s).map(c=>c.charCodeAt(0))); }
function webmF64El_(id, v){ const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v); return webmEl_(id, b); }
function webmConcat_(list){ let n = 0; list.forEach(u=>n += u.length); const out = new Uint8Array(n); let o = 0; list.forEach(u=>{ out.set(u, o); o += u.length; }); return out; }

// chunks: [{ data:Uint8Array, key:boolean, ms:number }]
function webmMux_(chunks, w, h, durMs, codecId){
  const ebml = webmEl_([0x1A, 0x45, 0xDF, 0xA3], [
    webmUintEl_([0x42, 0x86], 1), webmUintEl_([0x42, 0xF7], 1), webmUintEl_([0x42, 0xF2], 4), webmUintEl_([0x42, 0xF3], 8),
    webmStrEl_([0x42, 0x82], "webm"), webmUintEl_([0x42, 0x87], 4), webmUintEl_([0x42, 0x85], 2)
  ]);
  const info = webmEl_([0x15, 0x49, 0xA9, 0x66], [
    webmUintEl_([0x2A, 0xD7, 0xB1], 1000000), webmF64El_([0x44, 0x89], durMs),
    webmStrEl_([0x4D, 0x80], "DragaoStats"), webmStrEl_([0x57, 0x41], "DragaoStats")
  ]);
  const tracks = webmEl_([0x16, 0x54, 0xAE, 0x6B], webmEl_([0xAE], [
    webmUintEl_([0xD7], 1), webmUintEl_([0x73, 0xC5], 1), webmUintEl_([0x83], 1), webmStrEl_([0x86], codecId),
    webmEl_([0xE0], [webmUintEl_([0xB0], w), webmUintEl_([0xBA], h)])
  ]));
  // clusters: um novo em cada fotograma-chave
  const clusters = [], cues = [];
  let pos = info.length + tracks.length, cur = null;
  const flush = ()=>{
    if(!cur) return;
    const c = webmEl_([0x1F, 0x43, 0xB6, 0x75], [webmUintEl_([0xE7], cur.ms)].concat(cur.blocks));
    cues.push(webmEl_([0xBB], [webmUintEl_([0xB3], cur.ms), webmEl_([0xB7], [webmUintEl_([0xF7], 1), webmUintEl_([0xF1], pos)])]));
    clusters.push(c); pos += c.length; cur = null;
  };
  chunks.forEach(ch=>{
    if(!cur || (ch.key && cur.blocks.length)){ flush(); cur = { ms: ch.ms, blocks: [] }; }
    const rel = ch.ms - cur.ms;
    const hdr = new Uint8Array([0x81, (rel >> 8) & 255, rel & 255, ch.key ? 0x80 : 0x00]);
    cur.blocks.push(webmEl_([0xA3], [hdr, ch.data]));
  });
  flush();
  const cuesEl = webmEl_([0x1C, 0x53, 0xBB, 0x6B], cues);
  const body = webmConcat_([info, tracks].concat(clusters, [cuesEl]));
  const sz = [0x01]; for(let i = 6; i >= 0; i--) sz.push(Math.floor(body.length / Math.pow(2, 8 * i)) % 256);
  const segHead = new Uint8Array([0x18, 0x53, 0x80, 0x67].concat(sz));
  return new Blob([ebml, segHead, body], { type: "video/webm" });
}

// drawFn(tSegundos) desenha o fotograma no canvas; onProgress(0..1)
async function webmEncodeFrames_(canvas, drawFn, totalSec, fps, onProgress){
  if(typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  const w = canvas.width, h = canvas.height;
  let cfg = null, codecId = "V_VP9";
  const tries = [
    { codec: "vp09.00.40.08", id: "V_VP9" }, { codec: "vp09.00.41.08", id: "V_VP9" }, { codec: "vp8", id: "V_VP8" }
  ];
  for(const t of tries){
    const c = { codec: t.codec, width: w, height: h, bitrate: 6000000, framerate: fps };
    try{ const s = await VideoEncoder.isConfigSupported(c); if(s && s.supported){ cfg = c; codecId = t.id; break; } }catch(e){}
  }
  if(!cfg) return null;
  const out = []; let err = null;
  const enc = new VideoEncoder({
    output: (chunk)=>{ const d = new Uint8Array(chunk.byteLength); chunk.copyTo(d); out.push({ data: d, key: chunk.type === "key", ms: Math.round(chunk.timestamp / 1000) }); },
    error: (e)=>{ err = e; }
  });
  enc.configure(cfg);
  const n = Math.round(totalSec * fps);
  for(let i = 0; i < n; i++){
    if(err) throw err;
    drawFn(Math.min(i / fps, totalSec));
    const vf = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
    enc.encode(vf, { keyFrame: i % (fps * 2) === 0 });
    vf.close();
    while(enc.encodeQueueSize > 6){ await new Promise(r=>setTimeout(r, 4)); if(err) throw err; }
    if(i % 6 === 0){ if(onProgress) onProgress(i / n); await new Promise(r=>setTimeout(r, 0)); }
  }
  await enc.flush(); enc.close();
  if(err) throw err;
  if(!out.length) return null;
  out.sort((a, b)=>a.ms - b.ms);
  return webmMux_(out, w, h, Math.round(n * 1000 / fps), codecId);
}
