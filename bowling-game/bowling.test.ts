import { test, expect } from "bun:test";
import { BowlingGame } from "./bowling";

test("gutter game scores 0", () => {
  const game = new BowlingGame();
  for (let i = 0; i < 20; i++) {
    game.roll(0);
  }
  expect(game.score()).toBe(0);
});

test("all ones scores 20", () => {
  const game = new BowlingGame();
  for (let i = 0; i < 20; i++) {
    game.roll(1);
  }
  expect(game.score()).toBe(20);
});

test("one spare scores correctly", () => {
  const game = new BowlingGame();
  game.roll(5);
  game.roll(5);
  game.roll(3);
  for (let i = 0; i < 17; i++) {
    game.roll(0);
  }
  expect(game.score()).toBe(16);
});

test("one strike scores correctly", () => {
  const game = new BowlingGame();
  game.roll(10);
  game.roll(3);
  game.roll(4);
  for (let i = 0; i < 16; i++) {
    game.roll(0);
  }
  expect(game.score()).toBe(24);
});

test("perfect game scores 300", () => {
  const game = new BowlingGame();
  for (let i = 0; i < 12; i++) {
    game.roll(10);
  }
  expect(game.score()).toBe(300);
});

test("all spares with 5 pins scores 150", () => {
  const game = new BowlingGame();
  for (let i = 0; i < 21; i++) {
    game.roll(5);
  }
  expect(game.score()).toBe(150);
});

test("throws error for invalid pins", () => {
  const game = new BowlingGame();
  expect(() => game.roll(11)).toThrow();
  expect(() => game.roll(-1)).toThrow();
});
