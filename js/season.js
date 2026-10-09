// ======================================
// LIVE SEASON (data/season-2026.json, synced from ESPN by .github/workflows/espn-sync.yml)
// ======================================

const SEASON_DATA_URL = "data/season-2026.json";


async function loadSeasonData() {
  try {
    const response = await fetch(SEASON_DATA_URL, { cache: "no-cache" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Could not load season data:", error);
    return null;
  }
}


function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatPoints(points) {
  return Number(points || 0).toFixed(1);
}

function formatRecord(team) {
  return team.ties ? `${team.wins}-${team.losses}-${team.ties}` : `${team.wins}-${team.losses}`;
}

function winPct(team) {
  const games = team.wins + team.losses + team.ties;
  return games ? (team.wins + team.ties / 2) / games : 0;
}

function sortByRecord(teams) {
  return [...teams].sort((teamA, teamB) => winPct(teamB) - winPct(teamA) || teamB.pointsFor - teamA.pointsFor);
}

function formatUpdated(isoTime) {
  return new Date(isoTime).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}


function standingsTable(teams, compact) {
  const rows = sortByRecord(teams).map((team, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="team-cell">${escapeHtml(team.name)}</td>
      <td>${formatRecord(team)}</td>
      <td>${formatPoints(team.pointsFor)}</td>
      ${compact ? "" : `<td class="col-extra">${formatPoints(team.pointsAgainst)}</td><td class="col-extra">${team.streak || "-"}</td>`}
    </tr>
  `).join("");

  return `
    <div class="table-scroll">
      <table class="live-table">
        <thead>
          <tr>
            <th>#</th><th>Team</th><th>Record</th><th>PF</th>
            ${compact ? "" : '<th class="col-extra">PA</th><th class="col-extra">Streak</th>'}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderStandings(container, season, { compact = false } = {}) {
  if (season.divisions.length > 1) {
    container.innerHTML = season.divisions.map(division => `
      <div class="division-card">
        <h3>${escapeHtml(division.name)}</h3>
        ${standingsTable(season.teams.filter(team => team.divisionId === division.id), compact)}
      </div>
    `).join("");
  } else {
    container.innerHTML = standingsTable(season.teams, compact);
  }
}


function renderPlayoffPicture(container, season) {
  const spots = season.playoffTeamCount || 6;
  const hasEspnSeeds = season.teams.some(team => team.playoffSeed);
  const ordered = hasEspnSeeds
    ? [...season.teams].sort((teamA, teamB) => (teamA.playoffSeed || 99) - (teamB.playoffSeed || 99))
    : sortByRecord(season.teams);

  const line = (team, seedLabel, className) => `
    <div class="seed-row ${className}">
      <span class="seed">${seedLabel}</span>
      <span class="seed-team">${escapeHtml(team.name)}</span>
      <span class="seed-record">${formatRecord(team)} · ${formatPoints(team.pointsFor)} PF</span>
    </div>
  `;

  const inTeams = ordered.slice(0, spots).map((team, index) => line(team, index + 1, "seed-in")).join("");
  const bubbleTeams = ordered.slice(spots, spots + 2).map(team => line(team, "—", "seed-bubble")).join("");

  container.innerHTML = `
    ${inTeams}
    ${bubbleTeams ? `<p class="bubble-label">On the bubble</p>${bubbleTeams}` : ""}
  `;
}


function renderScoreboard(container, season, week) {
  const teamsById = new Map(season.teams.map(team => [team.id, team]));
  const games = season.matchups.filter(game => game.week === week);

  if (games.length === 0) {
    container.innerHTML = "<p>No matchups for this week.</p>";
    return;
  }

  const sideHtml = (sideData, game) => {
    const team = teamsById.get(sideData.teamId);
    const isWinner = game.winner === sideData.teamId;
    return `
      <div class="score-side ${isWinner ? "score-winner" : ""}">
        <span class="score-team">${escapeHtml(team ? team.name : "TBD")}${team ? ` <small>(${formatRecord(team)})</small>` : ""}</span>
        <span class="score-points">${formatPoints(sideData.score)}</span>
      </div>
    `;
  };

  container.innerHTML = games.map(game => `
    <div class="score-card">
      ${game.playoff ? '<div class="score-tag">Playoffs</div>' : ""}
      ${sideHtml(game.away, game)}
      ${sideHtml(game.home, game)}
      <div class="score-status">${game.winner ? "Final" : (game.away.score || game.home.score ? "In progress" : "Upcoming")}</div>
    </div>
  `).join("");
}

function setupWeekPicker(select, scoreboard, season) {
  const weeks = [...new Set(season.matchups.map(game => game.week))].sort((weekA, weekB) => weekA - weekB);
  const startWeek = weeks.includes(season.currentWeek) ? season.currentWeek : weeks[weeks.length - 1];

  select.innerHTML = weeks.map(week => {
    const label = season.regularSeasonWeeks && week > season.regularSeasonWeeks ? `Playoffs – Round ${week - season.regularSeasonWeeks}` : `Week ${week}`;
    return `<option value="${week}" ${week === startWeek ? "selected" : ""}>${label}</option>`;
  }).join("");

  select.closest(".week-picker")?.removeAttribute("hidden");
  select.addEventListener("change", () => renderScoreboard(scoreboard, season, Number(select.value)));
  renderScoreboard(scoreboard, season, startWeek);
}


document.addEventListener("DOMContentLoaded", async () => {
  const standingsEl = document.getElementById("liveStandings");
  const scoreboardEl = document.getElementById("liveScoreboard");
  if (!standingsEl && !scoreboardEl) {
    return;
  }

  const season = await loadSeasonData();
  if (!season) {
    // Leave each section's placeholder content in place until the first ESPN sync lands
    return;
  }

  const compact = document.body.dataset.compactStandings === "true";

  if (standingsEl) {
    renderStandings(standingsEl, season, { compact });
  }

  const playoffEl = document.getElementById("playoffPicture");
  if (playoffEl) {
    renderPlayoffPicture(playoffEl, season);
  }

  const weekSelect = document.getElementById("weekSelect");
  if (scoreboardEl && weekSelect) {
    setupWeekPicker(weekSelect, scoreboardEl, season);
  } else if (scoreboardEl) {
    renderScoreboard(scoreboardEl, season, season.currentWeek);
  }

  document.querySelectorAll(".season-updated").forEach(element => {
    element.textContent = `Week ${season.currentWeek} · Updated from ESPN ${formatUpdated(season.updatedAt)}`;
  });
});
