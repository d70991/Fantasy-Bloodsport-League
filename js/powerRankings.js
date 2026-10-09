// ======================================
// POWER RANKINGS
// Built from the same data/season-2026.json as js/season.js (load this after it).
//
// Power score (0-100):
//   40% all-play win % (your score vs every other team's score each week)
//   25% actual win %
//   20% points per game, ranked against the league
//   15% average of the last 3 games, ranked against the league
// ======================================

const POWER_WEIGHTS = { allPlay: 0.4, winPct: 0.25, scoring: 0.2, recent: 0.15 };
const RECENT_GAMES = 3;


// Each team's final score per week, from finished regular-season games only
function weeklyScores(season, throughWeek) {
  const scores = new Map(season.teams.map(team => [team.id, []]));

  season.matchups
    .filter(game => game.winner && !game.playoff && game.week <= throughWeek)
    .forEach(game => {
      [[game.home, game.away], [game.away, game.home]].forEach(([side, opponent]) => {
        scores.get(side.teamId)?.push({
          week: game.week,
          points: side.score,
          won: game.winner === side.teamId,
          tied: game.winner === "tie",
          opponentId: opponent.teamId
        });
      });
    });

  scores.forEach(games => games.sort((gameA, gameB) => gameA.week - gameB.week));
  return scores;
}

// 1 for the best value in the league, 0 for the worst
function percentileRanks(valuesById) {
  const entries = [...valuesById.entries()].sort((entryA, entryB) => entryA[1] - entryB[1]);
  const ranks = new Map();
  entries.forEach(([id, value]) => {
    // Ties share the lowest position so equal teams get equal credit
    const firstIndex = entries.findIndex(entry => entry[1] === value);
    ranks.set(id, entries.length > 1 ? firstIndex / (entries.length - 1) : 1);
  });
  return ranks;
}

function average(numbers) {
  return numbers.length ? numbers.reduce((sum, number) => sum + number, 0) / numbers.length : 0;
}


function computePowerRankings(season, throughWeek) {
  const scores = weeklyScores(season, throughWeek);

  // All-play: compare each team's weekly score with every other team that played that week
  const scoresByWeek = new Map();
  scores.forEach((games, teamId) => games.forEach(game => {
    if (!scoresByWeek.has(game.week)) scoresByWeek.set(game.week, []);
    scoresByWeek.get(game.week).push({ teamId, points: game.points });
  }));

  const rows = season.teams
    .filter(team => scores.get(team.id).length > 0)
    .map(team => {
      const games = scores.get(team.id);
      let allPlayWins = 0;
      let allPlayLosses = 0;
      games.forEach(game => {
        scoresByWeek.get(game.week).forEach(other => {
          if (other.teamId === team.id) return;
          if (game.points > other.points) allPlayWins += 1;
          else if (game.points < other.points) allPlayLosses += 1;
          else { allPlayWins += 0.5; allPlayLosses += 0.5; }
        });
      });

      const wins = games.filter(game => game.won).length;
      const ties = games.filter(game => game.tied).length;
      const losses = games.length - wins - ties;

      return {
        team,
        games,
        wins,
        losses,
        ties,
        winPct: (wins + ties / 2) / games.length,
        allPlayWins,
        allPlayLosses,
        allPlayPct: allPlayWins / Math.max(allPlayWins + allPlayLosses, 1),
        ppg: average(games.map(game => game.points)),
        recentAvg: average(games.slice(-RECENT_GAMES).map(game => game.points))
      };
    });

  const scoringRanks = percentileRanks(new Map(rows.map(row => [row.team.id, row.ppg])));
  const recentRanks = percentileRanks(new Map(rows.map(row => [row.team.id, row.recentAvg])));

  rows.forEach(row => {
    row.scoringRank = scoringRanks.get(row.team.id);
    row.recentRank = recentRanks.get(row.team.id);
    row.powerScore = 100 * (
      POWER_WEIGHTS.allPlay * row.allPlayPct +
      POWER_WEIGHTS.winPct * row.winPct +
      POWER_WEIGHTS.scoring * row.scoringRank +
      POWER_WEIGHTS.recent * row.recentRank
    );
  });

  rows.sort((rowA, rowB) => rowB.powerScore - rowA.powerScore || rowB.ppg - rowA.ppg);
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}


function powerVerdict(row, totalTeams) {
  const luck = row.winPct - row.allPlayPct;
  const lastGames = row.games.slice(-2);

  if (row.rank === 1) return "The team to beat. Everybody else is playing for second.";
  if (row.losses === 0 && row.ties === 0) return "Still perfect. Somebody check the lineup for cheat codes.";
  if (row.wins === 0) return "Still hunting for a W. Last place punishment is getting closer.";
  if (luck >= 0.25) return "Record says contender. The scores say they've been lucky.";
  if (luck <= -0.25) return "Scoring like a contender with a record that says otherwise. Snakebit.";
  if (row.recentRank >= 0.8) return "Heating up. Nobody wants this matchup right now.";
  if (row.recentRank <= 0.2) return "Ice cold lately. The bench might be outscoring the starters.";
  if (row.rank === totalTeams) return "Rock bottom of the rankings. Start shopping for the punishment.";
  if (lastGames.length === 2 && lastGames.every(game => game.won)) return "Back-to-back wins. Building something.";
  if (lastGames.length === 2 && lastGames.every(game => !game.won && !game.tied)) return "Two straight losses. The group chat has noticed.";
  return "Stuck in the middle. Not scary, not safe.";
}


function renderPowerRankings(container, season, { compact = false } = {}) {
  const finishedWeeks = [...new Set(season.matchups.filter(game => game.winner && !game.playoff).map(game => game.week))];
  if (finishedWeeks.length === 0) {
    container.innerHTML = "<p>Rankings start after the first week is final.</p>";
    return;
  }

  const lastWeek = Math.max(...finishedWeeks);
  const rows = computePowerRankings(season, lastWeek);
  const previousRanks = lastWeek > 1
    ? new Map(computePowerRankings(season, lastWeek - 1).map(row => [row.team.id, row.rank]))
    : new Map();

  const movement = row => {
    const previous = previousRanks.get(row.team.id);
    if (!previous || previous === row.rank) return '<span class="move move-none">–</span>';
    const change = previous - row.rank;
    return change > 0
      ? `<span class="move move-up">▲${change}</span>`
      : `<span class="move move-down">▼${-change}</span>`;
  };

  const visibleRows = compact ? rows.slice(0, 5) : rows;

  container.innerHTML = `
    <p class="power-week">Through Week ${lastWeek}</p>
    ${visibleRows.map(row => `
      <div class="power-row">
        <div class="power-rank">${row.rank}</div>
        <div class="power-main">
          <div class="power-team">${escapeHtml(row.team.name)} ${movement(row)}</div>
          <div class="power-stats">
            ${formatRecord(row)} · All-play ${Math.round(row.allPlayWins)}-${Math.round(row.allPlayLosses)} · ${row.ppg.toFixed(1)} PPG · Last ${Math.min(RECENT_GAMES, row.games.length)}: ${row.recentAvg.toFixed(1)}
          </div>
          ${compact ? "" : `<div class="power-verdict">${powerVerdict(row, rows.length)}</div>`}
        </div>
        <div class="power-score" title="Power score out of 100">${row.powerScore.toFixed(1)}</div>
      </div>
    `).join("")}
  `;
}
