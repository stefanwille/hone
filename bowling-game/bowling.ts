export class BowlingGame {
  private rolls: number[] = [];

  roll(pins: number): void {
    if (pins < 0 || pins > 10) {
      throw new Error("Pins must be between 0 and 10");
    }
    this.rolls.push(pins);
  }

  score(): number {
    let totalScore = 0;
    let rollIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(rollIndex)) {
        totalScore += 10 + this.strikeBonus(rollIndex);
        rollIndex += 1;
      } else if (this.isSpare(rollIndex)) {
        totalScore += 10 + this.spareBonus(rollIndex);
        rollIndex += 2;
      } else {
        totalScore += this.sumOfTwoRolls(rollIndex);
        rollIndex += 2;
      }
    }

    return totalScore;
  }

  private isStrike(rollIndex: number): boolean {
    return this.rolls[rollIndex] === 10;
  }

  private isSpare(rollIndex: number): boolean {
    const first = this.rolls[rollIndex] ?? 0;
    const second = this.rolls[rollIndex + 1] ?? 0;
    return first + second === 10;
  }

  private sumOfTwoRolls(rollIndex: number): number {
    const first = this.rolls[rollIndex] ?? 0;
    const second = this.rolls[rollIndex + 1] ?? 0;
    return first + second;
  }

  private strikeBonus(rollIndex: number): number {
    const first = this.rolls[rollIndex + 1] ?? 0;
    const second = this.rolls[rollIndex + 2] ?? 0;
    return first + second;
  }

  private spareBonus(rollIndex: number): number {
    return this.rolls[rollIndex + 2] ?? 0;
  }
}
