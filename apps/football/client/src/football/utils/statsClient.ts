/* ═══════════════════════════════════════════════════════════
   FOOTBALL STATS TRACKER
   ═══════════════════════════════════════════════════════════ */

interface MatchStatRecord {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  duration: number; // milliseconds
  timestamp: number;
  playerStats: Record<
    string,
    {
      goals: number;
      assists: number;
      passAccuracy: number;
      shotsOnTarget: number;
      tackles: number;
      rating: number;
    }
  >;
}

class FootballStatsClient {
  private stats: MatchStatRecord[] = [];
  private currentMatchId: string = "";
  private storageKey = "football_match_stats";

  constructor() {
    this.loadStats();
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.stats = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load stats:", e);
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch (e) {
      console.warn("Failed to save stats:", e);
    }
  }

  startMatch(matchId: string, _homeTeam: string, _awayTeam: string): void {
    this.currentMatchId = matchId;
  }

  recordGoal(_playerId: string, playerName: string, teamSide: "home" | "away"): void {
    if (!this.currentMatchId) return;
    console.log(`⚽ GOAL: ${playerName} (${teamSide})`);
  }

  recordAssist(_playerId: string, playerName: string, teamSide: "home" | "away"): void {
    if (!this.currentMatchId) return;
    console.log(`🎯 ASSIST: ${playerName} (${teamSide})`);
  }

  recordShot(playerId: string, onTarget: boolean): void {
    if (!this.currentMatchId) return;
    console.log(`🔫 SHOT: ${playerId} - ${onTarget ? "ON TARGET" : "OFF TARGET"}`);
  }

  recordPass(playerId: string, successful: boolean): void {
    if (!this.currentMatchId) return;
    if (successful) {
      console.log(`✅ PASS: ${playerId}`);
    }
  }

  recordTackle(playerId: string): void {
    if (!this.currentMatchId) return;
    console.log(`🛡️ TACKLE: ${playerId}`);
  }

  recordFoul(playerId: string, cardType?: "yellow" | "red"): void {
    if (!this.currentMatchId) return;
    console.log(`⚠️ FOUL: ${playerId} ${cardType ? `(${cardType} card)` : ""}`);
  }

  recordSave(goalkeeperId: string): void {
    if (!this.currentMatchId) return;
    console.log(`🧤 SAVE: ${goalkeeperId}`);
  }

  endMatch(
    homeScore: number,
    awayScore: number,
    homeTeam: string,
    awayTeam: string,
    duration: number
  ): void {
    if (!this.currentMatchId) return;

    const record: MatchStatRecord = {
      matchId: this.currentMatchId,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      duration,
      timestamp: Date.now(),
      playerStats: {},
    };

    this.stats.push(record);
    this.saveStats();
    this.currentMatchId = "";
  }

  getStats(): MatchStatRecord[] {
    return this.stats;
  }

  getTeamStats(teamName: string): {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  } {
    const teamMatches = this.stats.filter((s) => s.homeTeam === teamName || s.awayTeam === teamName);

    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    teamMatches.forEach((match) => {
      played++;
      const isHome = match.homeTeam === teamName;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamScore;
      goalsAgainst += oppScore;

      if (teamScore > oppScore) won++;
      else if (teamScore === oppScore) drawn++;
      else lost++;
    });

    const points = won * 3 + drawn * 1;
    const goalDifference = goalsFor - goalsAgainst;

    return { played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points };
  }

  getLeaderboard(): Array<{
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }> {
    const teams = new Set<string>();
    this.stats.forEach((s) => {
      teams.add(s.homeTeam);
      teams.add(s.awayTeam);
    });

    const standings = Array.from(teams)
      .map((team) => ({
        team,
        ...this.getTeamStats(team),
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

    return standings;
  }

  getTopScorers(_limit: number = 10): Array<{
    playerName: string;
    goals: number;
    assists: number;
    matches: number;
  }> {
    // This would need player-level tracking in match stats
    // Placeholder for now
    return [];
  }

  clearAllStats(): void {
    this.stats = [];
    this.saveStats();
  }
}

export const statsClient = new FootballStatsClient();

export const recordGoal = (playerId: string, playerName: string, teamSide: "home" | "away") => {
  statsClient.recordGoal(playerId, playerName, teamSide);
};

export const recordAssist = (playerId: string, playerName: string, teamSide: "home" | "away") => {
  statsClient.recordAssist(playerId, playerName, teamSide);
};

export const recordShot = (playerId: string, onTarget: boolean) => {
  statsClient.recordShot(playerId, onTarget);
};

export const recordPass = (playerId: string, successful: boolean) => {
  statsClient.recordPass(playerId, successful);
};

export const recordTackle = (playerId: string) => {
  statsClient.recordTackle(playerId);
};

export const recordFoul = (playerId: string, cardType?: "yellow" | "red") => {
  statsClient.recordFoul(playerId, cardType);
};

export const recordSave = (goalkeeperId: string) => {
  statsClient.recordSave(goalkeeperId);
};

export default statsClient;
