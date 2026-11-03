/* Chest0 Clip — script (source : Chest0SocialStudio/src/chest0_social_studio/web/clip.html) */
(() => {
'use strict';
const $ = s => document.querySelector(s);

/* ---------- Réglages ---------- */
const FORMATS = [
  {id:'vertical',  w:1080, h:1920, label:'Vertical 9:16',  hint:'TikTok · YouTube Shorts · Reels · Pinterest'},
  {id:'portrait',  w:1080, h:1350, label:'Portrait 4:5',   hint:'Fil Instagram et Facebook'},
  {id:'pin',       w:1000, h:1500, label:'Épingle 2:3',    hint:'Pinterest'},
  {id:'square',    w:1080, h:1080, label:'Carré 1:1',      hint:'Instagram · Facebook'},
  {id:'landscape', w:1920, h:1080, label:'Paysage 16:9',   hint:'YouTube classique · Facebook'}
];
const TRANSITIONS = [
  ['auto','Mélange automatique (varie à chaque image)'],
  ['fade','Fondu enchaîné'],
  ['slide','Glissement'],
  ['zoom','Zoom'],
  ['black','Passage au noir'],
  ['cut','Coupe nette (sans effet)']
];
const AUTO = ['fade','slide','zoom','black'];
const STYLE_META = [
  {id:'lofi',    name:'Douceur',     desc:'Lo-fi calme · piano feutré'},
  {id:'pop',     name:'Inspiration', desc:'Pop lumineuse · rythme modéré'},
  {id:'zen',     name:'Zen',         desc:'Nappes et clochettes · sans rythme'},
  {id:'electro', name:'Énergie',     desc:'Électro dansante · rythme soutenu'},
  {id:'cinema',  name:'Cinématique', desc:'Cordes amples · tambours lointains'},
  {id:'acoustic',name:'Acoustique',  desc:'Guitare douce · rythme léger'},
  {id:'motiv',   name:'Motivation',  desc:'Électro puissante · très rythmée'},
  {id:'nature',  name:'Nature',      desc:'Piano rêveur · souffle du vent'},
  {id:'tropic',  name:'Tropical',    desc:'Marimba ensoleillé · détente'}
];
// Ouvert depuis Social Studio (http://127.0.0.1:8503/clip) : envoi direct dans « Mes vidéos ».
const SOCIAL = location.protocol.startsWith('http') && location.pathname === '/clip';
let lastBlob = null;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

const S = {format:'vertical', fit:'blur', imgDur:3, transDur:0.8, transition:'auto', kenburns:true, subs:false, subPos:'bottom', volume:0.8, music:'lofi'};
try { Object.assign(S, JSON.parse(localStorage.getItem('chest0clip') || '{}')); } catch (e) {}
if (S.music === 'file' || (S.music !== 'none' && !isLibId(S.music) && !['lofi','pop','zen','electro','cinema','acoustic','motiv','nature','tropic'].includes(S.music))) S.music = 'lofi';
if (!FORMATS.some(f => f.id === S.format)) S.format = 'vertical';
function isLibId(v) { return typeof v === 'string' && v.startsWith('lib:'); }
const save = () => { try { localStorage.setItem('chest0clip', JSON.stringify(S)); } catch (e) {} };

/* ---------- État ---------- */
let images = [];           // {id,name,url,img,caption,key,fg,bg,baseW,baseH}
let uid = 0;
let W = 1080, H = 1920;
const canvas = $('#stage'), ctx = canvas.getContext('2d');
const cA = document.createElement('canvas'), xA = cA.getContext('2d');
const cB = document.createElement('canvas'), xB = cB.getContext('2d');
let ac = null;
const ensureAC = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const transT = () => S.transition === 'cut' ? 0 : Math.min(S.transDur, S.imgDur * 0.8);
const total = () => images.length * S.imgDur;
function setStatus(msg, kind = '') { const el = $('#status'); el.textContent = msg; el.className = 'status ' + kind; }

/* ---------- Préparation des images ---------- */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function drawCover(g, img, w, h) {
  const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w / iw, h / ih);
  g.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s);
}
const prepared = [];
function prepare(it) {
  const key = W + 'x' + H + S.fit;
  const pos = prepared.indexOf(it);
  if (pos >= 0) prepared.splice(pos, 1);
  prepared.push(it);
  while (prepared.length > 6) { const old = prepared.shift(); old.fg = old.bg = null; old.key = null; }
  if (it.key === key) return;
  const iw = it.img.naturalWidth, ih = it.img.naturalHeight;
  const s = S.fit === 'blur' ? Math.min(W / iw, H / ih) * 0.94 : Math.max(W / iw, H / ih);
  it.baseW = iw * s; it.baseH = ih * s;
  it.fg = mkCanvas(it.baseW * 1.06, it.baseH * 1.06);
  const g = it.fg.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(it.img, 0, 0, it.fg.width, it.fg.height);
  it.bg = null;
  if (S.fit === 'blur') {
    const tiny = mkCanvas(24, 24 * H / W); drawCover(tiny.getContext('2d'), it.img, tiny.width, tiny.height);
    const mid = mkCanvas(W / 12, H / 12); const gm = mid.getContext('2d'); gm.imageSmoothingQuality = 'high'; gm.drawImage(tiny, 0, 0, mid.width, mid.height);
    const bg = mkCanvas(W / 5, H / 5); const gb = bg.getContext('2d'); gb.imageSmoothingQuality = 'high'; gb.drawImage(mid, 0, 0, bg.width, bg.height);
    gb.fillStyle = 'rgba(0,0,0,.30)'; gb.fillRect(0, 0, bg.width, bg.height);
    it.bg = bg;
  }
  it.key = key;
}

/* ---------- Dessin ---------- */
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function wrap(g, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean); if (!words.length) continue;
    let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (line && g.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; }
    out.push(line);
  }
  return out;
}
function drawCaption(g, text) {
  const base = Math.min(W, H); let fs = Math.round(base * 0.058); const maxW = W * 0.82;
  g.font = `700 ${fs}px ${FONT}`; let lines = wrap(g, text, maxW);
  while (lines.length > 5 && fs > base * 0.032) { fs = Math.round(fs * 0.88); g.font = `700 ${fs}px ${FONT}`; lines = wrap(g, text, maxW); }
  if (!lines.length) return;
  const lh = fs * 1.24, pad = fs * 0.55;
  const tw = Math.min(W * 0.92, Math.max(...lines.map(l => g.measureText(l).width)));
  const bw = tw + pad * 2, bh = lines.length * lh + pad;
  const vertical = H > W * 1.3;
  let cy;
  if (S.subPos === 'top') cy = H * (vertical ? 0.14 : 0.09) + bh / 2;
  else if (S.subPos === 'middle') cy = H / 2;
  else cy = H * (vertical ? 0.79 : 0.91) - bh / 2;   // au-dessus de la zone des boutons TikTok/Reels
  const x = (W - bw) / 2, y = cy - bh / 2;
  g.fillStyle = 'rgba(0,0,0,.62)'; roundRect(g, x, y, bw, bh, fs * 0.38); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, k) => g.fillText(l, W / 2, y + pad / 2 + lh * (k + 0.5)));
}
function drawLayer(g, i, u) {
  const it = images[i]; prepare(it);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (it.bg) { g.imageSmoothingQuality = 'high'; g.drawImage(it.bg, 0, 0, W, H); }
  let z = 1;
  if (S.kenburns) { const e = ease(u); z = i % 2 === 0 ? 1 + 0.05 * e : 1.05 - 0.05 * e; }
  const w = it.baseW * z, h = it.baseH * z;
  g.drawImage(it.fg, (W - w) / 2, (H - h) / 2, w, h);
  if (S.subs && it.caption.trim()) drawCaption(g, it.caption);
}
function renderFrame(t) {
  const n = images.length;
  if (!n) { ctx.fillStyle = '#141416'; ctx.fillRect(0, 0, W, H); return; }
  const d = S.imgDur, T = transT(), D = n * d;
  t = clamp(t, 0, D - 1e-3);
  const i = Math.min(n - 1, Math.floor(t / d)), local = t - i * d;
  const u = k => { const st = k > 0 ? k * d - T : 0, span = k > 0 ? d + T : d; return clamp((t - st) / span); };
  if (i < n - 1 && T > 0 && local > d - T) {
    const p = ease((local - (d - T)) / T);
    const type = S.transition === 'auto' ? AUTO[i % AUTO.length] : S.transition;
    drawLayer(xA, i, u(i)); drawLayer(xB, i + 1, u(i + 1));
    ctx.globalAlpha = 1;
    if (type === 'slide') { ctx.drawImage(cA, -p * W, 0); ctx.drawImage(cB, (1 - p) * W, 0); }
    else if (type === 'zoom') {
      const s = 1 + 0.25 * p; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(cA, -W / 2, -H / 2); ctx.restore();
      ctx.globalAlpha = p; ctx.drawImage(cB, 0, 0); ctx.globalAlpha = 1;
    } else if (type === 'black') {
      ctx.drawImage(p < .5 ? cA : cB, 0, 0);
      ctx.fillStyle = `rgba(0,0,0,${p < .5 ? p * 2 : (1 - p) * 2})`; ctx.fillRect(0, 0, W, H);
    } else { ctx.drawImage(cA, 0, 0); ctx.globalAlpha = p; ctx.drawImage(cB, 0, 0); ctx.globalAlpha = 1; }
  } else {
    drawLayer(ctx, i, u(i));
    if (i < n - 1 && local < 0.5) prepare(images[i + 1]);   // prépare l'image suivante à l'avance
  }
}

/* ---------- Musique générée ---------- */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function kitFor(ac, out, seed) {
  const rng = mulberry(seed), sr = ac.sampleRate;
  const nb = ac.createBuffer(1, sr, sr); { const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rng() * 2 - 1; }
  const len = Math.round(sr * 2.8), ir = ac.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (rng() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ac.createConvolver(); conv.buffer = ir; const wet = ac.createGain(); wet.gain.value = 0.45; conv.connect(wet); wet.connect(out);
  const bus = send => { const g = ac.createGain(); g.connect(out); if (send) { const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(conv); } return g; };
  const B = {pad: bus(.7), keys: bus(.4), bass: bus(0), drums: bus(.08), bell: bus(.8)};
  const env = (g, t, a, peak, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
  function tone(dst, type, f, t, dur, vol, a = .005, cut = 0, q = .7) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = ac.createGain(); env(g, t, a, vol, dur); let n = o;
    if (cut) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = q; o.connect(fl); n = fl; }
    n.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, vol, type, freq, q = .7) {
    const s = ac.createBufferSource(); s.buffer = nb; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); env(g, t, .001, vol, dur); s.connect(f); f.connect(g); g.connect(B.drums); s.start(t, rng() * .5); s.stop(t + dur + .05);
  }
  return {
    rng,
    pad(notes, t, dur, vol, a = .8, cut = 1100) {
      const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = .4;
      const g = ac.createGain(); const at = Math.min(a, dur * .45);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.setValueAtTime(vol, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .9);
      fl.connect(g); g.connect(B.pad);
      for (const m of notes) for (const dt of [-9, 9]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + dur + 1); }
    },
    swell(m, t, dur, vol) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m); const g = ac.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .6); g.gain.setValueAtTime(vol, t + dur - .2); g.gain.linearRampToValueAtTime(0, t + dur + .6);
      o.connect(g); g.connect(B.bass); o.start(t); o.stop(t + dur + .7);
    },
    piano(m, t, vol) { tone(B.keys, 'triangle', mtof(m), t, 1.6, vol, .004, 3000); tone(B.keys, 'sine', mtof(m + 12), t, .7, vol * .35, .004); },
    pluck(m, t, vol, cut = 2400) { tone(B.keys, 'sawtooth', mtof(m), t, .32, vol, .003, cut, 1.2); },
    bass(m, t, dur, vol, type = 'triangle', cut = 650) { tone(B.bass, type, mtof(m), t, dur, vol, .008, cut); },
    kick(t, vol) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .13);
      const g = ac.createGain(); env(g, t, .002, vol, .42); o.connect(g); g.connect(B.drums); o.start(t); o.stop(t + .5);
    },
    snare(t, vol) { noise(t, .2, vol, 'bandpass', 1900, .8); tone(B.drums, 'triangle', 190, t, .12, vol * .5, .002); },
    clap(t, vol) { noise(t, .16, vol, 'highpass', 1300); },
    hat(t, vol) { noise(t, .05, vol, 'highpass', 7600); },
    guitar(m, t, vol) { tone(B.keys, 'triangle', mtof(m), t, 1.1, vol, .002, 2600); tone(B.keys, 'sawtooth', mtof(m), t, .22, vol * .22, .002, 3600); },
    marimba(m, t, vol) { tone(B.keys, 'sine', mtof(m), t, .5, vol, .002); tone(B.keys, 'sine', mtof(m) * 4, t, .08, vol * .3, .001); },
    tom(t, vol) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(62, t + .3);
      const g = ac.createGain(); env(g, t, .003, vol, .7); o.connect(g); g.connect(B.drums); o.start(t); o.stop(t + .8);
    },
    wind(t, dur, vol) {
      const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = .5;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur / 2); g.gain.linearRampToValueAtTime(0, t + dur);
      s.connect(f); f.connect(g); g.connect(B.pad); s.start(t); s.stop(t + dur + .1);
    },
    bell(m, t, vol) { tone(B.bell, 'sine', mtof(m), t, 3.2, vol, .004); tone(B.bell, 'sine', mtof(m) * 2, t, 1.4, vol * .22, .004); tone(B.bell, 'sine', mtof(m) * 3.01, t, .6, vol * .08, .004); }
  };
}
const STYLES = {
  lofi: {seed: 11, bar: 4 * 60 / 76, build(k, D) {
    const b = 60 / 76, bar = 4 * b, P = [[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]], R = [41,40,38,36], A = [0,2,1,3,2,1,3,2];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4], sw = j => j % 2 ? b * .09 : 0;
      k.pad(ch, t0, bar, .016, 1.2, 900);
      for (let j = 0; j < 8; j++) { if (k.rng() < .18) continue; k.piano(ch[A[j]] + 12, t0 + j * b / 2 + sw(j), .085 * (j % 2 ? .7 : 1) * (.85 + .3 * k.rng())); }
      k.bass(R[i % 4], t0, b * 1.8, .2, 'sine', 400); k.bass(R[i % 4], t0 + 2 * b, b * 1.6, .16, 'sine', 400);
      if (i >= 1) { k.kick(t0, .5); k.kick(t0 + 2.5 * b, .42); k.snare(t0 + b, .13); k.snare(t0 + 3 * b, .13); for (let j = 0; j < 8; j++) k.hat(t0 + j * b / 2 + sw(j), .028); }
    }
  }},
  pop: {seed: 23, bar: 4 * 60 / 100, build(k, D) {
    const b = 60 / 100, bar = 4 * b, P = [[60,64,67],[59,62,67],[57,60,64],[57,60,65]], R = [36,43,45,41], A = [0,1,2,1,0,1,2,1];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch, t0, bar, .014, .5, 1400);
      for (let j = 0; j < 8; j++) k.pluck(ch[A[j]] + 12, t0 + j * b / 2, .05 * (j % 2 ? .75 : 1));
      if (i >= 1) for (let j = 0; j < 8; j++) k.bass(R[i % 4], t0 + j * b / 2, b * .42, .15, 'triangle', 700);
      if (i >= 2) { for (let j = 0; j < 4; j++) { k.kick(t0 + j * b, .5); k.hat(t0 + (j + .5) * b, .04); } k.clap(t0 + b, .14); k.clap(t0 + 3 * b, .14); }
    }
  }},
  zen: {seed: 37, bar: 4, build(k, D) {
    const bar = 4, P = [[57,60,64,69],[53,57,60,65],[55,60,64,67],[55,59,62,67]], R = [45,41,48,43], PEN = [69,72,74,76,79,81,84], POS = [0,1,1.5,2,2.5,3];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar;
      k.pad(P[i % 4], t0, bar, .02, 1.6, 800); k.swell(R[i % 4], t0, bar, .12);
      const c = 1 + (k.rng() < .5 ? 1 : 0);
      for (let j = 0; j < c; j++) k.bell(PEN[Math.floor(k.rng() * PEN.length)], t0 + POS[Math.floor(k.rng() * POS.length)], .045);
    }
  }},
  electro: {seed: 41, bar: 4 * 60 / 122, build(k, D) {
    const b = 60 / 122, bar = 4 * b, P = [[69,72,76],[69,72,77],[67,72,76],[67,71,74]], R = [45,41,48,43], A = [0,1,2,1,2,1,0,2];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch.map(m => m - 12), t0, bar, .011, .3, 1600);
      if (i >= 1) for (let j = 0; j < 4; j++) { k.kick(t0 + j * b, .58); k.hat(t0 + (j + .5) * b, .05); k.bass(R[i % 4], t0 + (j + .5) * b, b * .42, .17, 'sawtooth', 750); }
      if (i >= 2) { k.clap(t0 + b, .15); k.clap(t0 + 3 * b, .15); for (let j = 0; j < 8; j++) k.pluck(ch[A[j]] + (j % 4 === 3 ? 12 : 0), t0 + j * b / 2, .04, 2800); }
    }
  }}
};
// Chaque ambiance est calculée une seule fois (20 mesures : introduction + boucle),
// puis découpée à la durée voulue : instantané quelle que soit la longueur de la vidéo.
const styleCache = {};
function styleSource(id) {
  if (styleCache[id]) return styleCache[id];
  return styleCache[id] = (async () => {
    const st = STYLES[id], sr = 44100, len = 20 * st.bar;
    const oac = new OfflineAudioContext(2, Math.ceil(len * sr), sr);
    const comp = oac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.knee.value = 8; comp.attack.value = .006; comp.release.value = .25;
    const sum = oac.createGain(); sum.connect(comp); comp.connect(oac.destination);
    st.build(kitFor(oac, sum, st.seed), len);
    const buf = await oac.startRendering();
    let peak = 0; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } }
    if (peak > 0) { const gn = .89 / peak; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= gn; } }
    return {buf, loopStart: 12 * st.bar, loopLen: 8 * st.bar};
  })().catch(e => { delete styleCache[id]; throw e; });
}
Object.assign(STYLES, {
  cinema: {seed: 53, bar: 4 * 60 / 70, build(k, D) {
    const b = 60 / 70, bar = 4 * b, P = [[62,65,69],[58,62,65],[60,65,69],[60,64,67]], R = [38,34,41,36];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch, t0, bar, .02, 2.2, 1300); k.pad(ch.map(m => m - 12), t0, bar, .014, 2.2, 700); k.swell(R[i % 4], t0, bar, .1);
      k.piano(ch[2] + 12, t0, .07); k.piano(ch[1] + 12, t0 + 2 * b, .055);
      if (i >= 4) { k.kick(t0, .5); k.tom(t0 + 2.5 * b, .42); k.tom(t0 + 3 * b, .3); }
    }
  }},
  acoustic: {seed: 61, bar: 4 * 60 / 92, build(k, D) {
    const b = 60 / 92, bar = 4 * b, P = [[55,59,62,67],[50,54,57,62],[52,55,59,64],[48,52,55,60]], R = [43,38,40,36], A = [0,2,1,3,2,1,3,2];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      for (let j = 0; j < 8; j++) k.guitar(ch[A[j]] + 12, t0 + j * b / 2 + (j % 2 ? b * .05 : 0), .07 * (j % 2 ? .75 : 1) * (.9 + .2 * k.rng()));
      k.bass(R[i % 4], t0, b * 1.7, .16); k.bass(R[i % 4], t0 + 2 * b, b * 1.7, .13);
      if (i >= 1) { for (let j = 0; j < 8; j++) k.hat(t0 + j * b / 2, j % 2 ? .022 : .014); k.kick(t0, .34); k.kick(t0 + 2.5 * b, .28); }
      if (i >= 2) { k.clap(t0 + b, .07); k.clap(t0 + 3 * b, .07); }
    }
  }},
  motiv: {seed: 71, bar: 4 * 60 / 128, build(k, D) {
    const b = 60 / 128, bar = 4 * b, P = [[64,67,71],[64,67,72],[62,67,71],[62,66,69]], R = [40,36,43,38];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch, t0, bar, .016, .2, 2200);
      for (let j = 0; j < 4; j++) {
        k.hat(t0 + (j + .5) * b, .06); k.hat(t0 + (j + .25) * b, .018); k.hat(t0 + (j + .75) * b, .018);
        if (i >= 2) { k.kick(t0 + j * b, .62); for (const m of ch) k.pluck(m, t0 + (j + .5) * b, .03, 3000); }
        if (i >= 1) { k.bass(R[i % 4], t0 + j * b, b * .4, .15, 'sawtooth', 900); k.bass(R[i % 4], t0 + (j + .5) * b, b * .4, .15, 'sawtooth', 900); }
      }
      if (i >= 2) { k.clap(t0 + b, .17); k.clap(t0 + 3 * b, .17); }
    }
  }},
  nature: {seed: 83, bar: 4 * 60 / 66, build(k, D) {
    const b = 60 / 66, bar = 4 * b, P = [[48,52,55,59],[45,52,55,60],[41,48,52,57],[43,50,55,59]], POS = [0, 1, 1.5, 2.5, 3];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch, t0, bar, .012, 1.8, 700); k.wind(t0, bar * 1.5, .05); k.piano(ch[0], t0, .06);
      const used = new Set();
      for (let j = 0; j < 3; j++) { const p = POS[Math.floor(k.rng() * POS.length)]; if (used.has(p)) continue; used.add(p);
        k.piano(ch[Math.floor(k.rng() * ch.length)] + (k.rng() < .5 ? 24 : 12), t0 + p * b, .06 * (.8 + .4 * k.rng())); }
    }
  }},
  tropic: {seed: 97, bar: 4 * 60 / 104, build(k, D) {
    const b = 60 / 104, bar = 4 * b, P = [[53,57,60,64],[55,59,62,67],[52,55,59,64],[57,60,64,69]], R = [41,43,40,45], STEPS = [0,3,5,6], A = [3,1,2,0];
    for (let i = 0; i * bar < D; i++) {
      const t0 = i * bar, ch = P[i % 4];
      k.pad(ch, t0, bar, .009, .4, 1500);
      STEPS.forEach((st, j) => k.marimba(ch[A[j]] + 12, t0 + st * b / 2, .1));
      if (i >= 1) {
        k.bass(R[i % 4], t0, b * .9, .18, 'sine', 500); k.bass(R[i % 4], t0 + 1.5 * b, b * .5, .14, 'sine', 500); k.bass(R[i % 4] + 7, t0 + 2.5 * b, b * .9, .14, 'sine', 500);
        for (let j = 0; j < 16; j++) k.hat(t0 + j * b / 4, j % 4 === 2 ? .03 : .012);
      }
      if (i >= 2) { k.kick(t0, .45); k.kick(t0 + 2.5 * b, .4); k.clap(t0 + b, .1); k.clap(t0 + 3 * b, .1); }
    }
  }}
});

/* ---------- Ma bibliothèque musicale ----------
   Dans Social Studio : dossier « Musiques Chest0 » du Mac, lu par le serveur local.
   Fichier autonome : dossier ou fichiers choisis pendant la séance (le navigateur ne peut pas s'en souvenir). */
let tracks = [];   // {key, name, source:'server'|'local', file?, buffer?}
const trackOf = key => tracks.find(t => t.key === key);
const isLib = id => typeof id === 'string' && id.startsWith('lib:');
const AUDIO_RX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i;
const prettyName = n => n.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
async function trackBuffer(t) {
  if (t.buffer) return t.buffer;
  ensureAC();
  const arr = t.source === 'server'
    ? await (async () => { const r = await fetch('/api/clip/music/' + encodeURIComponent(t.name), {cache: 'no-store'}); if (!r.ok) throw new Error(); return r.arrayBuffer(); })()
    : await t.file.arrayBuffer();
  t.buffer = await new Promise((res, rej) => ac.decodeAudioData(arr, res, rej));
  return t.buffer;
}
async function loadServerLibrary() {
  try {
    const r = await fetch('/api/clip/music', {cache: 'no-store'}); if (!r.ok) throw new Error();
    const data = await r.json();
    const keep = new Map(tracks.filter(t => t.source === 'server').map(t => [t.key, t]));
    tracks = [...data.tracks.map(n => keep.get('lib:' + n) || {key: 'lib:' + n, name: n, source: 'server'}), ...tracks.filter(t => t.source === 'local')];
    $('#libHelp').textContent = `Déposez vos morceaux (MP3, M4A, WAV…) dans le dossier « ${data.folder} » de votre Mac : ils apparaissent ici automatiquement. Cliquez sur « Actualiser la liste » après en avoir ajouté.`;
  } catch (e) { $('#libHelp').textContent = 'Bibliothèque musicale indisponible : Social Studio doit être relancé pour l’activer (dans le Hub : Arrêter, puis Lancer).'; }
  if (isLib(S.music) && !trackOf(S.music)) S.music = 'none';
  renderMusicList();
}
function addLocalTracks(files) {
  const list = [...files].filter(f => AUDIO_RX.test(f.name) || (f.type || '').startsWith('audio/'));
  list.sort((a, b) => a.name.localeCompare(b.name, 'fr', {numeric: true, sensitivity: 'base'}));
  for (const f of list) { const key = 'lib:' + f.name + '|' + f.size; if (!trackOf(key)) tracks.push({key, name: f.name, source: 'local', file: f}); }
  if (!list.length) setStatus('Aucun fichier audio trouvé (MP3, M4A, WAV, AAC, OGG ou FLAC).', 'err');
  else if (!isLib(S.music)) { S.music = 'lib:' + list[0].name + '|' + list[0].size; save(); }
  renderMusicList();
}

async function renderTrack(id, D) {
  const sr = 44100, N = Math.max(1, Math.ceil(D * sr)), fadeN = Math.max(1, Math.round(Math.min(2.5, D * .25) * sr));
  if (isLib(id)) {
    const userBuf = await trackBuffer(trackOf(id));
    const oac = new OfflineAudioContext(2, N, sr), master = oac.createGain();
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .04);
    master.gain.setValueAtTime(1, Math.max(.05, D - fadeN / sr)); master.gain.linearRampToValueAtTime(0, D);
    const s = oac.createBufferSource(); s.buffer = userBuf; s.loop = true; s.connect(master); master.connect(oac.destination); s.start(0);
    return oac.startRendering();
  }
  const st = await styleSource(id), src = st.buf;
  const out = ensureAC().createBuffer(2, N, sr), a = Math.round(st.loopStart * sr), L = Math.round(st.loopLen * sr);
  for (let c = 0; c < 2; c++) {
    const s = src.getChannelData(c), d = out.getChannelData(c);
    for (let i = 0; i < N; i++) { const j = i < a ? i : a + (i - a) % L; d[i] = i > N - fadeN ? s[j] * (N - i) / fadeN : s[j]; }
  }
  return out;
}
let musicCache = {key: '', buf: null};
async function getMusic(D) {
  if (S.music === 'none' || (isLib(S.music) && !trackOf(S.music)) || (!isLib(S.music) && !STYLES[S.music])) return null;
  const key = S.music + '|' + D.toFixed(3);
  if (musicCache.key === key) return musicCache.buf;
  setStatus('Préparation de la musique…');
  const buf = await renderTrack(S.music, D);
  musicCache = {key, buf}; setStatus('');
  return buf;
}

/* ---------- Écoute rapide d'une ambiance ---------- */
let listenSrc = null, listenId = null; const listenCache = {};
function stopListen() { if (listenSrc) { try { listenSrc.stop(); } catch (e) {} } listenSrc = null; listenId = null; }
async function listen(id) {
  const was = listenId === id; stopListen(); renderMusicList();
  if (was) return;
  pause(); ensureAC(); await ac.resume();
  listenId = id; renderMusicList();
  let buf;
  try { buf = isLib(id) ? await trackBuffer(trackOf(id)) : (listenCache[id] || (listenCache[id] = await renderTrack(id, 14))); }
  catch (e) { listenId = null; renderMusicList(); setStatus('Ce morceau ne peut pas être lu : utilisez un fichier MP3, M4A ou WAV.', 'err'); return; }
  if (listenId !== id) return;
  const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; g.gain.value = S.volume;
  src.connect(g); g.connect(ac.destination); src.start(0, 0, isLib(id) ? Math.min(30, buf.duration) : undefined); listenSrc = src;
  src.onended = () => { if (listenSrc === src) { listenSrc = null; listenId = null; renderMusicList(); } };
}

/* ---------- Aperçu ---------- */
let playing = false, playStart = 0, pos = 0, previewSrc = null, previewGain = null, raf = 0;
function updateTime() {
  const D = total();
  $('#time').textContent = fmtTime(pos) + ' / ' + fmtTime(D);
  $('#scrub').value = D ? Math.round(pos / D * 1000) : 0;
}
async function play() {
  if (!images.length || playing) return;
  stopListen(); renderMusicList();
  ensureAC(); await ac.resume();
  const D = total(); if (pos >= D - .05) pos = 0;
  playing = true; $('#play').textContent = '❚❚ Pause';
  let buf = null; try { buf = await getMusic(D); } catch (e) { setStatus("La musique n'a pas pu être lue.", 'err'); }
  if (!playing) return;
  const start = ac.currentTime + .05;
  if (buf) {
    previewSrc = ac.createBufferSource(); previewSrc.buffer = buf; previewGain = ac.createGain(); previewGain.gain.value = S.volume;
    previewSrc.connect(previewGain); previewGain.connect(ac.destination); previewSrc.start(start, pos);
  }
  playStart = start - pos;
  const tick = () => {
    if (!playing) return;
    const t = ac.currentTime - playStart;
    if (t >= D) { pause(); pos = 0; renderFrame(0); updateTime(); return; }
    pos = Math.max(0, t); renderFrame(pos); updateTime(); raf = requestAnimationFrame(tick);
  };
  tick();
}
function pause() {
  playing = false; cancelAnimationFrame(raf);
  if (previewSrc) { try { previewSrc.stop(); } catch (e) {} }
  previewSrc = null; previewGain = null; $('#play').textContent = '▶ Aperçu';
}
function seekToImage(i) { pause(); const d = S.imgDur; pos = i * d + (d - transT()) / 2; renderFrame(pos); updateTime(); }

/* ---------- Création de la vidéo ---------- */
const IS_SAFARI = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
function pickMime() {
  // Priorité : H.264 + AAC (accepté par toutes les plateformes). « video/mp4 » seul n'est sûr que dans Safari.
  const list = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.4d0028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2',
    ...(IS_SAFARI ? ['video/mp4'] : []), 'video/mp4;codecs=avc1.640028,opus', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  return list.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
}
let job = null, lastUrl = null;
document.addEventListener('visibilitychange', () => { if (job && document.hidden) job.hidden = true; });
function lock(on) {
  $('#left').classList.toggle('locked', on); $('#play').disabled = on; $('#scrub').disabled = on;
  const b = $('#export'); b.textContent = on ? 'Annuler' : 'Créer la vidéo'; b.classList.toggle('cancel', on);
  $('#progress').hidden = !on;
}
async function exportVideo() {
  if (job) { job.cancel = true; return; }
  if (!images.length) return;
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) { setStatus("Ce navigateur ne sait pas enregistrer de vidéo : ouvrez Chest0 Clip avec Safari.", 'err'); return; }
  pause(); stopListen(); renderMusicList();
  ensureAC(); await ac.resume();
  const D = total(), mime = pickMime();
  job = {cancel: false, hidden: document.hidden}; const me = job;
  lock(true); $('#result').hidden = true; $('#progress div').style.width = '0';
  let buf = null; try { buf = await getMusic(D); } catch (e) { buf = null; }
  setStatus('Création en cours… Laissez cette fenêtre visible jusqu\'à la fin.');
  const vStream = canvas.captureStream(30);
  const dest = ac.createMediaStreamDestination(), g = ac.createGain(); g.gain.value = buf ? S.volume : 0; g.connect(dest);
  let src;
  if (buf) { src = ac.createBufferSource(); src.buffer = buf; } else { src = ac.createOscillator(); }   // piste son muette si pas de musique
  src.connect(g);
  const stream = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const opts = {videoBitsPerSecond: 12000000, audioBitsPerSecond: 192000}; if (mime) opts.mimeType = mime;
  let rec; try { rec = new MediaRecorder(stream, opts); } catch (e) { rec = new MediaRecorder(stream); }
  const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });
  renderFrame(0);
  rec.start();
  const t0 = ac.currentTime + .25; src.start(t0);
  await new Promise(resolve => {
    const loop = () => {
      const t = ac.currentTime - t0;
      if (me.cancel) return resolve();
      renderFrame(Math.max(0, t));
      $('#progress div').style.width = clamp(t / D) * 100 + '%';
      if (t >= D + .15) return resolve();
      requestAnimationFrame(loop);
    };
    loop();
  });
  rec.stop(); try { src.stop(); } catch (e) {}
  await stopped;
  vStream.getTracks().forEach(t => t.stop()); g.disconnect();
  job = null; lock(false); pos = 0; renderFrame(0); updateTime();
  if (me.cancel) { setStatus('Création annulée.'); return; }
  const type = rec.mimeType || mime || 'video/webm', ext = type.includes('mp4') ? 'mp4' : 'webm';
  const blob = new Blob(chunks, {type: type.split(';')[0]});
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(blob);
  const now = new Date(), stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const name = `chest0-clip-${S.format}-${stamp}.${ext}`;
  lastBlob = blob;
  $('#out').src = lastUrl; const a = $('#dl'); a.href = lastUrl; a.download = name; $('#result').hidden = false;
  let msg;
  if (SOCIAL) {
    a.textContent = 'Télécharger aussi sur mon Mac';
    $('#sendBox').hidden = false; $('#sendBtn').disabled = false; $('#sendStatus').textContent = '';
    msg = `Vidéo prête (${(blob.size / 1048576).toFixed(1)} Mo). Donnez-lui un titre puis envoyez-la dans Mes vidéos.`;
    setStatus(msg + (me.hidden ? ' La fenêtre a été masquée pendant la création : si la vidéo saccade, recommencez.' : ''), me.hidden ? 'err' : 'ok');
    $('#sTitle').focus();
    return;
  }
  a.click();
  msg = `Vidéo prête : ${name} (${(blob.size / 1048576).toFixed(1)} Mo), envoyée dans vos Téléchargements.`;
  const fullCompat = /mp4a/.test(mime) || (mime === 'video/mp4' && IS_SAFARI);
  if (!fullCompat) msg += ' Attention : ce navigateur ne produit pas le format le plus compatible (vidéo H.264 + son AAC). Pour TikTok et Instagram, ouvrez Chest0 Clip avec Safari.';
  if (me.hidden) msg += ' La fenêtre a été masquée pendant la création : si la vidéo saccade, recommencez sans changer de fenêtre.';
  setStatus(msg, fullCompat && !me.hidden ? 'ok' : 'err');
}

/* ---------- Interface ---------- */
function refresh() {
  const n = images.length, D = total();
  $('#summary').hidden = !n; $('#empty').hidden = !!n; $('#export').disabled = !n; $('#play').disabled = !n;
  let txt = `${n} image${n > 1 ? 's' : ''} · durée totale ${fmtTime(D)}`;
  $('#countText').innerHTML = txt + (S.format === 'vertical' && D > 180 ? ' · <span class="warn">plus de 3 min : refusé par YouTube Shorts et les Reels</span>' : '');
  if (pos > D) pos = 0;
  renderFrame(pos); updateTime();
}
function renderList() {
  const ol = $('#list'); ol.innerHTML = '';
  images.forEach((it, i) => {
    const li = document.createElement('li'); li.className = 'thumb'; li.draggable = true; li.dataset.i = i;
    li.innerHTML = `<div class="pic" title="Voir dans l'aperçu"><img alt=""><span class="idx">${i + 1}</span><button class="x" title="Retirer cette image" aria-label="Retirer">×</button></div>
      <div class="moves"><button class="sbtn" data-mv="-1" title="Placer plus tôt" ${i === 0 ? 'disabled' : ''}>←</button><button class="sbtn" data-mv="1" title="Placer plus tard" ${i === images.length - 1 ? 'disabled' : ''}>→</button></div>
      ${S.subs ? '<textarea rows="2" placeholder="Texte (facultatif)"></textarea>' : ''}`;
    li.querySelector('img').src = it.url;
    const ta = li.querySelector('textarea');
    if (ta) { ta.value = it.caption; ta.addEventListener('input', () => { it.caption = ta.value; seekToImage(images.indexOf(it)); }); }
    li.querySelector('.pic').addEventListener('click', e => { if (!e.target.closest('.x')) seekToImage(i); });
    li.querySelector('.x').addEventListener('click', () => { pause(); images.splice(i, 1); URL.revokeObjectURL(it.url); renderList(); refresh(); });
    li.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', () => move(i, i + +b.dataset.mv)));
    li.addEventListener('dragstart', e => { dragFrom = i; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
    li.addEventListener('dragend', () => { dragFrom = -1; li.classList.remove('dragging'); });
    li.addEventListener('dragover', e => { if (dragFrom < 0) return; e.preventDefault(); li.classList.add('over'); });
    li.addEventListener('dragleave', () => li.classList.remove('over'));
    li.addEventListener('drop', e => { if (dragFrom < 0) return; e.preventDefault(); e.stopPropagation(); li.classList.remove('over'); move(dragFrom, i); });
    ol.appendChild(li);
  });
}
let dragFrom = -1;
function move(from, to) {
  if (to < 0 || to >= images.length || from === to) return;
  pause(); const [it] = images.splice(from, 1); images.splice(to, 0, it); renderList(); seekToImage(to);
}
async function addFiles(files) {
  const list = [...files].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i.test(f.name));
  if (!list.length) return;
  list.sort((a, b) => a.name.localeCompare(b.name, 'fr', {numeric: true, sensitivity: 'base'}));
  pause(); setStatus('Chargement des images…');
  const failed = [];
  for (const f of list) {
    const url = URL.createObjectURL(f), img = new Image(); img.src = url;
    try { await img.decode(); images.push({id: ++uid, name: f.name, url, img, caption: '', key: null, fg: null, bg: null}); }
    catch (e) { URL.revokeObjectURL(url); failed.push(f.name); }
  }
  setStatus(failed.length ? `Impossible d'ouvrir : ${failed.join(', ')}. Enregistrez-les en JPG ou PNG puis réessayez.` : '', failed.length ? 'err' : '');
  renderList(); refresh();
}
function renderFormats() {
  const box = $('#formats'); box.innerHTML = '';
  for (const f of FORMATS) {
    const b = document.createElement('button'); b.className = 'fmt' + (S.format === f.id ? ' sel' : '');
    const r = 24 / Math.max(f.w, f.h);
    b.innerHTML = `<span class="shape"><i style="width:${Math.round(f.w * r)}px;height:${Math.round(f.h * r)}px"></i></span><span><b>${f.label}</b><span>${f.hint}</span></span>`;
    b.addEventListener('click', () => { S.format = f.id; save(); applyFormat(); renderFormats(); });
    box.appendChild(b);
  }
}
function applyFormat() {
  pause(); const f = FORMATS.find(x => x.id === S.format); W = f.w; H = f.h;
  for (const c of [canvas, cA, cB]) { c.width = W; c.height = H; }
  refresh();
}
function musicItem(m, box, extra) {
  const d = document.createElement('div'); d.className = 'mitem' + (S.music === m.id ? ' sel' : '');
  d.innerHTML = `<span class="dot"></span><span class="mtext"><b></b><span></span></span>${extra || ''}`;
  d.querySelector('b').textContent = m.name; d.querySelector('.mtext span').textContent = m.desc;
  d.addEventListener('click', e => {
    if (e.target.closest('button')) { listen(m.id); return; }
    pause(); S.music = m.id; save(); renderMusicList();
  });
  box.appendChild(d);
}
function renderMusicList() {
  const box = $('#musicList'); box.innerHTML = '';
  for (const m of [{id: 'none', name: 'Sans musique', desc: 'Vidéo silencieuse'}, ...STYLE_META])
    musicItem(m, box, STYLES[m.id] ? `<button class="sbtn">${listenId === m.id ? '■' : '▶'}</button>` : '');
  const lib = $('#libList'); lib.innerHTML = '';
  for (const t of tracks)
    musicItem({id: t.key, name: prettyName(t.name), desc: t.source === 'local' ? 'Ajouté pour cette séance' : 'Dossier Musiques Chest0'}, lib,
      `<button class="sbtn">${listenId === t.key ? '■ Stop' : '▶ Écouter'}</button>`);
  $('#libCount').textContent = tracks.length ? `${tracks.length} morceau${tracks.length > 1 ? 'x' : ''}` : '';
}
function syncControls() {
  $('#imgDur').value = S.imgDur; $('#oImg').textContent = S.imgDur.toLocaleString('fr-FR') + ' s';
  $('#transDur').value = S.transDur; $('#oTr').textContent = S.transition === 'cut' ? 'sans effet' : transT().toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' s';
  $('#transDur').disabled = S.transition === 'cut';
  $('#transition').value = S.transition; $('#kenburns').checked = S.kenburns;
  document.querySelectorAll('[data-fit]').forEach(b => b.classList.toggle('sel', b.dataset.fit === S.fit));
  $('#volume').value = S.volume; $('#oVol').textContent = Math.round(S.volume * 100) + ' %';
  $('#subs').checked = S.subs; $('#subOpts').hidden = !S.subs; $('#subPos').value = S.subPos;
}

// Écouteurs
$('#transition').innerHTML = TRANSITIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
const onSet = (k, v, rerenderList) => { S[k] = v; save(); pause(); syncControls(); if (rerenderList) renderList(); refresh(); };
$('#imgDur').addEventListener('input', e => onSet('imgDur', +e.target.value));
$('#transDur').addEventListener('input', e => onSet('transDur', +e.target.value));
$('#transition').addEventListener('change', e => onSet('transition', e.target.value));
$('#kenburns').addEventListener('change', e => onSet('kenburns', e.target.checked));
document.querySelectorAll('[data-fit]').forEach(b => b.addEventListener('click', () => onSet('fit', b.dataset.fit)));
$('#subs').addEventListener('change', e => onSet('subs', e.target.checked, true));
$('#subPos').addEventListener('change', e => onSet('subPos', e.target.value));
$('#volume').addEventListener('input', e => { S.volume = +e.target.value; save(); syncControls(); if (previewGain) previewGain.gain.value = S.volume; });
$('#fileImages').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
$('#fileMusic').addEventListener('change', e => { pause(); stopListen(); addLocalTracks(e.target.files); e.target.value = ''; });
$('#folderMusic').addEventListener('change', e => { pause(); stopListen(); addLocalTracks(e.target.files); e.target.value = ''; });
$('#libAdd').addEventListener('click', () => $('#fileMusic').click());
$('#libRefresh').addEventListener('click', loadServerLibrary);
$('#libFolder').addEventListener('click', async () => {
  if (!SOCIAL) { $('#folderMusic').click(); return; }
  try { const st = await (await fetch('/api/status', {cache: 'no-store'})).json();
    const r = await fetch('/api/clip/music/open', {method: 'POST', headers: {'X-Chest0-CSRF': st.csrf, 'Content-Type': 'application/json'}, body: '{}'});
    if (!r.ok) throw new Error(); setStatus('Le dossier « Musiques Chest0 » est ouvert dans le Finder. Déposez-y vos morceaux puis cliquez sur « Actualiser la liste ».', 'ok');
  } catch (e) { setStatus("Le dossier n'a pas pu être ouvert : Social Studio doit être relancé pour activer la bibliothèque musicale (dans le Hub : Arrêter, puis Lancer).", 'err'); }
});
const drop = $('#drop');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { if (dragFrom >= 0) return; e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); if (dragFrom < 0 && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
$('#clearAll').addEventListener('click', () => { if (!confirm('Retirer toutes les images ?')) return; pause(); images.forEach(it => URL.revokeObjectURL(it.url)); images = []; prepared.length = 0; renderList(); refresh(); });
$('#play').addEventListener('click', () => playing ? pause() : play());
$('#scrub').addEventListener('input', e => { pause(); pos = e.target.value / 1000 * total(); renderFrame(pos); updateTime(); });
$('#export').addEventListener('click', exportVideo);
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !/TEXTAREA|INPUT|SELECT|BUTTON/.test(e.target.tagName) && images.length && !job) { e.preventDefault(); playing ? pause() : play(); }
});

async function sendToLibrary() {
  const box = $('#sendStatus'), btn = $('#sendBtn'), title = $('#sTitle').value.trim();
  if (!lastBlob) return;
  if (!title) { box.textContent = 'Écrivez un titre pour retrouver la vidéo dans Mes vidéos.'; box.className = 'status err'; $('#sTitle').focus(); return; }
  btn.disabled = true; box.className = 'status'; box.textContent = 'Envoi et mise au format des plateformes… (quelques secondes à une minute)';
  try {
    const st = await (await fetch('/api/status', {cache: 'no-store'})).json();
    const meta = {title, category: $('#sCat').value, description: $('#sDesc').value, hashtags: $('#sTags').value.split(/\s+/).filter(Boolean)};
    const r = await fetch('/api/clip/import', {method: 'POST', cache: 'no-store', body: lastBlob,
      headers: {'Content-Type': 'video/mp4', 'X-Chest0-CSRF': st.csrf, 'X-Chest0-Clip': encodeURIComponent(JSON.stringify(meta))}});
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Envoi impossible.');
    box.className = 'status ok';
    box.innerHTML = 'Envoyée ! Elle est dans Mes vidéos : regardez-la, validez-la puis diffusez-la. <a href="/#mes-videos">Ouvrir Mes vidéos</a>';
  } catch (e) {
    btn.disabled = false; box.className = 'status err';
    box.textContent = (e.message || 'Envoi impossible.') + ' Vérifiez que Social Studio est toujours ouvert.';
  }
}
if (SOCIAL) { $('#backSocial').hidden = false; $('#sendBtn').addEventListener('click', sendToLibrary); document.title = 'Montage rapide · Chest0 Social Studio'; }

if (SOCIAL) { $('#libFolder').textContent = 'Ouvrir mon dossier de musiques'; $('#libRefresh').hidden = false; }
else { $('#libFolder').textContent = 'Choisir mon dossier de musiques…';
  $('#libHelp').textContent = 'Choisissez le dossier où vous rangez vos musiques libres de droits : tous ses morceaux apparaissent ici pour cette séance.'; }
if (isLib(S.music) && !SOCIAL) S.music = 'lofi';
syncControls(); renderFormats(); renderMusicList(); applyFormat();
if (SOCIAL) loadServerLibrary();
if (STYLES[S.music]) setTimeout(() => styleSource(S.music).catch(() => {}), 400);   // prépare l'ambiance choisie à l'avance
window.__clip = {addFiles, images: () => images, S, exportVideo, renderTrack};
})();
