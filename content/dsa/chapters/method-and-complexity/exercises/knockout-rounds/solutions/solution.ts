export function knockoutRounds(players: number): number {
  let rounds = 0;
  while (players > 1) {
    // Half the players lose, rounded down, and the rest go through
    players -= Math.floor(players / 2);
    rounds++;
  }
  return rounds;
}
