// ESPN data fetching and processing
const BACKEND_URL = 'http://localhost:3001';

const espnData = {
  async fetchLeagueData() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/espn/league`);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch ESPN league data:', error);
      return null;
    }
  },

  async fetchMatchups() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/espn/matchups`);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch ESPN matchups:', error);
      return [];
    }
  },

  async fetchStandings() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/espn/standings`);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch ESPN standings:', error);
      return [];
    }
  },

  transformTeamsData(espnLeagueData) {
    if (!espnLeagueData || !espnLeagueData.teams) {
      return [];
    }

    return espnLeagueData.teams.map(team => ({
      id: `espn-team-${team.id}`,
      name: team.location + ' ' + team.nickname,
      owner: team.owner,
      record: team.record?.overall?.wins + '-' + team.record?.overall?.losses,
      pointsFor: team.record?.overall?.pointsFor
    }));
  },

  transformMatchupsData(espnLeagueData) {
    if (!espnLeagueData || !espnLeagueData.schedule) {
      return [];
    }

    return espnLeagueData.schedule.map(game => ({
      week: game.matchupPeriodId,
      teamA: `espn-team-${game.away.teamId}`,
      teamB: `espn-team-${game.home.teamId}`,
      scoreA: game.away.totalPoints,
      scoreB: game.home.totalPoints,
      winner: game.away.totalPoints > game.home.totalPoints ? `espn-team-${game.away.teamId}` : `espn-team-${game.home.teamId}`
    }));
  },

  async syncToLocalStorage() {
    const leagueData = await this.fetchLeagueData();
    
    if (!leagueData) {
      console.error('Could not sync ESPN data');
      return false;
    }

    const teams = this.transformTeamsData(leagueData);
    const matchups = this.transformMatchupsData(leagueData);

    localStorage.setItem('espn-teams', JSON.stringify(teams));
    localStorage.setItem('espn-matchups', JSON.stringify(matchups));

    console.log('ESPN data synced:', { teams: teams.length, matchups: matchups.length });
    return true;
  }
};

export default espnData;