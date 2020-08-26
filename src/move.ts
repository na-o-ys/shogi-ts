import { jpPieceMap, Piece } from "./piece";
import { getPiece, Position } from "./position";
import { canPromote } from "./rule";

export type Move = MoveFromCell | MoveFromHand;

export type MoveFromCell = {
  type: "move_from_cell";
  side: "b" | "w";
  piece: Piece;
  from: Cell;
  to: Cell;
  promote: boolean;
};

export type MoveFromHand = {
  type: "move_from_hand";
  side: "b" | "w";
  piece: Piece;
  to: Cell;
};

export type Cell = {
  file: number;
  rank: number;
};

export type ExtendedMove = Move | { type: "pass" };

export function createMoveFromSfen(
  sfen: string,
  position: Position
): Move | null {
  if (!/([1-9][a-i][1-9][a-i]\+?)|([KRBGSNLP]\*[1-9][a-i])/.test(sfen)) {
    console.error(`cannot parse sfen move: ${sfen}`);
    return null;
  }
  const to = {
    file: sfen.charCodeAt(2) - "0".charCodeAt(0),
    rank: sfen.charCodeAt(3) - "a".charCodeAt(0) + 1
  };
  const fromHand = sfen[1] === "*";
  if (fromHand) {
    return {
      type: "move_from_hand",
      to,
      piece: sfen[0].toLowerCase() as Piece,
      side: position.side
    };
  } else {
    const from = {
      file: sfen.charCodeAt(0) - "0".charCodeAt(0),
      rank: sfen.charCodeAt(1) - "a".charCodeAt(0) + 1
    };
    const piece = getPiece(position, from);
    if (piece === null) {
      return null;
    }
    const promote = sfen[4] === "+";
    return {
      type: "move_from_cell",
      side: position.side,
      from,
      to,
      piece: piece.piece,
      promote
    };
  }
}

export function convertMoveToSfen(move: Move): string {
  const to = `${move.to.file}${String.fromCharCode(
    "a".charCodeAt(0) + move.to.rank - 1
  )}`;
  if (move.type === "move_from_cell") {
    const from = `${move.from.file}${String.fromCharCode(
      "a".charCodeAt(0) + move.from.rank - 1
    )}`;
    const promote = move.promote ? "+" : "";
    return `${from}${to}${promote}`;
  } else {
    const piece = move.piece.toUpperCase();
    return `${piece}*${to}`;
  }
}

export function convertMoveJp(move: Move): string {
  const side = move.side === "b" ? "▲" : "△";
  const moveTo = `${move.to.file}${move.to.rank}`;
  const piece = jpPieceMap[move.piece];
  let promote = "";
  if (
    move.type === "move_from_cell" &&
    canPromote(move.side, move.from, move.to, move.piece)
  ) {
    promote = move.promote ? "成" : "不成";
  }
  const moveFrom =
    move.type === "move_from_cell"
      ? `(${move.from.file}${move.from.rank})`
      : "打";

  return side + moveTo + piece + promote + moveFrom;
}

export function createExtendedMoveFromSfen(
  sfen: string,
  position: Position
): ExtendedMove | null {
  if (sfen === "pass") return { type: "pass" };
  return createMoveFromSfen(sfen, position);
}

export function convertExtendedMoveToSfen(move: ExtendedMove): string {
  if (move.type === "pass") return "pass";
  return convertMoveToSfen(move);
}
