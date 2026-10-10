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
    sim: '⏭ 直接模擬到結束', next: '下一場 ▶', newTeams: '🔄 重新組隊', lang: 'English', fx: on => '✨ HD-2D 特效：' + (on ? '開' : '關'),
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
    sim: '⏭ Sim to the end', next: 'Next game ▶', newTeams: '🔄 New teams', lang: '中文', fx: on => '✨ HD-2D FX: ' + (on ? 'on' : 'off'),
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

// ---------------- the court: an HD-2D arena — a lit 3D diorama with pixel-sprite players ----------------
const cv = $('court'), g = cv.getContext('2d');
const S = 4;                              // device pixels per logical pixel
const PZ = 0.75;                          // sprite pixel = PZ logical px (3 device px) — big chibi players
const W = 320, H = 200;                   // logical size
const RIM = 13;                           // rim height in feet (raised to suit the big-headed players)
// the camera hangs high above the near sideline, tilted 50° down
const CAM = { th: 50 * Math.PI / 180, h: 90, back: 40, foc: 290, cx: 160, cy: 100 };
const CC = Math.cos(CAM.th), CS = Math.sin(CAM.th);
function P(x, y, z) {                     // court feet (x 0–94 along, y 0 far sideline – 50 near, z up) → logical px; s = px per foot there
  const rF = 50 - y + CAM.back, rZ = (z || 0) - CAM.h, d = rF * CC - rZ * CS, up = rF * CS + rZ * CC;
  return { x: CAM.cx + CAM.foc * (x - 47) / d, y: CAM.cy - CAM.foc * up / d, s: CAM.foc / d };
}
function floorY(Y) {                      // a screen row → the court y (feet) of the floor seen there
  const q = (CAM.cy - Y) / CAM.foc;
  return 50 + CAM.back + CAM.h * (CC + q * CS) / (q * CC - CS);
}
g.imageSmoothingEnabled = false;
const canFilter = typeof g.filter === 'string';
let fxOn = canFilter;
try { if (localStorage.getItem('hoops.fx') === 'off') fxOn = false; } catch (e) { /* ignore */ }
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function poly(pts, fill, stroke, lw) {
  g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.5; g.stroke(); }
}
function seg(a, b, col, lw) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }

// ---- the hardwood, painted flat in feet, then laid into perspective ----
const TEX = 12, TX0 = -16, TY0 = -10, TXW = 126, TYH = 74;   // texture pixels per foot, and the area it covers (feet)
function floorTexture() {
  const c = document.createElement('canvas'); c.width = TXW * TEX; c.height = TYH * TEX;
  const f = c.getContext('2d'), home = teams[1], r = rng(11);
  f.setTransform(TEX, 0, 0, TEX, -TX0 * TEX, -TY0 * TEX);
  for (let y = TY0; y < TY0 + TYH; y += 0.5) {                  // maple planks, each its own shade
    for (let x = TX0 - r() * 10; x < TX0 + TXW;) {
      const len = 5 + r() * 11, t = r();
      f.fillStyle = `hsl(${29 + t * 7},${50 + t * 12}%,${57 + t * 9}%)`; f.fillRect(x, y, len, 0.5);
      f.fillStyle = 'rgba(90,45,15,0.4)'; f.fillRect(x, y, 0.07, 0.5);
      x += len;
    }
    f.fillStyle = 'rgba(80,40,12,0.22)'; f.fillRect(TX0, y + 0.46, TXW, 0.04);
  }
  for (let i = 0; i < 2600; i++) {                                // grain
    f.fillStyle = r() < 0.55 ? 'rgba(120,60,20,0.12)' : 'rgba(255,235,200,0.12)';
    f.fillRect(TX0 + r() * TXW, TY0 + Math.floor(r() * TYH * 2) / 2 + 0.05 + r() * 0.38, 0.8 + r() * 3.5, 0.05);
  }
  // out of bounds: a band in the home colours, then a darker surround
  f.fillStyle = shade(home.main, -0.3); f.beginPath(); f.rect(-6, -6, 106, 62); f.rect(0, 0, 94, 50); f.fill('evenodd');
  f.fillStyle = 'rgba(12,10,24,0.55)'; f.beginPath(); f.rect(TX0, TY0, TXW, TYH); f.rect(-6, -6, 106, 62); f.fill('evenodd');
  f.globalAlpha = 0.6; f.fillStyle = home.main; f.fillRect(0, 17, 19, 16); f.fillRect(75, 17, 19, 16); f.globalAlpha = 1;   // the paint
  f.strokeStyle = '#ffffff'; f.lineWidth = 0.28;
  const line = (x1, y1, x2, y2) => { f.beginPath(); f.moveTo(x1, y1); f.lineTo(x2, y2); f.stroke(); };
  f.strokeRect(0, 0, 94, 50); line(47, 0, 47, 50);
  f.beginPath(); f.arc(47, 25, 6, 0, Math.PI * 2); f.stroke();
  [0, 1].forEach(side => {
    const bx = side ? 88.75 : 5.25, dir = side ? -1 : 1, base = side ? 94 : 0, a = Math.acos((14 - 5.25) / 23.75);
    const half = [side ? Math.PI / 2 : -Math.PI / 2, side ? Math.PI * 1.5 : Math.PI / 2];
    f.strokeRect(Math.min(base, base + dir * 19), 17, 19, 16);                                   // key
    f.beginPath(); f.arc(base + dir * 19, 25, 6, half[0], half[1]); f.stroke();                  // free throw circle
    line(base, 3, base + dir * 14, 3); line(base, 47, base + dir * 14, 47);                      // corner threes
    f.beginPath(); if (side) f.arc(bx, 25, 23.75, Math.PI - a, Math.PI + a); else f.arc(bx, 25, 23.75, -a, a); f.stroke();
    f.beginPath(); f.arc(bx, 25, 4, half[0], half[1]); f.stroke();                              // restricted area
  });
  const txt = (str, x, y, size, col, rot) => {
    f.save(); f.translate(x, y); if (rot) f.rotate(rot); f.scale(1 / TEX, 1 / TEX);
    f.font = `bold ${size * TEX}px sans-serif`; f.textAlign = 'center'; f.textBaseline = 'middle'; f.fillStyle = col; f.fillText(str, 0, 0); f.restore();
  };
  const hn = home.name[lang] || home.name.zh, city = (home.city[lang] || home.city.zh) + (lang === 'en' ? ' ' : '') + hn;
  f.fillStyle = home.main; f.beginPath(); f.arc(47, 25, 5.85, 0, Math.PI * 2); f.fill();         // centre logo
  f.strokeStyle = home.alt; f.lineWidth = 0.3; f.beginPath(); f.arc(47, 25, 5.1, 0, Math.PI * 2); f.stroke();
  txt(lang === 'en' ? hn.toUpperCase().slice(0, 9) : hn.slice(0, 2), 47, 25.2, lang === 'en' ? 2 : 3.4, home.alt);
  txt(lang === 'en' ? city.toUpperCase() : city, 47, -3, 2.6, 'rgba(255,255,255,0.85)');
  txt('PIXEL HOOPS', 47, 53, 2.6, 'rgba(255,255,255,0.7)');
  txt(hn, -3, 25, 2.4, home.alt, -Math.PI / 2); txt(hn, 97, 25, 2.4, home.alt, Math.PI / 2);
  return c;
}
function projectFloor() {
  const tex = floorTexture(), c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const a = c.getContext('2d'); a.imageSmoothingEnabled = true;
  for (let row = Math.max(0, Math.floor(P(47, TY0, 0).y * S)); row < H * S; row++) {           // one screen row at a time
    const y0 = floorY(row / S), y1 = floorY((row + 1) / S), ym = (y0 + y1) / 2;
    if (y0 > TY0 + TYH) break;
    const l = P(TX0, ym, 0), r = P(TX0 + TXW, ym, 0);
    a.drawImage(tex, 0, Math.max(0, (y0 - TY0) * TEX), tex.width, Math.max(0.5, (y1 - y0) * TEX), l.x * S, row, (r.x - l.x) * S, 1);
  }
  // a polished finish: pools of light from the rafters and long glossy streaks
  a.globalCompositeOperation = 'source-atop';
  [[23.5, 25, 30], [70.5, 25, 30], [47, 25, 22]].forEach(([x, y, rad]) => {
    const q = P(x, y, 0), rx = rad * q.s * S;
    a.save(); a.translate(q.x * S, q.y * S); a.scale(1, 0.6);
    const gr = a.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(255,240,210,0.26)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
    a.fillStyle = gr; a.fillRect(-rx, -rx, rx * 2, rx * 2); a.restore();
  });
  [70, 125, 195, 250].forEach(x => {
    const gr = a.createLinearGradient(0, 64 * S, 0, 190 * S); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    a.fillStyle = gr; a.fillRect((x - 2.5) * S, 64 * S, 5 * S, 126 * S);
  });
  return c;
}

// ---- the arena around it: tiered stands full of fans, LED boards, benches, rafters ----
const FAN = ['#e8e8e8', '#30343c', '#c03a3a', '#3a6ac0', '#e0b030', '#5a9a4a', '#8a4ac0', '#f08aa0'];
function fan(a, x, y, z, r, cheer, home, away) {
  const v = [r(), r(), r(), r(), r(), r(), r(), r()];             // always the same draws, so both crowd frames match
  const b = P(x, y, z), s = b.s;
  if (v[0] < 0.08) { a.fillStyle = '#2c2446'; a.fillRect(b.x - 0.7 * s, b.y - 1.4 * s, 1.4 * s, 1.4 * s); return; }   // an empty seat
  const shirt = v[1] < 0.42 ? home.main : v[1] < 0.62 ? away.main : v[1] < 0.7 ? home.alt : FAN[Math.floor(v[2] * FAN.length)];
  const skin = SKINS[Math.floor(v[3] * SKINS.length)], hair = HAIRS[Math.floor(v[4] * 5)];
  const up = cheer && v[5] < 0.8 ? (0.3 + v[6] * 0.5) * s : 0, arms = cheer && v[7] < 0.75;
  const tw = 1.5 * s, th = 1.8 * s, hr = 0.58 * s, by = b.y - up;
  a.fillStyle = shirt; a.fillRect(b.x - tw / 2, by - th, tw, th);
  a.fillStyle = 'rgba(0,0,0,0.25)'; a.fillRect(b.x + tw / 4, by - th, tw / 4, th);
  if (arms) { a.fillStyle = skin; a.fillRect(b.x - tw / 2 - 0.3 * s, by - th - 1.2 * s, 0.4 * s, 1.4 * s); a.fillRect(b.x + tw / 2 - 0.1 * s, by - th - 1.2 * s, 0.4 * s, 1.4 * s); }
  a.fillStyle = skin; a.beginPath(); a.arc(b.x, by - th - hr * 0.8, hr, 0, Math.PI * 2); a.fill();
  a.fillStyle = hair; a.fillRect(b.x - hr, by - th - hr * 1.8, hr * 2, hr * 0.75);
}
const benchX = (s, i) => (s ? 54 : 21.5) + i * 2.4;
let floorProj = null, arenaImgs = null, cheerUntil = 0;
function buildArena(cheer) {
  const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const a = c.getContext('2d'), home = teams[1], away = teams[0], r = rng(77);
  const bg = a.createLinearGradient(0, 0, 0, H * S); bg.addColorStop(0, '#07060f'); bg.addColorStop(0.4, '#171130'); bg.addColorStop(1, '#0c0a16');
  a.fillStyle = bg; a.fillRect(0, 0, W * S, H * S);
  a.setTransform(S, 0, 0, S, 0, 0);
  const quad = (pts, col) => { a.fillStyle = col; a.beginPath(); pts.forEach((q, i) => i ? a.lineTo(q.x, q.y) : a.moveTo(q.x, q.y)); a.closePath(); a.fill(); };
  for (let i = 15; i >= 0; i--) {                                 // far stands: rows rising away from the court
    const yr = -11 - i * 2.4, zr = 1.2 + i * 1.7, x0 = -18, x1 = 112;
    quad([P(x0, yr + 1.2, zr - 1.7), P(x1, yr + 1.2, zr - 1.7), P(x1, yr + 1.2, zr), P(x0, yr + 1.2, zr)], '#120e1e');
    quad([P(x0, yr + 1.2, zr), P(x1, yr + 1.2, zr), P(x1, yr - 1.2, zr), P(x0, yr - 1.2, zr)], i % 2 ? '#241c3a' : '#1e1832');
    for (let x = x0 + 1; x < x1; x += 2.1) fan(a, x + (r() - 0.5) * 0.5, yr, zr, r, cheer, home, away);
  }
  [-1, 1].forEach(sd => {                                         // stands behind both baselines
    for (let j = 11; j >= 0; j--) {
      const xr = sd < 0 ? -18 - j * 2.4 : 112 + j * 2.4, zr = 1.2 + j * 1.7, xf = xr - sd * 1.2, xb = xr + sd * 1.2, y0 = -11, y1 = 64;
      quad([P(xf, y0, zr - 1.7), P(xf, y1, zr - 1.7), P(xf, y1, zr), P(xf, y0, zr)], '#120e1e');
      quad([P(xf, y0, zr), P(xf, y1, zr), P(xb, y1, zr), P(xb, y0, zr)], j % 2 ? '#241c3a' : '#1e1832');
      for (let y = y0 + 1; y < y1; y += 2.1) fan(a, xr, y + (r() - 0.5) * 0.5, zr, r, cheer, home, away);
    }
  });
  a.fillStyle = 'rgba(10,8,25,0.32)'; a.fillRect(0, 0, W, H);     // the stands sit in shadow
  a.drawImage(floorProj, 0, 0, W, H);
  // LED board along the far sideline
  const lb = P(-16, -9, 0), lt = P(110, -9, 2.2), lh = lb.y - lt.y;
  a.fillStyle = '#06060c'; a.fillRect(lb.x, lt.y, lt.x - lb.x, lh);
  a.save(); a.beginPath(); a.rect(lb.x, lt.y + 0.3, lt.x - lb.x, lh - 0.6); a.clip();
  a.font = `bold ${lh * 0.62}px sans-serif`; a.textBaseline = 'middle'; a.textAlign = 'left';
  const words = ['PIXEL HOOPS', '★', (home.city[lang] || home.city.zh) + ' ' + (home.name[lang] || home.name.zh), '●', 'NBA RULES', '★', (away.city[lang] || away.city.zh) + ' ' + (away.name[lang] || away.name.zh), '●'];
  for (let x = lb.x + 1, k = 0; x < lt.x; k++) {
    const w = words[k % words.length]; a.fillStyle = k % 4 === 2 ? shade(home.main, 0.35) : k % 4 === 0 ? '#ffd23a' : k % 4 === 3 ? shade(away.main, 0.35) : '#ffffff';
    a.fillText(w, x, lt.y + lh / 2); x += a.measureText(w).width + lh * 0.8;
  }
  a.restore();
  a.fillStyle = 'rgba(255,255,255,0.08)'; a.fillRect(lb.x, lt.y, lt.x - lb.x, lh * 0.35);
  // team benches
  [0, 1].forEach(sd => {
    const t = teams[sd];
    for (let i = 0; i < 8; i++) {
      const x = benchX(sd, i);
      quad([P(x - 0.8, -5.4, 0.2), P(x + 0.8, -5.4, 0.2), P(x + 0.8, -5.4, 3.4), P(x - 0.8, -5.4, 3.4)], shade(t.main, -0.25));
      quad([P(x - 0.8, -5.4, 1.5), P(x + 0.8, -5.4, 1.5), P(x + 0.8, -3.9, 1.5), P(x - 0.8, -3.9, 1.5)], t.main);
      quad([P(x - 0.8, -3.9, 0), P(x + 0.8, -3.9, 0), P(x + 0.8, -3.9, 1.5), P(x - 0.8, -3.9, 1.5)], shade(t.main, -0.5));
    }
  });
  // rafters: lamps and soft beams falling onto the court
  a.globalCompositeOperation = 'lighter';
  [[23.5, 25, 70], [47, 22, 160], [70.5, 25, 250]].forEach(([x, y, tx]) => {
    const f = P(x, y, 0), spread = 26 * f.s;
    const gr = a.createLinearGradient(0, -2, 0, f.y); gr.addColorStop(0, 'rgba(255,240,210,0.16)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
    a.fillStyle = gr; a.beginPath(); a.moveTo(tx - 4, -2); a.lineTo(tx + 4, -2); a.lineTo(f.x + spread, f.y); a.lineTo(f.x - spread, f.y); a.closePath(); a.fill();
  });
  [40, 70, 100, 220, 250, 280].forEach(x => {
    const gr = a.createRadialGradient(x, 2, 0, x, 2, 6); gr.addColorStop(0, 'rgba(255,250,235,0.9)'); gr.addColorStop(1, 'rgba(255,250,235,0)');
    a.fillStyle = gr; a.fillRect(x - 6, -4, 12, 12);
  });
  return c;
}

// ---- the post-processing that gives the HD-2D look ----
const bufs = {};
function buf(name, w, h) {
  const b = bufs[name] || (bufs[name] = document.createElement('canvas'));
  if (b.width !== w || b.height !== h) { b.width = w; b.height = h; b.dirty = true; }
  return b;
}
function tiltShift() {                    // depth of field: the stands up top and the very front go soft
  const w = cv.width, h = cv.height, sm = buf('dof', w / 4, h / 4), sg = sm.getContext('2d');
  sg.filter = 'blur(1.6px)'; sg.clearRect(0, 0, sm.width, sm.height); sg.drawImage(cv, 0, 0, sm.width, sm.height); sg.filter = 'none';
  const m = buf('dofmask', w, h);
  if (m.dirty) {
    const mg = m.getContext('2d'), gr = mg.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.2, 'rgba(0,0,0,0.7)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)');
    gr.addColorStop(0.9, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)');
    mg.fillStyle = gr; mg.fillRect(0, 0, w, h); m.dirty = false;
  }
  const big = buf('dofbig', w, h), bg = big.getContext('2d');
  bg.globalCompositeOperation = 'source-over'; bg.clearRect(0, 0, w, h); bg.imageSmoothingEnabled = true; bg.drawImage(sm, 0, 0, w, h);
  bg.globalCompositeOperation = 'destination-in'; bg.drawImage(m, 0, 0); bg.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(big, 0, 0); g.restore();
}
function glow() {                         // bloom, a warm grade and a vignette
  const w = cv.width, h = cv.height, b = buf('bloom', w / 4, h / 4), bl = b.getContext('2d');
  bl.filter = 'brightness(0.7) contrast(3) saturate(1.4) blur(3px)'; bl.clearRect(0, 0, b.width, b.height); bl.drawImage(cv, 0, 0, b.width, b.height); bl.filter = 'none';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true;
  g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.34; g.drawImage(b, 0, 0, w, h);
  g.globalAlpha = 1; g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,190,110,0.14)'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  const v = buf('vig', w, h);
  if (v.dirty) {
    const vg = v.getContext('2d'), gr = vg.createRadialGradient(w / 2, h * 0.58, h * 0.35, w / 2, h * 0.58, w * 0.7);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,4,18,0.6)'); vg.fillStyle = gr; vg.fillRect(0, 0, w, h); v.dirty = false;
  }
  g.drawImage(v, 0, 0); g.restore();
}
function hash(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
function dust(now) {                      // motes drifting in the light
  const t = now / 1000;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const x = 40 + ((hash(i, 1) * 240 + Math.sin(t * 0.3 + i) * 8 + t * 2) % 240 + 240) % 240;
    const y = 10 + ((hash(i, 2) * 150 - t * (2 + hash(i, 3) * 3)) % 150 + 150) % 150;
    g.fillStyle = `rgba(255,240,200,${0.18 + 0.3 * Math.abs(Math.sin(t + i))})`;
    const sz = hash(i, 4) < 0.3 ? 0.75 : 0.5; g.fillRect(x, y, sz, sz);
  }
  g.restore();
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
    if (e.k === 'pass') { if (pt < e.t + e.dur) { const a = pos[e.from], b = pos[e.to]; if (a && b) { const k = (pt - e.t) / e.dur; ball = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, h: 4 + Math.sin(k * Math.PI) * 3 }; } holder = null; } else { holder = e.to; ball = null; } }
    if (e.k === 'shot') {
      const fl = e.dur, k = (pt - e.t) / fl, a = pos[e.p];
      if (k < 1 && a) { ball = { x: a.x + (B.x - a.x) * k, y: a.y + (B.y - a.y) * k, h: 8 + (RIM - 8) * k + Math.sin(k * Math.PI) * (e.type === 'three' ? 11 : 7) }; holder = null; }
      else { ball = { x: B.x, y: B.y, h: RIM }; holder = null; }
    }
    if (e.k === 'make') { ball = { x: B.x, y: B.y, h: Math.max(0.6, RIM - (pt - e.t) * 18) }; holder = null; }   // drops through the net
    if (e.k === 'miss') { ball = { x: B.x, y: B.y, h: RIM + Math.sin(clamp((pt - e.t) * 2.2, 0, 1) * Math.PI) * 5 }; holder = null; }   // clanks off the rim
    if (e.k === 'block') { const a = pos[e.p]; if (a) ball = { x: a.x, y: a.y, h: 9 }; holder = null; }
    if (e.k === 'reb' || e.k === 'steal') { const p = e.k === 'steal' ? e.by : e.p; const a = pos[p]; if (a && pt < e.t + 0.4 && ball) { const k = (pt - e.t) / 0.4; ball = { x: ball.x + (a.x - ball.x) * k, y: ball.y + (a.y - ball.y) * k, h: ball.h + (4 - ball.h) * k }; } else { holder = p; ball = null; } }
    if (e.k === 'ft') { const a = pos[e.p], k = clamp((pt - (e.t - 0.9)) / 0.9, 0, 1); if (a) ball = { x: a.x + (B.x - a.x) * k, y: a.y + (B.y - a.y) * k, h: 8 + (RIM - 8) * k + Math.sin(k * Math.PI) * 6 }; holder = null; }
  }
  const nextFt = cur.tl.find(e => e.k === 'ft' && pt >= e.t - 1.6 && pt < e.t - 0.9);
  if (nextFt) { holder = nextFt.p; ball = null; }
  if (holder != null && pos[holder]) {
    const a = pos[holder], bounce = Math.abs(Math.sin(pt * 9)) * 3.2;     // dribbling
    ballPos = { x: a.x + (a.face || 1) * 1.3, y: a.y + 0.8, h: 0.4 + bounce, holder };
  } else if (ball) ballPos = Object.assign({ holder: null }, ball);
}
function placeInitial() {          // a jump ball at center court
  pos = {}; lastPos = {};
  const L = [game.ts[0].on, game.ts[1].on];
  L.forEach((on, s) => on.forEach((p, i) => {
    const dir = s ? 1 : -1, xs = [2, 9, 9, 16, 16][i], ys = [0, -8, 8, -14, 14][i];
    lastPos[p.id] = pos[p.id] = { x: 47 + dir * (i ? xs : 1.5), y: 25 + (i ? ys : 0), face: -dir };
  }));
  ballPos = { x: 47, y: 25, h: 9 };
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
  const f = P(at.x, at.y, 0), fx = Math.round(f.x * S) / S, fy = Math.round(f.y * S) / S;
  // a reflection in the polished floor
  g.save(); g.globalAlpha = 0.17; g.translate(fx, fy + 0.6); g.scale(1, -0.6); g.drawImage(img, -w / 2, -h, w, h); g.restore();
  // shadow (stars stand in a golden glow)
  g.fillStyle = p.star ? 'rgba(255,210,60,0.5)' : 'rgba(0,0,0,0.35)';
  g.beginPath(); g.ellipse(fx, fy + 0.3, (p.star ? 5.5 : 4.5) * k, 1.8 * k, 0, 0, Math.PI * 2); g.fill();
  g.drawImage(img, fx - w / 2, fy - h + 1, w, h);
  const head = fy - h + 1;
  if (p.star) { g.fillStyle = '#ffd23a'; g.fillRect(fx - 0.5 * k, head - 3 * k, k, k); g.fillRect(fx - 1.5 * k, head - 2 * k, 3 * k, k); g.fillRect(fx - 0.5 * k, head - k, k, k); }
  if (hasBall) overlays.push(() => {
    g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(fx - 2 * k, head - 6 * k); g.lineTo(fx + 2 * k, head - 6 * k); g.lineTo(fx, head - 3.5 * k); g.fill();
    const label = lang === 'en' ? p.name.en.split(' ').pop() : p.name.zh;
    g.font = `bold ${4 * k}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom';
    const tw = g.measureText(label).width + 3 * k;
    g.fillStyle = 'rgba(10,10,20,0.75)'; g.fillRect(fx - tw / 2, head - 11 * k, tw, 5 * k);
    g.fillStyle = p.star ? '#ffd23a' : '#ffffff'; g.fillText(label, fx, head - 6.4 * k);
  });
}
function drawBenches(L) {                 // the players not on the floor sit on their team's bench
  [0, 1].forEach(sd => {
    const on = new Set(L[sd].map(p => p.id));
    teams[sd].roster.filter(p => !on.has(p.id)).slice(0, 8).forEach((p, i) => {
      const img = sprite(p, teams[sd], 0), q = P(benchX(sd, i), -4.7, 1.5), w = img.width * PZ, hh = 28 * PZ;
      g.drawImage(img, 0, 0, img.width, 28, Math.round((q.x - w / 2) * S) / S, Math.round((q.y - hh) * S) / S, w, hh);
    });
  });
}
function basket(side, front) {            // stanchion, glass backboard, rim and net; the front half of the rim draws after the ball
  const m = x => side ? 94 - x : x, bx = m(5.25), home = teams[1];
  if (!front) {
    const x0 = m(-6.5), x1 = m(-2), xi = side ? x0 : x1;                                       // padded base behind the baseline
    poly([P(x0, 23, 2.6), P(x1, 23, 2.6), P(x1, 27, 2.6), P(x0, 27, 2.6)], shade(home.main, 0.15));
    poly([P(xi, 23, 0), P(xi, 27, 0), P(xi, 27, 2.6), P(xi, 23, 2.6)], shade(home.main, -0.2));
    poly([P(x0, 27, 0), P(x1, 27, 0), P(x1, 27, 2.6), P(x0, 27, 2.6)], home.main);
    const base = P(m(-4), 25, 2.6), top = P(m(-4), 25, RIM + 2.4), arm = P(m(2.8), 25, RIM + 1.2);
    seg(base, top, '#2a2d38', 1.6); seg(top, arm, '#2a2d38', 1.1); seg(base, top, 'rgba(255,255,255,0.18)', 0.4);
    const ph = 28 * Math.PI / 180, tx = (side ? 1 : -1) * Math.sin(ph), ty = Math.cos(ph), cx = m(3.4);
    const C = (u, z) => P(cx + tx * u, 25 + ty * u, z);
    poly([C(-3.6, RIM - 1.2), C(3.6, RIM - 1.2), C(3.6, RIM + 3.3), C(-3.6, RIM + 3.3)], 'rgba(215,235,255,0.42)', '#ffffff', 0.6);
    poly([C(-1.2, RIM + 0.15), C(1.2, RIM + 0.15), C(1.2, RIM + 2), C(-1.2, RIM + 2)], null, '#ff5a2a', 0.45);
    poly([C(-3.6, RIM + 2.6), C(-1.5, RIM + 3.3), C(-3.6, RIM + 3.3)], 'rgba(255,255,255,0.35)');    // a glint on the glass
    seg(P(cx, 25, RIM), P(m(4.2), 25, RIM), '#d0d4dc', 0.6);
  }
  const ring = (rad, z, a) => P(bx + rad * Math.cos(a), 25 + rad * Math.sin(a), z);
  const A0 = front ? 0 : Math.PI, n = 8;
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.25; g.beginPath();
  for (let i = 0; i <= n; i++) { const a = A0 + i / n * Math.PI, t = ring(1.15, RIM, a), b = ring(0.7, RIM - 2.4, a + 0.3); g.moveTo(t.x, t.y); g.lineTo(b.x, b.y); }
  for (let i = 0; i <= n; i++) { const q = ring(0.7, RIM - 2.4, A0 + i / n * Math.PI); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
  for (let i = 0; i <= n; i++) { const q = ring(0.92, RIM - 1.2, A0 + i / n * Math.PI); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
  g.stroke();
  g.strokeStyle = '#ff5a1a'; g.lineWidth = 0.8; g.beginPath();
  for (let i = 0; i <= 12; i++) { const q = ring(1.15, RIM, A0 + i / 12 * Math.PI); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
  g.stroke();
}
function drawBall() {
  const sh = P(ballPos.x, ballPos.y, 0), b = P(ballPos.x, ballPos.y, ballPos.h), r = Math.max(2, 1.05 * b.s);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(sh.x, sh.y, r * 1.1, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createRadialGradient(b.x - r * 0.4, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
  gr.addColorStop(0, '#ffb070'); gr.addColorStop(0.6, '#e8742a'); gr.addColorStop(1, '#9a4010');
  g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#4a1e06'; g.lineWidth = 0.35; g.beginPath(); g.arc(b.x, b.y, r, 0, Math.PI * 2);
  g.moveTo(b.x, b.y - r); g.lineTo(b.x, b.y + r); g.moveTo(b.x - r, b.y); g.lineTo(b.x + r, b.y); g.stroke();
}
function jumbotron() {                    // the scoreboard hanging over centre court
  const home = teams[1], away = teams[0], sc = game ? liveScore() : [0, 0];
  const x0 = 124, y0 = 4, w = 72, h = 26, hw = w / 2 - 1;
  g.fillStyle = '#3a3d4c'; g.fillRect(x0 + 8, -2, 1, y0 + 2); g.fillRect(x0 + w - 9, -2, 1, y0 + 2);
  g.fillStyle = '#1b1c26'; g.fillRect(x0 - 2, y0 - 1, w + 4, h + 2);
  g.fillStyle = '#2c2e3c'; g.fillRect(x0 - 2, y0 + h + 1, w + 4, 2);
  [[away, sc[0], x0], [home, sc[1], x0 + w / 2 + 1]].forEach(([t, v, x]) => {
    g.fillStyle = '#05060a'; g.fillRect(x, y0, hw, h);
    g.fillStyle = t.main; g.fillRect(x, y0, hw, 6);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = t.alt; g.font = 'bold 4.5px sans-serif'; g.fillText((t.name[lang] || t.name.zh).slice(0, lang === 'en' ? 10 : 2), x + hw / 2, y0 + 3.3);
    g.fillStyle = '#ffcf3a'; g.font = 'bold 13px monospace'; g.fillText(String(v), x + hw / 2, y0 + 16.5);
  });
  const t = Math.floor(performance.now() / 300);
  for (let i = 0; i < 18; i++) { g.fillStyle = (i + t) % 3 ? '#ffd23a' : home.main; g.fillRect(x0 - 2 + i * 4.22, y0 + h + 3.4, 3, 1.1); }
}
const overlays = [];
function draw() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (!arenaImgs) { floorProj = projectFloor(); arenaImgs = [buildArena(false), buildArena(true)]; }
  const now = performance.now();
  g.drawImage(arenaImgs[now < cheerUntil && Math.floor(now / 170) % 2 ? 1 : 0], 0, 0);
  g.setTransform(S, 0, 0, S, 0, 0);
  overlays.length = 0;
  const list = [];
  [0, 1].forEach(side => { list.push({ d: 24.4, f: () => basket(side, false) }, { d: 25.6, f: () => basket(side, true) }); });
  if (game) {
    const L = cur ? lineups : [game.ts[0].on, game.ts[1].on];
    drawBenches(L);
    [0, 1].forEach(sd => L[sd].forEach(p => { const at = pos[p.id]; if (at) list.push({ d: at.y, f: () => drawPlayer(p, teams[sd], at, ballPos.holder === p.id) }); }));
    list.push({ d: ballPos.y + 0.05, f: drawBall });
  }
  list.sort((a, b) => a.d - b.d).forEach(o => o.f());
  dust(now);
  const fx = fxOn && canFilter;
  if (fx) tiltShift();
  g.setTransform(S, 0, 0, S, 0, 0);
  jumbotron();
  if (fx) glow();
  // crisp labels on top of everything
  g.setTransform(S, 0, 0, S, 0, 0);
  overlays.forEach(o => o());
  g.textAlign = 'center'; g.textBaseline = 'bottom'; g.font = 'bold 7px sans-serif';
  popups.forEach(o => {
    const q = P(o.x, o.y, 0), y = q.y - 30 - o.age * 4;
    g.globalAlpha = clamp(1 - o.age / 1.6, 0, 1); g.fillStyle = '#000'; g.fillText(o.text, q.x + 0.5, y + 0.5); g.fillStyle = o.color; g.fillText(o.text, q.x, y);
  });
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
    if (label && at) { if (popups.length >= 4) popups.shift(); } if (e.k === 'make') cheerUntil = performance.now() + 1800;
    if (label && at) popups.push({ text: label, x: at.x, y: at.y, age: 0, color: e.k === 'make' ? '#ffe14a' : e.k === 'block' || e.k === 'steal' ? '#7ae0ff' : e.k === 'foul' ? '#ff7a7a' : '#ffffff' });
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
  $('sim').textContent = T('sim'); $('next').textContent = T('next'); $('newTeams').textContent = T('newTeams'); $('lang').textContent = T('lang'); $('fx').textContent = T('fx')(fxOn && canFilter); $('fx').disabled = !canFilter;
  setPlaying(playing);
  arenaImgs = null; renderBoard.last = null; renderBoard.cards = null;
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
$('fx').onclick = () => { fxOn = !fxOn; try { localStorage.setItem('hoops.fx', fxOn ? 'on' : 'off'); } catch (e) { /* ignore */ } $('fx').textContent = T('fx')(fxOn && canFilter); };
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
