import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// League configuration
const LEAGUE_ID = '397265055';
const SEASON = 2026;
const ESPN_ENDPOINT = `https://lm-api-reads.espn.com/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}`;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Local data endpoint - for testing
app.get('/api/local/league', (req, res) => {
  try {
    const teamsPath = path.join(__dirname, '../data/teams.json');
    const matchupsPath = path.join(__dirname, '../data/matchups.json');

    const teams = JSON.parse(fs.readFileSync(teamsPath, 'utf8'));
    const matchups = JSON.parse(fs.readFileSync(matchupsPath, 'utf8'));

    res.json({
      teams,
      schedule: matchups,
      season: SEASON,
      leagueId: LEAGUE_ID,
      source: 'local'
    });
  } catch (error) {
    console.error('Error reading local data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ESPN proxy endpoint - fetch league data
app.get('/api/espn/league', async (req, res) => {
  try {
    const views = req.query.views || 'mTeam,mMatchup,mRoster,mSettings';
    const url = `${ESPN_ENDPOINT}?view=${views}`;

    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ESPN API error ${response.status}:`, errorText.substring(0, 200));
      throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ESPN data with ${data.teams?.length || 0} teams`);
    res.json(data);
  } catch (error) {
    console.error('ESPN proxy error:', error.message);
    res.status(500).json({ 
      error: error.message,
      note: 'ESPN API may require authentication for private leagues'
    });
  }
});

// ESPN proxy endpoint - fetch matchups only
app.get('/api/espn/matchups', async (req, res) => {
  try {
    const url = `${ESPN_ENDPOINT}?view=mMatchup`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data.schedule || []);
  } catch (error) {
    console.error('ESPN proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ESPN proxy endpoint - fetch standings
app.get('/api/espn/standings', async (req, res) => {
  try {
    const url = `${ESPN_ENDPOINT}?view=mTeam`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data.teams || []);
  } catch (error) {
    console.error('ESPN proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Fantasy League Backend running on http://localhost:${PORT}`);
  console.log(`ESPN League ID: ${LEAGUE_ID}`);
  console.log(`Season: ${SEASON}`);
});
