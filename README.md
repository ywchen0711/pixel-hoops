# 像素籃球 Pixel Hoops

**Play:** https://ywchen0711.github.io/pixel-hoops/

An automatic 2D pixel basketball simulation with NBA rules. Every player has their own ratings, and the game is
simulated possession by possession and animated on a pixel court — like the [pixel baseball sim](https://ywchen0711.github.io/game/).

- **NBA rules**: 5 players on the court, 13 on the roster; four 12-minute quarters; 24-second shot clock (14 after an
  offensive rebound); 2s, 3s (22 ft in the corners, 23.75 ft elsewhere), shooting fouls, and-ones, free throws;
  6 fouls and you are out; team bonus from the 5th foul of a quarter; 5-minute overtimes; teams switch baskets at halftime
- **Ratings**: inside, mid-range, three-point, free throw, passing, ball handling, speed, defense, blocks, rebounding,
  stamina, height. Players tire on the court (and play worse), recover on the bench; coaches substitute for fatigue
  and foul trouble and keep their best players in during close finishes
- **The four super players** — Josh Chen, Jasper Chen, Jeff Chen, Erin Lai — are in every game, each placed on a random
  team and a random starting position, with ratings around 92–99 (marked ★)
- **A playbook**: every possession runs a real set chosen to fit the shot it ends in — pick & roll, pick & pop,
  isolation, post-up, drive & kick, give & go, backdoor cut, Floppy, Elevator Doors, hand-off, Horns, Spain pick & roll,
  motion offense, alley-oop, fast breaks and second chances. Players run the routes on the court (defenders get hung up
  on screens), the set's name shows on the court, and a coach's diagram beside it draws the cuts, passes and screens
- **HD-2D arena**: a lit 3D diorama with a cheering crowd, benches, glass backboards and a hanging scoreboard
- Scoreboard with game and shot clocks, line score, team fouls and bonus; play-by-play; full box score
  (MIN PTS REB AST STL BLK FG 3P FT TO PF +/-); ratings for both rosters; speed 1x–30x or sim to the end
- Records and season stats carry over between games (saved in your browser); Chinese and English

## Balance

`node tools/sim.js 300` plays 300 games and compares the league averages with the NBA
(about 109 points, 97 possessions, 47% FG, 38% 3P on 33 attempts, 77% FT, 47 rebounds, 25 assists, 13 turnovers
per team), and checks that every box score adds up to the score and to 240 minutes.

## Files

```
engine.js      the simulation (rules, ratings, possessions, substitutions, stats) — runs in Node too
game.js        the court animation, scoreboard, play-by-play, box score, rosters
tools/sim.js   league-average check
```
