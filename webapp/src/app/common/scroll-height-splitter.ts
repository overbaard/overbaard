import {List} from 'immutable';

export class ScrollHeightSplitter<T> {

  private _list: List<T>;
  private _startPositions: List<StartAndHeight>;

  private _lastIndices: VirtualScrollInfo = {start: 0, end: 0, beforePadding: 0, afterPadding: 0};

  static create<T>(itemHeight: (t: T) => number): ScrollHeightSplitter<T> {
    const splitter: ScrollHeightSplitter<T> = new ScrollHeightSplitter<T>(itemHeight);
    return splitter;
  }

  private constructor(
    private _itemHeight: (t: T) => number) {
  }

  get startPositions(): List<StartAndHeight> {
    return this._startPositions;
  }

  updateList(list: List<T>) {
    if (this._list !== list) {
      this._list = list;
      this._startPositions = List<StartAndHeight>().withMutations(mutable => {
        let current = 0;
        this._list.forEach(item => {
          const height: number = this._itemHeight(item);
          mutable.push({start: current, height: height});
          current += height;
        })
      });
    }
  }

  getVirtualScrollInfo(scrollPos: number, containerHeight: number): VirtualScrollInfo {
    let startIndex = -1;
    let endIndex = -1;
    let beforePadding = 0;
    let afterPadding = 0;

    const endPosition: StartAndHeight = this._startPositions.get(this._startPositions.size - 1);
    if (this._startPositions.size > 0) {
      if (endPosition.start + endPosition.height > scrollPos) {
        startIndex = this.findStartIndex(scrollPos);
        // Find end index
        const endPos: number = scrollPos + containerHeight;
        const startPosition: StartAndHeight = this._startPositions.get(startIndex);
        if (startPosition.start + startPosition.height >= endPos) {
          // The start and the end one are the same
          endIndex = startIndex;
        } else if (endPosition.start + endPosition.height < endPos) {
          endIndex = this._startPositions.size - 1;
        } else {
          endIndex = this.findEndIndex(startIndex, scrollPos, containerHeight);
        }
      }

      beforePadding = this._startPositions.get(startIndex).start;
      if ((this._startPositions.size - 1) > endIndex) {
        const endStartPos: StartAndHeight = this._startPositions.get(endIndex);
        const lastStartPos: StartAndHeight = this._startPositions.get(this._startPositions.size - 1);
        const last: number = lastStartPos.start + lastStartPos.height;
        const end: number = endStartPos.start + endStartPos.height;
        afterPadding = last - end;
      }
    }

    return {start: startIndex, end: endIndex, beforePadding: beforePadding, afterPadding: afterPadding};
  }

  private findStartIndex(scrollPos: number): number {
    let low = 0;
    let high: number = this._startPositions.size - 1;

    while (true) {
      const middle: number = low === high ? low : Math.floor((low + high) / 2);
      const current: StartAndHeight = this._startPositions.get(middle);
      if (current.start === scrollPos || current.start < scrollPos && current.start + current.height > scrollPos) {
        return middle;
      } else if (current.start > scrollPos) {
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }
  }

  private findEndIndex(startIndex: number, scrollPos: number, containerHeight: number): number {
    let low = startIndex;
    let high: number = this._startPositions.size - 1;
    const endPos: number = scrollPos + containerHeight;

    while (true) {
      const middle: number = low === high ? low : Math.floor((low + high) / 2);
      const current: StartAndHeight = this._startPositions.get(middle);
      const currEnd = current.start + current.height
      if (currEnd < endPos) {
        low = middle + 1;
      } else {
        if (current.start < endPos && currEnd >= endPos) {
          return middle;
        }
        high = middle - 1;
      }
    }
  }
}

export interface StartAndHeight {
  start: number;
  height: number;
}

export interface VirtualScrollInfo {
  start: number,
  end: number,
  beforePadding: number,
  afterPadding: number
}
