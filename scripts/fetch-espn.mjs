// Pulls the current ESPN season and writes data/season-<year>.json for the site.
//
// Usage:
//   ESPN_S2=... ESPN_SWID={...} node scripts/fetch-espn.mjs
//   node scripts/fetch-espn.mjs --input saved-espn-response.json   (transform a saved response, no network)

import fs from "fs";
import path from "path";
import { CURRENT_SEASON, fetchLeague, logErrorAndExit, repoRoot, transformSeason } from "./espn.mjs";

const outputPath = path.join(repoRoot, "data", `season-${CURRENT_SEASON}.json`);


async function main() {
  const inputIndex = process.argv.indexOf("--input");
  const league = inputIndex > -1
    ? JSON.parse(fs.readFileSync(process.argv[inputIndex + 1], "utf8"))
    : await fetchLeague(CURRENT_SEASON, ["mTeam", "mSettings", "mStandings", "mMatchupScore"]);

  const season = transformSeason(league, CURRENT_SEASON);

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

main().catch(logErrorAndExit);
