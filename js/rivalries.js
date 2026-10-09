// ======================================
// RIVALRY TRACKER
// All-time head-to-head from data/history.json (past seasons) + data/season-2026.json (this season).
// Counts regular season and winners-bracket playoff games; consolation games are left out.
// Uses escapeHtml / formatPoints / loadSeasonData from js/season.js.
// ======================================

const HISTORY_DATA_URL = "data/history.json";
const COUNTED_TIERS = new Set(["NONE", "WINNERS_BRACKET"]);


async function loadHistoryData() {
  try {
    const response = await fetch(HISTORY_DATA_URL, { cache: "no-cache" });
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Could not load league history:", error);
    return null;
  }
}


// Turns every finished game into { season, week, playoff, a, b, aScore, bScore, winner } keyed by franchise
function buildRivalryIndex(history, currentSeason) {
  const seasons = Object.values(history?.seasons || {});
  if (currentSeason) {
    seasons.push(currentSeason);
  }
  seasons.sort((seasonA, seasonB) => seasonA.season - seasonB.season);

  const franchises = new Map();
  const games = [];

  seasons.forEach(season => {
    const franchiseOf = new Map(season.teams.map(team => [team.id, team.franchiseId || String(team.id)]));

    season.teams.forEach(team => {
      const id = franchiseOf.get(team.id);
      // ESPN names sometimes carry doubled or trailing spaces
      const name = team.name.replace(/\s+/g, " ").trim();
      const franchise = franchises.get(id) || { id, name, names: [] };
      // Seasons are sorted oldest first, so the last name seen is the current one
      franchise.name = name;
      if (!franchise.names.some(known => known.toLowerCase() === name.toLowerCase())) franchise.names.push(name);
      franchise.lastSeason = season.season;
      franchises.set(id, franchise);
    });

    season.matchups
      .filter(game => game.winner && COUNTED_TIERS.has(game.tier || (game.playoff ? "WINNERS_BRACKET" : "NONE")))
      .forEach(game => {
        games.push({
          season: season.season,
          week: game.week,
          playoff: game.playoff,
          a: franchiseOf.get(game.away.teamId),
          b: franchiseOf.get(game.home.teamId),
          aScore: game.away.score,
          bScore: game.home.score,
          winner: game.winner === "tie" ? "tie" : franchiseOf.get(game.winner)
        });
      });
  });

  return { franchises, games, currentSeason };
}


function seriesBetween(index, teamA, teamB) {
  const meetings = index.games
    .filter(game => (game.a === teamA && game.b === teamB) || (game.a === teamB && game.b === teamA))
    .map(game => {
      const aIsTeamA = game.a === teamA;
      return {
        season: game.season,
        week: game.week,
        playoff: game.playoff,
        scoreA: aIsTeamA ? game.aScore : game.bScore,
        scoreB: aIsTeamA ? game.bScore : game.aScore,
        winner: game.winner
      };
    });

  const series = {
    teamA, teamB, meetings,
    winsA: 0, winsB: 0, ties: 0,
    playoffWinsA: 0, playoffWinsB: 0,
    pointsA: 0, pointsB: 0,
    biggestWinA: null, biggestWinB: null,
    streak: null
  };

  meetings.forEach(game => {
    series.pointsA += game.scoreA;
    series.pointsB += game.scoreB;
    const margin = Math.abs(game.scoreA - game.scoreB);
    // Rank beatdowns by percentage, not raw points: 2021 used a scoring system with ~3x higher totals
    const blowout = margin / Math.max(Math.min(game.scoreA, game.scoreB), 1);

    if (game.winner === teamA) {
      series.winsA += 1;
      if (game.playoff) series.playoffWinsA += 1;
      if (!series.biggestWinA || blowout > series.biggestWinA.blowout) series.biggestWinA = { ...game, margin, blowout };
    } else if (game.winner === teamB) {
      series.winsB += 1;
      if (game.playoff) series.playoffWinsB += 1;
      if (!series.biggestWinB || blowout > series.biggestWinB.blowout) series.biggestWinB = { ...game, margin, blowout };
    } else {
      series.ties += 1;
    }
  });

  // Current streak, counted back from the latest meeting
  for (let i = meetings.length - 1; i >= 0; i -= 1) {
    const winner = meetings[i].winner;
    if (winner === "tie") break;
    if (!series.streak) series.streak = { team: winner, length: 1 };
    else if (series.streak.team === winner) series.streak.length += 1;
    else break;
  }

  return series;
}

function allSeries(index) {
  const ids = [...index.franchises.keys()];
  const list = [];
  ids.forEach((teamA, i) => ids.slice(i + 1).forEach(teamB => {
    const series = seriesBetween(index, teamA, teamB);
    if (series.meetings.length > 0) list.push(series);
  }));
  return list;
}

function nextMeeting(index, teamA, teamB) {
  const season = index.currentSeason;
  if (!season) return null;
  const franchiseOf = new Map(season.teams.map(team => [team.id, team.franchiseId || String(team.id)]));
  return season.matchups.find(game => !game.winner && (
    (franchiseOf.get(game.away.teamId) === teamA && franchiseOf.get(game.home.teamId) === teamB) ||
    (franchiseOf.get(game.away.teamId) === teamB && franchiseOf.get(game.home.teamId) === teamA)
  )) || null;
}


// "Team Nelson leads 6-3" / "Series tied 2-2" / "First meeting"
function seriesSummary(index, series) {
  const nameA = index.franchises.get(series.teamA).name;
  const nameB = index.franchises.get(series.teamB).name;
  const tiesText = series.ties ? `-${series.ties}` : "";
  if (series.meetings.length === 0) return "First meeting";
  if (series.winsA === series.winsB) return `Series tied ${series.winsA}-${series.winsB}${tiesText}`;
  return series.winsA > series.winsB
    ? `${nameA} leads ${series.winsA}-${series.winsB}${tiesText}`
    : `${nameB} leads ${series.winsB}-${series.winsA}${tiesText}`;
}

// For the scoreboard: series line for a current-season matchup, by ESPN team id
async function loadSeriesLookup(currentSeason) {
  const leagueHistory = await loadHistoryData();
  if (!leagueHistory) return null;
  const index = buildRivalryIndex(leagueHistory, currentSeason);
  return (teamIdA, teamIdB) => seriesSummary(index, seriesBetween(index, String(teamIdA), String(teamIdB)));
}


// ======================================
// RIVALRIES PAGE
// ======================================

function gameLabel(game) {
  return game.playoff ? `${game.season} Playoffs` : `${game.season} Wk ${game.week}`;
}

function renderSeriesCard(container, index, teamA, teamB) {
  const series = seriesBetween(index, teamA, teamB);
  const nameA = escapeHtml(index.franchises.get(teamA).name);
  const nameB = escapeHtml(index.franchises.get(teamB).name);
  const games = series.meetings.length;
  const upcoming = nextMeeting(index, teamA, teamB);

  if (games === 0) {
    container.innerHTML = `
      <div class="series-card">
        <div class="series-headline">${nameA} vs ${nameB}</div>
        <p>These two have never met. ${upcoming ? `First meeting: Week ${upcoming.week}.` : ""}</p>
      </div>`;
    return;
  }

  const leader = series.winsA === series.winsB ? null : (series.winsA > series.winsB ? teamA : teamB);
  const streakName = series.streak ? escapeHtml(index.franchises.get(series.streak.team).name) : "";
  const biggest = (win, name) => win
    ? `${name} by ${formatPoints(win.margin)} (${formatPoints(Math.max(win.scoreA, win.scoreB))}-${formatPoints(Math.min(win.scoreA, win.scoreB))}, ${gameLabel(win)})`
    : `${name}: never`;

  container.innerHTML = `
    <div class="series-card">
      <div class="series-score">
        <div class="series-side ${leader === teamA ? "series-leader" : ""}">
          <div class="series-team">${nameA}</div>
          <div class="series-wins">${series.winsA}</div>
        </div>
        <div class="series-vs">vs</div>
        <div class="series-side ${leader === teamB ? "series-leader" : ""}">
          <div class="series-team">${nameB}</div>
          <div class="series-wins">${series.winsB}</div>
        </div>
      </div>
      <div class="series-headline">${escapeHtml(seriesSummary(index, series))}${series.ties ? ` (${series.ties} tie${series.ties > 1 ? "s" : ""})` : ""}</div>

      <div class="series-stats">
        <div><span>Meetings</span>${games}</div>
        <div><span>Avg score</span>${formatPoints(series.pointsA / games)} – ${formatPoints(series.pointsB / games)}</div>
        <div><span>Playoffs</span>${series.playoffWinsA}-${series.playoffWinsB}</div>
        <div><span>Current streak</span>${series.streak ? `${streakName} W${series.streak.length}` : "—"}</div>
        <div class="series-wide"><span>Biggest beatdowns</span>${biggest(series.biggestWinA, nameA)}<br>${biggest(series.biggestWinB, nameB)}</div>
        ${upcoming ? `<div class="series-wide series-next"><span>Next meeting</span>Week ${upcoming.week}, ${index.currentSeason.season}</div>` : ""}
      </div>

      <h3>Every meeting</h3>
      <div class="table-scroll">
        <table class="live-table rival-table series-log">
          <thead><tr><th>When</th><th>${nameA}</th><th>${nameB}</th><th>Winner</th></tr></thead>
          <tbody>
            ${[...series.meetings].reverse().map(game => `
              <tr>
                <td>${gameLabel(game)}</td>
                <td class="${game.winner === teamA ? "log-win" : ""}">${formatPoints(game.scoreA)}</td>
                <td class="${game.winner === teamB ? "log-win" : ""}">${formatPoints(game.scoreB)}</td>
                <td>${game.winner === "tie" ? "Tie" : (game.winner === teamA ? nameA : nameB)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderTeamVsAll(container, index, teamId) {
  const name = escapeHtml(index.franchises.get(teamId).name);
  const rows = [...index.franchises.keys()]
    .filter(other => other !== teamId)
    .map(other => seriesBetween(index, teamId, other))
    .filter(series => series.meetings.length > 0)
    .sort((seriesA, seriesB) => (seriesB.winsA - seriesB.winsB) - (seriesA.winsA - seriesA.winsB) || seriesB.meetings.length - seriesA.meetings.length);

  const totals = rows.reduce((sum, series) => ({ wins: sum.wins + series.winsA, losses: sum.losses + series.winsB }), { wins: 0, losses: 0 });

  container.innerHTML = `
    <div class="series-card">
      <div class="series-headline">${name} vs the league: ${totals.wins}-${totals.losses}</div>
      <div class="table-scroll">
        <table class="live-table rival-table">
          <thead><tr><th>Opponent</th><th>Record</th><th>Avg score</th><th>Streak</th></tr></thead>
          <tbody>
            ${rows.map(series => {
              const opponent = index.franchises.get(series.teamB);
              const games = series.meetings.length;
              const streak = series.streak ? (series.streak.team === teamId ? `W${series.streak.length}` : `L${series.streak.length}`) : "—";
              return `
                <tr>
                  <td class="team-cell"><a href="#" data-pick="${escapeHtml(series.teamB)}">${escapeHtml(opponent.name)}</a></td>
                  <td>${series.winsA}-${series.winsB}${series.ties ? `-${series.ties}` : ""}</td>
                  <td>${formatPoints(series.pointsA / games)} – ${formatPoints(series.pointsB / games)}</td>
                  <td>${streak}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderRivalryBoards(fiercestEl, ownershipEl, index) {
  const series = allSeries(index);
  const pairLink = (item, text) =>
    `<a href="#" class="rivalry-item" data-a="${escapeHtml(item.teamA)}" data-b="${escapeHtml(item.teamB)}">${text}</a>`;
  const names = item => [index.franchises.get(item.teamA).name, index.franchises.get(item.teamB).name].map(escapeHtml);

  // Fiercest: lots of games, nearly even, and both sides have won
  const fiercest = series
    .filter(item => item.meetings.length >= 4 && item.winsA > 0 && item.winsB > 0)
    .sort((itemA, itemB) =>
      Math.abs(itemA.winsA - itemA.winsB) - Math.abs(itemB.winsA - itemB.winsB) ||
      itemB.meetings.length - itemA.meetings.length)
    .slice(0, 5);

  // Ownership: one side dominates
  const ownership = series
    .filter(item => item.meetings.length >= 3 && item.winsA !== item.winsB)
    .map(item => item.winsA > item.winsB ? item : { ...item, teamA: item.teamB, teamB: item.teamA, winsA: item.winsB, winsB: item.winsA })
    .sort((itemA, itemB) =>
      itemB.winsA / itemB.meetings.length - itemA.winsA / itemA.meetings.length ||
      itemB.winsA - itemA.winsA)
    .slice(0, 5);

  fiercestEl.innerHTML = fiercest.length
    ? fiercest.map(item => {
        const [nameA, nameB] = names(item);
        return pairLink(item, `<strong>${nameA}</strong> vs <strong>${nameB}</strong><span>${item.winsA}-${item.winsB} in ${item.meetings.length} meetings</span>`);
      }).join("")
    : "<p>Not enough games yet.</p>";

  ownershipEl.innerHTML = ownership.length
    ? ownership.map(item => {
        const [owner, owned] = names(item);
        return pairLink(item, `<strong>${owner}</strong> owns <strong>${owned}</strong><span>${item.winsA}-${item.winsB}</span>`);
      }).join("")
    : "<p>Nobody owns anybody. Yet.</p>";
}


async function setupRivalriesPage() {
  const pickA = document.getElementById("rivalA");
  const pickB = document.getElementById("rivalB");
  const output = document.getElementById("rivalryOutput");
  if (!pickA || !pickB || !output) return;

  const [leagueHistory, currentSeason] = await Promise.all([loadHistoryData(), loadSeasonData()]);
  if (!leagueHistory && !currentSeason) {
    output.innerHTML = "<p>Rivalry data shows up here after the first ESPN history sync.</p>";
    return;
  }

  const index = buildRivalryIndex(leagueHistory, currentSeason);
  const options = [...index.franchises.values()]
    .sort((teamA, teamB) => (teamB.lastSeason - teamA.lastSeason) || teamA.name.localeCompare(teamB.name))
    .map(team => {
      const formerNames = team.names.filter(name => name.toLowerCase() !== team.name.toLowerCase());
      const label = formerNames.length ? `${team.name} (a.k.a. ${formerNames.join(", ")})` : team.name;
      return `<option value="${escapeHtml(team.id)}">${escapeHtml(label)}${team.lastSeason < (currentSeason?.season || 0) ? " – former" : ""}</option>`;
    }).join("");

  pickA.innerHTML = options;
  pickB.innerHTML = `<option value="all">Everybody</option>${options}`;

  const render = () => {
    if (pickB.value === "all" || pickB.value === pickA.value) {
      renderTeamVsAll(output, index, pickA.value);
    } else {
      renderSeriesCard(output, index, pickA.value, pickB.value);
    }
    window.history.replaceState(null, "", `?a=${encodeURIComponent(pickA.value)}&b=${encodeURIComponent(pickB.value)}`);
  };

  const select = (teamA, teamB) => {
    pickA.value = teamA;
    pickB.value = teamB;
    render();
    output.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  renderRivalryBoards(document.getElementById("fiercestRivalries"), document.getElementById("ownershipList"), index);

  document.addEventListener("click", event => {
    const pair = event.target.closest(".rivalry-item");
    const pick = event.target.closest("[data-pick]");
    if (pair) {
      event.preventDefault();
      select(pair.dataset.a, pair.dataset.b);
    } else if (pick) {
      event.preventDefault();
      select(pickA.value, pick.dataset.pick);
    }
  });

  pickA.addEventListener("change", render);
  pickB.addEventListener("change", render);

  // Start from the URL if it names a matchup, otherwise the fiercest rivalry
  const params = new URLSearchParams(window.location.search);
  const first = document.querySelector("#fiercestRivalries .rivalry-item");
  if (params.get("a") && index.franchises.has(params.get("a"))) {
    pickA.value = params.get("a");
    pickB.value = params.get("b") && (params.get("b") === "all" || index.franchises.has(params.get("b"))) ? params.get("b") : "all";
  } else if (first) {
    pickA.value = first.dataset.a;
    pickB.value = first.dataset.b;
  }
  render();
}

document.addEventListener("DOMContentLoaded", setupRivalriesPage);
