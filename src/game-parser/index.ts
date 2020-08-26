import { Parsers } from "json-kifu-format";
import {
  IMoveMoveFormat,
  IMoveFormat
} from "json-kifu-format/dist/src/Formats";
import { Game } from "../game";
import { Cell, Move } from "../move";
import { Piece } from "../piece";
import {
  doMove,
  getInitialPosition,
  generateSfen,
  getPiece
} from "../position";
import { isChecked } from "../rule";

export { parseSfenString, parseSfenPosition } from "./sfen";

export type ParseSuccess = {
  type: "success";
  game: Game;
};
export type ParseError = {
  type: "parse_error";
  message: string;
};
export function parseKif(text: string): ParseSuccess | ParseError {
  try {
    const lines = text.split("\n").filter(l => l.length > 0);
    while (true) {
      const last = lines[lines.length - 1];
      if (last.match(/^\s*\d+/)) break;
      lines.pop();
    }
    const jkf = Parsers.parseKIF(lines.join("\n") + "\n");
    if (
      jkf.initial &&
      jkf.initial.preset !== "HIRATE" &&
      JSON.stringify(jkf.initial.data) !== JSON.stringify(hirateData)
    ) {
      return { type: "parse_error", message: "平手以外は未対応です" };
    }
    return {
      type: "success",
      game: parseJkfMoves(jkf.moves)
    };
  } catch (e) {
    return { type: "parse_error", message: e.toString() };
  }
}

export function parseCsa(text: string): ParseSuccess | ParseError {
  try {
    const lines = text.split("\n").filter(l => l.length > 0);
    const jkf = Parsers.parseCSA(lines.join("\n") + "\n");
    if (
      jkf.initial &&
      jkf.initial.preset !== "HIRATE" &&
      JSON.stringify(jkf.initial.data) !== JSON.stringify(hirateData)
    ) {
      return { type: "parse_error", message: "平手以外は未対応です" };
    }
    return {
      type: "success",
      game: parseJkfMoves(jkf.moves)
    };
  } catch (e) {
    return { type: "parse_error", message: e.toString() };
  }
}

function parseJkfMoves(jkfMoves: IMoveFormat[]): Game {
  let lastMoveTo: { x: number; y: number } | undefined;
  let side: "b" | "w" = "w";
  const moves: Move[] = jkfMoves
    .slice(1)
    .map(m => {
      side = side === "b" ? "w" : "b";
      if (!m.move) return null;
      const jkfMove = m.move as IMoveMoveFormat;
      if (jkfMove.same && jkfMove.to === undefined) {
        jkfMove.to = lastMoveTo;
      }
      if (!jkfMove.to) throw new Error("move.to is undefined");
      lastMoveTo = jkfMove.to;

      const piece: Piece = CsaToSfen[jkfMove.piece];
      const to: Cell = { file: jkfMove.to.x, rank: jkfMove.to.y };
      if (jkfMove.from) {
        const from: Cell = { file: jkfMove.from.x, rank: jkfMove.from.y };
        const promote = jkfMove.promote === true;
        return {
          type: "move_from_cell",
          from,
          to,
          piece,
          side,
          promote
        };
      }
      return {
        type: "move_from_hand",
        to,
        piece,
        side
      };
    })
    .filter(v => v) as Move[];

  const positions = [getInitialPosition()];
  let crr = positions[0];
  for (const move of moves) {
    crr = doMove(crr, move);
    positions.push(crr);
  }
  const sfenPositions = positions.map(generateSfen);
  const turns = positions.length;

  return normalizeGame({
    positions,
    sfenPositions,
    isChecked: positions.map(isChecked),
    moves,
    turns
  });
}

// JKF CSA パースのバグ
// promote が常に false, piece が成り駒
export function normalizeGame(game: Game): Game {
  const moves: Move[] = [];
  for (let i = 0; i < game.turns - 1; i++) {
    const position = game.positions[i];
    const move = game.moves[i];
    if (move.type === "move_from_cell") {
      const piece = getPiece(position, move.from)?.piece || move.piece;
      const promote = move.piece === `+${piece}` || move.promote;
      moves.push({
        ...move,
        piece,
        promote
      });
    } else {
      moves.push(move);
    }
  }
  return {
    ...game,
    moves
  };
}

const CsaToSfen: { [key: string]: Piece } = {
  FU: "p",
  KY: "l",
  KE: "n",
  GI: "s",
  KI: "g",
  KA: "b",
  HI: "r",
  OU: "k",
  TO: "+p",
  NY: "+l",
  NK: "+n",
  NG: "+s",
  UM: "+b",
  RY: "+r"
};

const hirateData = {
  board: [
    [
      { color: 1, kind: "KY" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "KY" }
    ],
    [
      { color: 1, kind: "KE" },
      { color: 1, kind: "KA" },
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      { color: 0, kind: "HI" },
      { color: 0, kind: "KE" }
    ],
    [
      { color: 1, kind: "GI" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "GI" }
    ],
    [
      { color: 1, kind: "KI" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "KI" }
    ],
    [
      { color: 1, kind: "OU" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "OU" }
    ],
    [
      { color: 1, kind: "KI" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "KI" }
    ],
    [
      { color: 1, kind: "GI" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "GI" }
    ],
    [
      { color: 1, kind: "KE" },
      { color: 1, kind: "HI" },
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      { color: 0, kind: "KA" },
      { color: 0, kind: "KE" }
    ],
    [
      { color: 1, kind: "KY" },
      {},
      { color: 1, kind: "FU" },
      {},
      {},
      {},
      { color: 0, kind: "FU" },
      {},
      { color: 0, kind: "KY" }
    ]
  ],
  hands: [
    { FU: 0, KY: 0, KE: 0, GI: 0, KI: 0, KA: 0, HI: 0 },
    { FU: 0, KY: 0, KE: 0, GI: 0, KI: 0, KA: 0, HI: 0 }
  ],
  color: 0
};
