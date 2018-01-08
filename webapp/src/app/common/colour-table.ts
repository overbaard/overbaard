import {Map} from 'immutable';

export class ColourTable {

  static readonly INSTANCE: ColourTable = new ColourTable();

  private tables: Map<number, string[]> = Map<number, string[]>();

  private constructor() {
  }

  getColourTable(length: number): string[] {
    let table: string[] = this.tables.get(length);
    if (table) {
      return table;
    }

    table = this.calculateColourTable(length);
    this.tables = this.tables.withMutations(mutable => {
      this.tables.set(length, table);
    });

    return table;
  }

  private calculateColourTable(length: number): string[] {
    const odd: boolean = length % 2 === 1;
    let len: number = length;
    if (!odd) {
      // Insert a fake half-way element to simplify the calculations
      len = length + 1;
    }
    const max = 255;
    const halfLength: number = Math.floor(len / 2);

    const increment: number = max / 2 / halfLength;

    const table: string[] = new Array(length);
    let insertIndex = 0;

    for (let i = 0; i < len; i++) {
      let red = 0;
      let green = 0;
      if (i === halfLength) {
        red = max;
        green = max;
        if (!odd) {
          // Skip this fake element
          continue;
        }
      } else if (i < halfLength) {
        red = max;
        green = i === 0 ? 0 : Math.round(max / 2 + increment * i);
      } else {
        // The yellow to green part of the scale is a bit too shiny, so reduce the brightness
        // while keeping the red to green ratio
        const adjustment: number = 4 / 5;
        if (i === len - 1) {
          red = 0;
          green = 220;
        } else {
          red = Math.round((max - increment * (i - halfLength)));
          green = Math.round(max * adjustment);
        }
      }

      const colourString: string = '#' + this.toHex(red) + this.toHex(green) + '00';
      table[insertIndex] = colourString;
      // console.log(insertIndex + " " + colourString + " " + red + " " + green);
      insertIndex++;
    }
    return table;
  }

  private toHex(i: number): string {
    let s: string = i.toString(16);
    if (s.length === 1) {
      s = '0' + s;
    }
    return s;
  }

}
