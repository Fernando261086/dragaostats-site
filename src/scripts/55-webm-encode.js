// v188 — vídeo fotograma a fotograma (WebCodecs) com tempos exatos, sem depender da velocidade do telemóvel.
// Desenha cada fotograma pela ordem (t = i/fps), codifica em VP9/VP8 e junta tudo num .webm (mux mínimo, escrito aqui).
// Devolve um Blob, ou null se o browser não tiver WebCodecs (aí o chamador usa a gravação em tempo real).
// v279: tenta primeiro H.264 em .mp4 (o TikTok, o Instagram e o iPhone não abrem .webm: «não é possível descodificar»);
// se o aparelho não codifica H.264, cai para o .webm de sempre. O Blob traz o tipo certo em blob.type; use reelExt_(blob).

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

// ---- v279: mux MP4 mínimo (H.264, só vídeo, moov antes do mdat para abrir logo)
function mp4Box_(type, parts){
  const list = [].concat(parts).map(p=>p instanceof Uint8Array ? p : new Uint8Array(p));
  let len = 8; list.forEach(u=>len += u.length);
  const out = new Uint8Array(len), dv = new DataView(out.buffer);
  dv.setUint32(0, len); for(let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  let o = 8; list.forEach(u=>{ out.set(u, o); o += u.length; });
  return out;
}
function mp4U32_(){ const a = new Uint8Array(arguments.length * 4), dv = new DataView(a.buffer); for(let i = 0; i < arguments.length; i++) dv.setUint32(i * 4, arguments[i] >>> 0); return a; }
function mp4U16_(n){ return new Uint8Array([(n >> 8) & 255, n & 255]); }
function mp4Full_(type, version, flags, parts){ return mp4Box_(type, [new Uint8Array([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255])].concat(parts)); }

// samples: [{ data:Uint8Array (AVCC, com comprimento à frente de cada NAL), key:boolean }] por ordem de descodificação; avcC: Uint8Array
function mp4Mux_(samples, w, h, fps, avcC){
  const TS = fps * 1000, DELTA = 1000, n = samples.length, dur = n * DELTA;
  const zero36 = new Uint8Array(36);
  const matrix = mp4U32_(0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000);
  const buildMoov = (mdatOffset)=>{
    const stss = []; samples.forEach((sm, i)=>{ if(sm.key) stss.push(i + 1); });
    const sizes = mp4U32_.apply(null, samples.map(sm=>sm.data.length));
    const avc1 = mp4Box_("avc1", [new Uint8Array(6), mp4U16_(1), new Uint8Array(16), mp4U16_(w), mp4U16_(h),
      mp4U32_(0x480000, 0x480000, 0), mp4U16_(1), new Uint8Array(32), mp4U16_(0x18), mp4U16_(0xFFFF), mp4Box_("avcC", avcC)]);
    const stbl = mp4Box_("stbl", [
      mp4Full_("stsd", 0, 0, [mp4U32_(1), avc1]),
      mp4Full_("stts", 0, 0, [mp4U32_(1, n, DELTA)]),
      mp4Full_("stss", 0, 0, [mp4U32_(stss.length), mp4U32_.apply(null, stss)]),
      mp4Full_("stsc", 0, 0, [mp4U32_(1, 1, n, 1)]),
      mp4Full_("stsz", 0, 0, [mp4U32_(0, n), sizes]),
      mp4Full_("stco", 0, 0, [mp4U32_(1, mdatOffset)])
    ]);
    const minf = mp4Box_("minf", [
      mp4Full_("vmhd", 0, 1, [new Uint8Array(8)]),
      mp4Box_("dinf", mp4Full_("dref", 0, 0, [mp4U32_(1), mp4Full_("url ", 0, 1, [])])),
      stbl
    ]);
    const mdia = mp4Box_("mdia", [
      mp4Full_("mdhd", 0, 0, [mp4U32_(0, 0, TS, dur), mp4U16_(0x55C4), mp4U16_(0)]),
      mp4Full_("hdlr", 0, 0, [mp4U32_(0), new Uint8Array([118, 105, 100, 101]), new Uint8Array(12), new Uint8Array([86, 105, 100, 101, 111, 0])]),
      minf
    ]);
    const trak = mp4Box_("trak", [
      mp4Full_("tkhd", 0, 3, [mp4U32_(0, 0, 1, 0, Math.round(dur * 1000 / TS)), new Uint8Array(8), mp4U16_(0), mp4U16_(0), mp4U16_(0), mp4U16_(0), matrix, mp4U32_(w << 16, h << 16)]),
      mdia
    ]);
    return mp4Box_("moov", [
      mp4Full_("mvhd", 0, 0, [mp4U32_(0, 0, 1000, Math.round(dur * 1000 / TS), 0x10000), mp4U16_(0x100), mp4U16_(0), new Uint8Array(8), matrix, zero36.subarray(0, 24), mp4U32_(2)]),
      trak
    ]);
  };
  const ftyp = mp4Box_("ftyp", [new Uint8Array([105, 115, 111, 109]), mp4U32_(0x200), new Uint8Array([105, 115, 111, 109, 105, 115, 111, 50, 97, 118, 99, 49, 109, 112, 52, 49])]);
  const moovLen = buildMoov(0).length;
  const mdatStart = ftyp.length + moovLen + 8;
  const moov = buildMoov(mdatStart);
  let body = 0; samples.forEach(sm=>body += sm.data.length);
  const mdatHead = mp4U32_(body + 8); const mdatTag = new Uint8Array([109, 100, 97, 116]);
  return new Blob([ftyp, moov, mdatHead, mdatTag].concat(samples.map(sm=>sm.data)), { type: "video/mp4" });
}

// extensão certa para o ficheiro conforme o que saiu do codificador / da gravação
function reelExt_(blob){ return (blob && /mp4/i.test(blob.type || "")) ? "mp4" : "webm"; }
function reelMime_(blob){ return (blob && blob.type) ? blob.type.split(";")[0] : "video/webm"; }

// H.264 por WebCodecs → .mp4. Devolve null se o aparelho não suportar (o chamador tenta o WebM).
async function mp4EncodeFrames_(canvas, drawFn, totalSec, fps, onProgress){
  if(typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  const w = canvas.width, h = canvas.height;
  let cfg = null;
  for(const codec of ["avc1.640028", "avc1.4d0028", "avc1.42002a", "avc1.42001f"]){
    const c = { codec, width: w, height: h, bitrate: 6000000, framerate: fps, avc: { format: "avc" } };
    try{ const s = await VideoEncoder.isConfigSupported(c); if(s && s.supported){ cfg = c; break; } }catch(e){}
  }
  if(!cfg) return null;
  const out = []; let err = null, avcC = null;
  const enc = new VideoEncoder({
    output: (chunk, meta)=>{
      if(meta && meta.decoderConfig && meta.decoderConfig.description && !avcC){
        const d = meta.decoderConfig.description; avcC = new Uint8Array(d instanceof ArrayBuffer ? d : d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));
      }
      const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data);
      out.push({ data, key: chunk.type === "key", ts: chunk.timestamp });
    },
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
  // sem descrição avcC, sem fotogramas, ou fotogramas fora de ordem (B-frames): este mux simples não os trata → tenta o WebM
  if(!avcC || out.length !== n || !out[0].key) return null;
  for(let i = 1; i < out.length; i++) if(out[i].ts <= out[i - 1].ts) return null;
  return mp4Mux_(out, w, h, fps, avcC);
}

// drawFn(tSegundos) desenha o fotograma no canvas; onProgress(0..1)
async function webmEncodeFrames_(canvas, drawFn, totalSec, fps, onProgress){
  if(typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  // v279: MP4 (H.264) primeiro — abre no TikTok, Instagram e iPhone; qualquer falha cai para o WebM abaixo
  try{ const mp4 = await mp4EncodeFrames_(canvas, drawFn, totalSec, fps, onProgress); if(mp4) return mp4; }catch(e){}
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
