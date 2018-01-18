import {Injectable} from '@angular/core';
import {Dictionary} from '../common/dictionary';
import {freezeObject} from '../common/object-util';

@Injectable()
export class FontSizeTableService {
  private _table: Dictionary<Dictionary<number>> = {};
  private _nextTable: TableBuilder;

  startModification() {
    this._nextTable = new TableBuilder(this._table);
  }

  completeModification() {
    this._table = this._nextTable.build();
    this._nextTable = null;
  }

  addItem(name: string, character: string, size: number) {
    this._nextTable.addItem(name, character, size);
  }

  getTable(name: string) {
    return this._table[name];
  }
}

class TableBuilder {

  private _table: Dictionary<Dictionary<number>> = {};

  constructor(existing: Dictionary<Dictionary<number>>) {
    this._table = {...existing};
    for (const key of Object.keys((existing))) {
      this._table[key] = {...existing[key]};
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

  build(): Dictionary<Dictionary<number>> {
    for (const key of Object.keys(this._table)) {
      const classSizes: Dictionary<number> = this._table[key];
      this._table[key] = freezeObject(classSizes);
    }
    return freezeObject(this._table);
  }
}
