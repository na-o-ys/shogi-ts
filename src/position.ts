import { Cell, ExtendedMove, Move } from "./move";
import { convertToRawPiece, Piece, PieceOnBoard } from "./piece";
import { parse } from "./sfen-parser";

export type Position = {
  cells: Array<Array<PieceOnBoard | null>>;
  side: "b" | "w";
  hand: { b: Hand; w: Hand };
  lastMove?: Move;
};

export type Hand = {
  [key in Piece]: number;
};

export function parseSfen(sfen: string): Position | null {
  try {
    const parsed = parse(sfen);
    return { ...parsed };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function generateSfen(position: Position): string {
  const board = position.cells
    .map(row => {
      const rowStr: Array<string | number> = [];
      for (const cell of row) {
        if (cell === null) {
          if (typeof rowStr[rowStr.length - 1] === "number") {
            (rowStr[rowStr.length - 1] as number) += 1;
          } else {
            rowStr.push(1);
          }
        } else {
          const p = cell.side === "b" ? cell.piece.toUpperCase() : cell.piece;
          rowStr.push(p);
        }
      }
      return rowStr.join("");
    })
    .join("/");

  const ps = ["p", "l", "n", "s", "g", "b", "r", "k"] as const;
  const bhand = ps
    .map(p => {
      if (position.hand.b[p] === 0) return "";
      if (position.hand.b[p] === 1) return p.toUpperCase();
      return `${position.hand.b[p]}${p.toUpperCase()}`;
    })
    .join("");
  const whand = ps
    .map(p => {
      if (position.hand.w[p] === 0) return "";
      if (position.hand.w[p] === 1) return p;
      return `${position.hand.w[p]}${p}`;
    })
    .join("");
  let hand = bhand + whand;
  if (hand.length === 0) hand = "-";

  return [board, position.side, hand, "1"].join(" ");
}

export function doMove(
  currentPosition: Position,
  move: ExtendedMove
): Position {
  try {
    const position: Position = JSON.parse(JSON.stringify(currentPosition));
    position.side = position.side === "b" ? "w" : "b";
    if (move.type === "pass") return { ...position, lastMove: undefined };
    if (move.type === "move_from_hand") {
      position.hand[move.side][move.piece] -= 1;
      setPiece(position, move.to, { piece: move.piece, side: move.side });
    } else {
      setPiece(position, move.from, null);
      let piece: Piece = JSON.parse(JSON.stringify(move.piece));
      if (move.promote) {
        piece = `+${piece}` as Piece;
      }
      const originalPiece = getPiece(position, move.to);
      if (originalPiece) {
        position.hand[move.side][convertToRawPiece(originalPiece.piece)] += 1;
      }
      setPiece(position, move.to, { piece, side: move.side });
    }
    position.lastMove = move;
    return { ...position };
  } catch (e) {
    console.log(JSON.stringify(currentPosition));
    console.log(JSON.stringify(move));
    throw e;
  }
}

export function getPiece(position: Position, cell: Cell): PieceOnBoard | null {
  return position.cells[cell.rank - 1][9 - cell.file];
}

export function setPiece(
  position: Position,
  cell: Cell,
  piece: PieceOnBoard | null
) {
  position.cells[cell.rank - 1][9 - cell.file] = piece;
}

export function getEmptyHand(): Hand {
  return {
    p: 0,
    l: 0,
    n: 0,
    s: 0,
    g: 0,
    b: 0,
    r: 0,
    k: 0,
    "+p": 0,
    "+l": 0,
    "+n": 0,
    "+s": 0,
    "+b": 0,
    "+r": 0
  };
}

export function getEmptyPosition(): Position {
  return {
    cells: new Array(9).map(() => new Array(9)),
    side: "b",
    hand: { b: getEmptyHand(), w: getEmptyHand() }
  };
}

export function getInitialPosition(): Position {
  return parseSfen(
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
  ) as Position;
}
