// 畫面：像素球場動畫、記分板、文字轉播、比賽數據、球員名單（中文 / English）
// The page: the pixel court animation, scoreboard, play-by-play, box score and roster.
(function () {
'use strict';
const { Game, makeMatch, addStars, POS, POS_NAME, RULES, BASKET, newStats, ovr } = HOOPS;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ---------------- text ----------------
const TX = {
  zh: {
    title: '像素籃球', subtitle: 'NBA 規則的全自動籃球模擬', speed: '速度', play: '▶ 開始比賽', pause: '⏸ 暫停', resume: '▶ 繼續',
    sim: '⏭ 直接模擬到結束', next: '下一場 ▶', newTeams: '🔄 重新組隊', lang: 'English',
    tabLog: '文字轉播', tabBox: '比賽數據', tabRoster: '球員名單',
    help: '每隊 5 人上場、13 人名單；四節各 12 分鐘、24 秒進攻時限（搶到進攻籃板重設為 14 秒），平手延長 5 分鐘。個人 6 犯畢業，單節團隊第 5 次犯規起進入加罰。球員會累，教練依體力和犯規換人。★ 是一定會出現的四位超級球員 Josh Chen、Jasper Chen、Jeff Chen、Erin Lai，每場隨機分到兩隊的不同位置。',
    period: n => n <= 4 ? '第 ' + n + ' 節' : (n === 5 ? '延長賽' : '第 ' + (n - 4) + ' 次延長'), final: '比賽結束', fouls: '團隊犯規', bonus: '加罰',
    rec: (w, l) => w + ' 勝 ' + l + ' 敗', offense: '進攻', defense: '防守', onBall: '持球', guarding: '防守中',
    rt: { ins: '內線', mid: '中距', thr: '三分', ft: '罰球', pas: '傳球', hnd: '控球', spd: '速度', def: '防守', blk: '阻攻', reb: '籃板', sta: '體力' },
    today: '本場', energy: '體力', total: '全隊', player: '球員', pos: '位', hgt: '身高', ovr: '總評',
    pre: '比賽即將開始', jump: '跳球！', tipoff: '開賽跳球',
    ev: {
      make: (p, e) => p + ' ' + (e.type === 'three' ? '三分球命中！' : e.type === 'mid' ? e.dist + ' 呎跳投得手' : pick(['上籃得分', '切入上籃', '禁區得手', '灌籃！'], e)) + (e.ast ? '（' + e.ast + ' 助攻）' : ''),
      miss: (p, e) => p + ' ' + (e.type === 'three' ? '三分出手不進' : e.type === 'mid' ? e.dist + ' 呎跳投不進' : '上籃沒進'),
      block: (p, e) => e.by + ' 蓋掉 ' + p + ' 的投籃！',
      steal: (p, e) => e.by + ' 抄走 ' + p + ' 的球！',
      turnover: (p, e) => p + ' ' + { travel: '走步', out: '球出界', pass: '傳球失誤', offensive: '進攻犯規' }[e.how],
      shotclock: p => p + ' 24 秒違例',
      reb: (p, e) => p + (e.off ? ' 搶下進攻籃板' : ' 抓下防守籃板'),
      foul: (p, e) => p + ' 犯規（個人第 ' + e.count + ' 次，團隊 ' + e.team + ' 次）',
      foulout: p => p + ' 六犯畢業！',
      shootfoul: (p, e) => p + ' 投籃被犯規，罰球 ' + (e.type === 'three' ? 3 : 2) + ' 次',
      andone: (p, e) => p + (e.type === 'three' ? ' 三分球進還被犯規！' : ' 打進還加罰！'),
      ft: (p, e) => p + ' 罰球 ' + e.n + '/' + e.of + (e.made ? ' 進' : ' 不進'),
      sub: (p, e) => '換人：' + e.innName + ' 上場，' + e.outName + ' 下場'
    }
  },
  en: {
    title: 'Pixel Hoops', subtitle: 'an automatic basketball sim with NBA rules', speed: 'Speed', play: '▶ Tip off', pause: '⏸ Pause', resume: '▶ Resume',
    sim: '⏭ Sim to the end', next: 'Next game ▶', newTeams: '🔄 New teams', lang: '中文',
    tabLog: 'Play-by-play', tabBox: 'Box score', tabRoster: 'Rosters',
    help: '5 players on the court, 13 on the roster; four 12-minute quarters, a 24-second shot clock (reset to 14 after an offensive rebound), 5-minute overtimes when tied. Players foul out at 6, and a team is in the bonus from its 5th foul of a quarter. Players get tired and coaches substitute for fatigue and foul trouble. ★ marks the four super players who are always in the game — Josh Chen, Jasper Chen, Jeff Chen and Erin Lai — placed on random teams and positions each match.',
    period: n => n <= 4 ? 'Q' + n : (n === 5 ? 'OT' : (n - 4) + 'OT'), final: 'Final', fouls: 'Team fouls', bonus: 'BONUS',
    rec: (w, l) => w + '-' + l, offense: 'Offense', defense: 'Defense', onBall: 'Has the ball', guarding: 'Guarding',
    rt: { ins: 'Inside', mid: 'Mid', thr: '3PT', ft: 'FT', pas: 'Pass', hnd: 'Handle', spd: 'Speed', def: 'Def', blk: 'Block', reb: 'Reb', sta: 'Stamina' },
    today: 'Today', energy: 'Energy', total: 'Team', player: 'Player', pos: 'Pos', hgt: 'Ht', ovr: 'OVR',
    pre: 'About to tip off', jump: 'Jump ball!', tipoff: 'Opening tip',
    ev: {
      make: (p, e) => p + ' ' + (e.type === 'three' ? 'drains a three!' : e.type === 'mid' ? 'hits a ' + e.dist + '-footer' : pick(['lays it in', 'scores on the drive', 'finishes inside', 'throws it down!'], e)) + (e.ast ? ' (assist ' + e.ast + ')' : ''),
      miss: (p, e) => p + ' ' + (e.type === 'three' ? 'misses a three' : e.type === 'mid' ? 'misses a ' + e.dist + '-footer' : 'misses the layup'),
      block: (p, e) => e.by + ' blocks ' + p + '!',
      steal: (p, e) => e.by + ' steals it from ' + p + '!',
      turnover: (p, e) => p + ' ' + { travel: 'travels', out: 'steps out of bounds', pass: 'throws it away', offensive: 'commits an offensive foul' }[e.how],
      shotclock: p => 'Shot clock violation on ' + p,
      reb: (p, e) => p + (e.off ? ' grabs the offensive rebound' : ' pulls down the rebound'),
      foul: (p, e) => 'Foul on ' + p + ' (' + e.count + ' personal, ' + e.team + ' team)',
      foulout: p => p + ' fouls out!',
      shootfoul: (p, e) => p + ' is fouled on the shot: ' + (e.type === 'three' ? 3 : 2) + ' free throws',
      andone: (p, e) => p + (e.type === 'three' ? ' hits the three and gets fouled!' : ' scores and draws the foul!'),
      ft: (p, e) => p + ' free throw ' + e.n + ' of ' + e.of + (e.made ? ': good' : ': missed'),
      sub: (p, e) => 'Sub: ' + e.innName + ' in for ' + e.outName
    }
  }
};
function pick(list, e) { return list[(e.p && e.p.id || 0) % list.length]; }
let lang = 'zh';
try { const l = localStorage.getItem('hoops.lang'); if (l === 'en' || l === 'zh') lang = l; else if (!/^zh/i.test(navigator.language || 'zh')) lang = 'en'; } catch (e) { /* private mode */ }
const T = k => TX[lang][k];
const nm = p => (p.name[lang] || p.name.zh);
const tn = t => (t.city[lang] || t.city.zh) + (lang === 'en' ? ' ' : '') + (t.name[lang] || t.name.zh);
const star = p => p.star ? ' <span class="star">★</span>' : '';
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------------- teams (saved in this browser so records carry over) ----------------
const KEYS = ['name', 'main', 'alt', 'trim', 'skin', 'city', 'W', 'L'];
const PKEYS = ['id', 'name', 'num', 'pos', 'hgt', 'r', 's', 'star'];
function saveTeams() {
  try { localStorage.setItem('hoops.teams', JSON.stringify(teams.map(t => Object.assign(Object.fromEntries(KEYS.map(k => [k, t[k]])), { roster: t.roster.map(p => Object.fromEntries(PKEYS.map(k => [k, p[k]]))) })))); } catch (e) { /* ignore */ }
}
function loadTeams() {
  try {
    const d = JSON.parse(localStorage.getItem('hoops.teams'));
    if (!d || d.length !== 2) return null;
    return addStars(d.map(td => { const t = Object.assign({}, td); t.roster = td.roster.map(pd => Object.assign({}, pd, { team: t, g: newStats(), s: Object.assign(newStats(), pd.s) })); return t; }));
  } catch (e) { return null; }
}

let teams = loadTeams() || makeMatch(), game = null, cur = null, pt = 0, playing = false, speed = 4, lineups = null, startScore = [0, 0];
let pos = {}, lastPos = {}, ballPos = { x: 47, y: 25, h: 0 }, popups = [], logShown = 0;

function newGame(fresh) {
  if (fresh) teams = makeMatch();
  saveTeams();
  game = new Game(teams[0], teams[1]);
  cur = null; pt = 0; pos = {}; lastPos = {}; popups = []; logShown = 0;
  $('log').innerHTML = '';
  addLog({ cls: 'period', tm: '', text: T('tipoff') + ' — ' + tn(teams[0]) + ' vs ' + tn(teams[1]) });
  setPlaying(false);
  $('next').disabled = true;
  placeInitial();
  renderAll();
}
function setPlaying(on) {
  playing = on;
  $('play').textContent = game && game.over ? T('play') : on ? T('pause') : (cur || (game && game.log.length) ? T('resume') : T('play'));
  $('play').disabled = !!(game && game.over);
}

// ---------------- the court ----------------
const cv = $('court'), g = cv.getContext('2d');
const S = 4;
const PZ = 0.75;                         // sprite pixel = PZ logical px (3 device px) — big chibi players                              // device pixels per logical pixel (sprites use half pixels: 2 device pixels each)
const W = 320, H = 176, FT = 3.2, OX = 9.6, OY = 8;   // logical size; feet → logical pixels
const px = x => OX + x * FT, py = y => OY + y * FT;
g.imageSmoothingEnabled = false;

let floorImg = null;
function floor() {
  if (floorImg) return floorImg;
  const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const f = c.getContext('2d'); f.scale(S, S);
  f.fillStyle = '#1a1d28'; f.fillRect(0, 0, W, H);
  // wood planks
  for (let y = 0; y < 160; y += 2) {
    f.fillStyle = (y / 2) % 2 ? '#d49a5a' : '#cc9152'; f.fillRect(OX, OY + y, 300.8, 2);
    for (let x = ((y * 7) % 40); x < 300; x += 40) { f.fillStyle = 'rgba(90,50,20,0.18)'; f.fillRect(OX + x, OY + y, 1, 2); }
  }
  // paint (the keys), tinted with the home colors
  const home = teams[1];
  f.globalAlpha = 0.55; f.fillStyle = home.main;
  f.fillRect(px(0), py(17), 19 * FT, 16 * FT); f.fillRect(px(75), py(17), 19 * FT, 16 * FT);
  f.globalAlpha = 1;
  f.strokeStyle = '#ffffff'; f.lineWidth = 0.8;
  const line = (x1, y1, x2, y2) => { f.beginPath(); f.moveTo(px(x1), py(y1)); f.lineTo(px(x2), py(y2)); f.stroke(); };
  f.strokeRect(px(0), py(0), 94 * FT, 50 * FT);
  line(47, 0, 47, 50);
  f.beginPath(); f.arc(px(47), py(25), 6 * FT, 0, Math.PI * 2); f.stroke();
  f.beginPath(); f.arc(px(47), py(25), 2 * FT, 0, Math.PI * 2); f.stroke();
  [0, 1].forEach(sideIdx => {
    const bx = sideIdx ? 88.75 : 5.25, dir = sideIdx ? -1 : 1, base = sideIdx ? 94 : 0;
    f.strokeRect(px(Math.min(base, base + dir * 19)), py(17), 19 * FT, 16 * FT);                  // key
    f.beginPath(); f.arc(px(base + dir * 19), py(25), 6 * FT, sideIdx ? Math.PI / 2 : -Math.PI / 2, sideIdx ? Math.PI * 1.5 : Math.PI / 2); f.stroke();   // free throw circle
    line(base, 3, base + dir * 14, 3); line(base, 47, base + dir * 14, 47);                        // corner threes
    const a = Math.acos((14 - 5.25) / 23.75);
    f.beginPath(); if (sideIdx) f.arc(px(bx), py(25), 23.75 * FT, Math.PI - a, Math.PI + a); else f.arc(px(bx), py(25), 23.75 * FT, -a, a);
    // the arc only between the corner lines
    f.stroke();
    f.beginPath(); f.arc(px(bx), py(25), 4 * FT, sideIdx ? Math.PI / 2 : -Math.PI / 2, sideIdx ? Math.PI * 1.5 : Math.PI / 2); f.stroke();   // restricted area
  });
  // center logo
  f.fillStyle = home.main; f.globalAlpha = 0.9; f.beginPath(); f.arc(px(47), py(25), 5.6 * FT, 0, Math.PI * 2); f.fill(); f.globalAlpha = 1;
  f.fillStyle = home.alt; f.font = 'bold 7px sans-serif'; f.textAlign = 'center'; f.textBaseline = 'middle';
  f.fillText((home.name[lang] || home.name.zh).slice(0, lang === 'en' ? 8 : 2), px(47), py(25) + 0.5);
  // baskets: backboard + rim
  [[4, 5.25], [90, 88.75]].forEach(b => {
    f.fillStyle = '#ffffff'; f.fillRect(px(b[0]) - 0.5, py(22), 1.5, 6 * FT);
    f.strokeStyle = '#ff6a1a'; f.lineWidth = 1.2; f.beginPath(); f.arc(px(b[1]), py(25), 0.9 * FT, 0, Math.PI * 2); f.stroke();
  });
  return (floorImg = c);
}

// ---- where everyone stands (feet) ----
const SPOTS = { PG: [24, 0], SG: [19, -15], SF: [5, 21], PF: [13, 9], C: [4, -6] };
function basketFor(side, period) { return BASKET[(side + (period >= 3 ? 1 : 0)) % 2]; }
function evAt(t, kinds) { let last = null; cur.tl.forEach(e => { if (e.t <= t && (!kinds || kinds.includes(e.k))) last = e; }); return last; }
function computePositions() {
  if (!cur) return;
  const off = cur.off, B = basketFor(off, cur.period), dir = B.x > 47 ? -1 : 1;
  const O = lineups[off], D = lineups[1 - off];
  const ftEv = cur.tl.find(e => e.k === 'ft' && pt >= e.t - 1.6 && pt <= e.t + 0.2);
  const shot = cur.tl.find(e => e.k === 'shot');
  const reb = cur.tl.find(e => e.k === 'reb' && pt >= e.t - 1 && pt <= e.t + 0.6);
  const target = {};
  const wob = (i, a) => Math.sin(pt * (0.7 + i * 0.13) + i * 1.7) * a;
  O.forEach((p, i) => {
    const s = SPOTS[POS[i]] || [15, 0];
    let x = B.x + dir * s[0] + wob(i, 2.2), y = B.y + s[1] + wob(i + 3, 2.6);
    if (shot && p.id === shot.p && pt > shot.t - 1.4 && pt <= shot.t + 0.3) {
      const k = clamp((pt - (shot.t - 1.4)) / 1.2, 0, 1);
      x = x + (shot.x - x) * k; y = y + (shot.y - y) * k;
    }
    target[p.id] = { x, y };
  });
  D.forEach((p, i) => {
    const m = target[O[i].id];
    target[p.id] = { x: m.x + (B.x - m.x) * 0.25, y: m.y + (B.y - m.y) * 0.25 };
  });
  if (ftEv) {                                    // free throws: everyone lines up on the lane
    const shooter = ftEv.p, lane = [[7, -6], [11, -6], [7, 6], [11, 6], [15, -9], [15, 9], [26, -4], [26, 4], [30, 0]];
    let k = 0;
    O.concat(D).forEach(p => {
      if (p.id === shooter) target[p.id] = { x: B.x + dir * 15, y: 25 };
      else { const l = lane[k++ % lane.length]; target[p.id] = { x: B.x + dir * l[0], y: 25 + l[1] }; }
    });
  }
  if (reb) { const ball = { x: B.x + dir * 4, y: 25 }; target[reb.p] = { x: ball.x + dir * 2, y: ball.y + (reb.p % 2 ? 2 : -2) }; }
  // transition from where they were when the possession started
  const tr = cur.transition || 3, k = clamp(pt / tr, 0, 1), e = k * k * (3 - 2 * k);
  Object.keys(target).forEach(id => {
    const from = lastPos[id] || target[id], to = target[id];
    const p = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
    const prev = pos[id];
    p.moving = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) > 0.02 : false;
    p.face = prev && Math.abs(p.x - prev.x) > 0.01 ? Math.sign(p.x - prev.x) : prev ? prev.face : 1;
    pos[id] = p;
  });
}
function computeBall() {
  if (!cur) return;
  const off = cur.off, B = basketFor(off, cur.period);
  const evs = cur.tl.filter(e => e.t <= pt + 1e-6);
  let holder = null, ball = null;
  for (const e of evs) {
    if (e.k === 'hold') holder = e.p;
    if (e.k === 'pass') { if (pt < e.t + e.dur) { const a = pos[e.from], b = pos[e.to]; if (a && b) { const k = (pt - e.t) / e.dur; ball = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, h: Math.sin(k * Math.PI) * 2 }; } holder = null; } else { holder = e.to; ball = null; } }
    if (e.k === 'shot') {
      const fl = e.dur, k = (pt - e.t) / fl, a = pos[e.p];
      if (k < 1 && a) { ball = { x: a.x + (B.x - a.x) * k, y: a.y + (B.y - a.y) * k, h: Math.sin(k * Math.PI) * (e.type === 'three' ? 12 : 8) + k * 3 }; holder = null; }
      else { ball = { x: B.x, y: B.y, h: 3 }; holder = null; }
    }
    if (e.k === 'make' || e.k === 'miss') { ball = { x: B.x, y: B.y, h: Math.max(0, 3 - (pt - e.t) * 6) }; holder = null; }
    if (e.k === 'block') { const a = pos[e.p]; if (a) ball = { x: a.x, y: a.y, h: 4 }; holder = null; }
    if (e.k === 'reb' || e.k === 'steal') { const p = e.k === 'steal' ? e.by : e.p; const a = pos[p]; if (a && pt < e.t + 0.4 && ball) { const k = (pt - e.t) / 0.4; ball = { x: ball.x + (a.x - ball.x) * k, y: ball.y + (a.y - ball.y) * k, h: 2 }; } else { holder = p; ball = null; } }
    if (e.k === 'ft') { const a = pos[e.p], k = clamp((pt - (e.t - 0.9)) / 0.9, 0, 1); if (a) ball = { x: a.x + (B.x - a.x) * k, y: a.y + (B.y - a.y) * k, h: Math.sin(k * Math.PI) * 7 + k * 3 }; holder = null; }
  }
  const nextFt = cur.tl.find(e => e.k === 'ft' && pt >= e.t - 1.6 && pt < e.t - 0.9);
  if (nextFt) { holder = nextFt.p; ball = null; }
  if (holder != null && pos[holder]) {
    const a = pos[holder], bounce = Math.abs(Math.sin(pt * 9)) * 1.2;
    ballPos = { x: a.x + (a.face || 1) * 0.9, y: a.y + 0.6, h: 1 + bounce, holder };
  } else if (ball) ballPos = Object.assign({ holder: null }, ball);
}
function placeInitial() {          // a jump ball at center court
  pos = {}; lastPos = {};
  const L = [game.ts[0].on, game.ts[1].on];
  L.forEach((on, s) => on.forEach((p, i) => {
    const dir = s ? 1 : -1, xs = [2, 9, 9, 16, 16][i], ys = [0, -8, 8, -14, 14][i];
    lastPos[p.id] = pos[p.id] = { x: 47 + dir * (i ? xs : 1.5), y: 25 + (i ? ys : 0), face: -dir };
  }));
  ballPos = { x: 47, y: 25, h: 8 };
}

// ---------------- players: big-headed pixel sprites, each with their own look ----------------
// A sprite is painted at twice the court's pixel detail (each sprite pixel = half a court pixel), then cached.
const SKINS = ['#f6d3b3', '#eab68c', '#cf9566', '#a06842', '#6f4529'];
const HAIRS = ['#1b1410', '#3a2414', '#6a3e1e', '#c8962e', '#a4381c', '#e8e2d8'];
const STYLES = ['short', 'buzz', 'afro', 'spiky', 'bun', 'mohawk', 'bald', 'long', 'rows'];
const SHOES = ['#f4f4f4', '#202020', '#e03030', '#2f6fde', '#30c060', '#f0a020', '#ff7ab8'];
// the four super players always look the same
const STAR_LOOK = {
  'Josh Chen':   { skin: 1, hair: 1, style: 'short', band: '#2e9e44' },
  'Jasper Chen': { skin: 1, hair: 0, style: 'spiky', band: null },
  'Jeff Chen':   { skin: 1, hair: 0, style: 'short', beard: true, goggles: true, band: null },
  'Erin Lai':    { skin: 0, hair: 1, style: 'bun', band: '#ff7aa0', beard: false }
};
function look(p) {
  if (p.look) return p.look;
  let seed = (p.id * 2654435761) % 2147483647 || 7;
  const r = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  const L = { skin: Math.floor(r() * SKINS.length), hair: r() < 0.92 ? Math.floor(r() * 5) : 5, style: STYLES[Math.floor(r() * STYLES.length)],
              beard: r() < 0.22, band: r() < 0.25 ? 'team' : null, goggles: r() < 0.07, sleeve: r() < 0.3, shoes: SHOES[Math.floor(r() * SHOES.length)] };
  if (p.star) Object.assign(L, { beard: false, goggles: false, sleeve: false }, STAR_LOOK[p.name.en] || {}, { shoes: '#ffd23a' });
  return (p.look = L);
}
const DIGITS = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return '#' + c.map(v => ('0' + v.toString(16)).slice(-2)).join('');
}
const spriteCache = {};
function sprite(p, team, frame) {
  const key = p.id + '|' + team.main + '|' + frame;
  if (spriteCache[key]) return spriteCache[key];
  const L = look(p), skin = SKINS[L.skin], skinD = shade(skin, -0.18), hair = HAIRS[L.hair], hairD = shade(hair, -0.35);
  const extra = clamp(Math.round((p.hgt - 196) / 5), -1, 4);          // taller players get longer bodies
  const Wd = 22, top = 5, hx = 5, hy = top, ty = hy + 12, sy = ty + 8, ly = sy + 4, legH = 3 + extra, Ht = ly + legH + 2 + 1;
  const c = document.createElement('canvas'); c.width = Wd; c.height = Ht;
  const x = c.getContext('2d');
  const R = (a, b, w, h, col) => { if (!col) return; x.fillStyle = col; x.fillRect(a, b, w, h); };
  const band = L.band === 'team' ? team.alt : L.band;
  // ---- hair behind the head ----
  if (L.style === 'afro') { x.fillStyle = hair; x.beginPath(); x.ellipse(hx + 6, hy + 3, 8.5, 6.5, 0, 0, Math.PI * 2); x.fill(); }
  if (L.style === 'long') { R(hx - 1, hy + 2, 3, 10, hairD); R(hx + 10, hy + 2, 3, 10, hairD); }
  if (L.style === 'bun') { x.fillStyle = hair; x.beginPath(); x.arc(hx + 6, hy - 2, 2.6, 0, Math.PI * 2); x.fill(); R(hx + 4, hy - 1, 4, 1, band || hairD); }
  // ---- arms, body, legs ----
  const step = frame % 2;
  R(3, ty + 1, 3, 3, team.main); R(16, ty + 1, 3, 3, team.main);                                  // shoulders
  R(3, ty + 4, 3, 4, skin); R(16, ty + 4, 3, 4, skinD);                                           // arms
  if (L.sleeve) R(16, ty + 3, 3, 4, '#f4f4f4');
  R(3, ty + 7 + (step ? 0 : 1), 3, 2, skin); R(16, ty + 7 + (step ? 1 : 0), 3, 2, skinD);           // hands swing
  R(5, ty, 12, 8, team.main);                                                                      // jersey
  R(5, ty, 1, 8, team.trim); R(16, ty, 1, 8, team.trim);
  R(9, ty, 4, 1, skin); R(10, ty + 1, 2, 1, skin);                                                 // V-neck
  const num = String(p.num), dw = num.length * 4 - 1, dx = 11 - Math.floor(dw / 2);
  num.split('').forEach((d, i) => DIGITS[d].forEach((row, yy) => row.split('').forEach((b, xx) => { if (b === '1') R(dx + i * 4 + xx, ty + 2 + yy, 1, 1, team.alt); })));
  R(5, sy, 12, 4, team.alt); R(5, sy, 12, 1, shade(team.alt, -0.25)); R(5, sy, 1, 4, team.main); R(16, sy, 1, 4, team.main);   // shorts
  x.clearRect(10, sy + 3, 2, 1);
  const l1 = step ? 1 : 0, l2 = step ? 0 : 1;                                                       // running legs
  R(6, ly, 3, legH - l1, skin); R(13, ly, 3, legH - l2, skinD);
  R(5, ly + legH - l1, 5, 2, L.shoes); R(12, ly + legH - l2, 5, 2, L.shoes);
  R(5, ly + legH - l1 + 1, 5, 1, shade(L.shoes, -0.35)); R(12, ly + legH - l2 + 1, 5, 1, shade(L.shoes, -0.35));
  // ---- the head (big) ----
  R(hx, hy + 1, 12, 9, skin); R(hx + 1, hy, 10, 11, skin);
  R(hx - 1, hy + 5, 1, 2, skin); R(hx + 12, hy + 5, 1, 2, skinD);                                  // ears
  R(hx + 1, hy + 10, 10, 1, skinD);
  // hair on top
  if (L.style === 'short' || L.style === 'spiky' || L.style === 'bun' || L.style === 'long') { R(hx, hy, 12, 3, hair); R(hx + 1, hy - 1, 10, 1, hair); R(hx, hy + 3, 1, 2, hair); R(hx + 11, hy + 3, 1, 2, hair); R(hx + 2, hy, 3, 1, shade(hair, 0.25)); }
  if (L.style === 'spiky') for (let k = 0; k < 4; k++) { R(hx + 1 + k * 3, hy - 2, 2, 1, hair); R(hx + 2 + k * 3, hy - 3, 1, 1, hair); }
  if (L.style === 'buzz') { R(hx + 1, hy, 10, 2, hairD); R(hx, hy + 1, 12, 1, hairD); }
  if (L.style === 'rows') { R(hx, hy, 12, 3, hair); for (let k = 1; k < 12; k += 2) R(hx + k, hy, 1, 3, hairD); }
  if (L.style === 'mohawk') { R(hx + 4, hy - 3, 4, 6, hair); R(hx + 5, hy - 3, 1, 5, shade(hair, 0.3)); }
  if (L.style === 'afro') { R(hx + 1, hy + 3, 10, 1, hair); }
  if (L.style === 'bald') { R(hx + 3, hy + 1, 2, 1, shade(skin, 0.45)); }
  if (band) { R(hx, hy + 3, 12, 1, band); R(hx + 11, hy + 3, 2, 2, band); }
  // face
  R(hx + 2, hy + 4, 3, 1, hairD); R(hx + 7, hy + 4, 3, 1, hairD);                                // eyebrows
  if (L.goggles) { R(hx + 1, hy + 4, 10, 4, '#2a2a34'); R(hx + 2, hy + 5, 3, 2, '#9ad8ff'); R(hx + 7, hy + 5, 3, 2, '#9ad8ff'); }
  R(hx + 3, hy + 5, 2, 2, '#1a1420'); R(hx + 7, hy + 5, 2, 2, '#1a1420');                          // eyes
  R(hx + 3, hy + 5, 1, 1, '#ffffff'); R(hx + 7, hy + 5, 1, 1, '#ffffff');
  R(hx + 1, hy + 7, 2, 1, 'rgba(255,110,120,0.45)'); R(hx + 9, hy + 7, 2, 1, 'rgba(255,110,120,0.45)');   // cheeks
  if (L.beard) { R(hx, hy + 6, 1, 4, hair); R(hx + 11, hy + 6, 1, 4, hair); R(hx + 1, hy + 8, 10, 3, hair); R(hx + 4, hy + 8, 4, 1, skin); }
  R(hx + 5, hy + 8, 2, 1, L.beard ? '#e8a0a0' : '#8a3a3a');                                      // mouth
  // ---- a dark outline around the whole player ----
  const id = x.getImageData(0, 0, Wd, Ht), d = id.data, src = new Uint8ClampedArray(d);
  for (let yy = 0; yy < Ht; yy++) for (let xx = 0; xx < Wd; xx++) {
    const i = (yy * Wd + xx) * 4;
    if (src[i + 3] > 40) continue;
    const near = (xx > 0 && src[i - 1] > 40) || (xx < Wd - 1 && src[i + 7] > 40) || (yy > 0 && src[i - Wd * 4 + 3] > 40) || (yy < Ht - 1 && src[i + Wd * 4 + 3] > 40);
    if (near) { d[i] = 20; d[i + 1] = 16; d[i + 2] = 24; d[i + 3] = 255; }
  }
  x.putImageData(id, 0, 0);
  return (spriteCache[key] = c);
}
function drawPlayer(p, team, at, hasBall) {
  const step = at.moving ? Math.floor(performance.now() / 110) % 2 + 1 : 0;
  const img = sprite(p, team, step), w = img.width * PZ, h = img.height * PZ;
  const k = PZ * 2;                       // overlay scale to match the sprite
  const fx = Math.round(px(at.x) * 4) / 4, fy = Math.round(py(at.y) * 4) / 4;
  // shadow (stars stand in a golden glow)
  g.fillStyle = p.star ? 'rgba(255,210,60,0.45)' : 'rgba(0,0,0,0.3)';
  g.beginPath(); g.ellipse(fx, fy + 0.5, (p.star ? 5.5 : 4.5) * k, 1.6 * k, 0, 0, Math.PI * 2); g.fill();
  g.drawImage(img, fx - w / 2, fy - h + 1, w, h);
  const head = fy - h + 1;
  if (p.star) { g.fillStyle = '#ffd23a'; g.fillRect(fx - 0.5 * k, head - 3 * k, k, k); g.fillRect(fx - 1.5 * k, head - 2 * k, 3 * k, k); g.fillRect(fx - 0.5 * k, head - k, k, k); }
  if (hasBall) {
    g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(fx - 2 * k, head - 6 * k); g.lineTo(fx + 2 * k, head - 6 * k); g.lineTo(fx, head - 3.5 * k); g.fill();
    const label = lang === 'en' ? p.name.en.split(' ').pop() : p.name.zh;
    g.font = `bold ${4 * k}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom';
    const tw = g.measureText(label).width + 3 * k;
    g.fillStyle = 'rgba(10,10,20,0.75)'; g.fillRect(fx - tw / 2, head - 11 * k, tw, 5 * k);
    g.fillStyle = p.star ? '#ffd23a' : '#ffffff'; g.fillText(label, fx, head - 6.4 * k);
  }
}
function draw() {
  g.setTransform(S, 0, 0, S, 0, 0);
  g.drawImage(floor(), 0, 0, W, H);
  if (!game) return;
  const L = cur ? lineups : [game.ts[0].on, game.ts[1].on];
  const list = [];
  [0, 1].forEach(s => L[s].forEach(p => { if (pos[p.id]) list.push({ p, team: teams[s], at: pos[p.id] }); }));
  list.sort((a, b) => a.at.y - b.at.y).forEach(o => drawPlayer(o.p, o.team, o.at, ballPos.holder === o.p.id));
  // the ball and its shadow
  const bx = px(ballPos.x), by = py(ballPos.y);
  const bz = by - ballPos.h * FT * 0.6;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(bx, by + 1.5, 2.5, 1, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e8742a'; g.beginPath(); g.arc(bx, bz, 2.25, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#5a2a0a'; g.lineWidth = 0.5; g.stroke();
  g.beginPath(); g.moveTo(bx, bz - 2.25); g.lineTo(bx, bz + 2.25); g.moveTo(bx - 2.25, bz); g.lineTo(bx + 2.25, bz); g.stroke();
  // pop-up text
  g.textAlign = 'center'; g.textBaseline = 'bottom'; g.font = 'bold 7px sans-serif';
  popups.forEach(o => { g.globalAlpha = clamp(1 - o.age / 1.6, 0, 1); g.fillStyle = '#000'; g.fillText(o.text, px(o.x) + 0.5, py(o.y) - 21 - o.age * 4 + 0.5); g.fillStyle = o.color; g.fillText(o.text, px(o.x), py(o.y) - 21 - o.age * 4); });
  g.globalAlpha = 1;
}

// ---------------- the possession player ----------------
let shownTl = 0;
function startPossession() {
  if (game.over) return false;
  lineups = [game.ts[0].on.slice(), game.ts[1].on.slice()];
  startScore = game.score.slice();
  lastPos = Object.assign({}, pos);
  cur = game.step();
  pt = 0; shownTl = 0;
  return !!cur;
}
function liveScore() {
  const s = startScore.slice();
  if (!cur) return game.score.slice();
  cur.tl.forEach(e => { if (e.t <= pt) { if (e.k === 'make') s[cur.off] += e.pts; if (e.k === 'ft' && e.made) s[cur.off] += 1; } });
  return s;
}
function tick(dt) {
  if (!playing || !game) return;
  if (!cur && !startPossession()) return;
  pt += dt * speed * 1.6;
  popups.forEach(o => { o.age += dt * speed * 1.6 / 2.5; });          // pop-ups fade with game time, so they never pile up
  popups = popups.filter(o => o.age < 1.6);
  // pop-ups for things that just happened
  while (shownTl < cur.tl.length && cur.tl[shownTl].t <= pt) {
    const e = cur.tl[shownTl++], at = pos[e.p] || ballPos;
    const label = { make: e.pts === 3 ? '3PT!' : '+2', block: 'BLOCK!', steal: 'STEAL!', foul: lang === 'zh' ? '犯規' : 'FOUL', ft: e.made ? '+1' : 'FT ✕', reb: lang === 'zh' ? '籃板' : 'REB' }[e.k];
    if (label && at) { if (popups.length >= 4) popups.shift(); } if (label && at) popups.push({ text: label, x: at.x, y: at.y, age: 0, color: e.k === 'make' ? '#ffe14a' : e.k === 'block' || e.k === 'steal' ? '#7ae0ff' : e.k === 'foul' ? '#ff7a7a' : '#ffffff' });
  }
  // play-by-play lines when their moment comes
  while (logShown < cur.log.length && cur.log[logShown].t != null && cur.log[logShown].t <= pt) showEvent(cur.log[logShown++]);   // undated events (subs, period end) wait for the end
  if (pt >= cur.dur + 0.6) {
    while (logShown < cur.log.length) showEvent(cur.log[logShown++]);
    lastPos = Object.assign({}, pos);
    const wasOver = game.over;
    cur = null; logShown = 0;
    if (wasOver) { endGame(); return; }
    renderSide();
  }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  tick(dt);
  if (cur) { computePositions(); computeBall(); }
  draw();
  renderBoard();
  requestAnimationFrame(frame);
}

// ---------------- play-by-play ----------------
function clockStr(c, period) { c = Math.max(0, c); const m = Math.floor(c / 60), s = Math.floor(c % 60); return T('period')(period) + ' ' + m + ':' + String(s).padStart(2, '0'); }
function addLog(o) {
  const li = document.createElement('li');
  li.className = o.cls || '';
  li.innerHTML = '<span class="tm">' + o.tm + '</span><span>' + o.text + '</span>';
  const ol = $('log'); ol.insertBefore(li, ol.firstChild);
  while (ol.children.length > 400) ol.removeChild(ol.lastChild);
}
function eventText(e) {
  const E = TX[lang].ev;
  if (e.k === 'periodEnd' || e.k === 'final') return null;
  if (e.k === 'sub') return E.sub(null, { innName: nm(e.inn) + (e.inn.star ? '★' : ''), outName: nm(e.out) });
  const f = E[e.k]; if (!f) return null;
  return f(esc(nm(e.p)) + (e.p.star ? '★' : ''), Object.assign({}, e, { by: e.by && nm(e.by), ast: e.ast && nm(e.ast) }));
}
function showEvent(e) {
  const period = cur ? cur.period : game.period;
  if (e.k === 'periodEnd') { addLog({ cls: 'period', tm: '', text: T('period')(e.period) + ' ' + (lang === 'zh' ? '結束' : 'ends') + '　' + tn(teams[0]) + ' ' + e.score[0] + ' – ' + e.score[1] + ' ' + tn(teams[1]) }); return; }
  if (e.k === 'final') { const w = teams[e.winner]; addLog({ cls: 'period', tm: '', text: T('final') + '：' + tn(w) + (lang === 'zh' ? ' 獲勝！' : ' win!') }); return; }
  const text = eventText(e); if (!text) return;
  const team = teams[e.side];
  const cls = e.k === 'make' ? (e.type === 'three' ? 'big' : 'score') : e.k === 'sub' ? 'sub' : e.k === 'block' || e.k === 'steal' || e.k === 'andone' || e.k === 'foulout' ? 'big' : '';
  addLog({ cls, tm: clockStr(e.clock, period), text: '<span style="color:' + team.main + '">■</span> ' + text });
}

// ---------------- panels ----------------
function renderBoard() {
  if (!game) return;
  const sc = liveScore(), period = cur ? cur.period : game.period;
  const clock = cur ? Math.max(0, cur.clock0 - Math.min(pt, cur.dur)) : game.clock;
  let shot = 24;
  if (cur) { const reset = cur.tl.filter(e => e.k === 'reb' && e.off && e.t <= pt).pop(); shot = reset ? 14 - (pt - reset.t) : 24 - pt; }
  shot = Math.max(0, Math.min(shot, clock));
  const side = s => {
    const t = teams[s], fouls = game.ts[s].fouls;
    return '<div class="team' + (s ? ' home' : '') + '"><div class="swatch" style="background:' + t.main + ';border-color:' + t.alt + '"></div><div><div class="tname">' + esc(tn(t)) + '</div>' +
      '<div class="trec">' + T('rec')(t.W, t.L) + ' · ' + T('fouls') + ' ' + fouls + (fouls >= 5 ? ' <b style="color:#ff6a2a">' + T('bonus') + '</b>' : '') + '</div></div><div class="tscore">' + sc[s] + '</div></div>';
  };
  // the line score, minus the points of this possession that the animation has not reached yet
  const line = [game.line[0].slice(), game.line[1].slice()];
  if (cur) [0, 1].forEach(s => { const pending = game.score[s] - sc[s]; if (pending) line[s][cur.period - 1] = (line[s][cur.period - 1] || 0) - pending; });
  const lines = [0, 1].map(s => '<tr><th style="text-align:left">' + esc(teams[s].name[lang]) + '</th>' + [0, 1, 2, 3].concat(line[s].slice(4).map((_, i) => i + 4)).map(i => '<td>' + (line[s][i] != null ? line[s][i] : '') + '</td>').join('') + '</tr>').join('');
  const head = '<tr><th></th>' + [1, 2, 3, 4].concat(game.line[0].slice(4).map((_, i) => i + 5)).map(n => '<th>' + T('period')(n) + '</th>').join('') + '</tr>';
  const html = side(0) + '<div class="mid"><div class="period">' + (game.over && !cur ? T('final') : T('period')(period)) + '</div><div class="clock">' +
    Math.floor(clock / 60) + ':' + String(Math.floor(clock % 60)).padStart(2, '0') + (clock < 60 ? '.' + Math.floor((clock * 10) % 10) : '') + '</div><div class="shot">⏱ ' + Math.ceil(shot) + '</div>' +
    '<table class="lines">' + head + lines + '</table></div>' + side(1);
  if (html !== renderBoard.last) { $('board').innerHTML = html; renderBoard.last = html; }
  // the players with and against the ball
  {
    const holderId = ballPos.holder;
    const L = cur ? lineups : [game.ts[0].on, game.ts[1].on];
    const off = cur ? cur.off : game.poss;
    const handler = L[off].find(p => p.id === holderId) || L[off][0];
    const defender = L[1 - off][L[off].indexOf(handler)] || L[1 - off][0];
    const key = handler.id + '|' + defender.id + '|' + lang + '|' + Math.round(handler.e) + '|' + handler.g.PTS + '|' + defender.g.PTS;
    if (key !== renderBoard.cards) { renderBoard.cards = key; $('cardO').innerHTML = card(handler, T('onBall')); $('cardD').innerHTML = card(defender, T('guarding')); }
  }
}
function card(p, role) {
  const t = p.team, keys = ['ins', 'mid', 'thr', 'pas', 'def', 'reb'];
  return '<h3><span class="chip" style="background:' + t.main + '"></span>#' + p.num + ' ' + esc(nm(p)) + star(p) + ' <span class="role">' + POS_NAME[lang][p.pos] + ' · ' + p.hgt + 'cm · ' + role + '</span></h3>' +
    keys.map(k => '<div class="rt"><span>' + T('rt')[k] + '</span><i><b style="width:' + p.r[k] + '%"></b></i><span>' + p.r[k] + '</span></div>').join('') +
    '<div class="rt"><span>' + T('energy') + '</span><i><b style="width:' + Math.round(p.e) + '%;background:' + (p.e > 60 ? '#4cd07a' : '#ff7a3a') + '"></b></i><span>' + Math.round(p.e) + '</span></div>' +
    '<div class="line">' + T('today') + '：' + p.g.PTS + ' PTS · ' + (p.g.OREB + p.g.DREB) + ' REB · ' + p.g.AST + ' AST · ' + p.g.FGM + '/' + p.g.FGA + ' FG · ' + p.g.PF + ' PF</div>';
}
function renderBox() {
  const cols = ['MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG', '3P', 'FT', 'TO', 'PF', '+/-'];
  $('pane-box').innerHTML = [0, 1].map(s => {
    const t = teams[s], on = game.ts[s].on, rows = t.roster.filter(p => p.g.MIN > 0 || on.includes(p)).sort((a, b) => (b.starter - a.starter) || (b.g.MIN - a.g.MIN));
    const tot = newStats(); rows.forEach(p => Object.keys(tot).forEach(k => { tot[k] += p.g[k] || 0; }));
    const line = (g, name, cls) => '<tr class="' + cls + '"><td>' + name + '</td><td>' + Math.round(g.MIN) + '</td><td>' + g.PTS + '</td><td>' + (g.OREB + g.DREB) + '</td><td>' + g.AST + '</td><td>' + g.STL + '</td><td>' + g.BLK + '</td><td>' +
      g.FGM + '-' + g.FGA + '</td><td>' + g.TPM + '-' + g.TPA + '</td><td>' + g.FTM + '-' + g.FTA + '</td><td>' + g.TOV + '</td><td>' + g.PF + '</td><td>' + (cls === 'total' ? '' : (g.PM > 0 ? '+' : '') + g.PM) + '</td></tr>';
    return '<table class="box"><tr><th style="color:' + t.main + '">' + esc(tn(t)) + '</th>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr>' +
      rows.map(p => line(p.g, '#' + p.num + ' ' + esc(nm(p)) + star(p) + ' <small style="color:#9aa2bd">' + p.pos + '</small>' + (p.fouledOut ? ' ✕' : ''), on.includes(p) ? 'on' : '')).join('') +
      line(tot, T('total'), 'total') + '</table>';
  }).join('');
}
function renderRoster() {
  const keys = ['ins', 'mid', 'thr', 'ft', 'pas', 'hnd', 'spd', 'def', 'blk', 'reb', 'sta'];
  const cell = v => '<td class="' + (v >= 80 ? 'r-hi' : v < 45 ? 'r-lo' : '') + '">' + v + '</td>';
  $('pane-roster').innerHTML = [0, 1].map(s => {
    const t = teams[s];
    return '<table class="box"><tr><th style="color:' + t.main + '">' + esc(tn(t)) + '</th><th>' + T('pos') + '</th><th>' + T('hgt') + '</th>' + keys.map(k => '<th>' + T('rt')[k] + '</th>').join('') + '<th>' + T('ovr') + '</th><th>PPG</th></tr>' +
      t.roster.map(p => '<tr><td>#' + p.num + ' ' + esc(nm(p)) + star(p) + '</td><td>' + p.pos + '</td><td>' + p.hgt + '</td>' + keys.map(k => cell(p.r[k])).join('') + cell(ovr(p)) +
        '<td>' + (p.s.G ? (p.s.PTS / p.s.G).toFixed(1) : '-') + '</td></tr>').join('') + '</table>';
  }).join('');
}
function renderSide() {
  const tab = document.querySelector('.tabs button.on').dataset.tab;
  if (tab === 'box') renderBox();
  if (tab === 'roster') renderRoster();
}
function renderAll() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T(el.getAttribute('data-t')); });
  document.title = T('title') + ' · ' + (lang === 'zh' ? 'Pixel Hoops' : '像素籃球');
  $('sim').textContent = T('sim'); $('next').textContent = T('next'); $('newTeams').textContent = T('newTeams'); $('lang').textContent = T('lang');
  setPlaying(playing);
  floorImg = null; renderBoard.last = null; renderBoard.cards = null;
  renderSide();
}
function endGame() {
  setPlaying(false);
  $('play').disabled = true;
  $('next').disabled = false;
  saveTeams();
  renderBox(); renderSide();
}

// ---------------- controls ----------------
$('play').onclick = () => { if (!game.over) setPlaying(!playing); };
$('speed').onchange = e => { speed = +e.target.value; };
$('sim').onclick = () => {
  if (game.over) return;
  if (cur) { while (logShown < cur.log.length) showEvent(cur.log[logShown++]); cur = null; }
  let r; while (!game.over && (r = game.step())) { cur = r; r.log.forEach(showEvent); }
  cur = null; placeInitial(); endGame();
};
$('next').onclick = () => newGame(false);
$('newTeams').onclick = () => { if (!game.log.length || game.over || confirm(lang === 'zh' ? '重新組隊會結束這場比賽，確定嗎？' : 'Make new teams and end this game?')) { setPlaying(false); cur = null; newGame(true); } };
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('hoops.lang', lang); } catch (e) { /* ignore */ } renderAll(); };
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + b.dataset.tab));
  renderSide();
});
setInterval(() => { if (playing) renderSide(); }, 1000);
document.addEventListener('keydown', e => { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); $('play').click(); } });

newGame(false);
const qs = new URLSearchParams(location.search);
if (qs.has('speed')) { speed = +qs.get('speed'); $('speed').value = qs.get('speed'); }
if (qs.has('auto')) setPlaying(true);
if (qs.has('lang')) { lang = qs.get('lang') === 'en' ? 'en' : 'zh'; renderAll(); }
if (qs.has('warp')) { const n = +qs.get('warp') * 60; setPlaying(true); for (let i = 0; i < n; i++) { tick(1 / 60); if (cur) { computePositions(); computeBall(); } } }
requestAnimationFrame(frame);
})();
