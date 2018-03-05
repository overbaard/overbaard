import {List} from 'immutable';
import {SwimlaneData} from '../view-model/board/swimlane-data';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardViewModel} from '../view-model/board/board-view';

export class ScrollHeightSplitter<T> {

  private _list: List<T>;
  private _startPositions: List<StartAndHeight>;

  private _lastInfo: VirtualScrollInfo = INITIAL_SCROLL_INFO;

  static create<T>(itemHeightGetter: (t: T) => number): ScrollHeightSplitter<T> {
    const splitter: ScrollHeightSplitter<T> = new ScrollHeightSplitter<T>(itemHeightGetter);
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
    private _itemHeightGetter: (t: T) => number) {
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
          const height: number = this._itemHeightGetter(item);
          mutable.push({start: current, height: height});
          current += height;
        })
      });
    }
  }

  updateVirtualScrollInfo(
    scrollPos: number,
    containerHeight: number,
    force: boolean,
    newInfoCallback: (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => void) {

    if (scrollPos < 0) {
      scrollPos = 0;
    }

    if (force || this._lastInfo === INITIAL_SCROLL_INFO) {
      this._lastInfo = this.binarySearchVirtualScrollInfos(scrollPos, containerHeight);
      newInfoCallback(this._lastInfo.start, this._lastInfo.end, this._lastInfo.beforePadding, this._lastInfo.afterPadding);
      return;
    }

    if (scrollPos > this._lastInfo.lowWaterMark && scrollPos < this._lastInfo.highWaterMark) {
      return;
    }

    this._lastInfo = this.calculateNewScrollInfo(this._lastInfo, scrollPos, containerHeight);
    newInfoCallback(this._lastInfo.start, this._lastInfo.end, this._lastInfo.beforePadding, this._lastInfo.afterPadding);
  }


  private calculateNewScrollInfo(scrollInfo: VirtualScrollInfo, scrollPos: number, containerHeight: number): VirtualScrollInfo {
    let newStart = -1;
    let newEnd = -1;

    // Check the next entries, as they are more likely to be the ones (especially if scrolling is not super-fast)
    // in order to avoid the overhead of doing the binary search on every scroll
    if (scrollPos <= scrollInfo.lowWaterMark) {
      newStart = this.checkIncrementCurrentLowWaterMark(scrollInfo, scrollPos, false);
      newEnd = this.checkIncrementCurrentHighWaterMark(scrollInfo, scrollPos, containerHeight, false);
    }
    if (scrollPos >= scrollInfo.highWaterMark) {
      newStart = this.checkIncrementCurrentLowWaterMark(scrollInfo, scrollPos, true);
      newEnd = this.checkIncrementCurrentHighWaterMark(scrollInfo, scrollPos, containerHeight, true);
    }

    if (newStart === -1 || newEnd === -1) {
      // console.log(`Binary Search ${newStart} ${newEnd}`);
      // It is not a simple increment so do the full binary search again
      return this.binarySearchVirtualScrollInfos(scrollPos, containerHeight);
    }

    // console.log(`Incremented ${newStart} ${newEnd}`);
    return this.createVirtualScrollInfo(scrollPos, containerHeight, newStart, newEnd);
  }

  private checkIncrementCurrentLowWaterMark(scrollInfo: VirtualScrollInfo, scrollPos: number, increment: boolean): number {
    let index = scrollInfo.start;
    let pos: StartAndHeight = this._startPositions.get(index);
    if (this.checkInStartRange(pos, scrollPos) === 0) {
      return index;
    } else if (increment || scrollInfo.start > 0) {
      index += increment ? 1 : -1;
      if (index >= this._startPositions.size - 1) {
        return scrollInfo.start;
      }
      pos = this._startPositions.get(index);
      if (this.checkInStartRange(pos, scrollPos) === 0) {
        return index;
      }
    }
    // It is not a simple increment, so give up and handle this in the caller
    return -1;
  }

  private checkIncrementCurrentHighWaterMark(
    scrollInfo: VirtualScrollInfo, scrollPos: number, containerHeight: number, increment: boolean): number {

    let index = scrollInfo.end;
    let pos: StartAndHeight = this._startPositions.get(index);
    if (this.checkInEndRange(pos, scrollPos, containerHeight) === 0) {
      return index;
    } else if (scrollInfo.end === this._startPositions.size - 1) {
      return this._startPositions.size - 1;
    } else if (!increment || scrollInfo.end < this.startPositions.size - 1) {
      index += increment ? 1 : -1;
      if (index < 0) {
        return scrollInfo.end;
      }
      pos = this._startPositions.get(index);
      if (this.checkInEndRange(pos, scrollPos, containerHeight) === 0) {
        return index;
      }
    }
    // It is not a simple increment, so give up and handle this in the caller
    return -1;
  }

  getVirtualScrollInfo(scrollPos: number, containerHeight: number): VirtualScrollInfo {
    return this.binarySearchVirtualScrollInfos(scrollPos, containerHeight);
  }

  private binarySearchVirtualScrollInfos(scrollPos: number, containerHeight: number): VirtualScrollInfo {
    let startIndex = -1;
    let endIndex = -1;

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

        return this.createVirtualScrollInfo(scrollPos, containerHeight, startIndex, endIndex);
      }
    }

    return INITIAL_SCROLL_INFO;
  }

  private createVirtualScrollInfo(scrollPos: number, containerHeight: number, startIndex: number, endIndex: number): VirtualScrollInfo {

    const startPosition: StartAndHeight = this._startPositions.get(startIndex);
    const endPosition: StartAndHeight = this._startPositions.get(endIndex);
    const lastPosition: StartAndHeight = this._startPositions.get(this._startPositions.size - 1);

    // Calculate paddings
    const beforePadding: number = startPosition.start;
    let afterPadding = 0;
    if ((this._startPositions.size - 1) > endIndex) {
      const last: number = lastPosition.start + lastPosition.height;
      const end: number = endPosition.start + endPosition.height;
      afterPadding = last - end;
    }

    // Calculate watermarks
    const lowWaterMark = this.findLowWaterMark(scrollPos, containerHeight, startPosition, endPosition);
    const highWaterMark = this.findHighWaterMark(scrollPos, containerHeight, startPosition, endPosition);

    // Always create a new instance
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
      switch (this.checkInStartRange(current, scrollPos)) {
        case 0:
          return middle;
        case -1:
          low = middle + 1;
          break;
        case 1:
          high = middle - 1;
      }
    }
  }

  private checkInStartRange(sah: StartAndHeight, scrollPos: number): number {
    if (sah.start === scrollPos || sah.start < scrollPos && sah.start + sah.height > scrollPos) {
      return 0;
    } else if (sah.start > scrollPos) {
      return 1;
    } else {
      return -1;
    }
  }

  private findEndIndex(startIndex: number, scrollPos: number, containerHeight: number): number {
    let checks = 0;
    let low = startIndex;
    let high: number = this._startPositions.size - 1;

    while (true) {
      checks++;
      const middle: number = low === high ? low : Math.floor((low + high) / 2);
      const current: StartAndHeight = this._startPositions.get(middle);
      const currEnd = current.start + current.height;
      switch (this.checkInEndRange(current, scrollPos, containerHeight)) {
        case 0:
          return middle;
        case -1:
          low = middle + 1;
          break;
        case 1:
          high = middle - 1;
      }
    }
  }

  private checkInEndRange(sah: StartAndHeight, scrollPos: number, containerHeight: number): number {
    const endPos: number = scrollPos + containerHeight;
    const currEnd = sah.start + sah.height;
    if (currEnd < endPos) {
      return -1;
    } else {
      if (sah.start < endPos && currEnd >= endPos) {
        return 0;
      }
      return 1;
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

const INITIAL_SCROLL_INFO: VirtualScrollInfo = {start: -1, end: -1, beforePadding: 0, afterPadding: 0, lowWaterMark: -1, highWaterMark: -1};

