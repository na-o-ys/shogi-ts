import { getSfen, getSfenString, getKifFiles, getCsaFiles } from "./testdata";
import {
  parseSfenPosition,
  parseSfenString,
  parseKif,
  parseCsa
} from "../src/game-parser";
import { Game } from "../src/game";
import { generateSfen } from "../src/position";
import { convertMoveToSfen } from "../src/move";

test("parseSfenPosition", () => {
  for (const sfen of getSfen()) {
    const result = parseSfenPosition(sfen);
    expect(result.type).toEqual("success");
    if (result.type !== "success") return;

    expect(convertGameToSfen(result.game)).toEqual(sfen);
  }
});

test("parseSfenString", () => {
  for (const sfenString of getSfenString()) {
    const result = parseSfenString(sfenString);
    expect(result.type).toEqual("success");
    if (result.type !== "success") return;

    const { game } = result;
    expect(game.turns).toEqual(1);
    expect(game.sfenPositions[0]).toEqual(sfenString);
    expect(generateSfen(game.positions[0])).toEqual(sfenString);
  }
});

test("parseKif", () => {
  const files = getKifFiles();
  for (const file of files) {
    const result = parseKif(file.kifu);
    expect(result.type).toEqual("success");
    if (result.type !== "success") return;

    const { game } = result;
    expect(game.turns).toEqual(file.data.turns);
    expect(convertGameToSfen(game)).toEqual(file.data.sfen);
  }
});

test("parseCsa", () => {
  const files = getCsaFiles();
  for (const file of files) {
    const result = parseCsa(file.kifu);
    expect(result.type).toEqual("success");
    if (result.type !== "success") return;

    const { game } = result;
    expect(game.turns).toEqual(file.data.turns);
    expect(convertGameToSfen(game)).toEqual(file.data.sfen);
  }
});

const InitialSfen =
  "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
function convertGameToSfen(game: Game): string {
  const initPos = game.positions[0];
  const initSfen = generateSfen(initPos);
  const initPosStr = initSfen === InitialSfen ? "startpos" : `sfen ${initSfen}`;
  const moves = game.moves.map(convertMoveToSfen).join(" ");
  const movesStr = moves ? ` moves ${moves}` : "";
  return `position ${initPosStr}${movesStr}`;
}
