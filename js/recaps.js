// ======================================
// BLOODSPORT CENTER (weekly broadcast episodes)
// Episodes come from data/recaps-2026.json + media/recaps/*.mp3, made by scripts/write-recaps.mjs.
// The audio drives everything: each line and segment has start/end times, so the anchor glow,
// captions, lower third and on-screen graphic follow audio.currentTime.
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

function broadcastEpisodes(recaps) {
  return Object.values(recaps?.weeks || {})
    .filter(episode => episode.format === "broadcast")
    .sort((episodeA, episodeB) => episodeB.week - episodeA.week);
}

function clockText(seconds) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}


// ======================================
// GRAPHICS (one per segment)
// ======================================

function graphicHtml(graphic) {
  if (!graphic) return "";
  const name = text => escapeHtml(text);

  switch (graphic.type) {
    case "title":
      return `
        <div class="gfx gfx-title">
          <div class="gfx-kicker">Week ${graphic.week}</div>
          <div class="gfx-headline">${name(graphic.title)}</div>
        </div>`;

    case "scores":
      return `
        <div class="gfx gfx-scores">
          ${graphic.games.map(game => `
            <div class="gfx-mini-score">
              <span class="${game.away === game.winner ? "won" : ""}">${name(game.away)} <b>${formatPoints(game.awayScore)}</b></span>
              <span class="${game.home === game.winner ? "won" : ""}">${name(game.home)} <b>${formatPoints(game.homeScore)}</b></span>
            </div>`).join("")}
        </div>`;

    case "matchup":
      return `
        <div class="gfx gfx-matchup">
          <div class="gfx-kicker">${name(graphic.label)}</div>
          <div class="gfx-score-row won"><span>${name(graphic.winner)}</span><b>${formatPoints(graphic.winnerScore)}</b></div>
          <div class="gfx-score-row"><span>${name(graphic.loser)}</span><b>${formatPoints(graphic.loserScore)}</b></div>
          <div class="gfx-foot">Won by ${formatPoints(graphic.margin)}</div>
        </div>`;

    case "player":
      return `
        <div class="gfx gfx-player">
          <div class="gfx-kicker">Player of the Week</div>
          <div class="gfx-big-number">${formatPoints(graphic.points)}</div>
          <div class="gfx-headline">${name(graphic.name)}</div>
          <div class="gfx-foot">${name(graphic.position)} · ${name(graphic.team)}</div>
        </div>`;

    case "blunder":
      return `
        <div class="gfx gfx-blunder">
          <div class="gfx-kicker">Bench Blunder · ${name(graphic.team)}</div>
          <div class="gfx-swap">
            <div class="gfx-swap-side bad"><small>Started</small><span>${name(graphic.started)}</span><b>${formatPoints(graphic.startedPoints)}</b></div>
            <div class="gfx-swap-vs">vs</div>
            <div class="gfx-swap-side good"><small>Benched</small><span>${name(graphic.benched)}</span><b>${formatPoints(graphic.benchedPoints)}</b></div>
          </div>
          <div class="gfx-foot">${formatPoints(graphic.pointsLost)} points left on the bench</div>
        </div>`;

    case "stat":
      return `
        <div class="gfx gfx-player">
          <div class="gfx-kicker">${name(graphic.label)}</div>
          <div class="gfx-big-number">${formatPoints(graphic.value)}</div>
          <div class="gfx-headline">${name(graphic.team)}</div>
        </div>`;

    case "standings": {
      const row = team => `<div class="gfx-standing"><span>${name(team.team)}</span><b>${name(team.record)}</b></div>`;
      return `
        <div class="gfx gfx-standings">
          <div class="gfx-kicker">Top of the league</div>
          ${graphic.top.map(row).join("")}
          <div class="gfx-kicker gfx-danger">Last-place watch</div>
          ${graphic.bottom.map(row).join("")}
        </div>`;
    }

    default:
      return "";
  }
}


// ======================================
// PLAYER
// ======================================

function setupPlayer(episodes, anchors) {
  const audio = document.getElementById("audio");
  const graphicEl = document.getElementById("graphic");
  const lowerThirdEl = document.getElementById("lowerThird");
  const captionEl = document.getElementById("caption");
  const bigPlay = document.getElementById("bigPlay");
  const playPause = document.getElementById("playPause");
  const seek = document.getElementById("seek");
  const timeEl = document.getElementById("time");
  const anchorEls = [...document.querySelectorAll(".anchor")];

  let episode = null;
  let shownSegment = null;
  let frame = null;

  const showSegment = segment => {
    if (segment === shownSegment) return;
    shownSegment = segment;
    graphicEl.innerHTML = segment ? graphicHtml(segment.graphic) : "";
    lowerThirdEl.textContent = segment ? segment.title : "";
    lowerThirdEl.classList.toggle("visible", Boolean(segment));
    // Restart the entrance animations
    [graphicEl, lowerThirdEl].forEach(element => {
      element.classList.remove("enter");
      void element.offsetWidth;
      element.classList.add("enter");
    });
  };

  const render = () => {
    const now = audio.currentTime;
    const beat = episode.beats.find(item => now >= item.start && now < item.end) || null;
    const segment = episode.segments.find(item => now >= item.start && now < item.end) || (now >= episode.duration ? episode.segments.at(-1) : episode.segments[0]);

    showSegment(segment);
    const speaking = beat && !audio.paused ? beat.speaker : null;
    anchorEls.forEach(element => element.classList.toggle("speaking", element.dataset.speaker === speaking));
    captionEl.textContent = beat ? beat.text : "";

    seek.value = episode.duration ? (now / episode.duration) * 100 : 0;
    timeEl.textContent = `${clockText(now)} / ${clockText(episode.duration)}`;
  };

  const loop = () => {
    render();
    if (!audio.paused) frame = requestAnimationFrame(loop);
  };

  const setPlaying = playing => {
    playPause.textContent = playing ? "❚❚" : "▶";
    playPause.setAttribute("aria-label", playing ? "Pause" : "Play");
    bigPlay.hidden = playing;
  };

  const toggle = () => {
    if (audio.paused) {
      if (audio.currentTime >= episode.duration - 0.05) audio.currentTime = 0;
      audio.play().catch(error => console.error("Playback failed:", error));
    } else {
      audio.pause();
    }
  };

  audio.addEventListener("play", () => {
    bigPlay.textContent = "▶";
    bigPlay.setAttribute("aria-label", "Play episode");
    setPlaying(true);
    cancelAnimationFrame(frame);
    loop();
  });
  // Seeking while paused still moves the graphics and captions
  audio.addEventListener("seeked", render);
  audio.addEventListener("pause", () => { setPlaying(false); render(); });
  audio.addEventListener("ended", () => {
    setPlaying(false);
    bigPlay.textContent = "↻";
    bigPlay.setAttribute("aria-label", "Replay episode");
    render();
  });
  bigPlay.addEventListener("click", toggle);
  playPause.addEventListener("click", toggle);
  document.querySelector(".stage").addEventListener("click", event => {
    if (!event.target.closest(".big-play")) toggle();
  });
  seek.addEventListener("input", () => {
    audio.currentTime = (Number(seek.value) / 100) * episode.duration;
    render();
  });

  return function load(next) {
    episode = next;
    shownSegment = null;
    audio.pause();
    audio.src = episode.audio;
    audio.currentTime = 0;
    bigPlay.textContent = "▶";
    bigPlay.setAttribute("aria-label", "Play episode");
    setPlaying(false);
    document.getElementById("stageWeek").textContent = `WEEK ${episode.week}`;
    render();

    document.getElementById("transcriptLines").innerHTML = episode.beats.map(beat =>
      `<p><b>${escapeHtml(anchors[beat.speaker] || beat.speaker)}:</b> ${escapeHtml(beat.text)}</p>`
    ).join("");
  };
}


// Home page card for the newest episode
function renderLatestTeaser(container, episode) {
  container.innerHTML = `
    <a class="episode-teaser-card" href="recaps.html?week=${episode.week}">
      <span class="teaser-play">▶</span>
      <span class="teaser-text">
        <span class="show-live">● NEW · WEEK ${episode.week} · ${clockText(episode.duration)}</span>
        <strong>${escapeHtml(episode.episodeTitle)}</strong>
        <span>${escapeHtml(episode.teaser)}</span>
      </span>
    </a>
  `;
}


document.addEventListener("DOMContentLoaded", async () => {
  const broadcastEl = document.getElementById("broadcast");
  const teaserEl = document.getElementById("latestRecap");
  if (!broadcastEl && !teaserEl) return;

  const recaps = await loadRecaps();
  const episodes = broadcastEpisodes(recaps);
  if (episodes.length === 0) return;

  if (teaserEl) {
    renderLatestTeaser(teaserEl, episodes[0]);
  }
  if (!broadcastEl) return;

  document.getElementById("noEpisodes").hidden = true;
  broadcastEl.hidden = false;
  document.getElementById("transcript").hidden = false;

  const load = setupPlayer(episodes, recaps.anchors || {});
  const select = document.getElementById("episodeSelect");
  const requested = Number(new URLSearchParams(window.location.search).get("week"));
  const start = episodes.find(episode => episode.week === requested) || episodes[0];

  select.innerHTML = episodes.map(episode =>
    `<option value="${episode.week}" ${episode === start ? "selected" : ""}>Week ${episode.week}: ${escapeHtml(episode.episodeTitle)}</option>`
  ).join("");
  select.closest(".week-picker").removeAttribute("hidden");

  const show = week => {
    load(episodes.find(episode => episode.week === week));
    window.history.replaceState(null, "", `?week=${week}`);
  };
  select.addEventListener("change", () => show(Number(select.value)));
  show(start.week);
});
