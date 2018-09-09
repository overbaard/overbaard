import {List} from 'immutable';

export class TableBuilder<T> {
  private readonly _current: ColumnBuilder<T>[];

  constructor(states: number, private readonly _existing: List<List<T>>) {
    this._current = new Array<ColumnBuilder<T>>(states);
    for (let i = 0 ; i < this._current.length ; i++) {
      if (_existing) {
        this._current[i] = new ExistingColumnBuilder(i, this._existing.get(i));
      } else {
        this._current[i] = new NewColumnBuilder();
      }
    }

  }

  push(index: number, value: T) {
    this._current[index].push(value);
  }

  build(): List<List<T>> {
    if (!this._existing) {
      return List<List<T>>().withMutations(mutable => {
        for (const column of this._current) {
          mutable.push(column.getList());
        }
      });
    } else {
      let changed = false;
      const table: List<List<T>> = List<List<T>>().withMutations(mutable => {
        for (const column of this._current) {
          changed = changed || column.isChanged();
          mutable.push(column.getList());
        }
      });
      if (!changed) {
        return this._existing;
      }
      return table;
    }
  }
}

interface ColumnBuilder<T> {
  push(value: T);
  isChanged(): boolean;
  getList(): List<T>;
}

class ExistingColumnBuilder<T> implements ColumnBuilder<T> {
  private _current: List<T>;
  private _index = 0;
  private _changed = false;

  constructor(private _column: number, private _existing: List<T>) {
  }

  push(value: T) {
    if (!this._changed) {
      if (this._existing.size <= this._index) {
        this._changed = true;
      } else {
        if (this._existing.get(this._index) !== value) {
          this._changed = true;
        }
      }
      this._index++;
    }
    if (!this._current) {
      this._current = List<T>().asMutable();
    }
    this._current.push(value);
  }

  isChanged(): boolean {
    return this._changed || this.safeSize(this._existing) !== this.safeSize(this._current);
  }

  private safeSize(list: List<T>): number {
    if (!list) {
      return 0;
    }
    return list.size;
  }

  getList(): List<T> {
    if (this.isChanged()) {
      return this._current ? this._current.asImmutable() : List<T>();
    }
    return this._existing;
  }
}

class NewColumnBuilder<T> implements ColumnBuilder<T> {
  private _current: List<T> = List<T>().asMutable();
  private _changed = true;


  push(value: T) {
    this._current.push(value);
  }

  isChanged(): boolean {
    return this._changed;
  }

  getList(): List<T> {
    return this._current.asImmutable();
  }
}
