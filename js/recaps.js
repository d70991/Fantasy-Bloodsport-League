// ======================================
// BLOODSPORT CENTER (weekly recap episodes)
// Episodes come from data/recaps-2026.json, written by scripts/write-recaps.mjs.
// Uses escapeHtml / formatPoints from js/season.js.
// ======================================

const RECAPS_DATA_URL = "data/recaps-2026.json";


async function loadRecaps() {
  try {
    const response = await fetch(RECAPS_DATA_URL, { cache: "no-cache" });
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Could not load recaps:", error);
    return null;
  }
}

function sortedEpisodes(recaps) {
  return Object.values(recaps?.weeks || {}).sort((episodeA, episodeB) => episodeB.week - episodeA.week);
}


function awardCards(awards) {
  const card = (label, main, detail) => main
    ? `<div class="award-card"><span>${label}</span><strong>${main}</strong>${detail ? `<small>${detail}</small>` : ""}</div>`
    : "";

  const player = awards.playerOfTheWeek;
  const blunder = awards.benchBlunder;
  const dud = awards.dudOfTheWeek;

  return [
    card("🏆 Player of the Week", player && escapeHtml(player.name), player && `${formatPoints(player.points)} pts · ${escapeHtml(player.team)}`),
    card("🔨 Beatdown", awards.beatdown && escapeHtml(awards.beatdown.winner), awards.beatdown && `over ${escapeHtml(awards.beatdown.loser)} by ${formatPoints(awards.beatdown.margin)}`),
    card("😰 Nail-Biter", awards.nailBiter && escapeHtml(awards.nailBiter.winner), awards.nailBiter && `over ${escapeHtml(awards.nailBiter.loser)} by ${formatPoints(awards.nailBiter.margin)}`),
    card("🪑 Bench Blunder", blunder && escapeHtml(blunder.team), blunder && `Benched ${escapeHtml(blunder.benched)} (${formatPoints(blunder.benchedPoints)}) for ${escapeHtml(blunder.started)} (${formatPoints(blunder.startedPoints)})`),
    card("📈 High Score", awards.highScore && escapeHtml(awards.highScore.team), awards.highScore && formatPoints(awards.highScore.score)),
    card("💀 Dud of the Week", dud && escapeHtml(dud.name), dud && `${formatPoints(dud.points)} pts · ${escapeHtml(dud.team)}`)
  ].join("");
}

function renderEpisode(container, recaps, episode) {
  const anchors = recaps.anchors || {};

  container.innerHTML = `
    <article class="episode">
      <div class="episode-header">
        <div class="episode-week">Week ${episode.week}</div>
        <h2>${escapeHtml(episode.episodeTitle)}</h2>
        <p class="episode-teaser">${escapeHtml(episode.teaser)}</p>
      </div>

      <div class="award-grid">${awardCards(episode.awards || {})}</div>

      ${episode.segments.map(segment => `
        <section class="segment">
          <div class="lower-third">${escapeHtml(segment.title)}</div>
          ${segment.lines.map(line => `
            <p class="show-line show-${escapeHtml(line.speaker)}">
              <span class="speaker">${escapeHtml(anchors[line.speaker] || line.speaker)}</span>
              ${escapeHtml(line.text)}
            </p>
          `).join("")}
        </section>
      `).join("")}

      <div class="segment final-scores">
        <div class="lower-third">Final Scores</div>
        <div class="scoreboard">
          ${(episode.scores || []).map(game => `
            <div class="score-card">
              ${[game.away, game.home].map(side => `
                <div class="score-side ${side.team === game.winner ? "score-winner" : ""}">
                  <span class="score-team">${escapeHtml(side.team)}</span>
                  <span class="score-points">${formatPoints(side.score)}</span>
                </div>`).join("")}
            </div>`).join("")}
        </div>
      </div>

      <p class="episode-credit">Written by AI (Claude) from ESPN box scores. Every score and stat is real; the opinions are not.</p>
    </article>
  `;
}


// Home page teaser for the newest episode
function renderLatestTeaser(container, recaps) {
  const latest = sortedEpisodes(recaps)[0];
  if (!latest) return;
  container.innerHTML = `
    <a class="episode-teaser-card" href="recaps.html?week=${latest.week}">
      <span class="show-live">● NEW EPISODE · WEEK ${latest.week}</span>
      <strong>${escapeHtml(latest.episodeTitle)}</strong>
      <span>${escapeHtml(latest.teaser)}</span>
      <span class="teaser-cta">Watch the recap →</span>
    </a>
  `;
}


document.addEventListener("DOMContentLoaded", async () => {
  const episodeEl = document.getElementById("episode");
  const teaserEl = document.getElementById("latestRecap");
  if (!episodeEl && !teaserEl) return;

  const recaps = await loadRecaps();
  const episodes = sortedEpisodes(recaps);
  if (episodes.length === 0) return;

  if (teaserEl) {
    renderLatestTeaser(teaserEl, recaps);
  }

  if (episodeEl) {
    const select = document.getElementById("episodeSelect");
    const requested = Number(new URLSearchParams(window.location.search).get("week"));
    const start = episodes.find(episode => episode.week === requested) || episodes[0];

    select.innerHTML = episodes.map(episode =>
      `<option value="${episode.week}" ${episode === start ? "selected" : ""}>Week ${episode.week}: ${escapeHtml(episode.episodeTitle)}</option>`
    ).join("");
    select.closest(".week-picker").removeAttribute("hidden");

    const show = week => {
      renderEpisode(episodeEl, recaps, episodes.find(episode => episode.week === week));
      window.history.replaceState(null, "", `?week=${week}`);
    };
    select.addEventListener("change", () => show(Number(select.value)));
    show(start.week);
  }
});
