import {List} from 'immutable';
import {ScrollHeightSplitter, StartAndEndIndex, StartAndHeight} from './scroll-height-splitter';

describe('Scroll Height Splitter Tests', () => {
  const splitter: ScrollHeightSplitter<number> = ScrollHeightSplitter.create(n => n);
  const list: List<number> = List<number>([2, 2, 1, 4, 3, 2, 4, 3, 5, 3]);
  splitter.updateList(list);

  beforeEach(() => {
    expect(splitter.startPositions.toArray()).toEqual([
      {start: 0, height: 2},  // 0
      {start: 2, height: 2},  // 1
      {start: 4, height: 1},  // 2
      {start: 5, height: 4},  // 3
      {start: 9, height: 3},  // 4
      {start: 12, height: 2}, // 5
      {start: 14, height: 4}, // 6
      {start: 18, height: 3}, // 7
      {start: 21, height: 5}, // 8
      {start: 26, height: 3}  // 9
    ]);
  });

  describe('Test scroll', () => {
    describe('One issue', () => {
      it ('Start', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(0, 1);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(0);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 2);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(0);

        startAndEndIndex = splitter.getStartAndEndIndex(1, 1);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(0);
      });

      it ('Middle', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(5, 4);
        expect(startAndEndIndex.start).toBe(3);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(6, 2);
        expect(startAndEndIndex.start).toBe(3);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(8, 1);
        expect(startAndEndIndex.start).toBe(3);
        expect(startAndEndIndex.end).toBe(3);
      });


      it ('End', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(26, 1);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(27, 1);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(28, 1);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(26, 10);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);
      });
    });

    it ('No issues', () => {
      let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(29, 100);
      expect(startAndEndIndex.start).toBe(-1);
      expect(startAndEndIndex.end).toBe(-1);

      startAndEndIndex = splitter.getStartAndEndIndex(50, 100);
      expect(startAndEndIndex.start).toBe(-1);
      expect(startAndEndIndex.end).toBe(-1);
    });

    describe('Several issues', () => {
      it ('Start', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(0, 1);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(0);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 2);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(0);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 3);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(1);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 4);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(1);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 5);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(2);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 6);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 8);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 9);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 10);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(4);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 12);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(4);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 13);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(5);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 14);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(5);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 15);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(6);
        //
        startAndEndIndex = splitter.getStartAndEndIndex(0, 18);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(6);

        startAndEndIndex = splitter.getStartAndEndIndex(1, 19);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(7);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 21);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(7);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 22);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(8);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 26);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(8);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 27);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 29);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(0, 10000);
        expect(startAndEndIndex.start).toBe(0);
        expect(startAndEndIndex.end).toBe(9);
      });

      it ('Middle', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(2, 20);
        expect(startAndEndIndex.start).toBe(1);
        expect(startAndEndIndex.end).toBe(8);

        startAndEndIndex = splitter.getStartAndEndIndex(3, 10);
        expect(startAndEndIndex.start).toBe(1);
        expect(startAndEndIndex.end).toBe(5);

        startAndEndIndex = splitter.getStartAndEndIndex(4, 5);
        expect(startAndEndIndex.start).toBe(2);
        expect(startAndEndIndex.end).toBe(3);

        startAndEndIndex = splitter.getStartAndEndIndex(5, 5);
        expect(startAndEndIndex.start).toBe(3);
        expect(startAndEndIndex.end).toBe(4);

        startAndEndIndex = splitter.getStartAndEndIndex(7, 8);
        expect(startAndEndIndex.start).toBe(3);
        expect(startAndEndIndex.end).toBe(6);

        startAndEndIndex = splitter.getStartAndEndIndex(9, 8);
        expect(startAndEndIndex.start).toBe(4);
        expect(startAndEndIndex.end).toBe(6);

        startAndEndIndex = splitter.getStartAndEndIndex(9, 9)
        expect(startAndEndIndex.start).toBe(4);
        expect(startAndEndIndex.end).toBe(6);

        startAndEndIndex = splitter.getStartAndEndIndex(9, 10)
        expect(startAndEndIndex.start).toBe(4);
        expect(startAndEndIndex.end).toBe(7);
      });

      it ('End', () => {
        let startAndEndIndex: StartAndEndIndex = splitter.getStartAndEndIndex(28, 10);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(28, 10);
        expect(startAndEndIndex.start).toBe(9);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(19, 10);
        expect(startAndEndIndex.start).toBe(7);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(12, 30);
        expect(startAndEndIndex.start).toBe(5);
        expect(startAndEndIndex.end).toBe(9);

        startAndEndIndex = splitter.getStartAndEndIndex(12, 8);
        expect(startAndEndIndex.start).toBe(5);
        expect(startAndEndIndex.end).toBe(7);
      })
    });
  });
});
