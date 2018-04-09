import {List} from 'immutable';
import {ScrollHeightSplitter} from './scroll-height-splitter';

export interface ScrollInfo {
  startIndex: number;
  endIndex: number;
  beforePadding: number;
  afterPadding: number;
}

let callbackInfo: ScrollInfo;

describe('Scroll Height Splitter Tests', () => {
  describe('Non-eager drop', () => {
    const splitter: ScrollHeightSplitter<number> = ScrollHeightSplitter.create(false, n => n);
    const containerHeight = 60;
    beforeEach(() => {
      const list: List<number> = List<number>([20, 30, 20, 20, 30, 30]);
      splitter.updateList(list);
      expect(splitter.startPositions.toArray()).toEqual([
        {start: 0, height: 20},  // 0
        {start: 20, height: 30},  // 1
        {start: 50, height: 20},  // 2
        {start: 70, height: 20},  // 3
        {start: 90, height: 30},  // 4
        {start: 120, height: 30}, // 5
      ]);

      callbackInfo = null;
      splitter.updateVirtualScrollInfo(0, containerHeight, true, callback);
      checkCallbackInfo(0, 2, 0, 80);
      callbackInfo = null;

    });

    describe('Non-Binary Search', () => {

      /*
       * force=false for these ones indicates it should attempt to increment to the next issue
       * before doing a binary search. Most of these tests do a slow increment so the
       * incrementation is tested. The fallback to binary search is tested in the New Issues/Decrement
       * test where it jumps to the end
       */

      const force = false;

      describe('Same issue', () => {

        // Just scrolls over the same issue

        it('Increment scroll', () => {
          checkNoNewCallbackInfo(splitter, containerHeight, 1, 2, 3, 4, 5, 6, 7, 8, 9);
        });

        it('Decrement scroll', () => {
          checkNoNewCallbackInfo(splitter, containerHeight, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);
        });
      });
      describe('New issues', () => {

        // Brings in new issues as we scroll

        it('Increment', () => {
          // Bring in a new issue
          splitter.updateVirtualScrollInfo(11, containerHeight, force, callback);
          checkCallbackInfo(0, 3, 0, 60);

          // These don't bring in new issues. Although we could lose some of the older issues here,
          // we don't bother recalculating every time here
          checkNoNewCallbackInfo(splitter, containerHeight, 20, 29);

          splitter.updateVirtualScrollInfo(30, containerHeight, force, callback);
          checkCallbackInfo(1, 4, 20, 30);

          // These don't bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 31, 50, 59);

          splitter.updateVirtualScrollInfo(60, containerHeight, force, callback);
          checkCallbackInfo(2, 5, 50, 0);

          // These don't bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 61, 70, 80);

          // Although the end of the screen is now past the end we're not bringing in any new issue
          checkNoNewCallbackInfo(splitter, containerHeight, 90);

          // These don't bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 110, 120, 140, 149);

          // We have now gone past the end
          splitter.updateVirtualScrollInfo(150, containerHeight, force, callback);
          checkCallbackInfo(-1, -1, 150, 0);

          checkNoNewCallbackInfo(splitter, containerHeight, 151, 200, 300);
        });

        it('Decrement', () => {
          // Jump to the end - this forces a binary search
          splitter.updateVirtualScrollInfo(300, containerHeight, force, callback);
          checkCallbackInfo(-1, -1, 150, 0);

          // These should not bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 200, 151, 150);


          splitter.updateVirtualScrollInfo(149, containerHeight, force, callback);
          checkCallbackInfo(5, 5, 120, 0);

          // These should not bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 140, 130, 120);

          splitter.updateVirtualScrollInfo(119, containerHeight, force, callback);
          checkCallbackInfo(4, 5, 90, 0);

          // These should not bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 110, 90);

          splitter.updateVirtualScrollInfo(89, containerHeight, force, callback);
          checkCallbackInfo(3, 5, 70, 0);

          // These should not bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 80, 70);

          splitter.updateVirtualScrollInfo(69, containerHeight, force, callback);
          checkCallbackInfo(2, 5, 50, 0);

          // These should not bring in new issues
          checkNoNewCallbackInfo(splitter, containerHeight, 60, 50);

          splitter.updateVirtualScrollInfo(49, containerHeight, force, callback);
          checkCallbackInfo(1, 4, 20, 30);

          checkNoNewCallbackInfo(splitter, containerHeight, 40, 30, 20);

          splitter.updateVirtualScrollInfo(19, containerHeight, force, callback);
          checkCallbackInfo(0, 3, 0, 60);

          checkNoNewCallbackInfo(splitter, containerHeight, -1);
        });
      });
    });

    it('Binary Search', () => {
      // Use force=true to enforce binary search
      const force = true;

      // Jump to the end - this forces a binary search
      splitter.updateVirtualScrollInfo(300, containerHeight, force, callback);
      checkCallbackInfo(-1, -1, 150, 0);

      // The gap here is big enough to check the fallback to binary search
      splitter.updateVirtualScrollInfo(19, containerHeight, false, callback);
      checkCallbackInfo(0, 3, 0, 60);

      splitter.updateVirtualScrollInfo(20, containerHeight, force, callback);
      checkCallbackInfo(1, 3, 20, 60);

      splitter.updateVirtualScrollInfo(29, containerHeight, force, callback);
      checkCallbackInfo(1, 3, 20, 60);

      splitter.updateVirtualScrollInfo(30, containerHeight, force, callback);
      checkCallbackInfo(1, 4, 20, 30);

      splitter.updateVirtualScrollInfo(49, containerHeight, force, callback);
      checkCallbackInfo(1, 4, 20, 30);

      splitter.updateVirtualScrollInfo(50, containerHeight, force, callback);
      checkCallbackInfo(2, 4, 50, 30);

      splitter.updateVirtualScrollInfo(69, containerHeight, force, callback);
      checkCallbackInfo(2, 5, 50, 0);

      splitter.updateVirtualScrollInfo(70, containerHeight, force, callback);
      checkCallbackInfo(3, 5, 70, 0);

      // Do some extra checks here as we're about to overrun the end
      splitter.updateVirtualScrollInfo(89, containerHeight, force, callback);
      checkCallbackInfo(3, 5, 70, 0);
      splitter.updateVirtualScrollInfo(90, containerHeight, force, callback);
      checkCallbackInfo(4, 5, 90, 0);
      splitter.updateVirtualScrollInfo(91, containerHeight, force, callback);
      checkCallbackInfo(4, 5, 90, 0);


      splitter.updateVirtualScrollInfo(119, containerHeight, force, callback);
      checkCallbackInfo(4, 5, 90, 0);

      splitter.updateVirtualScrollInfo(149, containerHeight, force, callback);
      checkCallbackInfo(5, 5, 120, 0);
    });

    it('Test scroll, no issues', () => {
      callbackInfo = null;
      splitter.updateList(List<number>());
      expect(splitter.startPositions.toArray()).toEqual([]);

      // An update happens for the first change (to change the internal tracking), after that there should be no change
      splitter.updateVirtualScrollInfo(40, containerHeight, true, callback); // Use force=true since we updated the list
      checkCallbackInfo(-1, -1, 0, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 800, 10, 0, -1, 10);
    });
  });

  describe('Eager drop', () => {
    const splitter: ScrollHeightSplitter<number> = ScrollHeightSplitter.create(true, n => n);
    const containerHeight = 60;
    beforeEach(() => {
      const list: List<number> = List<number>([20, 30, 20, 20, 30, 30]);
      splitter.updateList(list);
      expect(splitter.startPositions.toArray()).toEqual([
        {start: 0, height: 20},  // 0
        {start: 20, height: 30},  // 1
        {start: 50, height: 20},  // 2
        {start: 70, height: 20},  // 3
        {start: 90, height: 30},  // 4
        {start: 120, height: 30}, // 5
      ]);

      callbackInfo = null;
      splitter.updateVirtualScrollInfo(0, containerHeight, true, callback);
      checkCallbackInfo(0, 2, 0, 80);
      callbackInfo = null;
    });

    it('Increment', () => {
      checkNoNewCallbackInfo(splitter, containerHeight, 5);

      // This just brings in a new one but doesn't drop anything as we're still in the range of the start one
      splitter.updateVirtualScrollInfo(10, containerHeight, false, callback);
      checkCallbackInfo(0, 3, 0, 60);

      checkNoNewCallbackInfo(splitter, containerHeight, 11, 15, 19);

      // Should have dropped the start one
      splitter.updateVirtualScrollInfo(20, containerHeight, false, callback);
      checkCallbackInfo(1, 3, 20, 60);

      // This just brings in a new one but doesn't drop anything as we're still in the range of the start one
      splitter.updateVirtualScrollInfo(45, containerHeight, false, callback);
      checkCallbackInfo(1, 4, 20, 30);

      checkNoNewCallbackInfo(splitter, containerHeight, 49);

      // Should have dropped the start one
      splitter.updateVirtualScrollInfo(50, containerHeight, false, callback);
      checkCallbackInfo(2, 4, 50, 30);

      checkNoNewCallbackInfo(splitter, containerHeight, 51, 52, 55, 57, 59);

      // This just brings in a new one but doesn't drop anything as we're still in the range of the start one
      splitter.updateVirtualScrollInfo(60, containerHeight, false, callback);
      checkCallbackInfo(2, 5, 50, 0);

      // Should have dropped the start one
      splitter.updateVirtualScrollInfo(70, containerHeight, false, callback);
      checkCallbackInfo(3, 5, 70, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 71, 75, 80, 85, 89);

      splitter.updateVirtualScrollInfo(90, containerHeight, false, callback);
      checkCallbackInfo(4, 5, 90, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 91, 100, 110, 115, 119);

      splitter.updateVirtualScrollInfo(120, containerHeight, false, callback);
      checkCallbackInfo(5, 5, 120, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 121, 130, 140, 145, 149);

      splitter.updateVirtualScrollInfo(150, containerHeight, false, callback);
      checkCallbackInfo(-1, -1, 150, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 160, 170, 800);
    });

    it('Decrement', () => {
      splitter.updateVirtualScrollInfo(200, containerHeight, false, callback);
      checkCallbackInfo(-1, -1, 150, 0);

      checkNoNewCallbackInfo(splitter, containerHeight, 150);

      // These just bring in new issues but don't drop anything yet
      splitter.updateVirtualScrollInfo(149, containerHeight, false, callback);
      checkCallbackInfo(5, 5, 120, 0);
      checkNoNewCallbackInfo(splitter, containerHeight, 140, 130, 120);
      splitter.updateVirtualScrollInfo(119, containerHeight, false, callback);
      checkCallbackInfo(4, 5, 90, 0);
      checkNoNewCallbackInfo(splitter, containerHeight, 110, 100, 90);
      splitter.updateVirtualScrollInfo(89, containerHeight, false, callback);
      checkCallbackInfo(3, 5, 70, 0);
      checkNoNewCallbackInfo(splitter, containerHeight, 85, 80, 70);
      splitter.updateVirtualScrollInfo(69, containerHeight, false, callback);
      checkCallbackInfo(2, 5, 50, 0);
      checkNoNewCallbackInfo(splitter, containerHeight, 65, 60);

      // Now we should start dropping old issues
      splitter.updateVirtualScrollInfo(59, containerHeight, false, callback);
      checkCallbackInfo(2, 4, 50, 30);

      checkNoNewCallbackInfo(splitter, containerHeight, 55, 50);

      // Just brings in a new one, the end is still in range
      splitter.updateVirtualScrollInfo(49, containerHeight, false, callback);
      checkCallbackInfo(1, 4, 20, 30);

      checkNoNewCallbackInfo(splitter, containerHeight, 45, 40, 35, 30);

      // Drop another issue
      splitter.updateVirtualScrollInfo(29, containerHeight, false, callback);
      checkCallbackInfo(1, 3, 20, 60);

      checkNoNewCallbackInfo(splitter, containerHeight, 25, 20);

      splitter.updateVirtualScrollInfo(19, containerHeight, false, callback);
      checkCallbackInfo(0, 3, 0, 60);

      checkNoNewCallbackInfo(splitter, containerHeight, 15, 10);

      splitter.updateVirtualScrollInfo(9, containerHeight, false, callback);
      checkCallbackInfo(0, 2, 0, 80);

      checkNoNewCallbackInfo(splitter, containerHeight, 5, 0);
    });
  });
});

function checkNoNewCallbackInfo(sp: ScrollHeightSplitter<number>, containerHeight: number, ...positions: number[]) {
  for (const pos of positions) {
    sp.updateVirtualScrollInfo(pos, containerHeight, false, callback);
    expect(callbackInfo).toBeFalsy(`Should not have had a new info for: ${pos}`);
  }
}

function checkCallbackInfo(startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) {
  expect(callbackInfo).toBeTruthy();
  expect(callbackInfo.startIndex).toBe(startIndex);
  expect(callbackInfo.endIndex).toBe(endIndex);
  expect(callbackInfo.beforePadding).toBe(beforePadding);
  expect(callbackInfo.afterPadding).toBe(afterPadding);
  callbackInfo = null;
}


function callback(startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) {
  expect(callbackInfo).toBeFalsy();
  callbackInfo = {startIndex: startIndex, endIndex: endIndex, beforePadding: beforePadding, afterPadding: afterPadding};
}
