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
  const splitter: ScrollHeightSplitter<number> = ScrollHeightSplitter.create(n => n);

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
  });

  describe('Test scroll From start', () => {

    describe('Several issues in Viewport', () => {
      const containerHeight = 60;

      beforeEach(() => {
        callbackInfo = null;
        splitter.updateVirtualScrollInfo(0, containerHeight, true, callback);
        checkCallbackInfo(callbackInfo, 0, 2, 0, 80);
        callbackInfo = null;
      });

      describe('Same issue', () => {
        it('Increment scroll', () => {
          checkNoNewCallbackInfo(splitter, containerHeight, 1, 2, 3, 4, 5, 6, 7, 8, 9);

          // Although this brings in a new issue, leave this check here to clarify
          splitter.updateVirtualScrollInfo(10, containerHeight, false, callback);
          checkCallbackInfo(callbackInfo, 0, 3, 0, 60);
          callbackInfo = null;
        });

        it ('Decrement scroll', () => {
          checkNoNewCallbackInfo(splitter, containerHeight, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);
        });
      });
      describe('New issue', () => {
        describe('Increment', () => {
          it('Slowly', () => {
            // Bring in a new issue
            splitter.updateVirtualScrollInfo(11, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 0, 3, 0, 60);
            callbackInfo = null;

            // These don't bring in new issues. Although we could lose some of the older issues here,
            // we don't bother recalculating every time here
            checkNoNewCallbackInfo(splitter, containerHeight, 20, 29);

            splitter.updateVirtualScrollInfo(30, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 1, 4, 20, 30);
            callbackInfo = null;

            // These don't bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 31, 50, 59);

            splitter.updateVirtualScrollInfo(60, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 2, 5, 50, 0);
            callbackInfo = null;

            // These don't bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 61, 70, 80);

            // Although the end of the screen is now past the end we're not bringing in any new issue
            checkNoNewCallbackInfo(splitter, containerHeight, 90);
            splitter.updateVirtualScrollInfo(90, containerHeight, false, callback);
            expect(callbackInfo).toBeFalsy();


            // These don't bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 110, 120, 140, 149);

            // We have now gone past the end
            splitter.updateVirtualScrollInfo(150, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, -1, -1, 150, 0);
            callbackInfo = null;

            checkNoNewCallbackInfo(splitter, containerHeight, 151, 200, 300);
          });
        });

        describe('Decrement', () => {
          it('Slowly', () => {
            // Jump to the end
            splitter.updateVirtualScrollInfo(300, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, -1, -1, 150, 0);
            callbackInfo = null;

            // These should not bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 200, 151, 150);


            splitter.updateVirtualScrollInfo(149, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 5, 5, 120, 0);
            callbackInfo = null;

            // These should not bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 140, 130, 120);

            splitter.updateVirtualScrollInfo(119, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 4, 5, 90, 0);
            callbackInfo = null;

            // These should not bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 110, 90);

            splitter.updateVirtualScrollInfo(89, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 3, 5, 70, 0);
            callbackInfo = null;

            // These should not bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 80, 70);

            splitter.updateVirtualScrollInfo(69, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 2, 5, 50, 0);
            callbackInfo = null;

            // These should not bring in new issues
            checkNoNewCallbackInfo(splitter, containerHeight, 60, 50);

            splitter.updateVirtualScrollInfo(49, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 1, 4, 20, 30);
            callbackInfo = null;

            checkNoNewCallbackInfo(splitter, containerHeight, 40, 30, 20);

            splitter.updateVirtualScrollInfo(19, containerHeight, false, callback);
            checkCallbackInfo(callbackInfo, 0, 3, 0, 60);
            callbackInfo = null;

            checkNoNewCallbackInfo(splitter, containerHeight, -1);

          });
        });
      });
    });
  });


  it ('Test scroll, no issues', () => {
    callbackInfo = null;
    const containerHeight = 60;
    splitter.updateList(List<number>());
    expect(splitter.startPositions.toArray()).toEqual([]);

    // An update happens for the first change (to change the internal tracking), after that there should be no change
    splitter.updateVirtualScrollInfo(40, containerHeight, true, callback); // Use force=true since we updated the list
    checkCallbackInfo(callbackInfo, -1, -1, 0, 0);
    callbackInfo = null;

    checkNoNewCallbackInfo(splitter, containerHeight, 800, 10, 0, -1, 10);
  });

  function checkNoNewCallbackInfo(sp: ScrollHeightSplitter<number>, containerHeight: number, ...positions: number[]) {
    for (const pos of positions) {
      sp.updateVirtualScrollInfo(pos, containerHeight, false, callback);
      expect(callbackInfo).toBeFalsy(`Should not have had a new info for: ${pos}`);
    }
  }

  function checkCallbackInfo(info: ScrollInfo, startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) {
    expect(info).toBeTruthy();
    expect(info.startIndex).toBe(startIndex);
    expect(info.endIndex).toBe(endIndex);
    expect(info.beforePadding).toBe(beforePadding);
    expect(info.afterPadding).toBe(afterPadding);
  }
});


function callback(startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) {
  expect(callbackInfo).toBeFalsy();
  callbackInfo = {startIndex: startIndex, endIndex: endIndex, beforePadding: beforePadding, afterPadding: afterPadding};
}
