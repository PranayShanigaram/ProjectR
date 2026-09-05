const fs = require("fs");
const path = require("path");

/**
 * Commentary Generator for football matches
 * Generates real-time match commentary as events occur
 */

class CommentaryGenerator {
  constructor(homeTeam, awayTeam, gameId) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.gameId = gameId;
    this.commentaryLines = [];
    this.filePath = this.initCommentaryFile();
    this.passCount = 0;
    this.lastCommentaryTime = 0;
    this.passSequenceTeam = null;
    this.passSequenceCount = 0;
  }

  initCommentaryFile() {
    const commentaryDir = path.join(__dirname, "..", "client", "src", "football", "commentary");
    if (!fs.existsSync(commentaryDir)) {
      fs.mkdirSync(commentaryDir, { recursive: true });
    }
    const fileName = `match_${this.gameId}_${Date.now()}.txt`;
    const filePath = path.join(commentaryDir, fileName);
    
    // Write header
    const header = `=====================================\nFOOTBALL MATCH COMMENTARY\n${this.homeTeam.name} vs ${this.awayTeam.name}\n${this.homeTeam.flag} vs ${this.awayTeam.flag}\nStart Time: ${new Date().toLocaleString()}\n=====================================\n\n`;
    fs.writeFileSync(filePath, header, "utf8");
    
    return filePath;
  }

  addCommentary(text) {
    const timestamp = new Date().toLocaleTimeString();
    const line = `[${timestamp}] ${text}`;
    this.commentaryLines.push(line);
    
    try {
      fs.appendFileSync(this.filePath, line + "\n", "utf8");
    } catch (e) {
      console.error("Failed to write commentary to file:", e);
    }
    
    return line;
  }

  dribbleCommentary(playerName, teamName) {
    const comments = [
      `${playerName} takes the ball forward with pace!`,
      `${playerName} bursts past the midfield with purpose.`,
      `Great dribbling from ${playerName}! The defense is being pressed.`,
      `${playerName} drives forward into dangerous territory.`,
      `The ball is glued to ${playerName}'s feet as he charges forward.`,
      `What a run from ${playerName}! He's creating space.`,
    ];
    this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
  }

  decisionCommentary(playerName, decision, reason) {
    if (decision === "shoot") {
      const comments = [
        `${playerName} lines up a shot! Will he go for goal?`,
        `Here's the chance! ${playerName} preparing to shoot!`,
        `${playerName} sees an opening. Is this the moment?`,
      ];
      this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
    } else if (decision === "pass") {
      const comments = [
        `${playerName} looks for a teammate to continue the attack.`,
        `Playing it out? ${playerName} searching for support.`,
        `${playerName} circulates possession looking for the killer pass.`,
      ];
      this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
    } else if (decision === "blocked") {
      const comments = [
        `${playerName} blocked by the defense! No space to work with.`,
        `The defense closes down on ${playerName} - options are limited.`,
        `${playerName} is being marked tightly, can't find a way through.`,
      ];
      this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
    }
  }

  blockCommentary(defenderName, attackerName) {
    const comments = [
      `Excellent defending! ${defenderName} cuts out that pass!`,
      `${defenderName} gets in the way! Great positioning from the defense.`,
      `A strong tackle from ${defenderName}! Denying ${attackerName} the ball.`,
      `${defenderName} with timely intervention to stop ${attackerName}.`,
    ];
    this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
  }

  possessionCommentary(teamName, area) {
    const comments = [
      `${teamName} has possession in the ${area}.`,
      `${teamName} working the ball around in the ${area}.`,
      `The possession is with ${teamName} in the ${area}.`,
      `${teamName} controlling the game in the ${area}.`,
    ];
    this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
  }

  nearMissCommentary(playerName, teamName) {
    const comments = [
      `OH SO CLOSE! ${playerName} almost breaks through! Just wide!`,
      `What a chance! ${playerName} nearly finds the target!`,
      `So close! ${playerName}'s effort inches away from goal!`,
      `NEARLY! ${playerName} gets a shot away but it just misses!`,
    ];
    this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
  }

  matchStarted() {
    const greetings = [
      `Good day everyone and welcome to this fantastic match between ${this.homeTeam.name} and ${this.awayTeam.name}!`,
      `Hello friends! What a pleasant day for football. ${this.homeTeam.name} ${this.homeTeam.flag} will take on ${this.awayTeam.name} ${this.awayTeam.flag}.`,
      `Welcome to the stadium! The atmosphere is electric as ${this.homeTeam.name} prepare to face ${this.awayTeam.name}. This should be a thrilling encounter!`,
      `Ladies and gentlemen, what an exciting day we have in store! ${this.homeTeam.name} against ${this.awayTeam.name} – let's see who comes out on top!`
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.addCommentary(greeting);
  }

  passCommentary(passerName, receiverName, passerTeam) {
    // Track pass sequences for exciting commentary
    if (this.passSequenceTeam !== passerTeam) {
      this.passSequenceTeam = passerTeam;
      this.passSequenceCount = 0;
    }
    
    this.passSequenceCount++;
    
    if (this.passSequenceCount === 1) {
      this.addCommentary(`${passerName} has the ball. Looks to play it forward...`);
    } else if (this.passSequenceCount === 2) {
      this.addCommentary(`Nice pass! ${receiverName} receives it.`);
    } else if (this.passSequenceCount === 3) {
      this.addCommentary(`Building up nicely here. ${passerName} with another touch.`);
    } else if (this.passSequenceCount === 4) {
      this.addCommentary(`The ball is moving around well. ${receiverName} in possession.`);
    } else if (this.passSequenceCount >= 5) {
      const comments = [
        `Lovely football on display here! ${passerName} keeping possession.`,
        `The defense is being carved open with these passes. ${receiverName} continuing the move.`,
        `Excellent build-up play! ${passerName} spreading the ball around.`,
        `You can see the pattern forming here. Nice triangular passes. ${receiverName} with space.`
      ];
      this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
    }
  }

  shotCommentary(playerName, teamName, shotOnTarget) {
    const comments = shotOnTarget ? [
      `OH! ${playerName} unleashes a powerful shot! This could be it!`,
      `CHANCE! ${playerName} has a clear sight of goal and... SHOOTS!`,
      `What a chance! ${playerName} lets fly with a thunderous effort!`,
      `Here's an opportunity! ${playerName} strikes the ball cleanly!`
    ] : [
      `${playerName} goes for goal but the shot is wide!`,
      `That's off target from ${playerName}. Just a bit off the mark.`,
      `Close! ${playerName}'s shot flies just past the goal.`
    ];
    
    this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
    this.passSequenceTeam = null;
    this.passSequenceCount = 0;
  }

  goalCommentary(goalTeam, playerName, scoreLine) {
    const roars = [
      `GOOOOOOOOOAAAAAAAAL!!!!! ${playerName} has done it! What a strike! ${goalTeam} takes the lead ${scoreLine}!`,
      `YESSSSS!!! GOOOOOAL!!! ${playerName} finds the back of the net! BRILLIANT! The score is now ${scoreLine}!`,
      `OHHHHHHH WHAT A GOAL!!! ${playerName} gets the magic touch! ${goalTeam} go ahead ${scoreLine}!`,
      `IT'S IN!!! GOAL!!! MAGNIFICENT from ${playerName}! The crowd goes wild! ${goalTeam} ${scoreLine}!`
    ];
    
    this.addCommentary("");
    this.addCommentary("═══════════════════════════════════════");
    this.addCommentary(roars[Math.floor(Math.random() * roars.length)]);
    this.addCommentary("═══════════════════════════════════════");
    this.addCommentary("");
    
    this.passSequenceTeam = null;
    this.passSequenceCount = 0;
  }

  penaltyCommentary(penaltyTeam, playerName) {
    this.addCommentary("");
    this.addCommentary("⚠ PENALTY KICK! ⚠");
    this.addCommentary(`${penaltyTeam} have been awarded a penalty! ${playerName} will take it.`);
    this.addCommentary("The referee points to the spot. The crowd holds its breath...");
    this.addCommentary("");
  }

  goalKickCommentary(teamName) {
    this.addCommentary(`⚽ GOAL KICK - ${teamName}`);
    this.addCommentary(`The goalkeeper shapes up to take the goal kick.`);
  }

  cornerCommentary(teamName) {
    this.addCommentary("");
    this.addCommentary("🔶 CORNER KICK!");
    this.addCommentary(`${teamName} will take the corner. Excellent delivery opportunity!`);
  }

  throwInCommentary(teamName) {
    this.addCommentary(`↪️ THROW IN - ${teamName}`);
  }

  cardCommentary(cardType, playerName) {
    if (cardType === "yellow") {
      this.addCommentary(`⚠️ YELLOW CARD for ${playerName}! The referee shows the card.`);
    } else {
      this.addCommentary(`🔴 RED CARD for ${playerName}! That's a straight red! Off the field!`);
    }
  }

  shootoutCommentary() {
    this.addCommentary("");
    this.addCommentary("════════════════════════════════════════");
    this.addCommentary("🎯 PENALTY SHOOTOUT BEGINS!");
    this.addCommentary("The match is level at the end of 90 minutes!");
    this.addCommentary("Both teams will now battle it out from 12 yards!");
    this.addCommentary("════════════════════════════════════════");
    this.addCommentary("");
  }

  shootoutGoalCommentary(playerName, teamName, shootoutScore) {
    this.addCommentary(`⚽ GOOOOAL!!! ${playerName} scores for ${teamName}! Shootout score: ${shootoutScore}`);
  }

  shootoutMissCommentary(playerName, teamName, shootoutScore) {
    this.addCommentary(`❌ MISSED! ${playerName}'s effort goes wide or is saved! ${teamName} misses! Shootout score: ${shootoutScore}`);
  }

  matchEndCommentary(winner, finalScore, isShootout = false) {
    this.addCommentary("");
    this.addCommentary("════════════════════════════════════════");
    if (winner === "draw") {
      this.addCommentary(`FULL TIME! The match ends in a DRAW! Final Score: ${finalScore}`);
    } else {
      this.addCommentary(`🏆 FULL TIME! MATCH OVER!`);
      this.addCommentary(`Winner: ${winner === "home" ? this.homeTeam.name : this.awayTeam.name}!`);
      this.addCommentary(`Final Score: ${finalScore}`);
      if (isShootout) {
        this.addCommentary(`Victory comes via penalty shootout!`);
      }
    }
    this.addCommentary(`End Time: ${new Date().toLocaleString()}`);
    this.addCommentary("════════════════════════════════════════");
    this.addCommentary("");
  }

  getCommentaryFile() {
    return this.filePath;
  }
}

module.exports = CommentaryGenerator;
