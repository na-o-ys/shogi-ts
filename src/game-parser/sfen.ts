import { createMoveFromSfen } from "../move";
import { doMove, generateSfen, getInitialPosition } from "../position";
import { isChecked } from "../rule";
import { parse } from "../sfen-parser";
import { ParseError, ParseSuccess } from "./";

const SfenPositionRegex = /^\s*(position\s+)(sfen\s+[^m]+|startpos)(\s+moves\s+.*)?$/;
const SfenStringRegex = /sfen\s+([^\n]*)/;

export function parseSfenString(sfen: string): ParseSuccess | ParseError {
  try {
    const position = parse(sfen);
    return {
      type: "success",
      game: {
        positions: [position],
        sfenPositions: [generateSfen(position)],
        turns: 1,
        moves: [],
        isChecked: [isChecked(position)]
      }
    };
  } catch (error) {
    return { type: "parse_error", message: error.toString() };
  }
}

export function parseSfenPosition(
  sfenPosition: string
): ParseSuccess | ParseError {
  try {
    const result = SfenPositionRegex.exec(sfenPosition);
    if (!result) return { type: "parse_error", message: "regex failed" };
    const st = result[2];
    let position =
      st === "startpos"
        ? getInitialPosition()
        : parse(SfenStringRegex.exec(st)![1]);

    const positions = [position];
    const moves = [];

    const mv = result[3];
    if (mv) {
      const sfenMoves = mv
        .split(" ")
        .filter(m => m)
        .slice(1);
      for (const sfenMove of sfenMoves) {
        const move = createMoveFromSfen(sfenMove, position);
        if (!move) return { type: "parse_error", message: "move parse failed" };
        moves.push(move);
        position = doMove(position, move);
        positions.push(position);
      }
    }

    return {
      type: "success",
      game: {
        positions,
        sfenPositions: positions.map(generateSfen),
        isChecked: positions.map(isChecked),
        moves,
        turns: positions.length
      }
    };
  } catch (error) {
    return { type: "parse_error", message: error.toString() };
  }
}
