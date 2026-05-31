git commit -m "first commit"'use strict';
/* ====================================================
   EX PRO SCIENTIFIC CALCULATOR — script.js
   50+ Functions · Inspired by Casio fx-991 EX Plus
   ==================================================== */

// ── State ──────────────────────────────────────────
const S = {
  expr:      '',       // current expression string (display)
  shifted:   false,
  hyp:       false,
  mode:      'DEG',    // DEG | RAD | GRAD
  memory:    0,
  hasMemory: false,
  lastAns:   0,
  calcExpr:  '',       // expression snapshot after '='
  afterCalc: false,
  isError:   false,
  activeOpBtn: null,
};

// ── DOM refs ──────────────────────────────────────
const elGrid   = document.getElementById('btn-grid');
const elExpr   = document.getElementById('lcd-expr');
const elResult = document.getElementById('lcd-result');
const elBMode  = document.getElementById('badge-mode');
const elBShift = document.getElementById('badge-shift');
const elBHyp   = document.getElementById('badge-hyp');
const elBMem   = document.getElementById('badge-mem');

// ── Button Definitions ────────────────────────────
// type → CSS class suffix; alt → SHIFT secondary label
const BTNS = [
  // ── Row 1: Control ──────────────────────────────
  { id:'shift',  main:'SHIFT',  type:'ctrl-shift' },
  { id:'hyp',    main:'HYP',    type:'ctrl-hyp'   },
  { id:'mode',   main:'DEG',    type:'ctrl-mode'  },
  { id:'del',    main:'⌫',      type:'del'        },
  { id:'ac',     main:'AC',     type:'ac'         },

  // ── Row 2: Trig ─────────────────────────────────
  { id:'sin',    main:'sin',   alt:'sin⁻¹',  type:'trig'    },
  { id:'cos',    main:'cos',   alt:'cos⁻¹',  type:'trig'    },
  { id:'tan',    main:'tan',   alt:'tan⁻¹',  type:'trig'    },
  { id:'lp',     main:'(',                   type:'bracket' },
  { id:'rp',     main:')',                   type:'bracket' },

  // ── Row 3: Log & Power ──────────────────────────
  { id:'log',    main:'log',   alt:'10ˣ',    type:'log'     },
  { id:'ln',     main:'ln',    alt:'eˣ',     type:'log'     },
  { id:'xsq',    main:'x²',   alt:'x³',     type:'power'   },
  { id:'sqrt',   main:'√x',   alt:'∛x',     type:'power'   },
  { id:'xpow',   main:'xʸ',   alt:'^(1/y)', type:'power'   },

  // ── Row 4: Advanced Math ────────────────────────
  { id:'fact',   main:'n!',                  type:'special' },
  { id:'ncr',    main:'nCr',                 type:'special' },
  { id:'npr',    main:'nPr',                 type:'special' },
  { id:'abs',    main:'|x|',                 type:'special' },
  { id:'mod',    main:'mod',                 type:'special' },

  // ── Row 5: Constants & Recall ───────────────────
  { id:'pi',     main:'π',                   type:'const'   },
  { id:'euler',  main:'e',                   type:'const'   },
  { id:'exp',    main:'EXP',                 type:'const'   },
  { id:'ans',    main:'ANS',                 type:'ans'     },
  { id:'mr',     main:'MR',                  type:'memory'  },

  // ── Divider ─────────────────────────────────────
  { id:'sep1',   type:'sep' },

  // ── Row 6: 7 8 9 ÷ M+ ──────────────────────────
  { id:'n7',     main:'7',                   type:'number'  },
  { id:'n8',     main:'8',                   type:'number'  },
  { id:'n9',     main:'9',                   type:'number'  },
  { id:'div',    main:'÷',                   type:'operator'},
  { id:'mplus',  main:'M+',                  type:'memory'  },

  // ── Row 7: 4 5 6 × M− ──────────────────────────
  { id:'n4',     main:'4',                   type:'number'  },
  { id:'n5',     main:'5',                   type:'number'  },
  { id:'n6',     main:'6',                   type:'number'  },
  { id:'mul',    main:'×',                   type:'operator'},
  { id:'mminus', main:'M−',                  type:'memory'  },

  // ── Row 8: 1 2 3 − MC ──────────────────────────
  { id:'n1',     main:'1',                   type:'number'  },
  { id:'n2',     main:'2',                   type:'number'  },
  { id:'n3',     main:'3',                   type:'number'  },
  { id:'sub',    main:'−',                   type:'operator'},
  { id:'mc',     main:'MC',                  type:'memory'  },

  // ── Row 9: 0 . ± + = ───────────────────────────
  { id:'n0',     main:'0',                   type:'number'  },
  { id:'dot',    main:'.',                   type:'number'  },
  { id:'sign',   main:'±',                   type:'number'  },
  { id:'add',    main:'+',                   type:'operator'},
  { id:'equals', main:'=',                   type:'equals'  },
];

// ── Build Button DOM ──────────────────────────────
let audioCtx;

function playClickSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (err) {
    // Some browsers block audio without user gesture; ignore silently.
  }
}

function buildButtons() {
  BTNS.forEach(b => {
    // Section divider
    if (b.type === 'sep') {
      const d = document.createElement('div');
      d.className = 'btn-sep';
      elGrid.appendChild(d);
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'btn-' + b.id;
    btn.className = 'btn btn-' + b.type;
    btn.setAttribute('aria-label', b.main);

    if (b.alt) {
      btn.classList.add('has-alt');
      const a = document.createElement('span');
      a.className = 'btn-alt';
      a.id = 'alt-' + b.id;
      a.textContent = b.alt;
      btn.appendChild(a);
    }

    const m = document.createElement('span');
    m.className = 'btn-main';
    m.id = 'main-' + b.id;
    m.textContent = b.main;
    btn.appendChild(m);

    btn.addEventListener('click', () => handleBtn(b.id));
    elGrid.appendChild(btn);
  });
}

// ── Handle Button ─────────────────────────────────
function handleBtn(id) {
  playClickSound();
  const sh = S.shifted;
  const hy = S.hyp;
  ripple('btn-' + id);

  switch (id) {
    // Control
    case 'shift':  toggleShift(); return;
    case 'hyp':    toggleHyp();   return;
    case 'mode':   cycleMode();   return;
    case 'del':    doDelete();    return;
    case 'ac':     doAC();        return;

    // Trig (considers SHIFT + HYP combos)
    case 'sin':
      if (hy && sh) insertFn('asinh');
      else if (hy)  insertFn('sinh');
      else if (sh)  insertFn('asin');
      else          insertFn('sin');
      clearMods(); return;

    case 'cos':
      if (hy && sh) insertFn('acosh');
      else if (hy)  insertFn('cosh');
      else if (sh)  insertFn('acos');
      else          insertFn('cos');
      clearMods(); return;

    case 'tan':
      if (hy && sh) insertFn('atanh');
      else if (hy)  insertFn('tanh');
      else if (sh)  insertFn('atan');
      else          insertFn('tan');
      clearMods(); return;

    // Brackets
    case 'lp': rawAppend('('); return;
    case 'rp': rawAppend(')'); return;

    // Log / Power
    case 'log':
      sh ? rawAppend('10^(') : insertFn('log');
      clearMods(); return;
    case 'ln':
      sh ? rawAppend('e^(') : insertFn('ln');
      clearMods(); return;
    case 'xsq':
      sh ? rawAppend('^3') : rawAppend('^2');
      clearMods(); return;
    case 'sqrt':
      sh ? insertFn('cbrt') : insertFn('sqrt');
      clearMods(); return;
    case 'xpow':
      // SHIFT: opens 1/y root → user types: 27^(1÷3) = ∛27
      sh ? rawAppend('^(1÷') : rawAppend('^(');
      clearMods(); return;

    // Special
    case 'fact': rawAppend('!');     return;
    case 'ncr':  rawAppend('C');     return;
    case 'npr':  rawAppend('P');     return;
    case 'abs':  insertFn('abs');    return;
    case 'mod':  rawAppend(' mod '); return;

    // Constants
    case 'pi':    rawAppend('π');     return;
    case 'euler': rawAppend('e');     return;
    case 'exp':   rawAppend('×10^('); return;

    // Memory & ANS
    case 'ans':    doANS();    return;
    case 'mr':     doMR();     return;
    case 'mplus':  doMPlus();  return;
    case 'mminus': doMMinus(); return;
    case 'mc':     doMC();     return;

    // Numbers
    case 'n0': case 'n1': case 'n2': case 'n3': case 'n4':
    case 'n5': case 'n6': case 'n7': case 'n8': case 'n9':
      inputDigit(id[1]); return;
    case 'dot':  inputDot();   return;
    case 'sign': toggleSign(); return;

    // Operators
    case 'add': inputOp('+'); return;
    case 'sub': inputOp('−'); return;
    case 'mul': inputOp('×'); return;
    case 'div': inputOp('÷'); return;

    // Equals
    case 'equals': calculate(); return;
  }
}

// ── Input Helpers ─────────────────────────────────

function inputDigit(d) {
  if (S.isError) { clearState(); }
  if (S.afterCalc) {
    // If last char is an operator/open-paren: continue building
    const last = S.expr.slice(-1);
    if (!['+','−','×','÷','^','('].includes(last) && S.expr !== '') {
      S.expr = '';
    }
    S.afterCalc = false;
  }
  S.expr += d;
  clearActiveOp();
  refresh();
}

function inputDot() {
  if (S.isError || S.afterCalc) { clearState(); S.expr = '0'; }
  const parts = S.expr.split(/[+−×÷\^(]/);
  const last = parts[parts.length - 1];
  if (last.includes('.')) return;
  if (!S.expr || /[+−×÷\^(]$/.test(S.expr)) S.expr += '0';
  S.expr += '.';
  refresh();
}

function inputOp(op) {
  if (S.isError) { S.expr = '0'; S.isError = false; }
  if (S.afterCalc) S.afterCalc = false;
  const last = S.expr.slice(-1);
  if (['+','−','×','÷'].includes(last)) {
    S.expr = S.expr.slice(0, -1) + op;
  } else {
    if (!S.expr) S.expr = '0';
    S.expr += op;
  }
  highlightOp(op);
  refresh();
}

function insertFn(fn) {
  if (S.isError) clearState();
  if (S.afterCalc) { S.expr = ''; S.afterCalc = false; }
  const last = S.expr.slice(-1);
  if (/[\d)π]/.test(last)) S.expr += '×';
  S.expr += fn + '(';
  clearActiveOp();
  refresh();
}

function rawAppend(s) {
  if (S.isError) clearState();
  if (S.afterCalc && !/^[+−×÷\^]/.test(s.trim())) {
    S.expr = ''; S.afterCalc = false;
  } else {
    S.afterCalc = false;
  }
  S.expr += s;
  clearActiveOp();
  refresh();
}

function toggleSign() {
  if (!S.expr || S.expr === '0') return;
  if (S.expr.startsWith('-')) { S.expr = S.expr.slice(1); }
  else {
    const m = S.expr.match(/^(.*[+−×÷\^(])(-?\d*\.?\d+)$/);
    if (m) {
      const num = m[2];
      S.expr = m[1] + (num.startsWith('-') ? num.slice(1) : '-' + num);
    } else {
      S.expr = '-(' + S.expr + ')';
    }
  }
  refresh();
}

function doANS() {
  const ans = cleanNum(S.lastAns);
  rawAppend(ans);
}

// ── Delete / Clear ────────────────────────────────

function doDelete() {
  if (S.isError || S.afterCalc) { doAC(); return; }
  if (!S.expr) return;
  // Remove multi-char tokens like 'mod '
  if (S.expr.endsWith(' mod ')) { S.expr = S.expr.slice(0, -5); }
  else S.expr = S.expr.slice(0, -1);
  refresh();
}

function doAC() {
  clearState();
  elExpr.textContent = '\u00a0';
  setResult('0', false);
}

function clearState() {
  S.expr      = '';
  S.afterCalc = false;
  S.isError   = false;
  S.shifted   = false;
  S.hyp       = false;
  clearActiveOp();
  updateBadges();
  refreshTrigLabels();
}

// ── Calculate ─────────────────────────────────────

function calculate() {
  if (!S.expr.trim()) return;
  clearActiveOp();

  // Auto-close unclosed parentheses
  let expr = S.expr;
  const opens  = (expr.match(/\(/g) || []).length;
  const closes = (expr.match(/\)/g) || []).length;
  for (let i = 0; i < opens - closes; i++) expr += ')';

  // Remove trailing operators
  expr = expr.replace(/[+−×÷\^]\s*$/, '');

  try {
    const val = evalExpr(expr);
    const fmt = fmtNum(val);

    S.calcExpr = S.expr;
    S.lastAns  = val;
    S.afterCalc = true;
    S.isError   = false;
    S.expr      = cleanNum(val);

    elExpr.textContent = S.calcExpr + ' =';
    setResult(fmt, false);

    // Glow flash
    elResult.style.textShadow = '0 0 40px rgba(100,210,255,.9)';
    setTimeout(() => { elResult.style.textShadow = ''; }, 500);

  } catch (err) {
    showError(err.message || 'Error');
  }
}

function showError(msg) {
  S.isError = true;
  elExpr.textContent = S.expr;
  elResult.textContent = msg;
  elResult.className = 'lcd-result err';
  setTimeout(() => {
    if (S.isError) { doAC(); }
  }, 2000);
}

// ── Display Refresh ───────────────────────────────

function refresh() {
  if (!S.afterCalc) {
    elExpr.textContent = S.expr || '\u00a0';
  }
  if (!S.expr) { setResult('0', false); return; }

  // Live preview: try to evaluate completed-looking expression
  try {
    let preview = S.expr;
    const o = (preview.match(/\(/g) || []).length;
    const c = (preview.match(/\)/g) || []).length;
    for (let i = 0; i < o - c && i < 5; i++) preview += ')';
    preview = preview.replace(/[+−×÷\^]\s*$/, '');
    if (!preview) throw '';
    const val = evalExpr(preview);
    if (isFinite(val) && !isNaN(val)) setResult(fmtNum(val), false);
  } catch {
    setResult(S.expr, true);
  }
}

function setResult(txt, isExpr) {
  elResult.textContent = txt;
  const base = 'lcd-result';
  const l = txt.length;
  let sz = '';
  if (l > 20)     sz = ' sz-xs';
  else if (l > 14) sz = ' sz-sm';
  else if (l > 9)  sz = ' sz-med';
  elResult.className = base + sz;
}

// ── Evaluator ─────────────────────────────────────

function toRad(x) {
  if (S.mode === 'DEG')  return x * Math.PI / 180;
  if (S.mode === 'GRAD') return x * Math.PI / 200;
  return x;
}
function fromRad(x) {
  if (S.mode === 'DEG')  return x * 180 / Math.PI;
  if (S.mode === 'GRAD') return x * 200 / Math.PI;
  return x;
}

function factN(n) {
  n = Math.round(n);
  if (n < 0)   throw new Error('Domain Error');
  if (n > 170) throw new Error('Overflow');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function nCr(n, r) {
  n = Math.round(n); r = Math.round(r);
  if (r < 0 || r > n) return 0;
  return factN(n) / (factN(r) * factN(n - r));
}
function nPr(n, r) {
  n = Math.round(n); r = Math.round(r);
  if (r < 0 || r > n) return 0;
  return factN(n) / factN(n - r);
}

function evalExpr(raw) {
  let e = raw.trim();
  if (!e) return null;

  // ── Preprocess ──

  // Factorial: 5! → fact(5)
  e = e.replace(/(\d+(?:\.\d+)?)\s*!/g, 'fact($1)');

  // nCr: 5C3 → nCr(5,3)
  e = e.replace(/(\d+(?:\.\d+)?)\s*C\s*(\d+(?:\.\d+)?)/g, 'nCr($1,$2)');
  // nPr: 5P3 → nPr(5,3)
  e = e.replace(/(\d+(?:\.\d+)?)\s*P\s*(\d+(?:\.\d+)?)/g, 'nPr($1,$2)');

  // Constants: π → PI, standalone e → E
  e = e.replace(/π/g, 'PI');
  // standalone e: not adjacent to digits (avoid 2e3 scientific notation)
  e = e.replace(/(?<![0-9.])e(?![0-9.])/g, 'EU');

  // Operators
  e = e.replace(/÷/g, '/');
  e = e.replace(/×/g, '*');
  e = e.replace(/−/g, '-');

  // Power
  e = e.replace(/\^/g, '**');

  // Mod
  e = e.replace(/\s*mod\s*/gi, '%');

  // Implicit multiplication
  const fnPat = '(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|log|ln|sqrt|cbrt|abs)';
  e = e.replace(new RegExp(`(\\d)(${fnPat.slice(1,-1)})\\(`, 'g'), '$1*$2(');
  e = e.replace(new RegExp(`(\\d)\\s*PI`, 'g'), '$1*PI');
  e = e.replace(new RegExp(`(\\d)\\s*EU(?![0-9])`, 'g'), '$1*EU');
  e = e.replace(/(PI|EU)\s*(\d)/g, '$1*$2');
  e = e.replace(/(\d)\s*\(/g, '$1*(');
  e = e.replace(/\)\s*(\d)/g, ')*$1');
  e = e.replace(/\)\s*\(/g, ')*(');
  e = e.replace(/\)\s*PI/g, ')*PI');
  e = e.replace(/\)\s*EU(?![0-9])/g, ')*EU');

  // Build evaluation context
  const ctx = {
    PI:    Math.PI,
    EU:    Math.E,
    sin:   x => Math.sin(toRad(x)),
    cos:   x => Math.cos(toRad(x)),
    tan:   x => {
      const c = Math.cos(toRad(x));
      if (Math.abs(c) < 1e-12) throw new Error('Undefined');
      return Math.tan(toRad(x));
    },
    asin:  x => { if (x < -1 || x > 1) throw new Error('Domain Error'); return fromRad(Math.asin(x)); },
    acos:  x => { if (x < -1 || x > 1) throw new Error('Domain Error'); return fromRad(Math.acos(x)); },
    atan:  x => fromRad(Math.atan(x)),
    sinh:  x => Math.sinh(x),
    cosh:  x => Math.cosh(x),
    tanh:  x => Math.tanh(x),
    asinh: x => Math.asinh(x),
    acosh: x => { if (x < 1) throw new Error('Domain Error'); return Math.acosh(x); },
    atanh: x => { if (x <= -1 || x >= 1) throw new Error('Domain Error'); return Math.atanh(x); },
    log:   x => { if (x <= 0) throw new Error('Domain Error'); return Math.log10(x); },
    ln:    x => { if (x <= 0) throw new Error('Domain Error'); return Math.log(x); },
    sqrt:  x => { if (x < 0)  throw new Error('Domain Error'); return Math.sqrt(x); },
    cbrt:  x => Math.cbrt(x),
    abs:   x => Math.abs(x),
    fact:  factN,
    nCr:   nCr,
    nPr:   nPr,
  };

  const keys = Object.keys(ctx);
  const vals = Object.values(ctx);

  let result;
  try {
    const fn = new Function(...keys, `"use strict"; return (${e});`);
    result = fn(...vals);
  } catch (err) {
    throw new Error('Syntax Error');
  }

  if (result === Infinity)  throw new Error('∞ (Overflow)');
  if (result === -Infinity) throw new Error('-∞ (Overflow)');
  if (isNaN(result))        throw new Error('Math Error');
  return result;
}

// ── Number Formatting ─────────────────────────────

function fmtNum(n) {
  if (!isFinite(n)) return n.toString();
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-9 && abs !== 0)) {
    return n.toExponential(6).replace(/\.?0+(e)/, '$1');
  }
  const r = parseFloat(n.toPrecision(12));
  if (Number.isInteger(r)) return r.toLocaleString('en-US');
  let s = r.toString();
  if (s.includes('.') && s.split('.')[1].length > 10) {
    s = r.toFixed(10).replace(/\.?0+$/, '');
  }
  return s;
}

function cleanNum(n) {
  // Return plain number string (no commas) for use in expressions
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-9 && abs !== 0)) return n.toPrecision(10);
  return parseFloat(n.toPrecision(12)).toString();
}

// ── Mode ──────────────────────────────────────────

function cycleMode() {
  const modes = ['DEG','RAD','GRAD'];
  S.mode = modes[(modes.indexOf(S.mode) + 1) % 3];
  elBMode.textContent = S.mode;
  const mBtn = document.getElementById('btn-mode');
  if (mBtn) mBtn.querySelector('.btn-main').textContent = S.mode;
  doAC();
}

// ── Shift / Hyp ───────────────────────────────────

function toggleShift() {
  S.shifted = !S.shifted;
  document.getElementById('btn-grid').classList.toggle('shifted', S.shifted);
  document.getElementById('btn-shift').classList.toggle('sh-on', S.shifted);
  updateBadges();
}

function toggleHyp() {
  S.hyp = !S.hyp;
  document.getElementById('btn-hyp').classList.toggle('hy-on', S.hyp);
  updateBadges();
  refreshTrigLabels();
}

function clearMods() {
  if (S.shifted) toggleShift();
  // HYP stays until manually toggled again
}

function refreshTrigLabels() {
  ['sin','cos','tan'].forEach(id => {
    const mEl = document.getElementById('main-' + id);
    const aEl = document.getElementById('alt-' + id);
    if (!mEl) return;
    if (S.hyp) {
      mEl.textContent = id + 'h';
      if (aEl) aEl.textContent = id + 'h⁻¹';
    } else {
      mEl.textContent = id;
      if (aEl) aEl.textContent = id + '⁻¹';
    }
  });
}

// ── Memory ────────────────────────────────────────

function doMR() {
  if (!S.hasMemory) return;
  rawAppend(cleanNum(S.memory));
}
function doMPlus() {
  try {
    let expr = S.expr;
    const o = (expr.match(/\(/g)||[]).length, c = (expr.match(/\)/g)||[]).length;
    for (let i = 0; i < o-c; i++) expr += ')';
    S.memory += evalExpr(expr);
    S.hasMemory = true;
    elBMem.textContent = 'M=' + fmtNum(S.memory);
    elBMem.classList.remove('hidden');
  } catch { showError('Error'); }
}
function doMMinus() {
  try {
    let expr = S.expr;
    const o = (expr.match(/\(/g)||[]).length, c = (expr.match(/\)/g)||[]).length;
    for (let i = 0; i < o-c; i++) expr += ')';
    S.memory -= evalExpr(expr);
    S.hasMemory = true;
    elBMem.textContent = 'M=' + fmtNum(S.memory);
    elBMem.classList.remove('hidden');
  } catch { showError('Error'); }
}
function doMC() {
  S.memory = 0; S.hasMemory = false;
  elBMem.classList.add('hidden');
  elBMem.textContent = 'M';
}

// ── Active Operator Highlight ─────────────────────

function highlightOp(op) {
  clearActiveOp();
  const m = {'+':'add','−':'sub','×':'mul','÷':'div'};
  const btn = document.getElementById('btn-' + (m[op] || ''));
  if (btn) { btn.classList.add('op-active'); S.activeOpBtn = btn; }
}
function clearActiveOp() {
  if (S.activeOpBtn) { S.activeOpBtn.classList.remove('op-active'); S.activeOpBtn = null; }
}

// ── Button Ripple ─────────────────────────────────

function ripple(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.style.transform = 'scale(0.88)';
  setTimeout(() => { btn.style.transform = ''; }, 140);
}

// ── Status Badges ─────────────────────────────────

function updateBadges() {
  elBShift.classList.toggle('hidden', !S.shifted);
  elBHyp.classList.toggle('hidden',  !S.hyp);
}

// ── Keyboard Support ──────────────────────────────

document.addEventListener('keydown', ev => {
  if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
  const k = ev.key;

  const map = {
    '0':'n0','1':'n1','2':'n2','3':'n3','4':'n4',
    '5':'n5','6':'n6','7':'n7','8':'n8','9':'n9',
    '.':'dot', '+':'add', '-':'sub', '*':'mul',
    '/':'div', '(':'lp', ')':'rp',
    'Enter':'equals','=':'equals',
    'Backspace':'del','Escape':'ac','%':'mod',
  };

  if (map[k]) {
    ev.preventDefault();
    handleBtn(map[k]);
    ripple('btn-' + map[k]);
    return;
  }

  // Shortcut keys
  const sk = { 's':'sin','c':'cos','t':'tan','l':'log','p':'pi','e':'euler' };
  const skL = k.toLowerCase();
  if (sk[skL]) { handleBtn(sk[skL]); ripple('btn-' + sk[skL]); ev.preventDefault(); }
  if (k === 'F2') { handleBtn('shift'); ripple('btn-shift'); ev.preventDefault(); }
  if (k === 'F3') { handleBtn('mode');  ripple('btn-mode');  ev.preventDefault(); }
});

// ── Init ──────────────────────────────────────────
buildButtons();
updateBadges();
