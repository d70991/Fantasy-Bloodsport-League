// Shared ESPN fantasy API access for the sync scripts.

import path from "path";
import { fileURLToPath } from "url";

export const LEAGUE_ID = "397265055";
export const CURRENT_SEASON = Number(process.env.SEASON || 2026);

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");


// Sends the private-league cookies when they're set (ESPN_S2 / ESPN_SWID)
export async function fetchLeague(season, views, params = {}) {
  const query = new URLSearchParams(params);
  views.forEach(view => query.append("view", view));
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${query}`;

  const headers = { Accept: "application/json" };
  const espnS2 = process.env.ESPN_S2?.trim();
  const swid = process.env.ESPN_SWID?.trim();
  if (espnS2 && swid) {
    headers.Cookie = `espn_s2=${espnS2}; SWID=${swid}`;
  }

  const response = await fetch(url, { headers, redirect: "manual" });

  // ESPN answers missing, bad or expired cookies with a 401 or a redirect to its login page
  if (response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400)) {
    throw new Error(`ESPN rejected the ${season} request (HTTP ${response.status}). Refresh ESPN_S2 and ESPN_SWID.`);
  }
  if (!response.ok) {
    throw new Error(`ESPN returned HTTP ${response.status} for ${season}`);
  }

  const league = await response.json();
  if (!league.teams?.length) {
    throw new Error(`ESPN's ${season} response had no teams. The cookies may not have access to this league.`);
  }
  return league;
}


function teamName(team) {
  return (team.name || `${team.location || ""} ${team.nickname || ""}`).replace(/\s+/g, " ").trim();
}

function matchupWinner(game) {
  if (game.winner === "HOME") return game.home.teamId;
  if (game.winner === "AWAY") return game.away.teamId;
  if (game.winner === "TIE") return "tie";
  return null;
}

function side(sideData) {
  return {
    teamId: sideData.teamId,
    score: sideData.totalPointsLive ?? sideData.totalPoints ?? 0
  };
}

// The trimmed shape the site reads (data/season-<year>.json and each season in data/history.json)
export function transformSeason(league, season) {
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
      playoff: Boolean(game.playoffTierType && game.playoffTierType !== "NONE"),
      // NONE, WINNERS_BRACKET, or a consolation ladder
      tier: game.playoffTierType || "NONE"
    }));

  return {
    season,
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


export function logErrorAndExit(error) {
  // Node's fetch hides network failures behind "fetch failed"; the real reason is in error.cause
  console.error(error.cause ? `${error.message}: ${error.cause.code || ""} ${error.cause.message}` : error.message);
  process.exit(1);
}
