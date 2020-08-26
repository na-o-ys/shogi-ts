import { Position } from "./position";
import { Move, ExtendedMove } from "./move";
import { validateMove } from "./rule";

export type Game = {
  positions: Position[];
  sfenPositions: string[];
  isChecked: boolean[];
  moves: Move[];
  turns: number;
};

export type ExtendedGame = Omit<Game, "moves"> & { moves: ExtendedMove[] };

export type ValidateResult = Valid | Invalid;
export type Valid = { type: "valid" };
export type Invalid = {
  type: "invalid";
  turn: number;
  message: string;
  validGame: ExtendedGame;
};
export function validateGame(game: ExtendedGame): ValidateResult {
  for (let i = 0; i < game.turns - 1; i++) {
    const position = game.positions[i];
    const move = game.moves[i];
    const validateMoveResult = validateMove(position, move);
    if (validateMoveResult.type === "invalid") {
      return {
        type: "invalid",
        turn: i + 1,
        message: validateMoveResult.reason,
        validGame: {
          positions: game.positions.slice(0, i + 1),
          sfenPositions: game.sfenPositions.slice(0, i + 1),
          isChecked: game.isChecked.slice(0, i + 1),
          moves: game.moves.slice(0, i),
          turns: i + 1
        }
      };
    }
  }
  return { type: "valid" };
}
