/**
 * definition: http://shogidokoro.starfree.jp/usi.html
 */
{
  function getEmptyHand() {
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
}

start
  = sfen

sfen
  = cells:cells " " side:side " " hand:hand " " turn:turn {
      return { cells, side, hand, turn };
    }

cells
  = tokens:(piece / blankCells / newLine)+ {
      const result = [];
      let row = [];
      for (const token of tokens) {
        switch (token.type) {
          case "piece":
            row.push(token.data);
            break;
          case "blankCells":
            for (let i = 0; i < token.count; i++) {
              row.push(null);
            }
            break;
          case "newLine":
            result.push(row);
            row = [];
            break;
        }
      }
      result.push(row);
      return result;
    }

piece
  = piece:$(promotion? [lnsgkprbLNSGKPRB]) {
      let side = "b";
      if (piece == piece.toLowerCase()) side = "w";
      return {
        type: "piece",
        data: {
          piece: piece.toLowerCase(),
          side
        }
      }
    }

blankCells
  = count:integer {
      return {
        type: "blankCells",
        count
      }
    }

newLine
  = "/" {
      return {
        type: "newLine"
      }
    }

promotion
 = "+"

side
 = [bw]

hand
  = entries:handEntry+ {
      const result = { b: getEmptyHand(), w: getEmptyHand() };
      for (const entry of entries) {
        result[entry.side][entry.piece] = entry.count;
      }
      return result;
    }
    / emptyHand

handEntry
  = count:integer ? piece:[lnsgprbLNSGPRB] {
      let side = "b";
      if (piece == piece.toLowerCase()) side = "w";
      if (count == null) count = 1;
      return {
        piece: piece.toLowerCase(),
        count,
        side
      };
    }

emptyHand
  = "-" {
      return { b: getEmptyHand(), w: getEmptyHand() };
    }

turn
 = integer

integer
 = integer:$[0-9]+ { return parseInt(integer, 10); }