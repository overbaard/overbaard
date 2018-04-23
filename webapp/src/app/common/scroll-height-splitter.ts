import {List} from 'immutable';

export class ScrollHeightSplitter<T> {

  private _list: List<T>;
  private _startPositions: List<StartAndHeight>;

  private _lastContainerHeight = -1;
  private _lastInfo: VirtualScrollInfo = INITIAL_SCROLL_INFO;

  static create<T>(eagerlyDrop: boolean, itemHeightGetter: (t: T) => number): ScrollHeightSplitter<T> {
    const splitter: ScrollHeightSplitter<T> = new ScrollHeightSplitter<T>(eagerlyDrop, itemHeightGetter);
    return splitter;
  }

  constructor(
    private _eagerlyDrop: boolean,
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
      // Deal with any 'bounce' when quickly scrolling to the top of the page
      scrollPos = 0;
    }

    if (force || this._lastContainerHeight !== containerHeight || this._lastInfo === INITIAL_SCROLL_INFO) {
      const newInfo: VirtualScrollInfo = this.binarySearchVirtualScrollInfos(scrollPos, containerHeight);
      if (force || this._lastInfo.start !== newInfo.start || this._lastInfo.end !== newInfo.end) {
        newInfoCallback(newInfo.start, newInfo.end, newInfo.beforePadding, newInfo.afterPadding);
      }
      this._lastInfo = newInfo;
      this._lastContainerHeight = containerHeight;
      return;
    }

    if (scrollPos >= this._lastInfo.newEntryLowMark && (this._lastInfo.isPastLast || scrollPos <= this._lastInfo.newEntryHighMark)) {
      if (!this._eagerlyDrop || scrollPos === this._lastInfo.scrollPos) {
        return;
      }
      if (scrollPos > this._lastInfo.scrollPos && (this._lastInfo.isPastLast || scrollPos < this._lastInfo.dropIncrementMark)) {
        return;
      } else if (scrollPos < this._lastInfo.scrollPos && scrollPos > this._lastInfo.dropDecrementMark) {
        return;
      }
    }

    this._lastInfo = this.calculateNewScrollInfo(this._lastInfo, scrollPos, containerHeight);
    newInfoCallback(this._lastInfo.start, this._lastInfo.end, this._lastInfo.beforePadding, this._lastInfo.afterPadding);
  }


  private calculateNewScrollInfo(scrollInfo: VirtualScrollInfo, scrollPos: number, containerHeight: number): VirtualScrollInfo {
    let newStart = -1;
    let newEnd = -1;

    // Check the next entries, as they are more likely to be the ones (especially if scrolling is not super-fast)
    // in order to avoid the overhead of doing the binary search on every scroll
    if (scrollPos < scrollInfo.newEntryLowMark) {
      newStart = this.checkIncrementCurrentLowWaterMark(scrollInfo, scrollPos, false);
      newEnd = this.checkIncrementCurrentHighWaterMark(scrollInfo, scrollPos, containerHeight, false);
    } else if (scrollPos > scrollInfo.newEntryHighMark) {
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
    if (pos) {
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
    }

    // It is not a simple increment, so give up and handle this in the caller
    return -1;
  }

  private checkIncrementCurrentHighWaterMark(
    scrollInfo: VirtualScrollInfo, scrollPos: number, containerHeight: number, increment: boolean): number {

    let index = scrollInfo.end;
    let pos: StartAndHeight = this._startPositions.get(index);
    if (pos) {
      if (this.checkInEndRange(pos, scrollPos, containerHeight) === 0) {
        return index;
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
    }
    // It is not a simple increment, so give up and handle this in the caller
    return -1;
  }

  private binarySearchVirtualScrollInfos(scrollPos: number, containerHeight: number): VirtualScrollInfo {
    let startIndex = -1;
    let endIndex = -1;

    const lastPosition: StartAndHeight = this._startPositions.get(this._startPositions.size - 1);
    if (this._startPositions.size > 0) {
      if (lastPosition.start + lastPosition.height > scrollPos) {
        startIndex = this.binarySearchStartIndex(scrollPos);
        // Find end index
        const endPos: number = scrollPos + containerHeight;
        const startPosition: StartAndHeight = this._startPositions.get(startIndex);
        if (startPosition.start + startPosition.height >= endPos) {
          // The start and the end one are the same
          endIndex = startIndex;
        } else if (lastPosition.start + lastPosition.height < endPos) {
          endIndex = this._startPositions.size - 1;
        } else {
          endIndex = this.binarySearchEndIndex(startIndex, scrollPos, containerHeight);
        }
        return this.createVirtualScrollInfo(scrollPos, containerHeight, startIndex, endIndex);
      }
    }

    let beforePadding = 0;
    if (lastPosition) {
      beforePadding = lastPosition.start + lastPosition.height;
    }

    return {
      scrollPos: scrollPos,
      start: -1, end: -1,
      beforePadding: beforePadding, afterPadding: 0,
      newEntryLowMark: beforePadding, newEntryHighMark: -1,
      dropIncrementMark: -1, dropDecrementMark: -1,
      isPastLast: true};
  }

  private findNewEntryLowMark(startPos: StartAndHeight): number {
    return startPos.start;
  }

  private findNewEntryHighMark(containerHeight: number, endPos: StartAndHeight, last: boolean): number {
    const wm: number = this.calculateEndPos(endPos);
    if (last) {
      return wm;
    }

    return wm - containerHeight;
  }

  private findDropLowMark(startPos: StartAndHeight) {
    return startPos.start + startPos.height;
  }

  private findDropHighMark(containerHeight: number, endPos: StartAndHeight) {
    return endPos.start - 1 - containerHeight;
  }

  private binarySearchStartIndex(scrollPos: number): number {
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
    const currEnd = this.calculateEndPos(sah);
    if (sah.start <= scrollPos && currEnd >= scrollPos) {
      return 0;
    } else if (sah.start > scrollPos) {
      return 1;
    } else {
      return -1;
    }
  }

  private binarySearchEndIndex(startIndex: number, scrollPos: number, containerHeight: number): number {
    let checks = 0;
    let low = startIndex;
    let high: number = this._startPositions.size - 1;

    while (true) {
      checks++;
      const middle: number = low === high ? low : Math.floor((low + high) / 2);
      const current: StartAndHeight = this._startPositions.get(middle);
      switch (this.checkInEndRange(current, scrollPos, containerHeight)) {
        case 0:
          return middle;
        case -1:
          if (middle === high) {
            return middle;
          }
          low = middle + 1;
          break;
        case 1:
          high = middle - 1;
      }
    }
  }

  private checkInEndRange(sah: StartAndHeight, scrollPos: number, containerHeight: number): number {
    const endPos: number = scrollPos + containerHeight;
    const currEnd = this.calculateEndPos(sah);
    if (sah.start <= endPos && currEnd >= endPos) {
      return 0;
    } else if (currEnd < endPos) {
      return -1;
    } else {
      return 1;
    }
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
    const newEntryLowMark = this.findNewEntryLowMark(startPosition);
    const newEntryHighMark = this.findNewEntryHighMark(containerHeight, endPosition, lastPosition === endPosition);
    let dropLowMark = -1;
    let dropHighMark = -1;
    if (this._eagerlyDrop) {
      dropLowMark = this.findDropLowMark(startPosition);
      dropHighMark = this.findDropHighMark(containerHeight, endPosition);
    }

    // Always create a new instance
    const info: VirtualScrollInfo = {
      scrollPos: scrollPos,
      start: startIndex, end: endIndex,
      beforePadding: beforePadding, afterPadding: afterPadding,
      newEntryLowMark: newEntryLowMark, newEntryHighMark: newEntryHighMark,
      dropIncrementMark: dropLowMark, dropDecrementMark: dropHighMark,
      isPastLast: false};

    // console.log(JSON.stringify(info));
    return info;
  }

  private calculateEndPos(sah: StartAndHeight) {
    return sah.start + sah.height - 1;
  }
}

export interface StartAndHeight {
  start: number;
  height: number;
}

interface VirtualScrollInfo {
  scrollPos: number;
  start: number;
  end: number;
  beforePadding: number;
  afterPadding: number;
  newEntryLowMark: number;
  newEntryHighMark: number;
  dropIncrementMark: number;
  dropDecrementMark: number;
  isPastLast: boolean;
}

const INITIAL_SCROLL_INFO: VirtualScrollInfo = {
  scrollPos: -1,
  start: -1, end: -1, beforePadding: 0, afterPadding: 0,
  newEntryLowMark: -1, newEntryHighMark: -1, dropIncrementMark: -1, dropDecrementMark: -1, isPastLast: false};
