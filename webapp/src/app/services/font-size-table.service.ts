import {Injectable} from '@angular/core';
import {Dictionary} from '../common/dictionary';
import {freezeObject} from '../common/object-util';

@Injectable()
export class FontSizeTableService {
  private _sameCharTable: Dictionary<string> = {};
  private _table: Dictionary<Dictionary<number>> = {};
  private _nextTable: TableBuilder;

  constructor() {
    // Seed this with base ascii characters so that the unit tests can work
    for (let i = 32 ; i < 128 ; i++) {
      const s = String.fromCharCode(32);
      this._sameCharTable[s] = s;
    }
    this._sameCharTable = freezeObject(this._sameCharTable);

    this._table = freezeObject(this._table);
  }

  startModification() {
    this._nextTable = new TableBuilder(this._sameCharTable, this._table);
  }

  completeModification() {
    this._nextTable.build();
    this._sameCharTable = this._nextTable.sameCharTable;
    this._table = this._nextTable.table;
    this._nextTable = null;
  }

  setSameCharTable(table: Dictionary<string>) {
    this._nextTable.setSameCharTable(table);
  }

  addItem(name: string, character: string, size: number) {
    this._nextTable.addItem(name, character, size);
  }

  getTable(name: string): FontSizeTable {
    return new FontSizeTable(this._sameCharTable, this._table[name]);
  }
}

export class FontSizeTable {
  constructor(
    private _sameCharTable: Dictionary<string>,
    private _sizeTable: Dictionary<number>) {
  }

  getWidth(character: string): number {
    const base: string = this._sameCharTable[character];
    return this._sizeTable[base];
  }
}



class TableBuilder {

  private _sameCharTable: Dictionary<string> = {};
  private _table: Dictionary<Dictionary<number>> = {};

  constructor(existingChar: Dictionary<string>, existing: Dictionary<Dictionary<number>>) {
    this._sameCharTable = {...existingChar};
    this._table = {...existing};
    for (const key of Object.keys((existing))) {
      this._table[key] = {...existing[key]};
    }
  }

  setSameCharTable(table: Dictionary<string>) {
    for (const key of Object.keys(table)) {
      this._sameCharTable[key] = table[key];
    }
  }

  addItem(name: string, character: string, size: number) {
    let classSizes: Dictionary<number> = this._table[name];
    if (!classSizes) {
      classSizes = {};
      this._table[name] = classSizes;
    }
    classSizes[character] = size;
  }

  build() {
    for (const key of Object.keys(this._table)) {
      const classSizes: Dictionary<number> = this._table[key];
      this._table[key] = freezeObject(classSizes);
    }
    this._table = freezeObject(this._table);
    this._sameCharTable = freezeObject(this._sameCharTable);
  }

  get sameCharTable(): Dictionary<string> {
    return this._sameCharTable;
  }

  get table(): Dictionary<Dictionary<number>> {
    return this._table;
  }
}
