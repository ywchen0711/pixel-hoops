// 籃球模擬引擎：依球員能力逐回合模擬 NBA 規則的比賽，並產生給畫面播放的時間軸
// Basketball simulation: possession-by-possession with NBA rules, and a timeline for the court animation.
// Court coordinates are in feet: x 0–94 along the court, y 0–50 across; the baskets are at x 5.25 and 88.75, y 25.
(function (root) {
'use strict';

const R = Math.random;
function gauss() { let u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = a => a[Math.floor(R() * a.length)];
function pickW(list, w) { let s = 0; const ws = list.map((x, i) => { const v = Math.max(0, w(x, i)); s += v; return v; }); let r = R() * s; for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; }

// ---------------- rules (NBA) ----------------
const RULES = { PERIOD: 720, OT: 300, SHOT_CLOCK: 24, OREB_CLOCK: 14, FOUL_OUT: 6, BONUS: 5, ON_COURT: 5, ROSTER: 13 };
const BASKET = [{ x: 88.75, y: 25 }, { x: 5.25, y: 25 }];   // the basket a team attacks in the first half (side 0 → right)
const POS = ['PG', 'SG', 'SF', 'PF', 'C'];
const POS_NAME = { zh: { PG: '控球後衛', SG: '得分後衛', SF: '小前鋒', PF: '大前鋒', C: '中鋒' }, en: { PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', C: 'Center' } };
const RATINGS = ['ins', 'mid', 'thr', 'ft', 'pas', 'hnd', 'spd', 'def', 'blk', 'reb', 'sta'];

// ---------------- names (Chinese + pinyin) ----------------
const SUR = [['陳', 'Chen'], ['林', 'Lin'], ['黃', 'Huang'], ['張', 'Chang'], ['李', 'Lee'], ['王', 'Wang'], ['吳', 'Wu'], ['劉', 'Liu'], ['蔡', 'Tsai'], ['楊', 'Yang'],
  ['許', 'Hsu'], ['鄭', 'Cheng'], ['謝', 'Hsieh'], ['郭', 'Kuo'], ['洪', 'Hung'], ['曾', 'Tseng'], ['邱', 'Chiu'], ['廖', 'Liao'], ['賴', 'Lai'], ['周', 'Chou'],
  ['徐', 'Hsu'], ['蘇', 'Su'], ['葉', 'Yeh'], ['莊', 'Chuang'], ['呂', 'Lu'], ['江', 'Chiang'], ['何', 'Ho'], ['蕭', 'Hsiao'], ['羅', 'Lo'], ['高', 'Kao'],
  ['潘', 'Pan'], ['簡', 'Chien'], ['朱', 'Chu'], ['鍾', 'Chung'], ['彭', 'Peng'], ['游', 'Yu'], ['詹', 'Chan'], ['胡', 'Hu'], ['施', 'Shih'], ['沈', 'Shen']];
const GIV = [['志', 'Chih'], ['俊', 'Chun'], ['建', 'Chien'], ['家', 'Chia'], ['冠', 'Kuan'], ['宗', 'Tsung'], ['承', 'Cheng'], ['柏', 'Po'], ['彥', 'Yen'], ['睿', 'Jui'],
  ['宇', 'Yu'], ['哲', 'Che'], ['嘉', 'Chia'], ['文', 'Wen'], ['信', 'Hsin'], ['明', 'Ming'], ['國', 'Kuo'], ['偉', 'Wei'], ['勝', 'Sheng'], ['凱', 'Kai'],
  ['祐', 'Yu'], ['廷', 'Ting'], ['浩', 'Hao'], ['翔', 'Hsiang'], ['安', 'An'], ['仁', 'Jen'], ['昱', 'Yu'], ['維', 'Wei'], ['銘', 'Ming'], ['鴻', 'Hung'],
  ['傑', 'Chieh'], ['宏', 'Hung'], ['豪', 'Hao'], ['翰', 'Han'], ['恩', 'En'], ['軒', 'Hsuan'], ['鈞', 'Chun'], ['達', 'Ta'], ['毅', 'Yi'], ['威', 'Wei']];
function genName() {
  const s = pick(SUR), a = pick(GIV), b = pick(GIV);
  return { zh: s[0] + a[0] + b[0], en: a[1] + '-' + b[1].toLowerCase() + ' ' + s[1] };
}

// ---------------- teams ----------------
const TEAMS = [
  { name: { zh: '雷霆', en: 'Thunder' },  main: '#2a5bd7', alt: '#f4c430', trim: '#ffffff', skin: '#1d3f9c' },
  { name: { zh: '火鳳', en: 'Phoenix' },  main: '#e0402e', alt: '#ffd25a', trim: '#5a1408', skin: '#a8261a' },
  { name: { zh: '飛龍', en: 'Dragons' },  main: '#1f9a52', alt: '#f2f2e6', trim: '#0e4a26', skin: '#136a37' },
  { name: { zh: '猛虎', en: 'Tigers' },   main: '#f08a1c', alt: '#1c1c1c', trim: '#ffffff', skin: '#b5610c' },
  { name: { zh: '海鯨', en: 'Whales' },   main: '#1aa6c4', alt: '#0b2c4a', trim: '#ffffff', skin: '#0f7690' },
  { name: { zh: '紫晶', en: 'Amethyst' }, main: '#7a3fd0', alt: '#f0e4ff', trim: '#2c0f5a', skin: '#55289a' },
  { name: { zh: '黑熊', en: 'Bears' },    main: '#2b2b30', alt: '#e0e0e0', trim: '#b02020', skin: '#111114' },
  { name: { zh: '金鷹', en: 'Eagles' },   main: '#c9a227', alt: '#3a2a10', trim: '#ffffff', skin: '#8f7210' }
];
const CITIES = [{ zh: '台北', en: 'Taipei' }, { zh: '新北', en: 'New Taipei' }, { zh: '桃園', en: 'Taoyuan' }, { zh: '新竹', en: 'Hsinchu' }, { zh: '台中', en: 'Taichung' },
  { zh: '台南', en: 'Tainan' }, { zh: '高雄', en: 'Kaohsiung' }, { zh: '花蓮', en: 'Hualien' }, { zh: '基隆', en: 'Keelung' }, { zh: '嘉義', en: 'Chiayi' }];

// position profiles: rating offsets and height (cm)
const PROFILE = {
  PG: { ins: -4, mid: 2, thr: 4, ft: 4, pas: 14, hnd: 14, spd: 10, def: 2, blk: -16, reb: -14, hgt: 188 },
  SG: { ins: -2, mid: 4, thr: 8, ft: 4, pas: 2, hnd: 6, spd: 6, def: 2, blk: -12, reb: -10, hgt: 195 },
  SF: { ins: 2, mid: 2, thr: 2, ft: 0, pas: 0, hnd: 0, spd: 2, def: 4, blk: -4, reb: -2, hgt: 201 },
  PF: { ins: 6, mid: 0, thr: -6, ft: -4, pas: -4, hnd: -6, spd: -4, def: 2, blk: 8, reb: 10, hgt: 206 },
  C:  { ins: 10, mid: -4, thr: -16, ft: -8, pas: -6, hnd: -12, spd: -10, def: 0, blk: 16, reb: 16, hgt: 211 }
};
let PID = 1;
const newStats = () => ({ G: 0, MIN: 0, PTS: 0, FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0, OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0, PM: 0 });
function genPlayer(pos, tier) {
  const pr = PROFILE[pos], r = {};
  RATINGS.forEach(k => { r[k] = Math.round(clamp(58 + tier + (pr[k] || 0) + gauss() * 9, 25, 95)); });
  r.sta = Math.round(clamp(70 + gauss() * 10, 40, 95));
  return { id: PID++, name: genName(), num: 0, pos, hgt: Math.round(pr.hgt + gauss() * 3.5), r, g: newStats(), s: newStats() };
}
function makeTeam(style, city) {
  const t = Object.assign({}, style, { city, roster: [], W: 0, L: 0 });
  POS.forEach(p => t.roster.push(genPlayer(p, 0)));                                   // starters
  ['PG', 'SG', 'SF', 'PF', 'C', 'SG', 'SF', 'C'].forEach((p, i) => t.roster.push(genPlayer(p, i < 3 ? -5 : -9)));   // bench
  const nums = []; for (let i = 0; i < 100; i++) nums.push(i);
  t.roster.forEach(p => { p.num = nums.splice(Math.floor(R() * nums.length), 1)[0]; p.team = t; });
  return t;
}

// ---------------- the four super players ----------------
// every match puts them on random teams and random starting positions (never the same spot twice)
const STARS = [{ zh: 'Josh Chen', en: 'Josh Chen' }, { zh: 'Jasper Chen', en: 'Jasper Chen' }, { zh: 'Jeff Chen', en: 'Jeff Chen' }, { zh: 'Erin Lai', en: 'Erin Lai' }];
function genStar(name, pos) {
  const r = {};
  RATINGS.forEach(k => { r[k] = Math.round(92 + R() * 7); });
  // the position still shapes them a little (a star center blocks more than a star point guard), but never below 88
  const pr = PROFILE[pos];
  ['blk', 'reb', 'pas', 'hnd', 'thr'].forEach(k => { r[k] = Math.round(clamp(r[k] + (pr[k] || 0) * 0.15, 88, 99)); });
  r.sta = Math.round(92 + R() * 7);
  return { id: PID++, name: Object.assign({}, name), num: 0, pos, hgt: Math.round(PROFILE[pos].hgt + 3 + R() * 4), r, g: newStats(), s: newStats(), star: true };
}
function addStars(teams) {
  const slots = [];
  teams.forEach((t, ti) => POS.forEach((p, pi) => slots.push({ ti, pi })));
  STARS.forEach(name => {
    if (teams.some(t => t.roster.some(p => p.star && p.name.en === name.en))) return;   // already there (a saved roster)
    const free = slots.filter(s => !teams[s.ti].roster[s.pi].star);
    const s = pick(free), t = teams[s.ti], old = t.roster[s.pi], star = genStar(name, POS[s.pi]);
    star.num = old.num; star.team = t;
    t.roster[s.pi] = star;
  });
  return teams;
}
function makeMatch() {
  const styles = TEAMS.slice(), cities = CITIES.slice();
  const take = a => a.splice(Math.floor(R() * a.length), 1)[0];
  return addStars([makeTeam(take(styles), take(cities)), makeTeam(take(styles), take(cities))]);
}
const ovr = p => Math.round((p.r.ins + p.r.mid + p.r.thr * 1.1 + p.r.pas * 0.8 + p.r.hnd * 0.6 + p.r.def + p.r.blk * 0.6 + p.r.reb * 0.8 + p.r.spd * 0.6) / 7.6);


// ---------------- the playbook ----------------
// Every half-court possession runs a set that ends in the shot the possession is going to take.
// Slots: h ball handler, s screener (usually a big), x / a / b the others; sh = the slot that shoots.
// passes: [when (0–1 through the set), from slot, to slot, lob?]; kf names the movement diagram (in game.js).
const PLAYS = {
  pnr_roll: { sh: 's', types: ['rim'], big: true, kf: 'pnr', passes: [[0.84, 'h', 's']],
    name: { zh: '擋拆順下', en: 'Pick & Roll' },
    desc: { zh: '長人上提替持球者擋人，持球者切入吸引防守，擋人者順勢下到籃下接球攻擊。', en: 'The big sets a screen for the ball handler, then rolls hard to the rim for the pass.' } },
  pnr_pull: { sh: 'h', types: ['mid', 'three', 'rim'], big: false, kf: 'pnr', passes: [],
    name: { zh: '擋拆後出手', en: 'Pick & Roll Pull-up' },
    desc: { zh: '持球者借長人的掩護甩開防守者，趁空檔直接跳投或殺進禁區。', en: 'The handler rubs the defender off the screen and pulls up or attacks the paint.' } },
  pnp: { sh: 's', types: ['mid', 'three'], big: true, kf: 'pnp', passes: [[0.82, 'h', 's']],
    name: { zh: '擋拆外彈', en: 'Pick & Pop' },
    desc: { zh: '擋人者擋完不往籃下跑，而是外拉到空檔接球投籃，專門懲罰退守的長人。', en: 'Instead of rolling, the screener pops out to open space for a catch-and-shoot.' } },
  iso: { sh: 'h', types: ['rim', 'mid', 'three'], kf: 'iso', passes: [],
    name: { zh: '單打', en: 'Isolation' },
    desc: { zh: '其他四人拉開到弱邊，把空間留給一對一進攻的單打手。', en: 'Four players clear out to the weak side so one scorer can go one-on-one.' } },
  post: { sh: 'x', types: ['rim', 'mid'], big: true, kf: 'post', passes: [[0.4, 'h', 'x']],
    name: { zh: '低位單打', en: 'Post-up' },
    desc: { zh: '長人在低位卡位要球，接到傳球後背身往籃下擠。', en: 'The big seals on the low block, catches the entry pass and backs down.' } },
  dk: { sh: 'x', types: ['three'], kf: 'dk', passes: [[0.8, 'h', 'x']],
    name: { zh: '突破分球', en: 'Drive & Kick' },
    desc: { zh: '持球者突破吸引協防，再把球分給外線空檔的射手。', en: 'The handler drives to draw help, then kicks it out to the open shooter.' } },
  givego: { sh: 'h', types: ['rim'], big: false, kf: 'givego', passes: [[0.3, 'h', 'x'], [0.8, 'x', 'h']],
    name: { zh: '傳切', en: 'Give & Go' },
    desc: { zh: '傳球後立刻切向籃下，隊友再把球回傳完成上籃。', en: 'Pass, cut hard to the rim, and get the ball right back for the layup.' } },
  backdoor: { sh: 'x', types: ['rim'], big: false, kf: 'backdoor', passes: [[0.35, 'h', 's'], [0.8, 's', 'x']],
    name: { zh: '背切', en: 'Backdoor Cut' },
    desc: { zh: '側翼被貼身阻絕時先假裝外拉，再突然反跑切到防守者身後。', en: 'When the wing is overplayed, the wing fakes out and cuts behind the defender to the rim.' } },
  floppy: { sh: 'x', types: ['three', 'mid'], big: false, kf: 'floppy', passes: [[0.85, 'h', 'x']], screens: true,
    name: { zh: '無球掩護（Floppy）', en: 'Floppy' },
    desc: { zh: '射手從籃下出發，選一邊繞過隊友的掩護跑到側翼接球投籃。', en: 'The shooter starts under the rim and runs off a screen to either wing for the shot.' } },
  elevator: { sh: 'x', types: ['three'], big: false, kf: 'elevator', passes: [[0.85, 'h', 'x']],
    name: { zh: '電梯門', en: 'Elevator Doors' },
    desc: { zh: '射手穿過兩名並排的隊友中間，兩人立刻像電梯門一樣關上擋住追防者。', en: 'The shooter runs between two teammates who shut like elevator doors behind them.' } },
  dho: { sh: 'x', types: ['three', 'mid', 'rim'], big: false, kf: 'dho', passes: [[0.12, 'h', 's'], [0.55, 's', 'x']],
    name: { zh: '手遞手', en: 'Hand-off' },
    desc: { zh: '長人在弧頂持球，把球直接遞給繞過來的後衛，順便擋住他的防守者。', en: 'The big hands the ball to a guard running past and screens the defender at the same time.' } },
  horns_h: { sh: 'h', types: ['mid', 'three', 'rim'], big: false, kf: 'horns', passes: [],
    name: { zh: '牛角戰術', en: 'Horns' },
    desc: { zh: '兩名長人站在罰球線兩肘像一對牛角，持球者選邊利用掩護進攻。', en: 'Two bigs stand at the elbows like horns; the handler picks a side and uses the screen.' } },
  horns_a: { sh: 'a', types: ['mid', 'three'], big: true, kf: 'horns', passes: [[0.82, 'h', 'a']],
    name: { zh: '牛角外彈', en: 'Horns Pop' },
    desc: { zh: '牛角站位擋拆後，另一邊肘區的長人外彈接球投籃。', en: 'Out of the horns set, the other big pops off the elbow for the shot.' } },
  spain_s: { sh: 's', types: ['rim'], big: true, kf: 'spain', passes: [[0.8, 'h', 's']],
    name: { zh: '西班牙擋拆', en: 'Spain Pick & Roll' },
    desc: { zh: '擋拆時再加一記背掩護擋住順下者的防守人，讓長人一路空到籃下。', en: 'A pick and roll plus a back screen on the roller\u2019s defender, so the big has a clear lane.' } },
  spain_x: { sh: 'x', types: ['three'], big: false, kf: 'spain', passes: [[0.82, 'h', 'x']],
    name: { zh: '西班牙擋拆外彈', en: 'Spain Pick & Pop' },
    desc: { zh: '西班牙擋拆中，做背掩護的射手擋完立刻外彈到三分線接球。', en: 'In the Spain pick and roll, the back screener pops to the arc for the three.' } },
  motion: { sh: 'x', types: ['rim', 'mid', 'three'], kf: 'motion', passes: [[0.2, 'h', 'a'], [0.45, 'a', 's'], [0.65, 's', 'b'], [0.85, 'b', 'x']],
    name: { zh: '五外傳導', en: 'Motion Offense' },
    desc: { zh: '五人拉開，球不停轉移、空切、補位輪轉，直到找到空檔。', en: 'Five out: the ball swings while players cut and refill until someone is open.' } },
  alley: { sh: 's', types: ['rim'], big: true, kf: 'alley', passes: [[0.78, 'h', 's', true]],
    name: { zh: '空中接力', en: 'Alley-oop' },
    desc: { zh: '長人假裝上提擋人，突然空切籃下，持球者高吊空中接力。', en: 'The big fakes a screen and cuts to the rim; the handler lobs it up for the slam.' } },
  fast_h: { sh: 'h', special: true, kf: 'fast', passes: [],
    name: { zh: '快攻', en: 'Fast Break' },
    desc: { zh: '搶到球立刻推進，趁防守還沒回位直接攻擊。', en: 'Push the ball before the defense is set and attack right away.' } },
  fast_x: { sh: 'x', special: true, kf: 'fast', passes: [[0.75, 'h', 'x']],
    name: { zh: '快攻分球', en: 'Fast Break Pass' },
    desc: { zh: '快攻推進時，把球分給跑到底角或籃下的隊友。', en: 'On the break, the handler finds a teammate filling the lane or the corner.' } },
  putback: { sh: 'x', special: true, kf: null, passes: [],
    name: { zh: '二次進攻', en: 'Second Chance' },
    desc: { zh: '搶下進攻籃板後立刻補籃，或重新組織再攻一次。', en: 'After an offensive rebound: a quick putback or a reset.' } }
};

// ---------------- the game ----------------
const SHOT = { rim: { base: 0.63, key: 'ins', pts: 2, foul: 0.22 }, mid: { base: 0.41, key: 'mid', pts: 2, foul: 0.06 }, three: { base: 0.345, key: 'thr', pts: 3, foul: 0.015 } };
const SLOPE = 0.0042;      // make % per rating point above the defender

class Game {
  constructor(away, home) {
    this.teams = [away, home];
    this.ts = this.teams.map(t => this.initTeam(t));
    this.period = 1; this.clock = RULES.PERIOD; this.shotClock = RULES.SHOT_CLOCK;
    this.score = [0, 0]; this.line = [[], []];
    this.poss = R() < 0.5 ? 0 : 1;          // jump ball
    this.firstPoss = this.poss;
    this.over = false; this.log = []; this.lastPos = null;
  }
  initTeam(t) {
    t.roster.forEach(p => { p.g = newStats(); p.e = 100; p.on = false; p.fouledOut = false; });
    const on = POS.map(pos => t.roster.find(p => p.pos === pos && !p.on) || t.roster.find(p => !p.on));
    on.forEach(p => { p.on = true; p.starter = true; p.g.G = 1; });
    t.roster.forEach(p => { if (!on.includes(p)) p.starter = false; });
    return { team: t, on, fouls: 0, timeouts: 7 };
  }
  // the basket side `s` is shooting at in the current period (they switch at halftime)
  basket(s) { return BASKET[(s + (this.period >= 3 ? 1 : 0)) % 2]; }
  eff(p, k) { return p.r[k] * (0.82 + 0.18 * p.e / 100); }      // tired players are worse
  name(p, lang) { return p.name[lang] || p.name.zh; }

  // ---- substitutions at a dead ball: tired players and players in foul trouble sit, rested starters come back ----
  subs(side, events) {
    const ts = this.ts[side], bench = ts.team.roster.filter(p => !p.on && !p.fouledOut);
    const group = pos => pos === 'PG' || pos === 'SG' ? 'G' : pos === 'C' ? 'C' : 'F';
    const late = this.period >= 4 && this.clock < 300 && Math.abs(this.score[0] - this.score[1]) <= 12;   // crunch time: best players stay in
    ts.on.forEach((p, i) => {
      const trouble = p.g.PF >= Math.min(5, this.period + 1) && !(this.period >= 4 && this.clock < 360);
      const tired = p.e < (late ? 35 : p.starter ? 68 : 72);
      if (!tired && !trouble && !p.fouledOut) return;
      const cand = bench.filter(b => !b.on && b.e > 80 && (group(b.pos) === group(p.pos) || p.fouledOut));
      if (!cand.length) return;
      const sub = cand.sort((a, b) => (ovr(b) + (b.starter ? 6 : 0)) - (ovr(a) + (a.starter ? 6 : 0)))[0];
      p.on = false; sub.on = true; sub.g.G = 1; ts.on[i] = sub;
      events.push({ k: 'sub', side, inn: sub, out: p });
    });
    // rested starters come back for a bench player at their position
    ts.on.forEach((p, i) => {
      if (p.starter) return;
      const st = ts.team.roster.find(b => b.starter && !b.on && !b.fouledOut && b.e > 90 && group(b.pos) === group(p.pos) && b.g.PF < Math.min(5, this.period + 1));
      if (!st) return;
      p.on = false; st.on = true; ts.on[i] = st;
      events.push({ k: 'sub', side, inn: st, out: p });
    });
  }
  tire(dt) {
    this.ts.forEach(ts => ts.team.roster.forEach(p => {
      if (p.on) { p.e = Math.max(0, p.e - dt * (0.105 - p.r.sta * 0.0005)); p.g.MIN += dt / 60; }
      else p.e = Math.min(100, p.e + dt * 0.11);
    }));
  }

  // ---- one possession: returns { log, tl (timeline for the animation), dur (game seconds) } ----
  step() {
    if (this.over) return null;
    const ev = [], tl = [], off = this.poss, def = 1 - off, O = this.ts[off], D = this.ts[def];
    const clock0 = this.clock, startScore = this.score.slice();
    let t = 0;                                   // seconds used in this possession (set below: bringing the ball up)
    const transition = this.lastWasLive ? 2.5 : 4;
    const say = (k, o) => { ev.push(Object.assign({ k, side: off, t, clock: clock0 - t }, o)); };
    tl.push({ t: 0, k: 'start', off, transition });
    let holder = O.on[0];
    tl.push({ t: 0, k: 'hold', p: holder.id });
    // shotEnd: the possession time at which the shot clock runs out (24, reset to t + 14 after an offensive rebound)
    let shotEnd = RULES.SHOT_CLOCK, result = null, liveBall = false;
    const p0 = this.period;
    t = Math.min(this.clock, this.lastWasLive ? 1.5 + R() * 1.5 : 3 + R() * 2);   // bringing the ball up the court
    const left = () => Math.min(shotEnd - t, this.clock - t);
    const takeBall = () => { const last = tl[tl.length - 1]; holder = O.on.find(q => q.id === last.p) || holder; };
    for (let guard = 0; guard < 6 && !result; guard++) {
      // the ball moves around: a few passes
      const avail = left();
      if (avail <= 0.3) { result = 'periodEnd'; break; }
      const pace = guard === 0 ? 5 + R() * 9 : 1.5 + R() * 5;     // seconds until something happens
      const hurry = this.clock - t < 26 && this.clock <= shotEnd && this.clock - t > 3;          // last shot of the period
      let use = hurry ? Math.max(0.5, this.clock - t - 2 - R() * 1.5) : Math.min(pace, avail - 0.4);
      if (use < 0.3) use = Math.max(0.1, avail - 0.2);
      // who will shoot and what kind of shot, then the set that leads to it
      const shooter = this.chooseShooter(O, holder);
      let type = this.shotType(shooter);
      const playId = this.choosePlay(shooter, type, guard, use), PL = PLAYS[playId];
      const roles = this.roles(O, holder, shooter, PL.sh), ids = {};
      Object.keys(roles).forEach(k => { ids[k] = roles[k].id; });
      tl.push({ t, k: 'play', id: playId, end: t + use, roles: ids, flip: R() < 0.5 ? 1 : -1 });
      say('play', { play: playId });
      let lastPasser = null;
      const passTo = (tp, to, lob) => { if (!to || to === holder) return; tl.push({ t: tp, k: 'pass', from: holder.id, to: to.id, dur: lob ? 0.75 : 0.5, lob: !!lob }); lastPasser = holder; holder = to; };
      if (PL.kf) passTo(t + use * 0.05, roles.h);
      PL.passes.forEach(q => passTo(t + use * q[0], roles[q[2]], q[3]));
      t += use;
      // shot clock violation (rare) or the period ends while holding
      if (t >= shotEnd - 0.05 && !hurry) { this.addTO(holder, null); say('shotclock', { p: holder }); result = 'to'; break; }
      if (t >= this.clock - 0.05) { result = 'periodEnd'; break; }

      // turnover
      const handlerSkill = (this.eff(holder, 'hnd') + this.eff(holder, 'pas')) / 2;
      const thief = pickW(D.on, p => p.r.def * 0.6 + p.r.spd * 0.4);
      if (R() < 0.11 + (this.eff(thief, 'def') - handlerSkill) * 0.001) {
        const steal = R() < 0.58;
        this.addTO(holder, steal ? thief : null);
        tl.push({ t, k: steal ? 'steal' : 'lost', p: holder.id, by: thief.id });
        say(steal ? 'steal' : 'turnover', { p: holder, by: thief, how: steal ? null : pick(['travel', 'out', 'pass', 'offensive']) });
        result = 'to'; liveBall = steal; break;
      }
      // non-shooting foul
      if (R() < 0.072) {
        const fouler = pickW(D.on, p => 1.2 - p.r.def * 0.005);
        this.foul(fouler, def, ev, t, clock0);
        tl.push({ t, k: 'foul', p: fouler.id });
        if (D.fouls > RULES.BONUS) {                                  // in the bonus: two free throws
          const fte = this.freeThrows(holder, 2, off, ev, tl, t, clock0);
          t = fte.t; result = 'made';
          if (!fte.lastMade) { const rb = this.rebound(off, ev, tl, t, clock0, true); if (rb === off) { shotEnd = t + RULES.OREB_CLOCK; t += 0.5; result = null; takeBall(); continue; } result = 'missFT'; liveBall = true; }
          break;
        }
        shotEnd = Math.max(shotEnd, t + RULES.OREB_CLOCK);        // the shot clock resets to at least 14
        continue;
      }

      // the shot
      if (shooter !== holder) { const tp = Math.max(0, t - 0.6); tl.push({ t: tp, k: 'pass', from: holder.id, to: shooter.id, dur: 0.5 }); lastPasser = holder; holder = shooter; }
      const desperate = this.clock - t < 2.5;
      if (desperate) type = R() < 0.7 ? 'three' : 'mid';
      const defender = D.on[O.on.indexOf(shooter)] || pick(D.on);
      const spot = this.shotSpot(off, type);
      const S = SHOT[type];
      let p = S.base + SLOPE * (this.eff(shooter, S.key) - this.eff(defender, 'def'));
      if (type === 'rim') p -= 0.0015 * (Math.max.apply(null, D.on.map(d => d.r.blk)) - 60);
      if (desperate) p = 0.18;
      p = clamp(p, 0.08, 0.85);
      // block
      const blocker = type === 'three' ? defender : pickW(D.on, d => Math.pow(d.r.blk, 3));
      const blockP = type === 'rim' ? 0.075 + (blocker.r.blk - 65) * 0.0016 : type === 'mid' ? 0.03 : 0.008;
      const fouled = R() < S.foul * (1 + (this.eff(shooter, 'ins') - 60) * 0.006);
      shooter.g.FGA += fouled ? 0 : 1;
      tl.push({ t, k: 'shot', p: shooter.id, x: spot.x, y: spot.y, type, dur: type === 'three' ? 1.1 : type === 'mid' ? 0.9 : 0.6 });
      const tFlight = t + (type === 'three' ? 1.1 : type === 'mid' ? 0.9 : 0.6);
      if (!fouled && R() < blockP) {
        blocker.g.BLK++; if (type === 'three') shooter.g.TPA++;
        tl.push({ t: t + 0.25, k: 'block', p: blocker.id });
        say('block', { p: shooter, by: blocker, type });
        t = t + 0.6;
        const rb = this.rebound(off, ev, tl, t, clock0, false);
        if (rb === off) { shotEnd = t + RULES.OREB_CLOCK; t += 0.4; takeBall(); continue; }
        result = 'miss'; liveBall = true; break;
      }
      const made = R() < (fouled ? p * 0.55 : p);
      if (fouled) {
        const fouler = type === 'rim' ? pickW(D.on, d => d.r.blk + 20) : defender;
        this.foul(fouler, def, ev, tFlight, clock0);
        tl.push({ t: tFlight, k: 'foul', p: fouler.id });
        if (made) {
          shooter.g.FGA++; shooter.g.FGM++; if (type === 'three') { shooter.g.TPA++; shooter.g.TPM++; }
          this.points(off, shooter, S.pts);
          tl.push({ t: tFlight, k: 'make', p: shooter.id, pts: S.pts });
          say('andone', { p: shooter, type, pts: S.pts });
          const fte = this.freeThrows(shooter, 1, off, ev, tl, tFlight + 1.2, clock0);
          t = fte.t;
          if (!fte.lastMade) { const rb = this.rebound(off, ev, tl, t, clock0, true); if (rb === off) { shotEnd = t + RULES.OREB_CLOCK; t += 0.5; takeBall(); continue; } result = 'missFT'; liveBall = true; break; }
          result = 'made'; break;
        }
        say('shootfoul', { p: shooter, type });
        const fte = this.freeThrows(shooter, S.pts, off, ev, tl, tFlight + 1.2, clock0);
        t = fte.t;
        if (!fte.lastMade) { const rb = this.rebound(off, ev, tl, t, clock0, true); if (rb === off) { shotEnd = t + RULES.OREB_CLOCK; t += 0.5; takeBall(); continue; } result = 'missFT'; liveBall = true; break; }
        result = 'made'; break;
      }
      if (type === 'three') shooter.g.TPA++;
      if (made) {
        shooter.g.FGM++; if (type === 'three') shooter.g.TPM++;
        this.points(off, shooter, S.pts);
        let assist = null;
        if (lastPasser && lastPasser !== shooter && R() < (type === 'three' ? 0.85 : type === 'mid' ? 0.55 : 0.62)) { assist = lastPasser; assist.g.AST++; }
        else if (!lastPasser && R() < 0.42) { const a = pickW(O.on.filter(q => q !== shooter), q => q.r.pas); assist = a; a.g.AST++; }
        tl.push({ t: tFlight, k: 'make', p: shooter.id, pts: S.pts });
        say('make', { p: shooter, type, pts: S.pts, ast: assist, dist: Math.round(Math.hypot(spot.x - this.basket(off).x, spot.y - this.basket(off).y)) });
        t = tFlight + 0.4;
        result = 'made'; break;
      }
      tl.push({ t: tFlight, k: 'miss', p: shooter.id });
      say('miss', { p: shooter, type, dist: Math.round(Math.hypot(spot.x - this.basket(off).x, spot.y - this.basket(off).y)) });
      t = tFlight + 0.3;
      if (t >= this.clock) { result = 'periodEnd'; break; }
      const rb = this.rebound(off, ev, tl, t, clock0, false);
      if (rb === off) { shotEnd = t + RULES.OREB_CLOCK; t += 0.4; takeBall(); continue; }
      result = 'miss'; liveBall = true; break;
    }
    if (!result) result = 'to';
    // the last scraps of a period run out; every possession takes at least a moment
    if (result === 'periodEnd' || this.clock - t < 0.3) t = this.clock;
    t = Math.max(t, Math.min(0.5, this.clock));
    const used = Math.min(t, this.clock);
    this.tire(used);
    this.clock -= used;
    // plus / minus
    const diff = [this.score[0] - startScore[0], this.score[1] - startScore[1]];
    [0, 1].forEach(s => this.ts[s].on.forEach(p => { p.g.PM += diff[s] - diff[1 - s]; }));
    this.line[0][this.period - 1] = (this.line[0][this.period - 1] || 0) + diff[0];
    this.line[1][this.period - 1] = (this.line[1][this.period - 1] || 0) + diff[1];
    this.lastWasLive = liveBall;
    this.poss = def;
    tl.push({ t: used, k: 'end' });
    // end of a period
    let periodEnded = false;
    if (this.clock <= 0.05) {
      periodEnded = true;
      ev.push({ k: 'periodEnd', period: this.period, score: this.score.slice(), clock: 0 });
      if (this.period >= 4 && this.score[0] !== this.score[1]) this.finish(ev);
      else {
        this.period++;
        this.clock = this.period > 4 ? RULES.OT : RULES.PERIOD;
        this.ts.forEach(ts => { ts.fouls = 0; });
        // the team that did not get the opening tip starts the 2nd and 3rd; the other team the 4th (simplified)
        this.poss = this.period > 4 ? (R() < 0.5 ? 0 : 1) : this.period === 4 ? this.firstPoss : 1 - this.firstPoss;
        this.lastWasLive = false;
        this.ts.forEach(ts => ts.team.roster.forEach(p => { p.e = Math.min(100, p.e + (this.period === 3 ? 45 : 12)); }));
      }
    }
    // dead ball (or a new period): substitutions
    if (!this.over && (!liveBall || periodEnded)) { const se = []; this.subs(0, se); this.subs(1, se); se.forEach(e => { e.clock = this.clock; ev.push(e); }); }
    ev.forEach(e => this.log.push(e));
    return { log: ev, tl, dur: used, clock0, period: p0, off, result, transition };
  }

  choosePlay(shooter, type, seg, use) {
    const big = shooter.pos === 'C' || shooter.pos === 'PF';
    if (seg > 0 && use < 3.2) return 'putback';
    if (seg === 0 && this.lastWasLive && type !== 'mid' && R() < 0.4) return R() < 0.55 ? 'fast_h' : 'fast_x';
    const ids = Object.keys(PLAYS).filter(id => { const q = PLAYS[id]; return !q.special && q.types.includes(type) && (q.big == null || q.big === big); });
    return ids.length ? pick(ids) : 'iso';
  }
  // who fills each slot of the set: the shooter's slot first, then the best ball handler, then the biggest screener
  roles(O, holder, shooter, sh) {
    const r = { [sh]: shooter }, rest = O.on.filter(p => p !== shooter);
    const take = (slot, score) => {
      if (r[slot] || !rest.length) return;
      let b = rest[0]; rest.forEach(q => { if (score(q) > score(b)) b = q; });
      r[slot] = b; rest.splice(rest.indexOf(b), 1);
    };
    take('h', p => p.r.hnd + p.r.pas + (p === holder ? 12 : 0) - (p.pos === 'C' ? 40 : 0));
    take('s', p => p.hgt);
    ['x', 'a', 'b'].forEach(slot => { if (!r[slot]) r[slot] = rest.shift(); });
    return r;
  }
  chooseShooter(O, holder) {
    return pickW(O.on, p => {
      const scoring = Math.max(this.eff(p, 'ins'), this.eff(p, 'mid'), this.eff(p, 'thr') * 1.05);
      return Math.pow(scoring / 60, 2.6) * (p === holder ? 1.2 : 1);
    });
  }
  shotType(p) {
    const w = { rim: 0.33 + (p.r.ins - 60) / 180 + (p.pos === 'C' ? 0.15 : p.pos === 'PF' ? 0.08 : 0),
                mid: 0.2 + (p.r.mid - 60) / 300,
                three: 0.37 + (p.r.thr - 60) / 140 - (p.pos === 'C' ? 0.22 : p.pos === 'PF' ? 0.1 : 0) };
    Object.keys(w).forEach(k => { w[k] = Math.max(0.03, w[k]); });
    return pickW(['rim', 'mid', 'three'], k => w[k]);
  }
  shotSpot(side, type) {
    const b = this.basket(side), dir = b.x > 47 ? -1 : 1;
    const dist = type === 'rim' ? 1.5 + R() * 4 : type === 'mid' ? 11 + R() * 9 : 23.9 + R() * 2.5;
    let a = (R() - 0.5) * Math.PI * 0.95;
    if (type === 'three' && R() < 0.3) a = (R() < 0.5 ? -1 : 1) * (Math.PI / 2 - 0.05);       // corner three (22 ft)
    const d = type === 'three' && Math.abs(a) > 1.4 ? 22.2 : dist;
    return { x: b.x + dir * Math.cos(a) * d, y: clamp(b.y + Math.sin(a) * d, 1, 49) };
  }
  rebound(off, ev, tl, t, clock0, ft) {
    const O = this.ts[off], D = this.ts[1 - off];
    const oReb = O.on.reduce((s, p) => s + this.eff(p, 'reb'), 0), dReb = D.on.reduce((s, p) => s + this.eff(p, 'reb'), 0);
    const pOff = clamp((ft ? 0.12 : 0.235) + (oReb - dReb) / 900, 0.05, 0.42);
    const side = R() < pOff ? off : 1 - off, team = this.ts[side];
    const p = pickW(team.on, q => Math.pow(this.eff(q, 'reb'), 2.3) * (q.hgt - 170));
    if (side === off) p.g.OREB++; else p.g.DREB++;
    tl.push({ t: t + 0.4, k: 'reb', p: p.id, off: side === off });
    ev.push({ k: 'reb', side, p, off: side === off, t, clock: clock0 - t });
    return side;
  }
  freeThrows(shooter, n, off, ev, tl, t, clock0) {
    let made = false;
    for (let i = 0; i < n; i++) {
      t += 1.6;
      made = R() < clamp(0.4 + this.eff(shooter, 'ft') * 0.0052, 0.4, 0.94);
      shooter.g.FTA++; if (made) { shooter.g.FTM++; this.points(off, shooter, 1); }
      tl.push({ t, k: 'ft', p: shooter.id, made, n: i + 1, of: n });
      ev.push({ k: 'ft', side: off, p: shooter, made, n: i + 1, of: n, t, clock: clock0 - t });
    }
    return { t: t + 0.5, lastMade: made };
  }
  foul(p, side, ev, t, clock0) {
    p.g.PF++; this.ts[side].fouls++;
    ev.push({ k: 'foul', side, p, count: p.g.PF, team: this.ts[side].fouls, t, clock: clock0 - t });
    if (p.g.PF >= RULES.FOUL_OUT) {
      p.fouledOut = true;
      ev.push({ k: 'foulout', side, p, t, clock: clock0 - t });
    }
  }
  addTO(p, thief) { p.g.TOV++; if (thief) thief.g.STL++; }
  points(side, p, n) { this.score[side] += n; p.g.PTS += n; }
  finish(ev) {
    this.over = true;
    const w = this.score[0] > this.score[1] ? 0 : 1;
    this.teams[w].W++; this.teams[1 - w].L++;
    this.ts.forEach(ts => ts.team.roster.forEach(p => { if (p.g.G || p.g.MIN > 0) { p.g.G = 1; Object.keys(p.s).forEach(k => { p.s[k] += Math.round((p.g[k] || 0) * 10) / 10; }); } }));
    ev.push({ k: 'final', score: this.score.slice(), winner: w });
  }
  // play to the end in one go (for "simulate to the end" and tests)
  simToEnd() { const out = []; let r; while (out.length < 5000 && (r = this.step())) { out.push(r); if (this.over) break; } return out; }
}

const api = { PLAYS, Game, makeTeam, makeMatch, addStars, STARS, TEAMS, CITIES, POS, POS_NAME, RATINGS, RULES, BASKET, newStats, ovr };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
root.HOOPS = api;
})(typeof window !== 'undefined' ? window : globalThis);
