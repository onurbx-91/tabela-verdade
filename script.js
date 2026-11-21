/* ==========================================================
   Tabela Verdade
   ========================================================== */

const $ = id => document.getElementById(id);

const SYM = { NOT: '¬', AND: '∧', OR: '∨', IMP: '→', BIC: '↔' };

const TOKEN_MAP = {
  '¬': 'NOT', '~': 'NOT',
  '∧': 'AND', '&': 'AND',
  '∨': 'OR',  '|': 'OR',
  '→': 'IMP', '->': 'IMP',
  '↔': 'BIC', '<->': 'BIC'
};

/* ----------------------------------------------------------
   1. Tokenizador
   ---------------------------------------------------------- */
function tokenize(src) {
  const text = src.replace(/\s+/g, '');
  const re = /<->|->|↔|→|¬|~|∧|&|∨|\||\(|\)|[a-zA-Z]/y;
  const tokens = [];
  let pos = 0;

  while (pos < text.length) {
    re.lastIndex = pos;
    const m = re.exec(text);
    if (!m) throw new Error(`Caractere inválido: "${text[pos]}"`);

    const t = m[0];
    pos = re.lastIndex;

    if (t === '(') tokens.push({ t: 'LP' });
    else if (t === ')') tokens.push({ t: 'RP' });
    else if (/[a-zA-Z]/.test(t)) tokens.push({ t: 'VAR', v: t });
    else tokens.push({ t: TOKEN_MAP[t] });
  }
  return tokens;
}

/* ----------------------------------------------------------
   2. Parser (descida recursiva)
   Precedência: ¬ > ∧ > ∨ > → > ↔
   ---------------------------------------------------------- */
function parse(src) {
  const toks = tokenize(src);
  if (toks.length === 0) throw new Error('Digite uma expressão');

  let i = 0;
  const is = t => toks[i] && toks[i].t === t;

  function bic() {
    let n = imp();
    while (is('BIC')) { i++; n = { k: 'bin', op: 'BIC', l: n, r: imp() }; }
    return n;
  }
  function imp() {
    const l = or();
    if (is('IMP')) { i++; return { k: 'bin', op: 'IMP', l, r: imp() }; }
    return l;
  }
  function or() {
    let n = and();
    while (is('OR')) { i++; n = { k: 'bin', op: 'OR', l: n, r: and() }; }
    return n;
  }
  function and() {
    let n = not();
    while (is('AND')) { i++; n = { k: 'bin', op: 'AND', l: n, r: not() }; }
    return n;
  }
  function not() {
    if (is('NOT')) { i++; return { k: 'not', c: not() }; }
    return atom();
  }
  function atom() {
    if (is('VAR')) return { k: 'var', name: toks[i++].v };
    if (is('LP')) {
      i++;
      const n = bic();
      if (!is('RP')) throw new Error('Esperado ")" para fechar o parêntese');
      i++;
      return n;
    }
    if (i >= toks.length) throw new Error('Expressão incompleta');
    throw new Error('Esperado uma variável ou "("');
  }

  const ast = bic();
  if (i < toks.length) throw new Error('Há símbolos sobrando no final da expressão');
  return ast;
}

/* ----------------------------------------------------------
   3. Utilitários sobre a árvore
   ---------------------------------------------------------- */
function show(n) {
  if (n.k === 'var') return n.name;
  if (n.k === 'not') return '¬' + show(n.c);
  return `(${show(n.l)} ${SYM[n.op]} ${show(n.r)})`;
}

function evalNode(n, env) {
  if (n.k === 'var') return env[n.name];
  if (n.k === 'not') return !evalNode(n.c, env);
  const a = evalNode(n.l, env);
  const b = evalNode(n.r, env);
  switch (n.op) {
    case 'AND': return a && b;
    case 'OR':  return a || b;
    case 'IMP': return !a || b;
    case 'BIC': return a === b;
  }
}

function varsOf(n, set = new Set()) {
  if (n.k === 'var') set.add(n.name);
  else if (n.k === 'not') varsOf(n.c, set);
  else { varsOf(n.l, set); varsOf(n.r, set); }
  return [...set].sort();
}

/* Subfórmulas em ordem de cálculo (pós-ordem), sem repetir */
function subformulas(ast) {
  const seen = new Map();
  (function walk(n) {
    if (n.k === 'var') return;
    if (n.k === 'not') walk(n.c);
    else { walk(n.l); walk(n.r); }
    const key = show(n);
    if (!seen.has(key)) seen.set(key, n);
  })(ast);
  return [...seen].map(([key, node]) => ({ key, node }));
}

/* Todas as linhas: a primeira variável é a mais significativa, começando com V */
function makeRows(vs) {
  const n = vs.length;
  const rows = [];
  for (let r = 0; r < 2 ** n; r++) {
    const env = {};
    vs.forEach((v, j) => { env[v] = !((r >> (n - 1 - j)) & 1); });
    rows.push(env);
  }
  return rows;
}

/* ----------------------------------------------------------
   4. Renderização de tabelas
   ---------------------------------------------------------- */
function renderTable(el, cols, rows) {
  const head = '<thead><tr>' +
    cols.map((c, idx) => `<th class="${idx === cols.length - 1 && cols.length > 1 ? 'result' : ''}">${c.label}</th>`).join('') +
    '</tr></thead>';

  const body = '<tbody>' + rows.map(env =>
    '<tr>' + cols.map((c, idx) => {
      const val = c.fn(env);
      const cls = (val ? 'v' : 'f') + (idx === cols.length - 1 && cols.length > 1 ? ' result' : '');
      return `<td class="${cls}">${val ? 'V' : 'F'}</td>`;
    }).join('') + '</tr>'
  ).join('') + '</tbody>';

  el.innerHTML = head + body;
}

/* ----------------------------------------------------------
   5. Navegação entre abas
   ---------------------------------------------------------- */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    $(btn.dataset.tab).classList.remove('hidden');
    if (btn.dataset.tab === 'placar') atualizarPlacar();
  });
});

/* ----------------------------------------------------------
   6. Placar (salvo no localStorage do navegador)
   ---------------------------------------------------------- */
const PLACAR_KEY = 'tabela-verdade-placar';
let placar = carregarPlacar();

function carregarPlacar() {
  try {
    const data = JSON.parse(localStorage.getItem(PLACAR_KEY));
    if (data && typeof data.acertos === 'number' && typeof data.total === 'number') return data;
  } catch (_) { /* ignora dados corrompidos */ }
  return { acertos: 0, total: 0 };
}

function salvarPlacar() {
  try { localStorage.setItem(PLACAR_KEY, JSON.stringify(placar)); } catch (_) { /* sem armazenamento */ }
}

function atualizarPlacar() {
  $('stAcertos').textContent = placar.acertos;
  $('stTotal').textContent = placar.total;
  const pct = placar.total ? Math.round((placar.acertos / placar.total) * 100) : 0;
  $('stPct').textContent = pct + '%';
}

$('zerar').addEventListener('click', () => {
  if (!confirm('Zerar o placar?')) return;
  placar = { acertos: 0, total: 0 };
  salvarPlacar();
  atualizarPlacar();
});

/* ----------------------------------------------------------
   7. Modo Prática
   ---------------------------------------------------------- */
let current = null;   // { ast, vs, rows }
let answers = [];     // true (V), false (F) ou null
let verified = false;

function randomAst(depth, vs) {
  if (depth === 0 || Math.random() < 0.25) {
    return { k: 'var', name: vs[Math.floor(Math.random() * vs.length)] };
  }
  if (Math.random() < 0.2) return { k: 'not', c: randomAst(depth - 1, vs) };
  const ops = ['AND', 'OR', 'IMP', 'BIC'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  return { k: 'bin', op, l: randomAst(depth - 1, vs), r: randomAst(depth - 1, vs) };
}

function novaExpressao() {
  const n = Number($('nVars').value);
  const depth = Number($('depth').value);
  const vs = ['p', 'q', 'r'].slice(0, n);

  let ast;
  let tentativas = 0;
  do {
    ast = randomAst(depth, vs);
    tentativas++;
  } while (varsOf(ast).length < n && tentativas < 100);

  current = { ast, vs, rows: makeRows(vs) };
  answers = current.rows.map(() => null);
  verified = false;

  $('exprPratica').textContent = show(ast);
  $('feedback').textContent = '';
  $('verificar').disabled = false;
  renderPratica();
}

function renderPratica(marks) {
  const { vs, rows } = current;

  const head = '<thead><tr>' +
    vs.map(v => `<th>${v}</th>`).join('') +
    '<th class="result">Resultado</th></tr></thead>';

  const body = '<tbody>' + rows.map((env, i) => {
    const celulas = vs.map(v => `<td class="${env[v] ? 'v' : 'f'}">${env[v] ? 'V' : 'F'}</td>`).join('');
    const cls = marks ? (marks[i] ? ' ok' : ' no') : '';
    const btnV = `<button data-i="${i}" data-val="1" class="${answers[i] === true ? 'sel' : ''}" ${verified ? 'disabled' : ''}>V</button>`;
    const btnF = `<button data-i="${i}" data-val="0" class="${answers[i] === false ? 'sel' : ''}" ${verified ? 'disabled' : ''}>F</button>`;
    return `<tr>${celulas}<td class="result${cls}">${btnV}${btnF}</td></tr>`;
  }).join('') + '</tbody>';

  $('tabPratica').innerHTML = head + body;
}

$('tabPratica').addEventListener('click', e => {
  const btn = e.target.closest('button[data-i]');
  if (!btn || verified) return;
  answers[Number(btn.dataset.i)] = btn.dataset.val === '1';
  renderPratica();
});

function verificar() {
  if (!current || verified) return;
  if (answers.some(a => a === null)) {
    $('feedback').textContent = 'Responda todas as linhas antes de verificar.';
    return;
  }

  const marks = current.rows.map((env, i) => answers[i] === evalNode(current.ast, env));
  const acertos = marks.filter(Boolean).length;

  verified = true;
  renderPratica(marks);
  $('verificar').disabled = true;
  $('feedback').textContent = `Você acertou ${acertos} de ${marks.length}.` +
    (acertos === marks.length ? ' Parabéns!' : '');

  placar.acertos += acertos;
  placar.total += marks.length;
  salvarPlacar();
}

$('novaExpr').addEventListener('click', novaExpressao);
$('verificar').addEventListener('click', verificar);

/* ----------------------------------------------------------
   8. Modo Consulta (tabela completa com passo a passo)
   ---------------------------------------------------------- */
function calcular() {
  const erro = $('erro');
  const resumo = $('resumo');
  erro.textContent = '';
  resumo.textContent = '';

  let ast;
  try {
    ast = parse($('entrada').value);
  } catch (e) {
    erro.textContent = e.message;
    $('tabConsulta').innerHTML = '';
    return;
  }

  const vs = varsOf(ast);
  const subs = subformulas(ast);
  const rows = makeRows(vs);

  const cols = [
    ...vs.map(v => ({ label: v, fn: env => env[v] })),
    ...subs.map(s => ({ label: s.key, fn: env => evalNode(s.node, env) }))
  ];
  renderTable($('tabConsulta'), cols, rows);

  const finais = rows.map(env => evalNode(ast, env));
  let classe;
  if (finais.every(Boolean)) classe = 'Tautologia';
  else if (finais.every(x => !x)) classe = 'Contradição';
  else classe = 'Contingência';

  resumo.textContent = `Variáveis: ${vs.join(', ')} · Linhas: ${rows.length} · Classificação: ${classe}`;
}

$('calcular').addEventListener('click', calcular);

$('entrada').addEventListener('keydown', e => {
  if (e.key === 'Enter') calcular();
});

document.querySelectorAll('.symbols button').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $('entrada');
    const s = input.selectionStart ?? input.value.length;
    const f = input.selectionEnd ?? input.value.length;
    input.setRangeText(btn.dataset.sym, s, f, 'end');
    input.focus();
  });
});

document.querySelectorAll('button.ex').forEach(btn => {
  btn.addEventListener('click', () => {
    $('entrada').value = btn.dataset.ex;
    calcular();
  });
});

/* ----------------------------------------------------------
   9. Início
   ---------------------------------------------------------- */
novaExpressao();
atualizarPlacar();
