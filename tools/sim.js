// Simulate many games and print league averages (compare with the NBA), minutes, fouls and the four stars.
//   node tools/sim.js [games]
'use strict';
const H = require('../engine.js');
const n = Number(process.argv[2] || 300);
const T = { pts: 0, fga: 0, fgm: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0, oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, poss: 0 };
let ot = 0, maxPts = 0, minPts = 999, bad = 0, homeWins = 0, close = 0;
const starTot = {}, minutes = { starter: [], bench: [] }, fouledOut = { n: 0 };
for (let g = 0; g < n; g++) {
  const teams = H.makeMatch(), game = new H.Game(teams[0], teams[1]);
  const res = game.simToEnd();
  if (!game.over) { bad++; console.log('game did not finish'); continue; }
  T.poss += res.length / 2;
  if (game.period > 4) ot++;
  if (game.score[1] > game.score[0]) homeWins++;
  if (Math.abs(game.score[0] - game.score[1]) <= 5) close++;
  game.score.forEach(s => { maxPts = Math.max(maxPts, s); minPts = Math.min(minPts, s); });
  // the box score must add up to the score
  [0, 1].forEach(side => {
    const sum = teams[side].roster.reduce((s, p) => s + p.g.PTS, 0);
    if (sum !== game.score[side]) { bad++; console.log('points do not add up', sum, game.score[side]); }
    const mins = teams[side].roster.reduce((s, p) => s + p.g.MIN, 0);
    const want = (48 + 5 * Math.max(0, game.period - 4)) * 5;
    if (Math.abs(mins - want) > 0.5) { bad++; console.log('minutes do not add up', mins.toFixed(1), want); }
  });
  teams.forEach(t => t.roster.forEach(p => {
    const s = p.g;
    T.pts += s.PTS; T.fga += s.FGA; T.fgm += s.FGM; T.tpa += s.TPA; T.tpm += s.TPM; T.fta += s.FTA; T.ftm += s.FTM;
    T.oreb += s.OREB; T.dreb += s.DREB; T.ast += s.AST; T.stl += s.STL; T.blk += s.BLK; T.tov += s.TOV; T.pf += s.PF;
    if (s.PF >= 6) fouledOut.n++;
    (p.starter ? minutes.starter : minutes.bench).push(s.MIN);
    if (p.star) { const x = starTot[p.name.en] = starTot[p.name.en] || { g: 0, pts: 0, reb: 0, ast: 0, min: 0, fgm: 0, fga: 0 }; x.g++; x.pts += s.PTS; x.reb += s.OREB + s.DREB; x.ast += s.AST; x.min += s.MIN; x.fgm += s.FGM; x.fga += s.FGA; }
  }));
}
const per = v => (v / (2 * n)).toFixed(1), pct = (a, b) => (100 * a / b).toFixed(1) + '%';
const avg = a => (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1);
console.log(`per team per game  (NBA ~2024 in brackets)`);
console.log(`PTS ${per(T.pts)} [114]  poss ${(T.poss / n).toFixed(1)} [99]  FG ${pct(T.fgm, T.fga)} [47%]  3P ${pct(T.tpm, T.tpa)} [36%] 3PA ${per(T.tpa)} [35]  FT ${pct(T.ftm, T.fta)} [78%] FTA ${per(T.fta)} [22]`);
console.log(`REB ${per(T.oreb + T.dreb)} [44] OREB ${per(T.oreb)} [11]  AST ${per(T.ast)} [27]  STL ${per(T.stl)} [7.5]  BLK ${per(T.blk)} [5]  TOV ${per(T.tov)} [13.5]  PF ${per(T.pf)} [19]`);
console.log(`overtime ${pct(ot, n)} [6%]  close (≤5) ${pct(close, n)}  home wins ${pct(homeWins, n)}  scores ${minPts}–${maxPts}  foul-outs/game ${(fouledOut.n / n).toFixed(2)}`);
console.log(`minutes: starters ${avg(minutes.starter)} [~32]  bench ${avg(minutes.bench)}`);
Object.keys(starTot).forEach(k => { const x = starTot[k]; console.log(`  ★ ${k}: ${(x.pts / x.g).toFixed(1)} pts ${(x.reb / x.g).toFixed(1)} reb ${(x.ast / x.g).toFixed(1)} ast ${(x.min / x.g).toFixed(1)} min  FG ${pct(x.fgm, x.fga)}`); });
console.log(bad ? bad + ' PROBLEMS' : 'all games consistent');
process.exit(bad ? 1 : 0);
