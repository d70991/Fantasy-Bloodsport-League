// Pulls the private ESPN league and writes data/season-<year>.json for the site.
//
// Usage:
//   ESPN_S2=... ESPN_SWID={...} node scripts/fetch-espn.mjs
//   node scripts/fetch-espn.mjs --input saved-espn-response.json   (transform a saved response, no network)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LEAGUE_ID = "397265055";
const SEASON = Number(process.env.SEASON || 2026);

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "data", `season-${SEASON}.json`);


async function fetchLeague() {
  const ESPN_S2 = process.env.ESPN_S2?.trim();
  const ESPN_SWID = process.env.ESPN_SWID?.trim();
  if (!ESPN_S2 || !ESPN_SWID) {
    throw new Error("ESPN_S2 and ESPN_SWID must be set (private league cookies).");
  }

  const views = ["mTeam", "mSettings", "mStandings", "mMatchupScore"].map(view => `view=${view}`).join("&");
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?${views}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Cookie: `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID}`
    },
    redirect: "manual"
  });

  // ESPN answers bad or expired cookies with a 401 or a redirect to its login page
  if (response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400)) {
    throw new Error(`ESPN rejected the cookies (HTTP ${response.status}). Refresh ESPN_S2 and ESPN_SWID.`);
  }
  if (!response.ok) {
    throw new Error(`ESPN returned HTTP ${response.status}`);
  }

  return response.json();
}


function teamName(team) {
  return (team.name || `${team.location || ""} ${team.nickname || ""}`).trim();
}

function matchupWinner(game) {
  if (game.winner === "HOME") return game.home.teamId;
  if (game.winner === "AWAY") return game.away.teamId;
  if (game.winner === "TIE") return "tie";
  return null;
}

function side(sideData) {
  if (!sideData) return null;
  return {
    teamId: sideData.teamId,
    score: sideData.totalPointsLive ?? sideData.totalPoints ?? 0
  };
}

function transform(league) {
  const scheduleSettings = league.settings?.scheduleSettings || {};

  const teams = (league.teams || []).map(team => {
    const overall = team.record?.overall || {};
    return {
      id: team.id,
      name: teamName(team),
      abbrev: team.abbrev || "",
      divisionId: team.divisionId ?? null,
      wins: overall.wins ?? 0,
      losses: overall.losses ?? 0,
      ties: overall.ties ?? 0,
      pointsFor: overall.pointsFor ?? 0,
      pointsAgainst: overall.pointsAgainst ?? 0,
      streak: overall.streakLength ? `${overall.streakType === "WIN" ? "W" : "L"}${overall.streakLength}` : "",
      playoffSeed: team.playoffSeed ?? null
    };
  });

  const matchups = (league.schedule || [])
    // Byes have no away side
    .filter(game => game.home && game.away)
    .map(game => ({
      week: game.matchupPeriodId,
      home: side(game.home),
      away: side(game.away),
      winner: matchupWinner(game),
      playoff: Boolean(game.playoffTierType && game.playoffTierType !== "NONE")
    }));

  return {
    season: SEASON,
    leagueName: league.settings?.name || "",
    updatedAt: new Date().toISOString(),
    currentWeek: league.status?.currentMatchupPeriod ?? null,
    regularSeasonWeeks: scheduleSettings.matchupPeriodCount ?? null,
    playoffTeamCount: scheduleSettings.playoffTeamCount ?? null,
    divisions: (scheduleSettings.divisions || []).map(division => ({ id: division.id, name: division.name })),
    teams,
    matchups
  };
}


async function main() {
  const inputIndex = process.argv.indexOf("--input");
  const league = inputIndex > -1
    ? JSON.parse(fs.readFileSync(process.argv[inputIndex + 1], "utf8"))
    : await fetchLeague();

  if (!league.teams?.length) {
    throw new Error("ESPN response had no teams. The cookies may not have access to this league.");
  }

  const season = transform(league);

  // Skip the write when only the timestamp would change, so the workflow doesn't commit noise
  if (fs.existsSync(outputPath)) {
    const previous = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (JSON.stringify({ ...previous, updatedAt: null }) === JSON.stringify({ ...season, updatedAt: null })) {
      console.log("No changes from ESPN since the last sync.");
      return;
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(season, null, 2) + "\n");
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}: ${season.teams.length} teams, ${season.matchups.length} matchups, week ${season.currentWeek}`);
}

main().catch(error => {
  // Node's fetch hides network failures behind "fetch failed"; the real reason is in error.cause
  console.error(error.cause ? `${error.message}: ${error.cause.code || ""} ${error.cause.message}` : error.message);
  process.exit(1);
});
