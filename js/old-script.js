// ======================================
// TEAMS
// ======================================

const teams = [

  { id: "team-nelson", name: "Team Nelson", allTimeRecord: "39-30", championships: [2022, 2021], playoffAppearances: 4, badge: "" },
  { id: "moravia-rd-mmg", name: "Moravia Rd MMG", allTimeRecord: "36-33", championships: [], playoffAppearances: 2, badge: "" },
  { id: "the-conqueror", name: "The Conqueror", allTimeRecord: "38-31", championships: [2025], playoffAppearances: 3, badge: "" },
  { id: "northeast-winners", name: "Northeast Winners", allTimeRecord: "36-33", championships: [], playoffAppearances: 3, badge: "" },
  { id: "heavy-gewts", name: "Heavy Gewts", allTimeRecord: "38-31", championships: [2024], playoffAppearances: 5, badge: "🗑️ Never Beat Team Ayers" },
  { id: "lorde-commish", name: "Lorde Commish", allTimeRecord: "33-34", championships: [2023], playoffAppearances: 3, badge: "" },
  { id: "team-ayers", name: "Team Ayers", allTimeRecord: "41-37", championships: [], playoffAppearances: 3, badge: "🏅 Undefeated vs P", mvp: "🏆 League MVP - 2023 (14-0 Undefeated Season)" },
  { id: "team-epps", name: "Team Epps", allTimeRecord: "32-38", championships: [], playoffAppearances: 1, badge: "" },
  { id: "the-goat", name: "The Goat", allTimeRecord: "33-37", championships: [2022], playoffAppearances: 2, badge: "" },
  { id: "yall-suck", name: "Yall Suck", allTimeRecord: "35-35", championships: [], playoffAppearances: 1, badge: "" },
  { id: "say-whattt", name: "Say Whattt", allTimeRecord: "28-40", championships: [], playoffAppearances: 1, badge: "" },
  { id: "arise", name: "Arise", allTimeRecord: "14-13", championships: [], playoffAppearances: 1, badge: "" },
  { id: "tomfootballteam", name: "TomFootballTeam", allTimeRecord: "8-20", championships: [], playoffAppearances: 0, badge: "" },
  { id: "lul-daddy", name: "Lul Daddy", allTimeRecord: "4-10", championships: [], playoffAppearances: 0, badge: "" },
  { id: "phils-perfect-team", name: "Phil's Perfect Team", allTimeRecord: "6-8", championships: [], playoffAppearances: 0, badge: "" }

];


// ======================================
// MATCHUPS
// ======================================

const historicalMatchupGames = [
  { season: 2022, teamA: "the-conqueror", teamB: "the-goat", winner: "the-goat" },
  { season: 2022, teamA: "team-nelson", teamB: "yall-suck", winner: "team-nelson" },
  { season: 2022, teamA: "team-nelson", teamB: "moravia-rd-mmg", winner: "team-nelson" },
  { season: 2022, teamA: "team-nelson", teamB: "the-goat", winner: "team-nelson" },
  { season: 2023, teamA: "heavy-gewts", teamB: "the-goat", winner: "heavy-gewts" },
  { season: 2023, teamA: "the-conqueror", teamB: "moravia-rd-mmg", winner: "the-conqueror" },
  { season: 2023, teamA: "heavy-gewts", teamB: "the-conqueror", winner: "heavy-gewts" },
  { season: 2024, teamA: "team-ayers", teamB: "yall-suck", winner: "team-ayers" },
  { season: 2024, teamA: "moravia-rd-mmg", teamB: "northeast-winners", winner: "moravia-rd-mmg" },
  { season: 2024, teamA: "lorde-commish", teamB: "team-nelson", winner: "lorde-commish" },
  { season: 2024, teamA: "heavy-gewts", teamB: "team-ayers", winner: "heavy-gewts" },
  { season: 2024, teamA: "moravia-rd-mmg", teamB: "lorde-commish", winner: "moravia-rd-mmg" },
  { season: 2024, teamA: "heavy-gewts", teamB: "moravia-rd-mmg", winner: "heavy-gewts" }
];

const teamNameAliases = {
  "team ayers": "team-ayers",
  "heavy gewts": "heavy-gewts",
  "heavy-gewts": "heavy-gewts",
  "thewaysofp": "heavy-gewts",
  "northeast winners": "northeast-winners",
  "tomfootballteam": "tomfootballteam",
  "team nelson": "team-nelson",
  "say whatttt": "say-whattt",
  "the reaper": "say-whattt",
  "friday night lights": "arise",
  "arise": "arise",
  "defending champ (i beat p)": "lorde-commish",
  "coach roy": "lorde-commish",
  "the goat goat": "the-goat",
  "team epps": "team-epps",
  "the goat": "the-goat",
  "moravia rd mmg": "moravia-rd-mmg",
  "the conqueror": "the-conqueror",
  "yall suck": "yall-suck",
  "phillip's perfect team": "phils-perfect-team",
  "lul daddy": "lul-daddy",
  "lorde commish": "lorde-commish",
  "bigg daddy davon": "lorde-commish",
  "ova west pryor": "heavy-gewts",
  "this johnson is lamarvelous": "lorde-commish",
  "team pryor": "heavy-gewts"
};

const excludedTeamNames = new Set([
  "winners circle",
  "the muse klan",
  "out da mudd jones iii",
  "where u not sadie",
  "team 23"
]);

function teamIdFromName(teamName) {
  const normalizedName = teamName.toLowerCase();

  if (excludedTeamNames.has(normalizedName)) {
    return null;
  }

  return teamNameAliases[normalizedName] || null;
}

function createGame(season, week, awayName, homeName, awayScore, homeScore) {
  const teamA = teamIdFromName(awayName);
  const teamB = teamIdFromName(homeName);

  if (!teamA || !teamB || teamA === teamB || awayScore === homeScore) {
    return null;
  }

  return {
    season,
    week,
    teamA,
    teamB,
    scoreA: awayScore,
    scoreB: homeScore,
    winner: awayScore > homeScore ? teamA : teamB
  };
}

const season2021WeeklyGames = [
  // Week 1
  createGame(2021, 1, "The Conqueror", "This Johnson is lamarvelous", 442.0, 491.5),
  createGame(2021, 1, "Moravia RD MMG", "The GOAT GOAT", 405.0, 400.5),
  // Week 2
  createGame(2021, 2, "Moravia RD MMG", "The Conqueror", 456.5, 367.0),
  createGame(2021, 2, "This Johnson is lamarvelous", "Team Pryor", 379.5, 453.0),
  // Week 3
  createGame(2021, 3, "Team Pryor", "The Conqueror", 397.0, 418.5),
  createGame(2021, 3, "This Johnson is lamarvelous", "Team Nelson", 426.5, 418.5),
  // Week 4
  createGame(2021, 4, "Northeast Winners", "The GOAT GOAT", 518.5, 279.5),
  createGame(2021, 4, "The Conqueror", "Team Nelson", 350.0, 364.5),
  // Week 5
  createGame(2021, 5, "The GOAT GOAT", "This Johnson is lamarvelous", 452.0, 384.0),
  createGame(2021, 5, "Team Nelson", "Team Pryor", 432.5, 429.5),
  createGame(2021, 5, "Moravia RD MMG", "Northeast Winners", 567.5, 359.5),
  // Week 6
  createGame(2021, 6, "Team Pryor", "Northeast Winners", 478.0, 425.0),
  createGame(2021, 6, "Team Nelson", "The GOAT GOAT", 482.5, 317.0),
  // Week 7
  createGame(2021, 7, "Moravia RD MMG", "Team Pryor", 317.5, 365.0),
  createGame(2021, 7, "Northeast Winners", "This Johnson is lamarvelous", 444.5, 455.0),
  createGame(2021, 7, "The GOAT GOAT", "The Conqueror", 339.0, 458.0),
  // Week 8
  createGame(2021, 8, "This Johnson is lamarvelous", "Moravia RD MMG", 387.0, 283.5),
  createGame(2021, 8, "Team Nelson", "Northeast Winners", 328.0, 416.0),
  // Week 9
  createGame(2021, 9, "Team Pryor", "Team Nelson", 284.5, 280.0),
  createGame(2021, 9, "The GOAT GOAT", "Moravia RD MMG", 441.0, 436.0),
  // Week 10
  createGame(2021, 10, "Moravia RD MMG", "Team Nelson", 288.0, 325.5),
  createGame(2021, 10, "This Johnson is lamarvelous", "The Conqueror", 313.0, 302.5),
  // Week 11
  createGame(2021, 11, "Northeast Winners", "The Conqueror", 295.0, 306.0),
  createGame(2021, 11, "Team Pryor", "This Johnson is lamarvelous", 441.5, 243.0),
  // Week 12
  createGame(2021, 12, "The Conqueror", "Team Pryor", 347.0, 426.5),
  createGame(2021, 12, "The GOAT GOAT", "Northeast Winners", 389.5, 311.5),
  createGame(2021, 12, "Team Nelson", "This Johnson is lamarvelous", 331.0, 418.5),
  // Week 13
  createGame(2021, 13, "The GOAT GOAT", "Team Pryor", 458.0, 357.5),
  createGame(2021, 13, "Team Nelson", "The Conqueror", 316.0, 428.0),
  createGame(2021, 13, "Northeast Winners", "Moravia RD MMG", 384.5, 404.0),
  // Week 14
  createGame(2021, 14, "The Conqueror", "Moravia RD MMG", 406.0, 208.5),
  createGame(2021, 14, "This Johnson is lamarvelous", "The GOAT GOAT", 455.0, 381.5)
].filter(Boolean);

const season2022WeeklyGames = [
  // Week 1
  createGame(2022, 1, "Bigg Daddy Davon", "Team Nelson", 134.0, 131.0),
  createGame(2022, 1, "Ova west Pryor", "The Conqueror", 129.0, 80.0),
  createGame(2022, 1, "Yall Suck", "Team Ayers", 115.5, 124.0),
  createGame(2022, 1, "Moravia RD MMG", "The GOAT GOAT", 173.0, 124.5),
  // Week 2
  createGame(2022, 2, "Ova west Pryor", "Bigg Daddy Davon", 172.5, 108.5),
  createGame(2022, 2, "Team Nelson", "Yall Suck", 158.5, 135.5),
  createGame(2022, 2, "The Conqueror", "Team Ayers", 165.5, 146.5),
  createGame(2022, 2, "Team epps", "The Reaper", 107.5, 79.0),
  createGame(2022, 2, "The GOAT GOAT", "Northeast Winners", 166.0, 144.5),
  // Week 3
  createGame(2022, 3, "Bigg Daddy Davon", "Yall Suck", 136.5, 139.5),
  createGame(2022, 3, "Team Ayers", "Ova west Pryor", 101.0, 86.5),
  createGame(2022, 3, "The Conqueror", "Team Nelson", 131.5, 115.0),
  createGame(2022, 3, "Northeast Winners", "Moravia RD MMG", 113.5, 152.0),
  createGame(2022, 3, "The GOAT GOAT", "Team epps", 118.0, 109.0),
  // Week 4
  createGame(2022, 4, "Team Ayers", "Bigg Daddy Davon", 115.0, 101.0),
  createGame(2022, 4, "Yall Suck", "The Conqueror", 166.0, 86.5),
  createGame(2022, 4, "Ova west Pryor", "Team Nelson", 110.0, 133.5),
  createGame(2022, 4, "The Reaper", "The GOAT GOAT", 121.5, 103.5),
  createGame(2022, 4, "Moravia RD MMG", "Team epps", 117.0, 142.5),
  // Week 5
  createGame(2022, 5, "Bigg Daddy Davon", "The Conqueror", 112.0, 141.5),
  createGame(2022, 5, "Team Nelson", "Team Ayers", 140.0, 95.0),
  createGame(2022, 5, "Ova west Pryor", "Yall Suck", 118.0, 134.5),
  createGame(2022, 5, "Team epps", "Northeast Winners", 146.5, 209.0),
  createGame(2022, 5, "Moravia RD MMG", "The Reaper", 126.5, 146.5),
  // Week 6
  createGame(2022, 6, "Team epps", "Team Nelson", 108.0, 99.0),
  createGame(2022, 6, "Moravia RD MMG", "Ova west Pryor", 137.0, 97.0),
  createGame(2022, 6, "The Reaper", "Yall Suck", 115.5, 127.5),
  createGame(2022, 6, "Northeast Winners", "Team Ayers", 158.0, 123.0),
  createGame(2022, 6, "The GOAT GOAT", "The Conqueror", 116.5, 77.5),
  // Week 7
  createGame(2022, 7, "Ova west Pryor", "Team epps", 111.5, 107.0),
  createGame(2022, 7, "Yall Suck", "Moravia RD MMG", 133.0, 104.0),
  createGame(2022, 7, "Team Ayers", "The Reaper", 94.5, 130.0),
  createGame(2022, 7, "The Conqueror", "Northeast Winners", 115.5, 132.0),
  createGame(2022, 7, "Bigg Daddy Davon", "The GOAT GOAT", 111.0, 137.0),
  // Week 8
  createGame(2022, 8, "Team epps", "Yall Suck", 161.0, 140.0),
  createGame(2022, 8, "Moravia RD MMG", "Team Ayers", 152.0, 107.5),
  createGame(2022, 8, "The Reaper", "The Conqueror", 82.5, 162.5),
  createGame(2022, 8, "Northeast Winners", "Bigg Daddy Davon", 142.5, 127.0),
  createGame(2022, 8, "The GOAT GOAT", "Team Nelson", 140.5, 131.5),
  // Week 9
  createGame(2022, 9, "Team Ayers", "Team epps", 132.0, 155.0),
  createGame(2022, 9, "The Conqueror", "Moravia RD MMG", 131.5, 112.0),
  createGame(2022, 9, "Bigg Daddy Davon", "The Reaper", 80.0, 64.0),
  createGame(2022, 9, "Team Nelson", "Northeast Winners", 97.0, 127.5),
  createGame(2022, 9, "Ova west Pryor", "The GOAT GOAT", 145.0, 108.0),
  // Week 10
  createGame(2022, 10, "Team epps", "The Conqueror", 120.0, 96.0),
  createGame(2022, 10, "Moravia RD MMG", "Bigg Daddy Davon", 118.0, 94.5),
  createGame(2022, 10, "The Reaper", "Team Nelson", 135.5, 98.5),
  createGame(2022, 10, "Northeast Winners", "Ova west Pryor", 109.5, 136.0),
  createGame(2022, 10, "The GOAT GOAT", "Yall Suck", 134.5, 97.0),
  // Week 11
  createGame(2022, 11, "Bigg Daddy Davon", "Team epps", 92.5, 98.5),
  createGame(2022, 11, "Team Nelson", "Moravia RD MMG", 112.0, 107.5),
  createGame(2022, 11, "Ova west Pryor", "The Reaper", 114.0, 123.5),
  createGame(2022, 11, "Yall Suck", "Northeast Winners", 131.5, 102.5),
  createGame(2022, 11, "Team Ayers", "The GOAT GOAT", 133.5, 154.0),
  // Week 12
  createGame(2022, 12, "Team Nelson", "Team epps", 119.0, 106.0),
  createGame(2022, 12, "Ova west Pryor", "Moravia RD MMG", 128.0, 117.0),
  createGame(2022, 12, "Yall Suck", "The Reaper", 135.0, 146.0),
  createGame(2022, 12, "Team Ayers", "Northeast Winners", 149.5, 153.0),
  createGame(2022, 12, "The Conqueror", "The GOAT GOAT", 97.0, 138.5),
  // Week 13
  createGame(2022, 13, "Team epps", "Ova west Pryor", 131.0, 140.5),
  createGame(2022, 13, "Moravia RD MMG", "Yall Suck", 123.5, 126.0),
  createGame(2022, 13, "The Reaper", "Team Ayers", 113.5, 82.0),
  createGame(2022, 13, "Northeast Winners", "The Conqueror", 137.0, 88.0),
  createGame(2022, 13, "The GOAT GOAT", "Bigg Daddy Davon", 129.0, 110.0),
  // Week 14
  createGame(2022, 14, "Yall Suck", "Team epps", 128.5, 109.0),
  createGame(2022, 14, "Team Ayers", "Moravia RD MMG", 103.5, 109.5),
  createGame(2022, 14, "The Conqueror", "The Reaper", 114.5, 77.0),
  createGame(2022, 14, "Bigg Daddy Davon", "Northeast Winners", 145.5, 140.5),
  createGame(2022, 14, "Team Nelson", "The GOAT GOAT", 113.0, 109.0)
].filter(Boolean);

const season2023WeeklyGames = [
  createGame(2023, 1, "The Conqueror", "Yall Suck", 105.0, 90.0),
  createGame(2023, 1, "Team Nelson", "TheWaysOfP", 129.0, 104.5),
  createGame(2023, 1, "Team Ayers", "Coach Roy", 125.5, 101.5),
  createGame(2023, 1, "Northeast Winners", "Winners Circle", 108.0, 170.5),
  createGame(2023, 1, "Team epps", "The Reaper", 115.5, 96.0),
  createGame(2023, 1, "Moravia RD MMG", "The GOAT GOAT", 86.0, 112.0),
  createGame(2023, 2, "Team Nelson", "The Conqueror", 124.5, 105.0),
  createGame(2023, 2, "Yall Suck", "Team Ayers", 121.0, 147.5),
  createGame(2023, 2, "TheWaysOfP", "Coach Roy", 120.5, 135.5),
  createGame(2023, 2, "Team epps", "Northeast Winners", 110.5, 105.5),
  createGame(2023, 2, "Winners Circle", "Moravia RD MMG", 101.0, 144.5),
  createGame(2023, 2, "The Reaper", "The GOAT GOAT", 153.0, 159.0),
  createGame(2023, 3, "The Conqueror", "Team Ayers", 122.0, 134.0),
  createGame(2023, 3, "Coach Roy", "Team Nelson", 139.0, 131.0),
  createGame(2023, 3, "TheWaysOfP", "Yall Suck", 146.5, 142.0),
  createGame(2023, 3, "Northeast Winners", "Moravia RD MMG", 79.5, 117.5),
  createGame(2023, 3, "The GOAT GOAT", "Team epps", 127.0, 127.0),
  createGame(2023, 3, "The Reaper", "Winners Circle", 159.5, 157.5),
  createGame(2023, 4, "Coach Roy", "The Conqueror", 154.0, 115.5),
  createGame(2023, 4, "Team Ayers", "TheWaysOfP", 155.0, 97.0),
  createGame(2023, 4, "Team Nelson", "Yall Suck", 146.5, 74.5),
  createGame(2023, 4, "The GOAT GOAT", "Northeast Winners", 131.0, 125.0),
  createGame(2023, 4, "Moravia RD MMG", "The Reaper", 106.5, 102.0),
  createGame(2023, 4, "Team epps", "Winners Circle", 87.0, 111.0),
  createGame(2023, 5, "The Conqueror", "TheWaysOfP", 148.0, 103.0),
  createGame(2023, 5, "Yall Suck", "Coach Roy", 149.0, 118.0),
  createGame(2023, 5, "Team Nelson", "Team Ayers", 102.5, 127.5),
  createGame(2023, 5, "Northeast Winners", "The Reaper", 95.5, 136.5),
  createGame(2023, 5, "Winners Circle", "The GOAT GOAT", 128.5, 99.5),
  createGame(2023, 5, "Team epps", "Moravia RD MMG", 162.5, 147.5),
  createGame(2023, 6, "Northeast Winners", "The Conqueror", 117.5, 75.0),
  createGame(2023, 6, "Winners Circle", "Yall Suck", 122.5, 115.0),
  createGame(2023, 6, "Team epps", "Team Nelson", 112.5, 107.5),
  createGame(2023, 6, "Moravia RD MMG", "Team Ayers", 127.0, 141.0),
  createGame(2023, 6, "The GOAT GOAT", "Coach Roy", 138.5, 100.5),
  createGame(2023, 6, "The Reaper", "TheWaysOfP", 117.5, 114.5),
  createGame(2023, 7, "Yall Suck", "Northeast Winners", 100.0, 94.5),
  createGame(2023, 7, "Team Nelson", "Winners Circle", 93.5, 102.0),
  createGame(2023, 7, "Team Ayers", "Team epps", 151.5, 109.0),
  createGame(2023, 7, "Coach Roy", "Moravia RD MMG", 162.0, 138.5),
  createGame(2023, 7, "TheWaysOfP", "The GOAT GOAT", 157.5, 88.0),
  createGame(2023, 7, "The Conqueror", "The Reaper", 119.5, 106.0),
  createGame(2023, 8, "Northeast Winners", "Team Nelson", 127.0, 116.5),
  createGame(2023, 8, "Winners Circle", "Team Ayers", 149.0, 152.0),
  createGame(2023, 8, "Team epps", "Coach Roy", 148.0, 135.5),
  createGame(2023, 8, "Moravia RD MMG", "TheWaysOfP", 176.5, 132.0),
  createGame(2023, 8, "The GOAT GOAT", "The Conqueror", 90.5, 127.5),
  createGame(2023, 8, "The Reaper", "Yall Suck", 123.0, 108.0),
  createGame(2023, 9, "Team Ayers", "Northeast Winners", 145.0, 141.5),
  createGame(2023, 9, "Coach Roy", "Winners Circle", 112.5, 112.5),
  createGame(2023, 9, "TheWaysOfP", "Team epps", 147.5, 85.0),
  createGame(2023, 9, "The Conqueror", "Moravia RD MMG", 144.0, 84.0),
  createGame(2023, 9, "Yall Suck", "The GOAT GOAT", 135.5, 90.0),
  createGame(2023, 9, "Team Nelson", "The Reaper", 92.5, 106.0),
  createGame(2023, 10, "Northeast Winners", "Coach Roy", 150.5, 125.5),
  createGame(2023, 10, "Winners Circle", "TheWaysOfP", 106.0, 145.5),
  createGame(2023, 10, "Team epps", "The Conqueror", 120.0, 140.5),
  createGame(2023, 10, "Moravia RD MMG", "Yall Suck", 132.5, 102.0),
  createGame(2023, 10, "The GOAT GOAT", "Team Nelson", 106.0, 78.5),
  createGame(2023, 10, "The Reaper", "Team Ayers", 105.5, 137.0),
  createGame(2023, 11, "TheWaysOfP", "Northeast Winners", 95.0, 124.5),
  createGame(2023, 11, "The Conqueror", "Winners Circle", 105.0, 77.0),
  createGame(2023, 11, "Yall Suck", "Team epps", 115.0, 131.5),
  createGame(2023, 11, "Team Nelson", "Moravia RD MMG", 124.5, 130.5),
  createGame(2023, 11, "Team Ayers", "The GOAT GOAT", 109.5, 99.0),
  createGame(2023, 11, "Coach Roy", "The Reaper", 134.0, 139.5),
  createGame(2023, 12, "The Conqueror", "Northeast Winners", 180.5, 160.5),
  createGame(2023, 12, "Yall Suck", "Winners Circle", 106.0, 117.0),
  createGame(2023, 12, "Team Nelson", "Team epps", 120.0, 94.0),
  createGame(2023, 12, "Team Ayers", "Moravia RD MMG", 145.0, 112.0),
  createGame(2023, 12, "Coach Roy", "The GOAT GOAT", 133.5, 137.5),
  createGame(2023, 12, "TheWaysOfP", "The Reaper", 170.0, 118.0),
  createGame(2023, 13, "Northeast Winners", "Yall Suck", 99.5, 104.5),
  createGame(2023, 13, "Winners Circle", "Team Nelson", 109.0, 149.0),
  createGame(2023, 13, "Team epps", "Team Ayers", 76.0, 129.5),
  createGame(2023, 13, "Moravia RD MMG", "Coach Roy", 135.0, 152.0),
  createGame(2023, 13, "The GOAT GOAT", "TheWaysOfP", 126.0, 125.0),
  createGame(2023, 13, "The Reaper", "The Conqueror", 113.0, 165.5),
  createGame(2023, 14, "Team Nelson", "Northeast Winners", 144.5, 105.0),
  createGame(2023, 14, "Team Ayers", "Winners Circle", 154.5, 119.0),
  createGame(2023, 14, "Coach Roy", "Team epps", 104.5, 94.0),
  createGame(2023, 14, "TheWaysOfP", "Moravia RD MMG", 115.5, 101.5),
  createGame(2023, 14, "The Conqueror", "The GOAT GOAT", 90.0, 114.0),
  createGame(2023, 14, "Yall Suck", "The Reaper", 95.0, 76.5)
].filter(Boolean);

const season2024WeeklyGames = [
  createGame(2024, 1, "Yall Suck", "Defending Champ (I beat P)", 122.3, 151.9),
  createGame(2024, 1, "Friday Night Lights", "Team Ayers", 183.8, 159.6),
  createGame(2024, 1, "Moravia RD MMG", "TheWaysOfP", 166.1, 201.4),
  createGame(2024, 1, "The Reaper", "Northeast Winners", 135.0, 137.5),
  createGame(2024, 1, "Tomfootballteam", "The Conqueror", 118.4, 196.6),
  createGame(2024, 1, "The GOAT", "Team Nelson", 148.1, 111.5),
  createGame(2024, 1, "Team 23", "Team epps", 94.6, 127.9),
  createGame(2024, 2, "Friday Night Lights", "Yall Suck", 96.4, 147.1),
  createGame(2024, 2, "Defending Champ (I beat P)", "Moravia RD MMG", 177.3, 185.4),
  createGame(2024, 2, "Team Ayers", "The Reaper", 160.2, 122.6),
  createGame(2024, 2, "TheWaysOfP", "Tomfootballteam", 143.5, 117.0),
  createGame(2024, 2, "Northeast Winners", "The GOAT", 133.3, 156.5),
  createGame(2024, 2, "The Conqueror", "Team 23", 115.0, 210.5),
  createGame(2024, 2, "Team Nelson", "Team epps", 138.0, 135.4),
  createGame(2024, 3, "Yall Suck", "Moravia RD MMG", 197.0, 183.6),
  createGame(2024, 3, "The Reaper", "Friday Night Lights", 98.1, 110.1),
  createGame(2024, 3, "Tomfootballteam", "Defending Champ (I beat P)", 94.8, 105.4),
  createGame(2024, 3, "The GOAT", "Team Ayers", 178.6, 171.6),
  createGame(2024, 3, "Team 23", "TheWaysOfP", 120.8, 188.4),
  createGame(2024, 3, "Team epps", "Northeast Winners", 113.8, 123.7),
  createGame(2024, 3, "Team Nelson", "The Conqueror", 139.3, 90.7),
  createGame(2024, 4, "The Reaper", "Yall Suck", 172.6, 143.4),
  createGame(2024, 4, "Moravia RD MMG", "Tomfootballteam", 187.4, 78.9),
  createGame(2024, 4, "Friday Night Lights", "The GOAT", 181.0, 107.5),
  createGame(2024, 4, "Defending Champ (I beat P)", "Team 23", 122.0, 102.7),
  createGame(2024, 4, "Team Ayers", "Team epps", 157.0, 107.7),
  createGame(2024, 4, "TheWaysOfP", "Team Nelson", 152.6, 194.1),
  createGame(2024, 4, "Northeast Winners", "The Conqueror", 151.4, 187.1),
  createGame(2024, 5, "Yall Suck", "Tomfootballteam", 185.9, 187.2),
  createGame(2024, 5, "The GOAT", "The Reaper", 121.9, 147.6),
  createGame(2024, 5, "Team epps", "Friday Night Lights", 150.4, 200.8),
  createGame(2024, 5, "Team Nelson", "Defending Champ (I beat P)", 146.0, 201.5),
  createGame(2024, 5, "The Conqueror", "Team Ayers", 149.7, 137.2),
  createGame(2024, 5, "Northeast Winners", "TheWaysOfP", 122.4, 146.8),
  createGame(2024, 6, "The GOAT", "Yall Suck", 127.0, 157.3),
  createGame(2024, 6, "Tomfootballteam", "The Reaper", 130.0, 126.5),
  createGame(2024, 6, "Moravia RD MMG", "Team Nelson", 131.3, 186.4),
  createGame(2024, 6, "Friday Night Lights", "The Conqueror", 158.6, 140.3),
  createGame(2024, 6, "Defending Champ (I beat P)", "Northeast Winners", 167.9, 180.7),
  createGame(2024, 6, "Team Ayers", "TheWaysOfP", 154.3, 141.9),
  createGame(2024, 7, "Yall Suck", "Team Ayers", 195.2, 166.2),
  createGame(2024, 7, "Team epps", "The GOAT", 129.0, 120.9),
  createGame(2024, 7, "Team Nelson", "Tomfootballteam", 213.4, 97.4),
  createGame(2024, 7, "The Conqueror", "The Reaper", 105.4, 86.3),
  createGame(2024, 7, "Northeast Winners", "Moravia RD MMG", 92.7, 168.7),
  createGame(2024, 7, "TheWaysOfP", "Friday Night Lights", 199.9, 158.0),
  createGame(2024, 8, "Team epps", "Yall Suck", 172.1, 184.1),
  createGame(2024, 8, "The GOAT", "The Conqueror", 119.2, 187.4),
  createGame(2024, 8, "Tomfootballteam", "Northeast Winners", 159.2, 168.2),
  createGame(2024, 8, "Team Nelson", "The Reaper", 178.6, 144.3),
  createGame(2024, 8, "Moravia RD MMG", "Team Ayers", 144.5, 148.9),
  createGame(2024, 8, "Friday Night Lights", "Defending Champ (I beat P)", 153.0, 191.0),
  createGame(2024, 9, "Yall Suck", "Team Nelson", 121.1, 185.2),
  createGame(2024, 9, "The Conqueror", "Team epps", 175.8, 188.3),
  createGame(2024, 9, "TheWaysOfP", "The GOAT", 180.7, 147.7),
  createGame(2024, 9, "Team Ayers", "Tomfootballteam", 124.8, 108.3),
  createGame(2024, 9, "Defending Champ (I beat P)", "The Reaper", 179.7, 89.0),
  createGame(2024, 9, "Friday Night Lights", "Moravia RD MMG", 162.1, 208.1),
  createGame(2024, 10, "The Conqueror", "Yall Suck", 108.9, 216.7),
  createGame(2024, 10, "Team Ayers", "Northeast Winners", 169.2, 76.2),
  createGame(2024, 10, "Team epps", "TheWaysOfP", 153.1, 166.8),
  createGame(2024, 10, "The GOAT", "Defending Champ (I beat P)", 153.7, 147.4),
  createGame(2024, 10, "Tomfootballteam", "Friday Night Lights", 67.0, 132.5),
  createGame(2024, 10, "The Reaper", "Moravia RD MMG", 104.1, 191.9),
  createGame(2024, 11, "Yall Suck", "Northeast Winners", 158.2, 115.9),
  createGame(2024, 11, "TheWaysOfP", "The Conqueror", 196.8, 171.2),
  createGame(2024, 11, "Team Ayers", "Team Nelson", 177.1, 146.0),
  createGame(2024, 11, "Defending Champ (I beat P)", "Team epps", 158.8, 160.7),
  createGame(2024, 11, "Friday Night Lights", "Team 23", 142.5, 0.0),
  createGame(2024, 11, "Moravia RD MMG", "The GOAT", 181.3, 168.2),
  createGame(2024, 11, "The Reaper", "Tomfootballteam", 93.1, 87.8),
  createGame(2024, 12, "TheWaysOfP", "Yall Suck", 178.7, 147.8),
  createGame(2024, 12, "Northeast Winners", "Team Ayers", 212.5, 153.8),
  createGame(2024, 12, "The Conqueror", "Defending Champ (I beat P)", 127.0, 112.9),
  createGame(2024, 12, "Team Nelson", "Friday Night Lights", 189.1, 152.5),
  createGame(2024, 12, "Team epps", "Moravia RD MMG", 161.1, 173.3),
  createGame(2024, 12, "The GOAT", "Tomfootballteam", 128.8, 152.0),
  createGame(2024, 13, "Yall Suck", "Team Ayers", 173.6, 145.3),
  createGame(2024, 13, "Defending Champ (I beat P)", "TheWaysOfP", 136.3, 147.3),
  createGame(2024, 13, "Friday Night Lights", "Northeast Winners", 132.8, 138.0),
  createGame(2024, 13, "Moravia RD MMG", "The Conqueror", 181.4, 163.3),
  createGame(2024, 13, "The Reaper", "Team Nelson", 154.6, 147.6),
  createGame(2024, 13, "Tomfootballteam", "Team epps", 103.0, 180.6),
  createGame(2024, 14, "Defending Champ (I beat P)", "Yall Suck", 167.5, 159.1),
  createGame(2024, 14, "Team Ayers", "Team epps", 206.3, 152.6),
  createGame(2024, 14, "TheWaysOfP", "Moravia RD MMG", 200.5, 205.1),
  createGame(2024, 14, "Northeast Winners", "The Reaper", 167.1, 113.1),
  createGame(2024, 14, "The Conqueror", "Tomfootballteam", 141.6, 138.5),
  createGame(2024, 14, "Team Nelson", "The GOAT", 151.2, 122.9)
].filter(Boolean);

const season2025WeeklyGames = [
  createGame(2025, 1, "Team Ayers", "Heavy Gewts", 142.5, 139.5),
  createGame(2025, 1, "Northeast Winners", "Tomfootballteam", 136.5, 127.0),
  createGame(2025, 1, "Team Nelson", "Say whatttt", 151.5, 114.0),
  createGame(2025, 1, "Arise", "Team epps", 163.5, 152.0),
  createGame(2025, 1, "The GOAT", "Moravia RD MMG", 148.0, 136.5),
  createGame(2025, 1, "The Conqueror", "Yall suck", 147.0, 91.5),
  createGame(2025, 1, "phillip's Perfect Team", "Lul Daddy", 143.0, 96.0),
  createGame(2025, 2, "Arise", "Team Ayers", 134.0, 137.5),
  createGame(2025, 2, "Yall suck", "Northeast Winners", 116.0, 150.5),
  createGame(2025, 2, "Lul Daddy", "Tomfootballteam", 107.0, 109.0),
  createGame(2025, 2, "Heavy Gewts", "Say whatttt", 164.5, 139.5),
  createGame(2025, 2, "Lorde Commish", "The GOAT", 160.0, 136.0),
  createGame(2025, 2, "phillip's Perfect Team", "Moravia RD MMG", 129.5, 209.5),
  createGame(2025, 2, "The Conqueror", "Team epps", 143.5, 144.5),
  createGame(2025, 3, "Tomfootballteam", "The GOAT", 119.5, 170.0),
  createGame(2025, 3, "Say whatttt", "Yall suck", 113.5, 107.0),
  createGame(2025, 3, "Arise", "Lul Daddy", 103.5, 141.0),
  createGame(2025, 3, "Moravia RD MMG", "Team epps", 135.0, 134.5),
  createGame(2025, 3, "phillip's Perfect Team", "Northeast Winners", 125.5, 152.0),
  createGame(2025, 3, "Team Nelson", "The Conqueror", 98.0, 163.0),
  createGame(2025, 3, "Heavy Gewts", "Lorde Commish", 153.5, 133.0),
  createGame(2025, 4, "Team Ayers", "Say whatttt", 177.5, 153.0),
  createGame(2025, 4, "Lul Daddy", "The GOAT", 120.5, 158.5),
  createGame(2025, 4, "phillip's Perfect Team", "Team epps", 145.5, 165.5),
  createGame(2025, 4, "Moravia RD MMG", "Northeast Winners", 126.5, 172.0),
  createGame(2025, 4, "Arise", "Yall suck", 167.0, 84.5),
  createGame(2025, 4, "Lorde Commish", "Tomfootballteam", 182.5, 103.5),
  createGame(2025, 4, "Team Nelson", "The Conqueror", 130.0, 190.5),
  createGame(2025, 5, "The GOAT", "phillip's Perfect Team", 168.5, 137.5),
  createGame(2025, 5, "Team epps", "Yall suck", 168.0, 109.5),
  createGame(2025, 5, "Lul Daddy", "Lorde Commish", 111.0, 124.5),
  createGame(2025, 5, "Moravia RD MMG", "Tomfootballteam", 185.5, 75.5),
  createGame(2025, 5, "Team Nelson", "Team Ayers", 120.0, 174.5),
  createGame(2025, 5, "Say whatttt", "The Conqueror", 117.5, 169.5),
  createGame(2025, 5, "Arise", "Heavy Gewts", 139.0, 148.0),
  createGame(2025, 6, "Say whatttt", "Arise", 86.0, 173.0),
  createGame(2025, 6, "Yall suck", "Team Ayers", 123.5, 109.5),
  createGame(2025, 6, "phillip's Perfect Team", "Team Nelson", 88.0, 125.0),
  createGame(2025, 6, "The GOAT", "The Conqueror", 101.5, 145.5),
  createGame(2025, 6, "Lul Daddy", "Heavy Gewts", 125.5, 162.5),
  createGame(2025, 6, "Team epps", "Moravia RD MMG", 141.5, 123.0),
  createGame(2025, 6, "Lorde Commish", "Northeast Winners", 104.5, 173.0),
  createGame(2025, 7, "Northeast Winners", "Team Ayers", 176.5, 165.5),
  createGame(2025, 7, "Arise", "Moravia RD MMG", 130.5, 154.5),
  createGame(2025, 7, "phillip's Perfect Team", "Tomfootballteam", 102.5, 154.5),
  createGame(2025, 7, "Lul Daddy", "Team epps", 151.0, 132.0),
  createGame(2025, 7, "Yall suck", "The GOAT", 137.0, 87.5),
  createGame(2025, 7, "Lorde Commish", "Team Nelson", 174.0, 107.5),
  createGame(2025, 7, "The Conqueror", "Heavy Gewts", 147.5, 154.0),
  createGame(2025, 8, "Say whatttt", "phillip's Perfect Team", 128.5, 148.5),
  createGame(2025, 8, "The GOAT", "Heavy Gewts", 101.0, 172.5),
  createGame(2025, 8, "Moravia RD MMG", "The Conqueror", 146.5, 86.0),
  createGame(2025, 8, "Tomfootballteam", "Team epps", 157.0, 149.0),
  createGame(2025, 8, "Yall suck", "Lorde Commish", 80.5, 112.5),
  createGame(2025, 8, "Team Ayers", "Lul Daddy", 102.5, 123.0),
  createGame(2025, 8, "Northeast Winners", "Team Nelson", 117.5, 154.0),
  createGame(2025, 9, "Team Nelson", "phillip's Perfect Team", 133.5, 156.5),
  createGame(2025, 9, "Team Ayers", "The GOAT", 115.0, 107.0),
  createGame(2025, 9, "Moravia RD MMG", "Lul Daddy", 134.5, 114.0),
  createGame(2025, 9, "Tomfootballteam", "Say whatttt", 174.0, 136.0),
  createGame(2025, 9, "Arise", "Yall suck", 128.0, 122.0),
  createGame(2025, 9, "Lorde Commish", "The Conqueror", 91.0, 160.0),
  createGame(2025, 9, "Heavy Gewts", "Northeast Winners", 103.5, 186.0),
  createGame(2025, 10, "Arise", "Team Nelson", 130.0, 158.5),
  createGame(2025, 10, "Team epps", "Yall suck", 102.0, 191.5),
  createGame(2025, 10, "The Conqueror", "Team Ayers", 184.0, 97.5),
  createGame(2025, 10, "phillip's Perfect Team", "Lorde Commish", 179.5, 90.5),
  createGame(2025, 10, "Heavy Gewts", "Moravia RD MMG", 183.0, 108.5),
  createGame(2025, 10, "Tomfootballteam", "Northeast Winners", 149.5, 163.0),
  createGame(2025, 10, "Lul Daddy", "Say whatttt", 87.5, 150.5),
  createGame(2025, 11, "Lorde Commish", "Team epps", 103.0, 114.0),
  createGame(2025, 11, "Team Nelson", "The GOAT", 115.0, 143.5),
  createGame(2025, 11, "Heavy Gewts", "Tomfootballteam", 101.0, 138.5),
  createGame(2025, 11, "The Conqueror", "Arise", 137.0, 170.5),
  createGame(2025, 11, "Yall suck", "Lul Daddy", 137.0, 120.5),
  createGame(2025, 11, "Team Ayers", "Moravia RD MMG", 99.5, 109.0),
  createGame(2025, 11, "Northeast Winners", "Say whatttt", 168.5, 119.5),
  createGame(2025, 12, "Yall suck", "Heavy Gewts", 166.0, 107.5),
  createGame(2025, 12, "Team epps", "The Conqueror", 136.0, 107.0),
  createGame(2025, 12, "Lorde Commish", "Arise", 131.0, 139.5),
  createGame(2025, 12, "Team Ayers", "The GOAT", 147.0, 93.0),
  createGame(2025, 12, "phillip's Perfect Team", "Northeast Winners", 159.0, 162.5),
  createGame(2025, 12, "Team Nelson", "Lul Daddy", 162.5, 150.5),
  createGame(2025, 12, "Say whatttt", "Tomfootballteam", 156.0, 112.5),
  createGame(2025, 13, "Team epps", "Northeast Winners", 129.5, 188.5),
  createGame(2025, 13, "Lul Daddy", "Heavy Gewts", 144.5, 106.0),
  createGame(2025, 13, "phillip's Perfect Team", "Say whatttt", 138.5, 146.0),
  createGame(2025, 13, "Moravia RD MMG", "The GOAT", 166.0, 114.0),
  createGame(2025, 13, "Team Ayers", "Lorde Commish", 113.5, 126.0),
  createGame(2025, 13, "Tomfootballteam", "Team Nelson", 157.0, 158.0),
  createGame(2025, 13, "Arise", "The Conqueror", 129.5, 141.0),
  createGame(2025, 14, "Lorde Commish", "Arise", 143.0, 116.5),
  createGame(2025, 14, "Tomfootballteam", "phillip's Perfect Team", 124.5, 131.5),
  createGame(2025, 14, "Heavy Gewts", "Team epps", 138.5, 113.5),
  createGame(2025, 14, "Lul Daddy", "The GOAT", 130.5, 203.5),
  createGame(2025, 14, "Moravia RD MMG", "Team Ayers", 139.0, 133.5),
  createGame(2025, 14, "Northeast Winners", "Say whatttt", 78.5, 130.0),
  createGame(2025, 14, "Team Nelson", "Yall suck", 141.0, 127.5),
  createGame(2025, 15, "The Conqueror", "Lorde Commish", 195.0, 119.5),
  createGame(2025, 15, "The GOAT", "Moravia RD MMG", 140.0, 185.0),
  createGame(2025, 15, "Yall suck", "phillip's Perfect Team", 94.5, 152.5),
  createGame(2025, 15, "Arise", "Team epps", 164.5, 118.0),
  createGame(2025, 15, "Heavy Gewts", "Team Ayers", 138.5, 143.5),
  createGame(2025, 15, "Team Nelson", "Say whatttt", 135.0, 114.0),
  createGame(2025, 15, "Tomfootballteam", "Northeast Winners", 153.0, 174.0)
].filter(Boolean);

const matchupGames = [...historicalMatchupGames, ...season2021WeeklyGames, ...season2022WeeklyGames, ...season2023WeeklyGames, ...season2024WeeklyGames, ...season2025WeeklyGames];


const teamLookup = new Map(teams.map(team => [team.id, team]));


function buildMatchupRecords(games) {
  const matchupMap = new Map();

  games.forEach(game => {
    if (!teamLookup.has(game.teamA) || !teamLookup.has(game.teamB)) {
      return;
    }

    const matchupKey = [game.teamA, game.teamB].sort().join("::");
    let matchup = matchupMap.get(matchupKey);

    if (!matchup) {
      matchup = {
        teamA: [game.teamA, game.teamB].sort()[0],
        teamB: [game.teamA, game.teamB].sort()[1],
        winsA: 0,
        winsB: 0,
        games: []
      };
      matchupMap.set(matchupKey, matchup);
    }

    if (game.winner === matchup.teamA) {
      matchup.winsA += 1;
    } else if (game.winner === matchup.teamB) {
      matchup.winsB += 1;
    }

    matchup.games.push(game);
  });

  return Array.from(matchupMap.values());
}


const matchups = buildMatchupRecords(matchupGames);


function renderTeamPage() {
  const teamNameEl = document.getElementById("teamName");
  if (!teamNameEl) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const teamId = params.get("id");
  const recordEl = document.getElementById("teamRecord");
  const championshipsEl = document.getElementById("teamChampionships");
  const playoffsEl = document.getElementById("teamPlayoffs");
  const bannerDiv = document.getElementById("championshipBanners");
  const headToHeadDiv = document.getElementById("headToHead");
  const rivalDiv = document.getElementById("biggestRival");
  const noteEl = document.getElementById("headToHeadNote");

  if (!teamId || !teamLookup.has(teamId)) {
    teamNameEl.textContent = "Team not found";
    if (recordEl) {
      recordEl.textContent = "Choose a team from Team History to view franchise details.";
    }
    return;
  }

  const team = teamLookup.get(teamId);

  teamNameEl.textContent = team.name;
  if (recordEl) {
    recordEl.textContent = "All-Time Record: " + team.allTimeRecord;
  }
  if (championshipsEl) {
    championshipsEl.textContent = "Championships: " + team.championships.length;
  }
  if (playoffsEl) {
    playoffsEl.textContent = "Playoff Appearances: " + team.playoffAppearances;
  }

  if (bannerDiv) {
    bannerDiv.innerHTML = "";

    if (team.mvp) {
      const mvpBanner = document.createElement("div");
      mvpBanner.className = "mvp-banner";
      mvpBanner.textContent = team.mvp;
      bannerDiv.appendChild(mvpBanner);
    }

    if (team.badge) {
      const badge = document.createElement("div");
      badge.className = "history-card";
      badge.textContent = team.badge;
      bannerDiv.appendChild(badge);
    }

    if (team.championships.length > 0) {
      team.championships.forEach(year => {
        const banner = document.createElement("div");
        banner.className = "champion-banner";
        banner.innerHTML = `
          <div class="year">${year}</div>
          <div class="team">${team.name}</div>
          <div class="tagline">League Champion</div>
        `;
        bannerDiv.appendChild(banner);
      });
    } else {
      const emptyState = document.createElement("p");
      emptyState.textContent = "No championships yet.";
      bannerDiv.appendChild(emptyState);
    }
  }

  if (headToHeadDiv) {
    headToHeadDiv.innerHTML = "";

    const teamMatchups = matchups.filter(matchup => matchup.teamA === teamId || matchup.teamB === teamId);

    if (teamMatchups.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.textContent = "No matchup results are entered yet for this franchise.";
      headToHeadDiv.appendChild(emptyState);
      if (rivalDiv) {
        rivalDiv.textContent = "No rival data yet";
      }
      return;
    }

    let biggestRival = null;
    let closestDiff = Number.POSITIVE_INFINITY;

    const sortedMatchups = [...teamMatchups].sort((matchupA, matchupB) => {
      const totalGamesA = matchupA.winsA + matchupA.winsB;
      const totalGamesB = matchupB.winsA + matchupB.winsB;

      if (totalGamesB !== totalGamesA) {
        return totalGamesB - totalGamesA;
      }

      const opponentA = matchupA.teamA === teamId ? matchupA.teamB : matchupA.teamA;
      const opponentB = matchupB.teamA === teamId ? matchupB.teamB : matchupB.teamA;
      return teamLookup.get(opponentA).name.localeCompare(teamLookup.get(opponentB).name);
    });

    sortedMatchups.forEach(matchup => {
      const isTeamA = matchup.teamA === teamId;
      const opponentId = isTeamA ? matchup.teamB : matchup.teamA;
      const opponent = teamLookup.get(opponentId);
      const wins = isTeamA ? matchup.winsA : matchup.winsB;
      const losses = isTeamA ? matchup.winsB : matchup.winsA;
      const totalGames = wins + losses;

      const recordLine = document.createElement("p");
      recordLine.textContent = `${opponent ? opponent.name : opponentId}: ${wins}-${losses}`;
      headToHeadDiv.appendChild(recordLine);

      const diff = Math.abs(wins - losses);
      if (totalGames >= 3 && diff < closestDiff) {
        closestDiff = diff;
        biggestRival = opponent ? opponent.name : opponentId;
      }
    });

    if (noteEl) {
      noteEl.textContent = "Records below are based on matchup results currently entered on the site, including imported 2025 Weeks 1-15 data and available cross-season entries.";
    }

    if (rivalDiv) {
      rivalDiv.textContent = biggestRival ? "Biggest Rival: " + biggestRival : "No rival data yet";
    }
  }
}


function getTeamTier(team) {
  const score = team.championships.length * 5 + team.playoffAppearances * 2;

  if (team.championships.length >= 2) {
    return { label: "Dynasty", color: "gold" };
  }

  if (score >= 8) {
    return { label: "Contender", color: "orange" };
  }

  if (score >= 3) {
    return { label: "Mid Tier", color: "lightblue" };
  }

  return { label: "Poverty", color: "red" };
}


function renderTeamHistoryPage() {
  const teamHistoryListDiv = document.getElementById("teamHistoryList");
  if (!teamHistoryListDiv) {
    return;
  }

  teamHistoryListDiv.innerHTML = "";

  const sortedTeams = [...teams].sort((teamA, teamB) => {
    const scoreA = teamA.championships.length * 5 + teamA.playoffAppearances * 2;
    const scoreB = teamB.championships.length * 5 + teamB.playoffAppearances * 2;
    return scoreB - scoreA;
  });

  sortedTeams.forEach(team => {
    const tier = getTeamTier(team);
    const card = document.createElement("div");
    card.className = "history-card team-history-card";
    card.style.border = "2px solid " + tier.color;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", team.name + " franchise page");

    const title = document.createElement("h3");
    const titleLink = document.createElement("a");
    titleLink.href = "team.html?id=" + encodeURIComponent(team.id);
    titleLink.textContent = team.name;
    titleLink.className = "team-card-title";
    title.appendChild(titleLink);

    const tierLabel = document.createElement("p");
    tierLabel.textContent = tier.label;
    tierLabel.style.fontWeight = "bold";

    const record = document.createElement("p");
    record.textContent = "All-Time Record: " + team.allTimeRecord;

    const rings = document.createElement("p");
    rings.textContent = "Championships: " + team.championships.length;

    const playoffs = document.createElement("p");
    playoffs.textContent = "Playoff Appearances: " + team.playoffAppearances;

    card.appendChild(title);
    card.appendChild(tierLabel);

    if (team.badge) {
      const badge = document.createElement("p");
      badge.textContent = team.badge;
      card.appendChild(badge);
    }

    card.appendChild(record);
    card.appendChild(rings);
    card.appendChild(playoffs);

    const link = document.createElement("a");
    link.href = "team.html?id=" + encodeURIComponent(team.id);
    link.textContent = "View Franchise Page";
    link.className = "team-history-link";
    card.appendChild(link);

    const navigateToTeam = () => {
      window.location.href = titleLink.href;
    };

    card.addEventListener("click", event => {
      if (event.target.closest("a")) {
        return;
      }

      navigateToTeam();
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToTeam();
      }
    });

    teamHistoryListDiv.appendChild(card);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  renderTeamPage();
  renderTeamHistoryPage();
});


// ======================================
// TEAM PAGE
// ======================================
function showTab(tabId) {

document.querySelectorAll(".tab-content").forEach(tab => {
tab.classList.remove("active");
});

document.querySelectorAll(".tab-button").forEach(btn => {
btn.classList.remove("active");
});

document.getElementById(tabId).classList.add("active");

event.target.classList.add("active");

}// ===== 2025 SEASON DATA =====

let currentTab = "regular";
let currentTeam = null;

function showTab(tab) {
  currentTab = tab;
  if (currentTeam) loadTeam(currentTeam);
}

const season2025 = {

  Conqueror: {
    regular: [
      "The Conqueror def. Yall Suck, 147.0-91.5 (+55.5)",
      "Team Epps def. The Conqueror, 144.5-143.5 (-1.0)",
      "The Conqueror def. Team Nelson, 163.0-98.0 (+65.0)",
      "The Conqueror def. Team Nelson, 190.5-130.0 (+60.5)",
      "The Conqueror def. Say Whattt, 169.5-117.5 (+52.0)",
      "The Conqueror def. The GOAT, 145.5-101.5 (+44.0)",
      "Heavy Gewts def. The Conqueror, 154.0-147.5 (-6.5)",
      "Moravia RD MMG def. The Conqueror, 146.5-86.0 (-60.5)",
      "The Conqueror def. Lorde Commish, 160.0-91.0 (+69.0)",
      "The Conqueror def. Team Ayers, 184.0-97.5 (+86.5)",
      "Arise def. The Conqueror, 170.5-137.0 (-33.5)",
      "Team Epps def. The Conqueror, 136.0-107.0 (-29.0)",
      "The Conqueror def. Arise, 141.0-129.5 (+11.5)"
    ],
    playoffs: [
      "The Conqueror def. Arise, 137.0-131.5",
      "The Conqueror def. Moravia RD MMG, 127.5-120.5",
      "The Conqueror def. Heavy Gewts, 152.5-143.5 🏆"
    ]
  },

  "Heavy Gewts": {
    regular: [
      "Team Ayers def. Heavy Gewts, 142.5-139.5",
      "Heavy Gewts def. Say Whattt, 164.5-139.5",
      "Heavy Gewts def. Lorde Commish, 153.5-133.0",
      "Heavy Gewts def. Arise, 148.0-139.0",
      "Heavy Gewts def. Lul Daddy, 162.5-125.5",
      "Heavy Gewts def. The Conqueror, 154.0-147.5",
      "Heavy Gewts def. The GOAT, 172.5-101.0",
      "Northeast Winners def. Heavy Gewts, 186.0-103.5",
      "Heavy Gewts def. Moravia RD MMG, 183.0-108.5",
      "TomFootballTeam def. Heavy Gewts, 138.5-101.0",
      "Yall Suck def. Heavy Gewts, 166.0-107.5",
      "Lul Daddy def. Heavy Gewts, 144.5-106.0",
      "Heavy Gewts def. Team Epps, 138.5-113.5"
    ],
    playoffs: [
      "Heavy Gewts def. Team Nelson, 182.0-176.5",
      "Heavy Gewts def. Northeast Winners, 176.0-171.0",
      "The Conqueror def. Heavy Gewts, 152.5-143.5"
    ]
  },

  Moravia: {
    regular: [
      "The GOAT def. Moravia RD MMG, 148.0-136.5",
      "Moravia RD MMG def. Phillip's Perfect Team, 209.5-129.5",
      "Moravia RD MMG def. Team Epps, 135.0-134.5",
      "Northeast Winners def. Moravia RD MMG, 172.0-126.5",
      "Moravia RD MMG def. TomFootballTeam, 185.5-75.5",
      "Team Epps def. Moravia RD MMG, 141.5-123.0",
      "Moravia RD MMG def. Arise, 154.5-130.5",
      "Moravia RD MMG def. The Conqueror, 146.5-86.0",
      "Moravia RD MMG def. Lul Daddy, 134.5-114.0",
      "Heavy Gewts def. Moravia RD MMG, 183.0-108.5",
      "Moravia RD MMG def. Team Ayers, 109.0-99.5",
      "Moravia RD MMG def. The GOAT, 166.0-114.0",
      "Moravia RD MMG def. Team Ayers, 139.0-133.5"
    ],
    playoffs: [
      "Moravia RD MMG def. Team Ayers, 141.5-124.0",
      "The Conqueror def. Moravia RD MMG, 127.5-120.5",
      "Moravia RD MMG def. Northeast Winners, 158.0-118.0"
    ]
  }

};

function loadTeam(team) {
  currentTeam = team;

  const data = season2025[team];
  if (!data) return;

  const games = data[currentTab];

  let html = `<h2>${team}</h2>`;

  games.forEach(g => {
    html += `<div class="game">${g}</div>`;
  });

  document.getElementById("teamDisplay").innerHTML = html;
}document.querySelectorAll(".team-btn").forEach(button => {
  button.addEventListener("click", function() {
    const teamName = this.getAttribute("data-team");
    console.log("Clicked:", teamName);
  });
});function render2025Season() {
  const container = document.getElementById("content");

  container.innerHTML = `
    <section id="season-2025">
      <h1>2025 Season</h1>
      <p>This is the 2025 season page.</p>
      <p>Divisions are now active.</p>
    </section>
  `;
}