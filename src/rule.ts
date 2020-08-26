import { Cell, Move, ExtendedMove } from "./move";
import { Piece } from "./piece";
import { doMove, getPiece, Position } from "./position";

export function canPromote(
  side: "b" | "w",
  from: Cell,
  to: Cell,
  piece: Piece
): boolean {
  if (!piece) return false;
  const canPromotePiece = ["l", "n", "s", "b", "r", "p"].includes(piece);
  if (!canPromotePiece) return false;

  const isPromoteArea = (rank: number) =>
    (side === "b" && rank <= 3) || (side === "w" && rank >= 7);
  return isPromoteArea(from.rank) || isPromoteArea(to.rank);
}

// checked: 王手放置
// unchecked: 打ち歩詰め, 行き所の無い駒, 二歩
export type ValidateMoveResult =
  | {
      type: "valid";
    }
  | {
      type: "invalid";
      reason: string;
    };
export function validateMove(
  position: Position,
  move: ExtendedMove
): ValidateMoveResult {
  if (move.type === "move_from_cell") {
    if (position.side !== move.side)
      return { type: "invalid", reason: "手番違い" };
    const fromP = getPiece(position, move.from);
    if (fromP?.side !== move.side || fromP?.piece !== move.piece)
      return { type: "invalid", reason: "不正な移動元" };
    const toP = getPiece(position, move.to);
    if (toP && toP.side === move.side)
      return { type: "invalid", reason: "不正な移動先" };
  }
  if (move.type === "move_from_hand") {
    if (position.side !== move.side)
      return { type: "invalid", reason: "手番違い" };
    const toP = getPiece(position, move.to);
    if (toP) return { type: "invalid", reason: "不正な移動先" };
    if (position.hand[move.side][move.piece] <= 0)
      return {
        type: "invalid",
        reason: "存在しない持ち駒"
      };
  }
  if (isChecked({ ...doMove(position, move), side: position.side })) {
    return { type: "invalid", reason: "王手放置" };
  }
  return { type: "valid" };
}

export function getLegalMoves(position: Position): Move[] {
  // TODO: 打ち歩詰めチェック
  let kingCell: Cell | undefined;
  for (let file = 1; file <= 9; file++) {
    for (let rank = 1; rank <= 9; rank++) {
      const piece = getPiece(position, { file, rank });
      if (piece && piece.side === position.side && piece.piece === "k") {
        kingCell = { file, rank };
      }
    }
  }
  const moves = getPseudoLegalMoves(position);
  if (kingCell === undefined) return moves;
  const rev = (side: "b" | "w", rank: number) =>
    side === "b" ? rank : 10 - rank;
  return moves.filter(move => {
    // 行き所のない駒
    if (move.type === "move_from_hand" || !move.promote) {
      if (["p", "l"].includes(move.piece) && rev(move.side, move.to.rank) === 1)
        return false;
      if (move.piece === "n" && rev(move.side, move.to.rank) <= 2) return false;
    }

    // 王手放置
    const nextPosition = doMove(position, move);
    const nextKingCell = move.piece === "k" ? move.to : kingCell!;
    return getPseudoLegalMoves(nextPosition).every(
      m => !(m.to.file === nextKingCell.file && m.to.rank === nextKingCell.rank)
    );
  });
}

export function isChecked(position: Position): boolean {
  let kingCell: Cell | undefined;
  for (let file = 1; file <= 9; file++) {
    for (let rank = 1; rank <= 9; rank++) {
      const piece = getPiece(position, { file, rank });
      if (piece && piece.side === position.side && piece.piece === "k") {
        kingCell = { file, rank };
      }
    }
  }
  if (kingCell === undefined) return false;
  return getPseudoLegalMoves({
    ...position,
    side: position.side === "b" ? "w" : "b"
  }).some(m => m.to.file === kingCell?.file && m.to.rank === kingCell.rank);
}

// unchecked: 王手放置, 打ち歩詰め, 行き所の無い駒
// checked: 二歩
function getPseudoLegalMoves(position: Position): Move[] {
  const moves: Move[] = [];
  for (let rank = 1; rank <= 9; rank++) {
    for (let file = 1; file <= 9; file++) {
      const piece = getPiece(position, { rank, file });
      if (piece && piece.side === position.side) {
        moves.push(...getPsuedoLegalMovesFrom(position, { rank, file }));
      }
    }
  }
  const hand = position.hand[position.side];
  const toCells0 = getMovesFromHand(position, 0);
  const toCells1 = getMovesFromHand(position, 1);
  const toCells2 = getMovesFromHand(position, 2);
  const toCellsP = getMovesFromHandPawn(position);
  moves.push(
    ...(["s", "g", "b", "r"] as const).flatMap(piece =>
      hand[piece] > 0
        ? toCells0.map(to => genMovesFromHand(position, piece, to))
        : []
    )
  );
  moves.push(
    ...(["l"] as const).flatMap(piece =>
      hand[piece] > 0
        ? toCells1.map(to => genMovesFromHand(position, piece, to))
        : []
    )
  );
  moves.push(
    ...(["n"] as const).flatMap(piece =>
      hand[piece] > 0
        ? toCells2.map(to => genMovesFromHand(position, piece, to))
        : []
    )
  );
  moves.push(
    ...(["p"] as const).flatMap(piece =>
      hand[piece] > 0
        ? toCellsP.map(to => genMovesFromHand(position, piece, to))
        : []
    )
  );
  return moves;
}

function genMovesFromHand(position: Position, piece: Piece, to: Cell): Move {
  return {
    type: "move_from_hand",
    side: position.side,
    piece,
    to
  };
}

function getPsuedoLegalMovesFrom(position: Position, cell: Cell): Move[] {
  const piece = getPiece(position, cell);
  if (piece === null || piece.side !== position.side) return [];
  switch (piece.piece) {
    case "l":
      return getMovesL(position, cell);
    case "n":
      return getMovesN(position, cell);
    case "s":
      return getMovesS(position, cell);
    case "g":
      return getMovesG(position, cell);
    case "k":
      return getMovesK(position, cell);
    case "b":
      return getMovesB(position, cell);
    case "r":
      return getMovesR(position, cell);
    case "p":
      return getMovesP(position, cell);
    case "+l":
    case "+n":
    case "+s":
    case "+p":
      return getMovesG(position, cell);
    case "+b":
      return getMovesBp(position, cell);
    case "+r":
      return getMovesRp(position, cell);
  }
}

function canMovePsuedoLegally(position: Position, cell: Cell): boolean {
  if (!isValidRange(cell)) return false;
  const piece = getPiece(position, cell);
  return piece === null || piece.side !== position.side;
}

function isValidRange(cell: Cell) {
  return cell.file >= 1 && cell.file <= 9 && cell.rank >= 1 && cell.rank <= 9;
}

function dir({ side }: Position): number {
  return side === "b" ? -1 : 1;
}

function getPromotes(
  { side }: Position,
  from: Cell,
  to: Cell,
  piece: Piece
): boolean[] {
  return canPromote(side, from, to, piece) ? [true, false] : [false];
}

function genMovesFromCell(position: Position, from: Cell, to: Cell): Move[] {
  if (!canMovePsuedoLegally(position, to)) return [];
  const piece = getPiece(position, from);
  if (piece === null) return [];
  return getPromotes(position, from, to, piece.piece).map(promote => ({
    type: "move_from_cell",
    side: position.side,
    piece: piece.piece,
    from,
    to,
    promote
  }));
}

function getMovesL(position: Position, cell: Cell): Move[] {
  return getStraightMoves(position, cell, {
    file: 0,
    rank: dir(position)
  }).flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesN(position: Position, cell: Cell): Move[] {
  return [
    { file: cell.file - 1, rank: cell.rank + dir(position) * 2 },
    { file: cell.file + 1, rank: cell.rank + dir(position) * 2 }
  ].flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesP(position: Position, cell: Cell): Move[] {
  return [{ file: cell.file, rank: cell.rank + dir(position) }].flatMap(to =>
    genMovesFromCell(position, cell, to)
  );
}

function getMovesG(position: Position, cell: Cell): Move[] {
  return [
    { file: cell.file - 1, rank: cell.rank },
    { file: cell.file + 1, rank: cell.rank },
    { file: cell.file, rank: cell.rank - dir(position) },
    { file: cell.file - 1, rank: cell.rank + dir(position) },
    { file: cell.file + 1, rank: cell.rank + dir(position) },
    { file: cell.file, rank: cell.rank + dir(position) }
  ].flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesS(position: Position, cell: Cell): Move[] {
  return [
    { file: cell.file - 1, rank: cell.rank + dir(position) },
    { file: cell.file + 1, rank: cell.rank + dir(position) },
    { file: cell.file, rank: cell.rank + dir(position) },
    { file: cell.file - 1, rank: cell.rank - dir(position) },
    { file: cell.file + 1, rank: cell.rank - dir(position) }
  ].flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesK(position: Position, cell: Cell): Move[] {
  return [
    { file: cell.file - 1, rank: cell.rank - 1 },
    { file: cell.file, rank: cell.rank - 1 },
    { file: cell.file + 1, rank: cell.rank - 1 },
    { file: cell.file - 1, rank: cell.rank },
    { file: cell.file + 1, rank: cell.rank },
    { file: cell.file - 1, rank: cell.rank + 1 },
    { file: cell.file, rank: cell.rank + 1 },
    { file: cell.file + 1, rank: cell.rank + 1 }
  ].flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesB(position: Position, cell: Cell): Move[] {
  return [
    { file: -1, rank: -1 },
    { file: -1, rank: 1 },
    { file: 1, rank: -1 },
    { file: 1, rank: 1 }
  ]
    .flatMap(d => getStraightMoves(position, cell, d))
    .flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesR(position: Position, cell: Cell): Move[] {
  return [
    { file: -1, rank: 0 },
    { file: 1, rank: 0 },
    { file: 0, rank: -1 },
    { file: 0, rank: 1 }
  ]
    .flatMap(d => getStraightMoves(position, cell, d))
    .flatMap(to => genMovesFromCell(position, cell, to));
}

function getMovesBp(position: Position, cell: Cell): Move[] {
  const movesA = getMovesB(position, cell).map(move => ({
    ...move,
    piece: "+b" as Piece
  }));
  const movesB = [
    { file: cell.file, rank: cell.rank + 1 },
    { file: cell.file, rank: cell.rank - 1 },
    { file: cell.file - 1, rank: cell.rank },
    { file: cell.file + 1, rank: cell.rank }
  ].flatMap(to => genMovesFromCell(position, cell, to));

  return movesA.concat(movesB);
}

function getMovesRp(position: Position, cell: Cell): Move[] {
  const movesA = getMovesR(position, cell).map(move => ({
    ...move,
    piece: "+r" as Piece
  }));
  const movesB = [
    { file: cell.file + 1, rank: cell.rank + 1 },
    { file: cell.file + 1, rank: cell.rank - 1 },
    { file: cell.file - 1, rank: cell.rank + 1 },
    { file: cell.file - 1, rank: cell.rank - 1 }
  ].flatMap(to => genMovesFromCell(position, cell, to));
  return movesA.concat(movesB);
}

function getStraightMoves(
  position: Position,
  cell: Cell,
  d: { file: number; rank: number }
): Cell[] {
  const moves: Cell[] = [];
  let i = 1;
  while (true) {
    const next = { file: cell.file + d.file * i, rank: cell.rank + d.rank * i };
    if (!canMovePsuedoLegally(position, next)) break;
    moves.push(next);
    const piece = getPiece(position, next);
    if (piece && piece.side !== position.side) break;
    i += 1;
  }
  return moves;
}

function getMovesFromHand(position: Position, rankBound: number): Cell[] {
  const rankL = position.side === "b" ? 1 + rankBound : 1;
  const rankH = position.side === "b" ? 9 : 9 - rankBound;
  const moves: Cell[] = [];
  for (let file = 1; file <= 9; file++) {
    for (let rank = rankL; rank <= rankH; rank++) {
      if (getPiece(position, { file, rank }) === null) {
        moves.push({ file, rank });
      }
    }
  }
  return moves;
}

function getMovesFromHandPawn(position: Position): Cell[] {
  const rankL = position.side === "b" ? 2 : 1;
  const rankH = position.side === "b" ? 9 : 8;
  let cells: Cell[] = [];
  for (let file = 1; file <= 9; file++) {
    const fileCells: Cell[] = [];
    let cantPut = false;
    for (let rank = rankL; rank <= rankH; rank++) {
      const piece = getPiece(position, { file, rank });
      if (piece && piece.side === position.side && piece.piece === "p")
        cantPut = true;
      if (piece === null) {
        fileCells.push({ file, rank });
      }
    }
    if (!cantPut) cells = cells.concat(fileCells);
  }
  return cells;
}
