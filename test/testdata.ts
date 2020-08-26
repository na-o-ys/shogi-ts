import { readFileSync, readdirSync } from "fs";
import path from "path";

export function getSfen(): string[] {
  return readFileSync(path.join(__dirname, "data", "sfen.txt"))
    .toString()
    .split("\n");
}

export function getSfenString(): string[] {
  return readFileSync(path.join(__dirname, "data", "sfenString.txt"))
    .toString()
    .split("\n");
}

export type KifuFile = {
  kifu: string;
  data: {
    turns: number;
    sfen: string;
  };
};
export function getKifFiles(): KifuFile[] {
  const files = readdirSync(path.join(__dirname, "data")).filter(file =>
    /.*\.kif$/.test(file)
  );
  return files.map(file => ({
    kifu: readFileSync(path.join(__dirname, "data", file)).toString(),
    data: JSON.parse(
      readFileSync(path.join(__dirname, "data", `${file}.json`)).toString()
    )
  }));
}

export function getCsaFiles(): KifuFile[] {
  const files = readdirSync(path.join(__dirname, "data")).filter(file =>
    /.*\.csa$/.test(file)
  );
  return files.map(file => ({
    kifu: readFileSync(path.join(__dirname, "data", file)).toString(),
    data: JSON.parse(
      readFileSync(path.join(__dirname, "data", `${file}.json`)).toString()
    )
  }));
}
