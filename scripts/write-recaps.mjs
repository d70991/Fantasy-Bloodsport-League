// Makes "Bloodsport Center" weekly broadcast episodes: data/recaps-<year>.json + media/recaps/<year>-week-<n>.mp3.
//
// For every finished week without an episode: pull the box scores from ESPN, work out the facts
// (scores, top players, duds, bench blunders, standings, series records), have Claude write a
// 60-90 second two-anchor script around those facts, voice each line with OpenAI text-to-speech,
// and stitch the lines into one MP3 with exact timings so the site can sync graphics and captions.
// Hourly syncs that find nothing new never call either API.
//
// Usage:
//   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... ESPN_S2=... ESPN_SWID=... node scripts/write-recaps.mjs [--max 4] [--week 5 --force] [--dry-run]

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { mp3Frames, speak } from "./audio.mjs";
import { CURRENT_SEASON, fetchLeague, logErrorAndExit, repoRoot } from "./espn.mjs";

const MODEL = "claude-opus-5-5";
const seasonPath = path.join(repoRoot, "data", `season-${CURRENT_SEASON}.json`);
const historyPath = path.join(repoRoot, "data", "history.json");
const recapsPath = path.join(repoRoot, "data", `recaps-${CURRENT_SEASON}.json`);
const mediaDir = path.join(repoRoot, "media", "recaps");

const BENCH_SLOT = 20;
const IR_SLOT = 21;
const POSITIONS = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };

const ANCHORS = {
  mike: "Big Mike Malone",
  tasha: "Tasha Reid"
};


function argValue(name) {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : null;
}

function readJson(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
}

function round(points) {
  return Math.round(points * 10) / 10;
}


// ======================================
// FACTS
// ======================================

function finishedWeeks(season) {
  const weeks = [...new Set(season.matchups.map(game => game.week))];
  return weeks
    .filter(week => {
      const games = season.matchups.filter(game => game.week === week && !String(game.tier || "NONE").includes("CONSOLATION"));
      return games.length > 0 && games.every(game => game.winner);
    })
    .sort((weekA, weekB) => weekA - weekB);
}

function recordsThrough(season, week) {
  const records = new Map(season.teams.map(team => [team.id, { wins: 0, losses: 0, ties: 0, pointsFor: 0, results: [] }]));
  season.matchups
    .filter(game => game.winner && !game.playoff && game.week <= week)
    .sort((gameA, gameB) => gameA.week - gameB.week)
    .forEach(game => {
      [game.home, game.away].forEach(side => {
        const record = records.get(side.teamId);
        record.pointsFor += side.score;
        if (game.winner === "tie") { record.ties += 1; record.results.push("T"); }
        else if (game.winner === side.teamId) { record.wins += 1; record.results.push("W"); }
        else { record.losses += 1; record.results.push("L"); }
      });
    });

  records.forEach(record => {
    const last = record.results[record.results.length - 1];
    let length = 0;
    for (let i = record.results.length - 1; i >= 0 && record.results[i] === last; i -= 1) length += 1;
    record.streak = last ? `${last}${length}` : "";
    record.text = record.ties ? `${record.wins}-${record.losses}-${record.ties}` : `${record.wins}-${record.losses}`;
    record.pointsFor = round(record.pointsFor);
  });
  return records;
}

// All-time head-to-head by franchise (history + this season), counted the same way as js/rivalries.js
function seriesLookup(history, season, throughWeek) {
  const wins = new Map();
  const seasons = [...Object.values(history?.seasons || {}), season];

  seasons.forEach(seasonData => {
    const franchiseOf = new Map(seasonData.teams.map(team => [team.id, team.franchiseId || String(team.id)]));
    seasonData.matchups
      .filter(game => game.winner && game.winner !== "tie" && ["NONE", "WINNERS_BRACKET"].includes(game.tier || "NONE"))
      .filter(game => seasonData !== season || game.week <= throughWeek)
      .forEach(game => {
        const key = `${franchiseOf.get(game.winner)}>${franchiseOf.get(game.winner === game.home.teamId ? game.away.teamId : game.home.teamId)}`;
        wins.set(key, (wins.get(key) || 0) + 1);
      });
  });

  return (teamA, teamB, names) => {
    const aWins = wins.get(`${teamA}>${teamB}`) || 0;
    const bWins = wins.get(`${teamB}>${teamA}`) || 0;
    if (aWins + bWins === 0) return "first meeting";
    if (aWins === bWins) return `series tied ${aWins}-${bWins}`;
    return aWins > bWins ? `${names.get(teamA)} leads ${aWins}-${bWins}` : `${names.get(teamB)} leads ${bWins}-${aWins}`;
  };
}

function lineup(sideData) {
  const entries = sideData.rosterForCurrentScoringPeriod?.entries || [];
  const players = entries.map(entry => ({
    name: entry.playerPoolEntry.player.fullName,
    position: POSITIONS[entry.playerPoolEntry.player.defaultPositionId] || "?",
    points: round(entry.playerPoolEntry.appliedStatTotal || 0),
    slot: entry.lineupSlotId
  }));
  const starters = players.filter(player => player.slot !== BENCH_SLOT && player.slot !== IR_SLOT).sort((playerA, playerB) => playerB.points - playerA.points);
  const bench = players.filter(player => player.slot === BENCH_SLOT).sort((playerA, playerB) => playerB.points - playerA.points);

  // Worst same-position swap: a bench player who outscored a starter at his position
  let blunder = null;
  bench.forEach(benched => {
    starters.filter(starter => starter.position === benched.position).forEach(starter => {
      const lost = round(benched.points - starter.points);
      if (lost > 0 && (!blunder || lost > blunder.pointsLost)) {
        blunder = { benched: benched.name, benchedPoints: benched.points, started: starter.name, startedPoints: starter.points, position: benched.position, pointsLost: lost };
      }
    });
  });

  return {
    topStarters: starters.slice(0, 3).map(({ name, position, points }) => ({ name, position, points })),
    worstStarter: starters.length ? (({ name, position, points }) => ({ name, position, points }))(starters[starters.length - 1]) : null,
    benchPoints: round(bench.reduce((sum, player) => sum + player.points, 0)),
    blunder
  };
}

async function weekFacts(season, history, week) {
  const box = await fetchLeague(CURRENT_SEASON, ["mMatchupScore", "mBoxscore"], { scoringPeriodId: week });
  const names = new Map(season.teams.map(team => [team.id, team.name]));
  const franchiseNames = new Map(season.teams.map(team => [String(team.id), team.name]));
  const recordsAfter = recordsThrough(season, week);
  const series = seriesLookup(history, season, week);
  const isPlayoffs = season.regularSeasonWeeks && week > season.regularSeasonWeeks;

  const boxByTeam = new Map();
  (box.schedule || [])
    .filter(game => game.matchupPeriodId === week && game.away)
    .forEach(game => {
      boxByTeam.set(game.home.teamId, lineup(game.home));
      boxByTeam.set(game.away.teamId, lineup(game.away));
    });

  const games = season.matchups
    .filter(game => game.week === week && game.winner && !String(game.tier).includes("CONSOLATION"))
    .map(game => {
      const side = sideData => ({
        team: names.get(sideData.teamId),
        score: round(sideData.score),
        recordAfterWeek: recordsAfter.get(sideData.teamId).text,
        streakAfterWeek: recordsAfter.get(sideData.teamId).streak,
        ...boxByTeam.get(sideData.teamId)
      });
      const winnerSide = game.winner === game.home.teamId ? game.home : game.away;
      const loserSide = winnerSide === game.home ? game.away : game.home;
      return {
        winner: names.get(winnerSide.teamId),
        loser: names.get(loserSide.teamId),
        margin: round(winnerSide.score - loserSide.score),
        allTimeSeriesIncludingThisGame: series(String(game.away.teamId), String(game.home.teamId), franchiseNames),
        playoffRound: game.tier === "WINNERS_BRACKET" ? "playoffs" : null,
        away: side(game.away),
        home: side(game.home)
      };
    });

  const sides = games.flatMap(game => [game.away, game.home]);
  const allStarters = sides.flatMap(sideData => (sideData.topStarters || []).map(player => ({ ...player, team: sideData.team })));
  const blunders = sides.filter(sideData => sideData.blunder).map(sideData => ({ team: sideData.team, ...sideData.blunder }));
  const duds = sides.filter(sideData => sideData.worstStarter).map(sideData => ({ team: sideData.team, ...sideData.worstStarter }));
  const byScore = [...sides].sort((sideA, sideB) => sideB.score - sideA.score);
  const byMargin = [...games].sort((gameA, gameB) => gameB.margin - gameA.margin);

  const awards = {
    playerOfTheWeek: allStarters.sort((playerA, playerB) => playerB.points - playerA.points)[0] || null,
    highScore: byScore[0] ? { team: byScore[0].team, score: byScore[0].score } : null,
    lowScore: byScore.at(-1) ? { team: byScore.at(-1).team, score: byScore.at(-1).score } : null,
    beatdown: byMargin[0] ? { winner: byMargin[0].winner, loser: byMargin[0].loser, margin: byMargin[0].margin } : null,
    nailBiter: byMargin.at(-1) ? { winner: byMargin.at(-1).winner, loser: byMargin.at(-1).loser, margin: byMargin.at(-1).margin } : null,
    benchBlunder: blunders.sort((blunderA, blunderB) => blunderB.pointsLost - blunderA.pointsLost)[0] || null,
    dudOfTheWeek: duds.filter(dud => dud.position !== "K").sort((dudA, dudB) => dudA.points - dudB.points)[0] || null
  };

  const pointsForOrder = [...recordsAfter.values()].map(record => record.pointsFor).sort((pointsA, pointsB) => pointsB - pointsA);
  const standings = [...recordsAfter.entries()]
    .map(([teamId, record]) => ({
      team: names.get(teamId),
      record: record.text,
      gamesPlayed: record.results.length,
      pointsFor: record.pointsFor,
      pointsForRank: pointsForOrder.indexOf(record.pointsFor) + 1,
      streak: record.streak
    }))
    .sort((teamA, teamB) => {
      const pct = team => { const [wins, losses] = team.record.split("-").map(Number); return wins / Math.max(wins + losses, 1); };
      return pct(teamB) - pct(teamA) || teamB.pointsFor - teamA.pointsFor;
    });

  const nextWeek = season.matchups
    .filter(game => game.week === week + 1)
    .map(game => ({
      away: `${names.get(game.away.teamId)} (${recordsAfter.get(game.away.teamId).text})`,
      home: `${names.get(game.home.teamId)} (${recordsAfter.get(game.home.teamId).text})`,
      allTimeSeriesBeforeThisGame: series(String(game.away.teamId), String(game.home.teamId), franchiseNames)
    }));

  const playing = new Set(sides.map(sideData => sideData.team));
  const onBye = season.teams.map(team => team.name).filter(name => !playing.has(name));

  return {
    season: CURRENT_SEASON,
    week,
    isPlayoffs: Boolean(isPlayoffs),
    regularSeasonWeeks: season.regularSeasonWeeks,
    playoffSpots: season.playoffTeamCount,
    games,
    onBye: isPlayoffs ? [] : onBye,
    awards,
    standingsAfterWeek: isPlayoffs ? [] : standings,
    nextWeek
  };
}


// ======================================
// THE SHOW
// ======================================

// Broadcast order; each segment gets its on-screen graphic from the facts, not from the model
const SEGMENT_IDS = ["cold_open", "quick_hits", "beatdown", "nail_biter", "player_of_the_week", "bench_blunder", "sign_off"];

const SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    episodeTitle: { type: "string", description: "Punchy episode title, under 50 characters" },
    teaser: { type: "string", description: "One-sentence hook for the home page, under 25 words" },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: SEGMENT_IDS },
          title: { type: "string", description: "On-screen segment title, under 28 characters" },
          lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "string", enum: Object.keys(ANCHORS) },
                text: { type: "string", description: "One spoken line, under 25 words" }
              },
              required: ["speaker", "text"],
              additionalProperties: false
            }
          }
        },
        required: ["id", "title", "lines"],
        additionalProperties: false
      }
    }
  },
  required: ["episodeTitle", "teaser", "segments"],
  additionalProperties: false
};

const SYSTEM_PROMPT = `You write the spoken script for "Bloodsport Center", a 60-90 second weekly video highlight segment for the Fantasy Bloodsport League, a 15-team ESPN fantasy football league of friends who talk a lot of trash. The commissioner goes by Lorde Commish. The league has a last-place punishment.

Two anchors, voiced by text-to-speech:
- ${ANCHORS.mike} (speaker "mike"): loud, theatrical, hot takes, nicknames, overreacts.
- ${ANCHORS.tasha} (speaker "tasha"): dry, deadpan, the stat that ruins Mike's take.

This is heard, not read. Write for the ear:
- 170 to 220 words in total. That is a hard limit; the segment has to fit in 90 seconds.
- Short, punchy lines, each under 25 words. Quick back-and-forth, never a monologue.
- Say numbers the way an announcer would ("one eighty-seven five", "fifty-two points"). Don't use symbols, abbreviations like "pts" or "D/ST" (say "defense"), or anything that sounds wrong out loud.
- Graphics appear on screen with each segment, so you can lean on them ("look at this", "check the bench").

Segments, in this order, each exactly once:
1. cold_open (1-2 lines): the week's biggest storyline, as a hook.
2. quick_hits (2-3 lines): rapid-fire through the other notable results. The full scoreboard is on screen, so don't read every score.
3. beatdown (2 lines): awards.beatdown.
4. nail_biter (2 lines): awards.nailBiter.
5. player_of_the_week (2 lines): awards.playerOfTheWeek.
6. bench_blunder (2-3 lines): awards.benchBlunder. If it's null, roast awards.lowScore instead.
7. sign_off (2 lines): a jab about the standings or next week's best matchup, then "This has been Bloodsport Center."

Ground rules:
- Use only the facts in the data. Never invent players, scores, stats, injuries, trades, or quotes from managers. Every number and superlative ("most", "fewest", "only") must come straight from the data; for points-for comparisons use pointsForRank (1 = most), and teams with a bye have played fewer games.
- allTimeSeriesIncludingThisGame already counts this week's result; nextWeek's allTimeSeriesBeforeThisGame is the series going into that game.
- Refer to fantasy teams by their team names. Real NFL players can be named and their fantasy points cited.
- Trash talk is about fantasy decisions and results only: lineups, benchings, scores, records. Nothing about anyone's real life, looks, family, job, or identity, and no slurs. PG-13.`;

async function writeScript(client, facts) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCRIPT_SCHEMA }
    },
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Write the Bloodsport Center script for ${facts.isPlayoffs ? "the playoff round in " : ""}Week ${facts.week} of the ${facts.season} season.\n\nThis week's data:\n${JSON.stringify(facts, null, 1)}`
    }]
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined Week ${facts.week} (${response.stop_details?.category || "no category"}).`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(`Week ${facts.week} script ran past max_tokens.`);
  }

  const script = JSON.parse(response.content.filter(block => block.type === "text").map(block => block.text).join(""));
  console.log(`  ${response.model}: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

  // Keep one of each segment, in broadcast order, whatever order the model used
  script.segments = SEGMENT_IDS
    .map(id => script.segments.find(segment => segment.id === id))
    .filter(segment => segment && segment.lines.length > 0);
  return { script, model: response.model };
}


function segmentGraphic(id, facts, script) {
  const { awards } = facts;
  const scoreOf = (winner, loser) => {
    const game = facts.games.find(item => item.winner === winner && item.loser === loser);
    const sideOf = team => game && (game.away.team === team ? game.away : game.home);
    return game ? { winnerScore: sideOf(winner).score, loserScore: sideOf(loser).score } : {};
  };

  switch (id) {
    case "cold_open":
      return { type: "title", title: script.episodeTitle, week: facts.week };
    case "quick_hits":
      return {
        type: "scores",
        games: facts.games.map(game => ({ away: game.away.team, awayScore: game.away.score, home: game.home.team, homeScore: game.home.score, winner: game.winner }))
      };
    case "beatdown":
    case "nail_biter": {
      const result = id === "beatdown" ? awards.beatdown : awards.nailBiter;
      return result ? { type: "matchup", label: id === "beatdown" ? "Beatdown of the Week" : "Nail-Biter", ...result, ...scoreOf(result.winner, result.loser) } : null;
    }
    case "player_of_the_week":
      return awards.playerOfTheWeek ? { type: "player", ...awards.playerOfTheWeek } : null;
    case "bench_blunder":
      return awards.benchBlunder
        ? { type: "blunder", ...awards.benchBlunder }
        : (awards.lowScore ? { type: "stat", label: "Low Score of the Week", team: awards.lowScore.team, value: awards.lowScore.score } : null);
    case "sign_off":
      return facts.standingsAfterWeek.length
        ? { type: "standings", top: facts.standingsAfterWeek.slice(0, 3), bottom: facts.standingsAfterWeek.slice(-2) }
        : { type: "title", title: "Bloodsport Center", week: facts.week };
    default:
      return null;
  }
}

// Voice every line, join them into one MP3, and record when each line and segment starts
async function produceBroadcast(script, facts) {
  const frames = [];
  const beats = [];
  const segments = [];
  let clock = 0;

  for (const segment of script.segments) {
    const segmentStart = clock;
    for (const line of segment.lines) {
      const clip = mp3Frames(await speak(line.speaker, line.text));
      beats.push({ segment: segment.id, speaker: line.speaker, text: line.text, start: round2(clock), end: round2(clock + clip.seconds) });
      frames.push(...clip.frames);
      clock += clip.seconds;
    }
    segments.push({ id: segment.id, title: segment.title, start: round2(segmentStart), end: round2(clock), graphic: segmentGraphic(segment.id, facts, script) });
  }

  return { audio: Buffer.concat(frames), beats, segments, duration: round2(clock) };
}

function round2(seconds) {
  return Math.round(seconds * 100) / 100;
}


// ======================================
// MAIN
// ======================================

async function main() {
  const season = readJson(seasonPath, null);
  if (!season) throw new Error(`Missing ${path.relative(repoRoot, seasonPath)}; run fetch-espn.mjs first.`);
  const history = readJson(historyPath, { seasons: {} });
  const recaps = readJson(recapsPath, { season: CURRENT_SEASON, weeks: {} });
  recaps.anchors = ANCHORS;

  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const onlyWeek = argValue("--week") ? Number(argValue("--week")) : null;
  const maxEpisodes = Number(argValue("--max") || 4);

  const weeks = finishedWeeks(season)
    .filter(week => onlyWeek === null || week === onlyWeek)
    // Older text-only recaps count as missing so they get remade as broadcasts
    .filter(week => force || recaps.weeks[week]?.format !== "broadcast")
    // Newest first, so a backlog never delays this week's episode
    .reverse()
    .slice(0, maxEpisodes);

  if (weeks.length === 0) {
    console.log("No new finished weeks to recap.");
    return;
  }

  if (!dryRun && (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY)) {
    console.log("ANTHROPIC_API_KEY or OPENAI_API_KEY isn't set; skipping recaps.");
    return;
  }

  const client = dryRun ? null : new Anthropic();
  fs.mkdirSync(mediaDir, { recursive: true });

  // Check the voices work before paying for any scripts (costs a fraction of a cent)
  if (!dryRun) {
    await speak("mike", "Bloodsport Center.");
  }

  for (const week of weeks) {
    console.log(`Week ${week}:`);
    const facts = await weekFacts(season, history, week);

    if (dryRun) {
      console.log(JSON.stringify(facts, null, 2));
      continue;
    }

    const { script, model } = await writeScript(client, facts);
    const words = script.segments.flatMap(segment => segment.lines).reduce((sum, line) => sum + line.text.split(/\s+/).length, 0);
    const broadcast = await produceBroadcast(script, facts);

    const audioFile = `${CURRENT_SEASON}-week-${week}.mp3`;
    fs.writeFileSync(path.join(mediaDir, audioFile), broadcast.audio);

    recaps.weeks[week] = {
      week,
      format: "broadcast",
      generatedAt: new Date().toISOString(),
      model,
      episodeTitle: script.episodeTitle,
      teaser: script.teaser,
      audio: `media/recaps/${audioFile}`,
      duration: broadcast.duration,
      segments: broadcast.segments,
      beats: broadcast.beats,
      awards: facts.awards,
      scores: facts.games.map(game => ({
        away: { team: game.away.team, score: game.away.score },
        home: { team: game.home.team, score: game.home.score },
        winner: game.winner
      }))
    };
    // Save after each episode so a later failure keeps the earlier ones
    fs.writeFileSync(recapsPath, JSON.stringify(recaps, null, 2) + "\n");
    console.log(`  Saved "${script.episodeTitle}": ${words} words, ${broadcast.duration}s, ${Math.round(broadcast.audio.length / 1024)} KB`);
  }
}

main().catch(error => {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("The Anthropic API key was rejected. Make a new key and update the DAVON_API secret.");
    process.exit(1);
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}: ${error.message}`);
    process.exit(1);
  }
  logErrorAndExit(error);
});
