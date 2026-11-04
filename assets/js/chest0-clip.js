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
let results = [];          // vidéos créées : {fmt, label, blob, url, name, aac}
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

const S = {format:'vertical', also:[], fit:'blur', imgDur:3, beatSync:false, transDur:0.8, transition:'auto', kenburns:true, logo:false, logoPos:'tr', subs:false, subPos:'bottom', volume:0.8, music:'lofi', bookCursor:{}};
try { Object.assign(S, JSON.parse(localStorage.getItem('chest0clip') || '{}')); } catch (e) {}
if (S.music === 'file' || (S.music !== 'none' && !isLibId(S.music) && !['lofi','pop','zen','electro','cinema','acoustic','motiv','nature','tropic'].includes(S.music))) S.music = 'lofi';
if (!FORMATS.some(f => f.id === S.format)) S.format = 'vertical';
if (!Array.isArray(S.also)) S.also = [];
S.also = S.also.filter(id => FORMATS.some(f => f.id === id));
if (!S.bookCursor || typeof S.bookCursor !== 'object') S.bookCursor = {};
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
// Durée d'un temps musical quand le calage est actif (ambiances intégrées rythmées uniquement)
const beatLen = () => (S.beatSync && STYLES[S.music] && S.music !== 'zen') ? STYLES[S.music].bar / 4 : 0;
const imgD = () => { const b = beatLen(); return b ? Math.max(1, Math.round(S.imgDur / b)) * b : S.imgDur; };
const transT = () => S.transition === 'cut' ? 0 : Math.min(S.transDur, imgD() * 0.8);
const total = () => images.length * imgD();
// Décalage de la musique pour que le milieu de chaque transition tombe sur un temps
const musicOffset = () => { const b = beatLen(); return b ? (transT() / 2) % b : 0; };
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
  while (prepared.length > 6) { const old = prepared.shift(); old.fg = old.bg = old.capCanvas = null; old.key = old.capKey = null; }
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
    const full = mkCanvas(W, H), gf = full.getContext('2d'); gf.imageSmoothingQuality = 'high'; gf.drawImage(bg, 0, 0, W, H);
    it.bg = full;
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
function drawCaption(g, text, alpha = 1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  const base = Math.min(W, H); let fs = Math.round(base * 0.058); const maxW = W * 0.82;
  g.font = `700 ${fs}px ${FONT}`; let lines = wrap(g, text, maxW);
  while (lines.length > 5 && fs > base * 0.032) { fs = Math.round(fs * 0.88); g.font = `700 ${fs}px ${FONT}`; lines = wrap(g, text, maxW); }
  if (!lines.length) { g.restore(); return; }
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
  g.restore();
}
function drawLayer(g, i, u, capA = 1) {
  const it = images[i]; prepare(it);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (it.bg) g.drawImage(it.bg, 0, 0);
  g.imageSmoothingQuality = 'low';   // l'image est déjà à la bonne taille : un lissage simple suffit pour le léger zoom
  let z = 1;
  if (S.kenburns) { const e = ease(u); z = i % 2 === 0 ? 1 + 0.05 * e : 1.05 - 0.05 * e; }
  const w = it.baseW * z, h = it.baseH * z;
  g.drawImage(it.fg, (W - w) / 2, (H - h) / 2, w, h);
  if (S.subs && it.caption.trim()) {
    const key = it.caption + '|' + W + 'x' + H + '|' + S.subPos;
    if (it.capKey !== key) { it.capCanvas = mkCanvas(W, H); drawCaption(it.capCanvas.getContext('2d'), it.caption); it.capKey = key; }
    if (capA > 0) { g.save(); g.globalAlpha *= capA; g.drawImage(it.capCanvas, 0, 0); g.restore(); }
  }
}
// Logo : posé au-dessus de tout, immobile pendant les transitions
let logoImg = null;
async function logoFromData(data) {
  const bin = atob(data.split(',')[1]), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const li = new Image(); li.src = URL.createObjectURL(new Blob([u], {type: 'image/png'})); await li.decode(); return li;
}
function drawLogo(g) {
  if (!S.logo || !logoImg || !logoImg.naturalWidth) return;
  const box = Math.min(W, H) * 0.17, k = Math.min(box / logoImg.naturalWidth, box / logoImg.naturalHeight);
  const w = logoImg.naturalWidth * k, h = logoImg.naturalHeight * k, vertical = H > W * 1.3;
  const x = S.logoPos.endsWith('l') ? W * 0.045 : W - w - W * 0.045;
  const y = S.logoPos.startsWith('t') ? H * (vertical ? 0.065 : 0.045) : H - h - H * (vertical ? 0.2 : 0.045);
  g.save(); g.globalAlpha = 0.92; g.drawImage(logoImg, x, y, w, h); g.restore();
}
function renderFrame(t) {
  const n = images.length;
  if (!n) { ctx.fillStyle = '#141416'; ctx.fillRect(0, 0, W, H); return; }
  const d = imgD(), T = transT(), D = n * d;
  t = clamp(t, 0, D - 1e-3);
  const i = Math.min(n - 1, Math.floor(t / d)), local = t - i * d;
  const u = k => { const st = k > 0 ? k * d - T : 0, span = k > 0 ? d + T : d; return clamp((t - st) / span); };
  // Le texte d'une image apparaît en douceur une fois la transition terminée (sauf la 1re : visible tout de suite)
  const capA = k => k === 0 ? 1 : clamp((t - k * d) / 0.35);
  if (i < n - 1 && T > 0 && local > d - T) {
    const p = ease((local - (d - T)) / T);
    const type = S.transition === 'auto' ? AUTO[i % AUTO.length] : S.transition;
    drawLayer(xA, i, u(i), capA(i)); drawLayer(xB, i + 1, u(i + 1), capA(i + 1));
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
    drawLayer(ctx, i, u(i), capA(i));
    if (i < n - 1 && local < 0.5) prepare(images[i + 1]);   // prépare l'image suivante à l'avance
  }
  drawLogo(ctx);
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

async function renderTrack(id, D, offset = 0) {
  const sr = 44100, N = Math.max(1, Math.ceil(D * sr)), fadeN = Math.max(1, Math.round(Math.min(2.5, D * .25) * sr));
  if (isLib(id)) {
    const userBuf = await trackBuffer(trackOf(id));
    const oac = new OfflineAudioContext(2, N, sr), master = oac.createGain();
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .04);
    master.gain.setValueAtTime(1, Math.max(.05, D - fadeN / sr)); master.gain.linearRampToValueAtTime(0, D);
    const s = oac.createBufferSource(); s.buffer = userBuf; s.loop = true; s.connect(master); master.connect(oac.destination); s.start(0);
    return oac.startRendering();
  }
  const st = await styleSource(id), src = st.buf, off = Math.round(offset * sr);
  const out = ensureAC().createBuffer(2, N, sr), a = Math.round(st.loopStart * sr), L = Math.round(st.loopLen * sr);
  const inN = Math.min(N, Math.round(0.04 * sr));
  for (let c = 0; c < 2; c++) {
    const s = src.getChannelData(c), d = out.getChannelData(c);
    for (let i = 0; i < N; i++) {
      const m = i + off, j = m < a ? m : a + (m - a) % L;
      let v = i > N - fadeN ? s[j] * (N - i) / fadeN : s[j];
      if (off && i < inN) v *= i / inN;
      d[i] = v;
    }
  }
  return out;
}
let musicCache = {key: '', buf: null};
async function getMusic(D) {
  if (S.music === 'none' || (isLib(S.music) && !trackOf(S.music)) || (!isLib(S.music) && !STYLES[S.music])) return null;
  const off = isLib(S.music) ? 0 : musicOffset();
  const key = S.music + '|' + D.toFixed(3) + '|' + off.toFixed(3);
  if (musicCache.key === key) return musicCache.buf;
  setStatus('Préparation de la musique…');
  const buf = await renderTrack(S.music, D, off);
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
function seekToImage(i) { pause(); const d = imgD(); pos = i * d + (d - transT()) / 2 + 0.3; renderFrame(pos); updateTime(); }

/* ---------- Création de la vidéo ---------- */
const IS_SAFARI = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
function pickMime() {
  // Priorité : H.264 + AAC (accepté par toutes les plateformes). « video/mp4 » seul n'est sûr que dans Safari.
  const list = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.4d0028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2',
    ...(IS_SAFARI ? ['video/mp4'] : []), 'video/mp4;codecs=avc1.640028,opus', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  return list.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
}
let job = null;
document.addEventListener('visibilitychange', () => { if (job && document.hidden) job.hidden = true; });
function lock(on) {
  $('#left').classList.toggle('locked', on); $('#play').disabled = on; $('#scrub').disabled = on;
  const b = $('#export'); b.textContent = on ? 'Annuler' : 'Créer la vidéo'; b.classList.toggle('cancel', on);
  $('#progress').hidden = !on;
}
const fmtOf = id => FORMATS.find(f => f.id === id);
const exportList = () => [S.format, ...S.also.filter(id => id !== S.format)];
function setSize(id) { const f = fmtOf(id); W = f.w; H = f.h; for (const c of [canvas, cA, cB]) { c.width = W; c.height = H; } }
// Pause qui laisse respirer la page, même si la fenêtre est en arrière-plan (pas de ralentissement des minuteries)
const breathe = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
const copyBytes = d => d ? new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d.slice(0)) : null;

/* ---------- Fabrication du fichier MP4 (sans dépendance externe) ----------
   Assemble les images codées en H.264 et le son codé en AAC (ou Opus) dans un fichier
   .mp4 standard, avec l'index au début (lecture immédiate sur les plateformes). */
const MP4 = (() => {
  const te = new TextEncoder();
  const bytes = a => a instanceof Uint8Array ? a : new Uint8Array(a);
  const flat = parts => { parts = parts.map(bytes); let n = 0; for (const p of parts) n += p.length; const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
  const u16 = n => [n >>> 8 & 255, n & 255], u24 = n => [n >>> 16 & 255, n >>> 8 & 255, n & 255], u32 = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
  const u32s = list => { const b = new Uint8Array(list.length * 4), v = new DataView(b.buffer); list.forEach((x, i) => v.setUint32(i * 4, x)); return b; };
  const box = (type, ...parts) => { const body = flat(parts); return flat([u32(body.length + 8), te.encode(type), body]); };
  const full = (type, version, flags, ...parts) => box(type, [version, ...u24(flags)], ...parts);
  const zeros = n => new Uint8Array(n);
  const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].flatMap(u32);
  const descr = (tag, body) => { body = bytes(body); const l = body.length; return flat([[tag, 0x80 | (l >> 21 & 127), 0x80 | (l >> 14 & 127), 0x80 | (l >> 7 & 127), l & 127], body]); };
  function trak(t, offsets) {
    const v = t.type === 'video', deltas = t.samples.map(x => x.delta), dur = deltas.reduce((a, b) => a + b, 0);
    const runs = []; for (const d of deltas) { const r = runs[runs.length - 1]; if (r && r[1] === d) r[0]++; else runs.push([1, d]); }
    const stbl = [full('stsd', 0, 0, u32(1), t.entry), full('stts', 0, 0, u32(runs.length), u32s(runs.flat()))];
    if (v) { const keys = []; t.samples.forEach((x, i) => { if (x.key) keys.push(i + 1); }); stbl.push(full('stss', 0, 0, u32(keys.length), u32s(keys))); }
    stbl.push(full('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
              full('stsz', 0, 0, u32(0), u32(t.samples.length), u32s(t.samples.map(x => x.data.length))),
              full('stco', 0, 0, u32(offsets.length), u32s(offsets)));
    return box('trak',
      full('tkhd', 0, 3, u32(0), u32(0), u32(t.id), u32(0), u32(Math.round(dur / t.timescale * 1000)), zeros(8), u16(0), u16(0), u16(v ? 0 : 0x100), u16(0), MATRIX,
           u32(v ? t.width * 65536 : 0), u32(v ? t.height * 65536 : 0)),
      box('mdia',
        full('mdhd', 0, 0, u32(0), u32(0), u32(t.timescale), u32(dur), u16(0x55c4), u16(0)),
        full('hdlr', 0, 0, u32(0), te.encode(v ? 'vide' : 'soun'), zeros(12), te.encode(v ? 'VideoHandler\0' : 'SoundHandler\0')),
        box('minf', v ? full('vmhd', 0, 1, zeros(8)) : full('smhd', 0, 0, zeros(4)),
          box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))), box('stbl', ...stbl))));
  }
  return function mux({width, height, video, audio}) {
    const tracks = [{id: 1, type: 'video', timescale: 90000, width, height,
      entry: box('avc1', zeros(6), u16(1), zeros(16), u16(width), u16(height), u32(0x480000), u32(0x480000), u32(0), u16(1), zeros(32), u16(0x18), u16(0xffff), box('avcC', video.desc)),
      samples: video.chunks.map(c => ({data: c.data, ts: c.ts, key: c.key, delta: Math.max(1, Math.round(c.dur * 0.09))}))}];
    if (audio) {
      const sr = audio.sampleRate, ch = audio.channels;
      const head = [zeros(6), u16(1), zeros(8), u16(ch), u16(16), u16(0), u16(0), u32(sr * 65536)];
      let entry;
      if (audio.kind === 'aac') {
        const fi = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000].indexOf(sr);
        const asc = audio.desc && audio.desc.length ? audio.desc : new Uint8Array([(2 << 3) | (fi >> 1), ((fi & 1) << 7) | (ch << 3)]);
        const dcd = descr(4, flat([[0x40, 0x15, 0, 0, 0], u32(audio.bitrate), u32(audio.bitrate), descr(5, asc)]));
        entry = box('mp4a', ...head, full('esds', 0, 0, descr(3, flat([u16(2), [0], dcd, descr(6, [2])]))));
      } else {
        entry = box('Opus', ...head, box('dOps', [0, ch], u16(audio.preSkip), u32(48000), u16(0), [0]));
      }
      tracks.push({id: 2, type: 'audio', timescale: sr, entry,
        samples: audio.chunks.map(c => ({data: c.data, ts: c.ts, delta: Math.max(1, Math.round(c.dur * sr / 1e6))}))});
    }
    // Échantillons rangés par ordre chronologique (son et image entrelacés)
    const order = tracks.flatMap(t => t.samples.map(x => ({t: t.id, x}))).sort((a, b) => a.x.ts - b.x.ts || a.t - b.t);
    const ftyp = box('ftyp', te.encode('isom'), u32(0x200), te.encode('isomiso2avc1mp41'));
    const durMs = Math.max(...tracks.map(t => Math.round(t.samples.reduce((a, x) => a + x.delta, 0) / t.timescale * 1000)));
    const moov = offs => box('moov', full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(durMs), u32(0x10000), u16(0x100), zeros(10), MATRIX, zeros(24), u32(tracks.length + 1)),
                             ...tracks.map(t => trak(t, offs[t.id])));
    const size = moov({1: video.chunks.map(() => 0), 2: audio ? audio.chunks.map(() => 0) : []}).length;
    const offs = {1: [], 2: []}; let o = ftyp.length + size + 8;
    for (const s of order) { offs[s.t].push(o); o += s.x.data.length; }
    const head = moov(offs); if (head.length !== size) throw new Error('mp4-index');
    return new Blob([ftyp, head, flat([u32(o - ftyp.length - size), te.encode('mdat')]), ...order.map(s => s.x.data)], {type: 'video/mp4'});
  };
})();

/* ---------- Création rapide : chaque image de la vidéo est calculée puis codée directement ---------- */
let fastCache;
async function fastSupport() {
  if (fastCache !== undefined) return fastCache;
  fastCache = null;
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined' || typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return null;
  let codec = null;
  for (const c of ['avc1.640028', 'avc1.4d0028', 'avc1.420028']) {
    try { if ((await VideoEncoder.isConfigSupported({codec: c, width: 1080, height: 1920, bitrate: 8e6, framerate: 30, avc: {format: 'avc'}})).supported) { codec = c; break; } } catch (e) {}
  }
  if (!codec) return null;
  let audio = null;
  for (const [c, kind, sr] of [['mp4a.40.2', 'aac', 44100], ['mp4a.40.2', 'aac', 48000], ['opus', 'opus', 48000]]) {
    const cfg = {codec: c, sampleRate: sr, numberOfChannels: 2, bitrate: 192000}; if (kind === 'aac') cfg.aac = {format: 'aac'};
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) { audio = {cfg, kind}; break; } } catch (e) {}
  }
  if (!audio) return null;
  // Hors Social Studio, un son AAC est indispensable : si le navigateur l'enregistre mieux en direct, on garde le direct.
  if (audio.kind !== 'aac' && !SOCIAL && /mp4a/.test(pickMime())) return null;
  return fastCache = {codec, audio};
}
async function resample(buf, sr) {
  if (buf.sampleRate === sr) return buf;
  const oac = new OfflineAudioContext(2, Math.ceil(buf.duration * sr), sr), s = oac.createBufferSource();
  s.buffer = buf; s.connect(oac.destination); s.start(0); return oac.startRendering();
}
async function encodeFast(sup, music, me, onProgress) {
  const fps = 30, D = total(), frames = Math.max(1, Math.round(D * fps)), frameUs = 1e6 / fps;
  let failure = null;
  // --- image ---
  const vChunks = []; let vDesc = null;
  const ve = new VideoEncoder({
    output: (c, meta) => { if (!vDesc && meta && meta.decoderConfig && meta.decoderConfig.description) vDesc = copyBytes(meta.decoderConfig.description);
      const b = new Uint8Array(c.byteLength); c.copyTo(b); vChunks.push({data: b, ts: c.timestamp, dur: c.duration || frameUs, key: c.type === 'key'}); },
    error: e => { failure = e; }});
  ve.configure({codec: sup.codec, width: W, height: H, bitrate: 8e6, framerate: fps, avc: {format: 'avc'}});
  for (let f = 0; f < frames; f++) {
    if (me.cancel || failure) break;
    renderFrame(f / fps);
    const vf = new VideoFrame(canvas, {timestamp: Math.round(f * frameUs), duration: Math.round(frameUs)});
    ve.encode(vf, {keyFrame: f % (fps * 2) === 0}); vf.close();
    while (ve.encodeQueueSize > 4 && !failure) await breathe();
    if (f % 6 === 0) { onProgress(f / frames * 0.92); await breathe(); }
  }
  if (!failure && !me.cancel) await ve.flush();
  try { ve.close(); } catch (e) {}
  if (me.cancel) return null;
  if (failure) throw failure;
  if (!vDesc || !vChunks.length) throw new Error('video');
  for (let i = 1; i < vChunks.length; i++) if (vChunks[i].ts < vChunks[i - 1].ts) throw new Error('reorder');
  // --- son (musique, ou silence pour garder une piste son) ---
  const cfg = sup.audio.cfg, sr = cfg.sampleRate, N = Math.max(1, Math.ceil(D * sr));
  const src = music ? await resample(music, sr) : null;
  const aChunks = []; let aDesc = null;
  const ae = new AudioEncoder({
    output: (c, meta) => { if (!aDesc && meta && meta.decoderConfig && meta.decoderConfig.description) aDesc = copyBytes(meta.decoderConfig.description);
      const b = new Uint8Array(c.byteLength); c.copyTo(b); aChunks.push({data: b, ts: c.timestamp, dur: c.duration}); },
    error: e => { failure = e; }});
  ae.configure(cfg);
  const step = sr, vol = S.volume;
  for (let o = 0; o < N && !failure; o += step) {
    const n = Math.min(step, N - o), data = new Float32Array(n * 2);
    if (src) for (let c = 0; c < 2; c++) { const chData = src.getChannelData(Math.min(c, src.numberOfChannels - 1)); for (let i = 0; i < n; i++) data[c * n + i] = (chData[o + i] || 0) * vol; }
    const ad = new AudioData({format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(o * 1e6 / sr), data});
    ae.encode(ad); ad.close();
  }
  if (!failure) await ae.flush();
  try { ae.close(); } catch (e) {}
  if (failure) throw failure;
  const frameLen = sup.audio.kind === 'aac' ? 1024 : 960;
  aChunks.forEach(c => { if (!c.dur) c.dur = frameLen * 1e6 / sr; });
  let preSkip = 312;
  if (sup.audio.kind === 'opus' && aDesc && aDesc.length >= 12 && String.fromCharCode(...aDesc.slice(0, 8)) === 'OpusHead') preSkip = aDesc[10] | aDesc[11] << 8;
  onProgress(0.97);
  return MP4({width: W, height: H, video: {desc: vDesc, chunks: vChunks},
              audio: {kind: sup.audio.kind, desc: aDesc, sampleRate: sr, channels: 2, bitrate: cfg.bitrate, preSkip, chunks: aChunks}});
}

/* ---------- Création en temps réel (navigateurs sans codage direct) ---------- */
async function recordRealtime(music, me, onProgress) {
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) throw new Error('norecorder');
  const D = total(), mime = pickMime();
  const vStream = canvas.captureStream(30);
  const dest = ac.createMediaStreamDestination(), g = ac.createGain(); g.gain.value = music ? S.volume : 0; g.connect(dest);
  let src;
  if (music) { src = ac.createBufferSource(); src.buffer = music; } else { src = ac.createOscillator(); }   // piste son muette si pas de musique
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
      renderFrame(Math.max(0, t)); onProgress(clamp(t / D));
      if (t >= D + .15) return resolve();
      requestAnimationFrame(loop);
    };
    loop();
  });
  rec.stop(); try { src.stop(); } catch (e) {}
  await stopped;
  vStream.getTracks().forEach(t => t.stop()); g.disconnect();
  if (me.cancel) return null;
  const type = rec.mimeType || mime || 'video/webm';
  return {blob: new Blob(chunks, {type: type.split(';')[0]}), ext: type.includes('mp4') ? 'mp4' : 'webm', aac: /mp4a/.test(type) || (type.startsWith('video/mp4') && IS_SAFARI)};
}

async function exportVideo() {
  if (job) { job.cancel = true; return; }
  if (!images.length) return;
  pause(); stopListen(); renderMusicList();
  ensureAC(); await ac.resume();
  const list = exportList(), main = S.format;
  job = {cancel: false, hidden: document.hidden, realtime: false}; const me = job;
  lock(true); $('#result').hidden = true; $('#progress div').style.width = '0';
  results.forEach(r => URL.revokeObjectURL(r.url)); results = [];
  let music = null; try { music = await getMusic(total()); } catch (e) { music = null; }
  let sup = await fastSupport();
  const now = new Date(), stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  let problem = '';
  try {
    for (let k = 0; k < list.length && !me.cancel; k++) {
      const f = fmtOf(list[k]); setSize(f.id);
      const label = list.length > 1 ? ` (${k + 1}/${list.length} : ${f.label})` : '';
      const progress = x => { $('#progress div').style.width = ((k + x) / list.length * 100) + '%'; };
      let out = null;
      if (sup) {
        setStatus('Création en cours' + label + '… Vous pouvez continuer à utiliser votre Mac pendant ce temps.');
        try { const blob = await encodeFast(sup, music, me, progress); if (blob) out = {blob, ext: 'mp4', aac: sup.audio.kind === 'aac'}; }
        catch (e) { sup = null; fastCache = null; }
      }
      if (!out && !sup && !me.cancel) {
        me.realtime = true;
        setStatus('Création en cours' + label + '… Laissez cette fenêtre visible jusqu\'à la fin.');
        out = await recordRealtime(music, me, progress);
      }
      if (out) results.push({fmt: f.id, label: f.label, ...out, url: URL.createObjectURL(out.blob), name: `chest0-clip-${f.id}-${stamp}.${out.ext}`});
    }
  } catch (e) {
    problem = e && e.message === 'norecorder' ? "Ce navigateur ne sait pas créer de vidéo : ouvrez Chest0 Clip avec Safari ou Chrome." : 'La création a échoué. Réessayez ; si cela se reproduit, fermez puis rouvrez la page.';
  }
  setSize(main);
  job = null; lock(false); pos = 0; renderFrame(0); updateTime();
  if (me.cancel) { setStatus('Création annulée.'); results.forEach(r => URL.revokeObjectURL(r.url)); results = []; return; }
  if (!results.length) { setStatus(problem || 'La création a échoué.', 'err'); return; }
  showResults(me, problem);
}
function showResults(me, problem) {
  const box = $('#dlList'); box.innerHTML = '';
  for (const r of results) {
    const a = document.createElement('a'); a.href = r.url; a.download = r.name;
    a.innerHTML = '<b></b><span></span>';
    a.querySelector('b').textContent = (SOCIAL ? 'Télécharger sur mon Mac · ' : 'Télécharger · ') + r.label;
    a.querySelector('span').textContent = (r.blob.size / 1048576).toFixed(1) + ' Mo';
    box.appendChild(a);
  }
  $('#out').src = results[0].url; $('#result').hidden = false;
  const many = results.length > 1, size = (results.reduce((a, r) => a + r.blob.size, 0) / 1048576).toFixed(1);
  const late = problem ? ' ' + problem : '', hidden = me.realtime && me.hidden ? ' La fenêtre a été masquée pendant la création : si une vidéo saccade, recommencez sans changer de fenêtre.' : '';
  if (SOCIAL) {
    $('#sendBox').hidden = false; $('#sendBtn').disabled = false; $('#sendStatus').textContent = '';
    $('#sendBtn').textContent = many ? `Envoyer les ${results.length} formats dans Mes vidéos` : 'Envoyer dans Mes vidéos';
    setStatus((many ? `${results.length} vidéos prêtes (${size} Mo). ` : `Vidéo prête (${size} Mo). `) + 'Donnez-lui un titre puis envoyez-la dans Mes vidéos.' + late + hidden, late || hidden ? 'err' : 'ok');
    $('#sTitle').focus();
    return;
  }
  results.forEach((r, k) => setTimeout(() => box.children[k].click(), k * 700));
  let msg = many ? `${results.length} vidéos prêtes (${size} Mo), envoyées dans vos Téléchargements.` : `Vidéo prête : ${results[0].name} (${size} Mo), envoyée dans vos Téléchargements.`;
  const compat = results.every(r => r.aac && r.ext === 'mp4');
  if (!compat) msg += ' Attention : ce navigateur ne produit pas le format le plus compatible (vidéo H.264 + son AAC). Pour TikTok et Instagram, ouvrez Chest0 Clip avec Safari.';
  setStatus(msg + late + hidden, compat && !late && !hidden ? 'ok' : 'err');
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
    b.addEventListener('click', () => { S.format = f.id; S.also = S.also.filter(id => id !== f.id); save(); applyFormat(); renderFormats(); });
    box.appendChild(b);
  }
  const also = $('#alsoBox'); also.innerHTML = '<span>Créer aussi :</span>';
  for (const f of FORMATS) {
    if (f.id === S.format) continue;
    const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = S.also.includes(f.id);
    c.addEventListener('change', () => { S.also = c.checked ? [...S.also, f.id] : S.also.filter(id => id !== f.id); save(); refresh(); });
    l.append(c, document.createTextNode(f.label)); also.appendChild(l);
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
    pause(); S.music = m.id; save(); renderMusicList(); syncControls(); refresh();
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
  const fr = v => v.toLocaleString('fr-FR', {maximumFractionDigits: 2}) + ' s';
  $('#imgDur').value = S.imgDur; $('#oImg').textContent = imgD() !== S.imgDur ? `${fr(imgD())} (calé sur le rythme)` : fr(S.imgDur);
  const beatOk = !!STYLES[S.music] && S.music !== 'zen';
  $('#beatSync').checked = S.beatSync; $('#beatSync').disabled = !beatOk;
  $('#beatRow').title = beatOk ? '' : 'Disponible avec les ambiances intégrées rythmées (pas avec Zen, Ma bibliothèque ou Sans musique)';
  $('#logoOn').checked = S.logo; $('#logoPos').value = S.logoPos; $('#logoPos').hidden = !S.logo || !logoImg;
  $('#logoThumb').hidden = !logoImg; if (logoImg) $('#logoThumb').src = logoImg.src;
  $('#logoPick').textContent = logoImg ? 'Changer…' : 'Choisir mon logo…';
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
$('#beatSync').addEventListener('change', e => onSet('beatSync', e.target.checked));
$('#logoOn').addEventListener('change', e => { if (e.target.checked && !logoImg) { e.target.checked = false; $('#fileLogo').click(); return; } onSet('logo', e.target.checked); });
$('#logoPos').addEventListener('change', e => onSet('logoPos', e.target.value));
$('#logoPick').addEventListener('click', () => $('#fileLogo').click());
$('#fileLogo').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const url = URL.createObjectURL(f), img = new Image(); img.src = url;
  try {
    await img.decode();
    // Logo réduit (600 px max) et mémorisé dans ce navigateur pour les prochaines fois
    const k = Math.min(1, 600 / Math.max(img.naturalWidth || 600, img.naturalHeight || 600));
    const c = mkCanvas((img.naturalWidth || 600) * k, (img.naturalHeight || 600) * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    // Affichage via une adresse « blob: » (autorisée par la sécurité de Social Studio) ; mémorisation en texte
    const data = c.toDataURL('image/png'), li = await logoFromData(data);
    logoImg = li; let kept = true;
    try { localStorage.setItem('chest0clip-logo', data); } catch (err) { kept = false; }
    S.logo = true; save(); syncControls(); refresh();
    setStatus(kept ? 'Logo enregistré : il sera proposé automatiquement les prochaines fois.' : 'Logo ajouté pour cette séance (ce navigateur ne permet pas de le mémoriser).', 'ok');
  } catch (err) { setStatus(`Impossible d'ouvrir « ${f.name} » : utilisez une image PNG ou JPG.`, 'err'); }
  finally { URL.revokeObjectURL(url); }
});
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
  if (!results.length) return;
  if (!title) { box.textContent = 'Écrivez un titre pour retrouver la vidéo dans Mes vidéos.'; box.className = 'status err'; $('#sTitle').focus(); return; }
  btn.disabled = true; box.className = 'status';
  try {
    const st = await (await fetch('/api/status', {cache: 'no-store'})).json();
    for (let k = 0; k < results.length; k++) {
      const r = results[k]; if (r.sent) continue;
      box.textContent = `Envoi et mise au format des plateformes${results.length > 1 ? ` (${k + 1}/${results.length} : ${r.label})` : ''}… (quelques secondes à une minute)`;
      const meta = {title: results.length > 1 ? `${title} · ${r.label}` : title, category: $('#sCat').value, description: $('#sDesc').value, hashtags: $('#sTags').value.split(/\s+/).filter(Boolean)};
      const resp = await fetch('/api/clip/import', {method: 'POST', cache: 'no-store', body: r.blob,
        headers: {'Content-Type': 'video/mp4', 'X-Chest0-CSRF': st.csrf, 'X-Chest0-Clip': encodeURIComponent(JSON.stringify(meta))}});
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Envoi impossible.');
      r.sent = true;
    }
    box.className = 'status ok';
    box.innerHTML = (results.length > 1 ? `Les ${results.length} formats sont envoyés !` : 'Envoyée !') + ' Ils sont dans Mes vidéos : regardez, validez puis diffusez. <a href="/#mes-videos">Ouvrir Mes vidéos</a>';
  } catch (e) {
    btn.disabled = false; box.className = 'status err';
    box.textContent = (e.message || 'Envoi impossible.') + ' Vérifiez que Social Studio est toujours ouvert, puis cliquez à nouveau (les formats déjà envoyés ne sont pas renvoyés).';
  }
}
/* ---------- Phrases de mes livres (Social Studio uniquement) ---------- */
let books = [];
const bookOf = () => books.find(b => b.id === S.book) || books[0];
function nextEmpty(from) { for (let i = from; i < images.length; i++) if (!images[i].caption.trim()) return i; return -1; }
function placeCaptions(texts) {
  if (!images.length) { setStatus("Ajoutez d'abord vos images (étape 1).", 'err'); return; }
  let i = nextEmpty(0);
  if (i < 0) { setStatus('Toutes les images ont déjà un texte : videz une case pour en placer un nouveau.', 'err'); return; }
  const placed = [];
  for (const t of texts) { if (i < 0) break; images[i].caption = t; placed.push(i); i = nextEmpty(i + 1); }
  setStatus(placed.length < texts.length ? 'Il manque une image sans texte pour la réponse : ajoutez une image ou videz une case.' : '', placed.length < texts.length ? 'err' : '');
  renderList(); seekToImage(placed[0]);
}
function renderPhrases() {
  const b = bookOf(), box = $('#phraseList'); box.innerHTML = ''; if (!b) return;
  const hasPairs = !!(b.pairs && b.pairs.length);
  const kind = S.bookKind === 'pairs' && !hasPairs ? 'ideas' : S.bookKind;
  document.querySelectorAll('#bookKinds .sbtn').forEach(x => { x.classList.toggle('sel', x.dataset.kind === kind); x.hidden = x.dataset.kind === 'pairs' && !hasPairs; });
  const items = kind === 'pairs' ? b.pairs.map(p => [p.situation, p.reply]) : (b[kind] || []).map(t => [t]);
  for (const texts of items) {
    const el = document.createElement('button'); el.className = 'phrase';
    if (texts.length === 2) { const t = document.createElement('b'); t.textContent = texts[0]; const r = document.createElement('span'); r.textContent = texts[1]; el.append(t, r); }
    else el.textContent = texts[0];
    el.addEventListener('click', () => { pause(); placeCaptions(texts); });
    box.appendChild(el);
  }
}
async function loadBooks() {
  try {
    const r = await fetch('/api/clip/phrases', {cache: 'no-store'}); if (!r.ok) return;
    books = (await r.json()).books || []; if (!books.length) return;
    if (!books.some(b => b.id === S.book)) S.book = books[0].id;
    if (!['hooks', 'pairs', 'ideas'].includes(S.bookKind)) S.bookKind = 'pairs';
    // Livres regroupés par thème dans la liste
    $('#bookSel').innerHTML = ''; const groups = {};
    for (const b of books) {
      const label = /^Intelligence relationnelle/.test(b.series) ? 'Intelligence relationnelle' : b.series;
      if (!groups[label]) { groups[label] = document.createElement('optgroup'); groups[label].label = label; $('#bookSel').appendChild(groups[label]); }
      const o = document.createElement('option'); o.value = b.id; o.textContent = /^Intelligence/.test(b.series) ? `${b.title} (${b.series.split('— ')[1] || ''})` : b.title; groups[label].appendChild(o);
    }
    $('#bookSel').value = S.book; $('#bookBox').hidden = false; renderPhrases();
  } catch (e) {}
}
function bookTemplate() {
  const b = bookOf(); if (!b) return;
  const n = images.length;
  if (n < 2) { setStatus("Ajoutez au moins 2 images (étape 1) : la première reçoit l'accroche, la dernière la mention du livre.", 'err'); return; }
  if (images.some(it => it.caption.trim()) && !confirm('Remplacer les textes déjà écrits sur les images ?')) return;
  const cur = S.bookCursor[b.id] || 0, pairs = b.pairs || [], ideas = b.ideas || [], hooks = b.hooks || [];
  const texts = [hooks.length ? hooks[cur % hooks.length] : b.title];
  // Chaque phrase n'est utilisée qu'une fois par vidéo : les images en trop restent sans texte
  let pi = (cur * 2) % Math.max(1, pairs.length), ii = (cur * 3) % Math.max(1, ideas.length), room = n - 2, pLeft = pairs.length, iLeft = ideas.length;
  while (room > 0) {
    if (pLeft && room >= 2) { const p = pairs[pi++ % pairs.length]; texts.push(p.situation, p.reply); room -= 2; pLeft--; }
    else if (iLeft) { texts.push(ideas[ii++ % ideas.length]); room -= 1; iLeft--; }
    else break;
  }
  images.forEach(it => { it.caption = ''; });
  texts.slice(0, n - 1).forEach((t, k) => { images[k].caption = t; });
  images[n - 1].caption = b.mention + (b.cta ? '\n' + b.cta : '');
  S.bookCursor[b.id] = cur + 1; S.subs = true; save();
  syncControls(); renderList(); seekToImage(0);
  setStatus('Textes placés sur vos images : vérifiez-les dans les cases sous chaque image, puis créez la vidéo. Un nouveau clic propose d’autres phrases.', 'ok');
}
$('#bookTemplate').addEventListener('click', () => { pause(); bookTemplate(); });
$('#bookSel').addEventListener('change', e => { S.book = e.target.value; save(); renderPhrases(); });
document.querySelectorAll('#bookKinds .sbtn').forEach(x => x.addEventListener('click', () => { S.bookKind = x.dataset.kind; save(); renderPhrases(); }));
$('#addMention').addEventListener('click', () => {
  const b = bookOf(); if (!b) return;
  if (!images.length) { setStatus("Ajoutez d'abord vos images (étape 1).", 'err'); return; }
  const last = images[images.length - 1], text = b.mention + (b.cta ? '\n' + b.cta : '');
  if (!last.caption.includes(b.mention)) last.caption = last.caption.trim() ? last.caption.trim() + '\n' + text : text;
  pause(); renderList(); seekToImage(images.length - 1);
});

if (SOCIAL) { loadBooks(); $('#backSocial').hidden = false; $('#sendBtn').addEventListener('click', sendToLibrary); document.title = 'Montage rapide · Chest0 Social Studio'; }

if (SOCIAL) { $('#libFolder').textContent = 'Ouvrir mon dossier de musiques'; $('#libRefresh').hidden = false; }
else { $('#libFolder').textContent = 'Choisir mon dossier de musiques…';
  $('#libHelp').textContent = 'Choisissez le dossier où vous rangez vos musiques libres de droits : tous ses morceaux apparaissent ici pour cette séance.'; }
if (isLib(S.music) && !SOCIAL) S.music = 'lofi';
try { const saved = localStorage.getItem('chest0clip-logo'); if (saved) logoFromData(saved).then(li => { logoImg = li; syncControls(); refresh(); }).catch(() => {}); } catch (e) {}
if (S.logo) S.logo = true;
syncControls(); renderFormats(); renderMusicList(); applyFormat();
if (SOCIAL) loadServerLibrary();
if (STYLES[S.music]) setTimeout(() => styleSource(S.music).catch(() => {}), 400);   // prépare l'ambiance choisie à l'avance
window.__clip = {renderFrame,addFiles, images: () => images, S, exportVideo, renderTrack, results: () => results, fastSupport, imgD, total};
})();
