import {List} from 'immutable';

export class ScrollHeightSplitter<T> {

  private _list: List<T>;
  private _startPositions: List<StartAndHeight>;

  private _lastIndices: VirtualScrollInfo = {start: 0, end: 0, beforePadding: 0, afterPadding: 0, lowWaterMark: -1, highWaterMark: -1};

  static create<T>(itemHeight: (t: T) => number): ScrollHeightSplitter<T> {
    const splitter: ScrollHeightSplitter<T> = new ScrollHeightSplitter<T>(itemHeight);
    return splitter;
  }

  static same(a: VirtualScrollInfo, b: VirtualScrollInfo) {
    return a.start === b.start &&
      a.end === b.end &&
      a.beforePadding === b.beforePadding &&
      a.afterPadding === b.afterPadding;
  }

  static isWithinScrollWaterMark(scrollTop: number, scrollInfo: VirtualScrollInfo) {
    if (scrollInfo.highWaterMark === -1 || scrollInfo.lowWaterMark === -1) {
      return false;
    }
    return scrollTop > scrollInfo.lowWaterMark && scrollTop < scrollInfo.highWaterMark;
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
    let highWaterMark = -1;
    let lowWaterMark = -1;

    const lastPosition: StartAndHeight = this._startPositions.get(this._startPositions.size - 1);
    if (this._startPositions.size > 0) {
      if (lastPosition.start + lastPosition.height > scrollPos) {
        startIndex = this.findStartIndex(scrollPos);
        // Find end index
        const endPos: number = scrollPos + containerHeight;
        const startPosition: StartAndHeight = this._startPositions.get(startIndex);
        if (startPosition.start + startPosition.height >= endPos) {
          // The start and the end one are the same
          endIndex = startIndex;
        } else if (lastPosition.start + lastPosition.height < endPos) {
          endIndex = this._startPositions.size - 1;
        } else {
          endIndex = this.findEndIndex(startIndex, scrollPos, containerHeight);
        }
        const endPosition: StartAndHeight = this._startPositions.get(endIndex);

        // Calculate paddings
        beforePadding = startPosition.start;
        if ((this._startPositions.size - 1) > endIndex) {
          const last: number = lastPosition.start + lastPosition.height;
          const end: number = endPosition.start + endPosition.height;
          afterPadding = last - end;
        }

        // Calculate watermarks
        lowWaterMark = this.findLowWaterMark(scrollPos, containerHeight, startPosition, endPosition);
        highWaterMark = this.findHighWaterMark(scrollPos, containerHeight, startPosition, endPosition);
      }
    }

    return {
      start: startIndex, end: endIndex,
      beforePadding: beforePadding, afterPadding: afterPadding,
      lowWaterMark: lowWaterMark, highWaterMark: highWaterMark};
  }

  private findLowWaterMark(scrollPos: number, containerHeight: number, startPos: StartAndHeight, endPos: StartAndHeight): number {
    const startMark: number = startPos.start;
    const endMark: number = endPos.start - containerHeight;
    if (endMark < 0) {
      return startMark;
    }
    return this.minimumDeltaMark(scrollPos, startMark, endMark);
  }

  private findHighWaterMark(scrollPos: number, containerHeight: number, startPos: StartAndHeight, endPos: StartAndHeight): number {
    const startMark: number = startPos.start + startPos.height;
    const endMark: number = endPos.start + endPos.height - containerHeight;
    return this.minimumDeltaMark(scrollPos, startMark, endMark);
  }

  private minimumDeltaMark(scrollPos: number, startMark: number, endMark: number): number {
    if (endMark < 0) {
      return startMark;
    }

    const startDelta = Math.abs(startMark - scrollPos);
    const endDelta = Math.abs(endMark - scrollPos);
    if (endDelta < startDelta) {
      return endMark;
    }
    return startMark;
  }

  private findStartIndex(scrollPos: number): number {
    let checks = 0;
    let low = 0;
    let high: number = this._startPositions.size - 1;

    while (true) {
      checks++;
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
    let checks = 0;
    let low = startIndex;
    let high: number = this._startPositions.size - 1;
    const endPos: number = scrollPos + containerHeight;

    while (true) {
      checks++;
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
  afterPadding: number,
  lowWaterMark: number,
  highWaterMark: number
}
