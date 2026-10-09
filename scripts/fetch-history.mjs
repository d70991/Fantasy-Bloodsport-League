// Pulls every finished ESPN season of the league into data/history.json for the rivalry tracker.
// Finished seasons never change, so seasons already in the file are skipped.
//
// Usage:
//   ESPN_S2=... ESPN_SWID={...} node scripts/fetch-history.mjs

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { CURRENT_SEASON, fetchLeague, logErrorAndExit, repoRoot, transformSeason } from "./espn.mjs";

const outputPath = path.join(repoRoot, "data", "history.json");


// Owner ids are ESPN account ids; only a short one-way hash ever reaches the public data file
function ownerKey(ownerId) {
  return crypto.createHash("sha256").update(String(ownerId)).digest("hex").slice(0, 10);
}


async function main() {
  const history = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : { seasons: {} };

  const current = await fetchLeague(CURRENT_SEASON, ["mTeam", "mSettings"]);
  const pastSeasons = (current.status?.previousSeasons || []).filter(season => season < CURRENT_SEASON);
  const missing = pastSeasons.filter(season => !history.seasons[season]);

  if (missing.length === 0) {
    console.log(`History is up to date (${pastSeasons.join(", ")}).`);
    return;
  }

  // A franchise is an owner: follow them to their current ESPN team id, even if the team was renamed
  const currentTeamByOwner = new Map(
    current.teams.filter(team => team.primaryOwner).map(team => [team.primaryOwner, String(team.id)])
  );

  for (const season of missing) {
    const league = await fetchLeague(season, ["mTeam", "mSettings", "mMatchupScore"]);
    const seasonData = transformSeason(league, season);
    delete seasonData.updatedAt;
    delete seasonData.currentWeek;

    const ownerByTeamId = new Map(league.teams.map(team => [team.id, team.primaryOwner]));
    seasonData.teams.forEach(team => {
      const owner = ownerByTeamId.get(team.id);
      team.franchiseId = currentTeamByOwner.get(owner) || (owner ? `former-${ownerKey(owner)}` : `former-${season}-${team.id}`);
    });

    history.seasons[season] = seasonData;
    console.log(`Added ${season}: ${seasonData.teams.length} teams, ${seasonData.matchups.length} matchups`);
  }

  fs.writeFileSync(outputPath, JSON.stringify(history, null, 2) + "\n");
}

main().catch(logErrorAndExit);
