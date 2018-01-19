import {IssueHeightCalculator, LineFitter, LineOverflowFitter, WordAndWidthSplitter} from './issue-height-calculator';

describe('Issue Size Calculator Tests', () => {
  describe('Splitting and word counts', () => {
    it ('Test', () => {
      checkSplit('ABC', 'ABC');
      checkSplit('    ABC', 'ABC');
      checkSplit('ABC     ', 'ABC');
      checkSplit('ABC DEFG', 'ABC', 'DEFG');
      checkSplit('ABC      DEFG IJK   LMNOPQ', 'ABC', 'DEFG', 'IJK', 'LMNOPQ');
      checkSplit('     ABC      DEFG IJK   LMNOPQ      ', 'ABC', 'DEFG', 'IJK', 'LMNOPQ');
    });

    function checkSplit(s: string, ...expectedWords: string[]) {
      const splitter: WordAndWidthSplitter = WordAndWidthSplitter.create(s, character => 1);
      expect(splitter.words).toEqual(expectedWords);
      expect(splitter.wordWidths).toEqual(expectedWords.map(word => word.length));
    }
  });

  describe('Line counting', () => {
    describe('Full summary', () => {
      it ('One line', () => {
        let fitter: LineFitter = createFitter(
          ['abc', 'de'], 7, 0);
        expect(fitter.lines).toBe(1);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def'], 7, 0);
        expect(fitter.lines).toBe(1);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'de', 'i'], 8, 0);
        expect(fitter.lines).toBe(1);
        expect(fitter.summary).toBeFalsy();
      });

      it ('Normal line break', () => {
        let fitter: LineFitter = createFitter(
          ['abc', 'def', 'ijkl'], 8, 0);
        expect(fitter.lines).toBe(2);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def', 'ij'], 8, 0);
        expect(fitter.lines).toBe(2);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def', 'ijkl', 'mno'], 8, 0);
        expect(fitter.lines).toBe(2);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def', 'ijkl', 'mnop'], 8, 0);
        expect(fitter.lines).toBe(3);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def', 'ijkl', 'mnop', 'qrs'], 8, 0);
        expect(fitter.lines).toBe(3);
        expect(fitter.summary).toBeFalsy();

        fitter = createFitter(
          ['abc', 'def', 'ijkl', 'mnop', 'qrst'], 8, 0);
        expect(fitter.lines).toBe(4);
        expect(fitter.summary).toBeFalsy();
      });

      describe('Overflow Fitter', () => {
        it ('One Break from start of line', () => {
          const fitter: LineOverflowFitter =
            new LineOverflowFitter('abcde', 1, 0, character => 1, line => 4);
          fitter.fitToLine();
          expect(fitter.currentLine).toBe(2);
          expect(fitter.word).toBe('abcd e');
          expect(fitter.currentLineIndex).toBe(1);
        });
        it ('One Break from middle of line', () => {
          const fitter: LineOverflowFitter =
            new LineOverflowFitter('abcde', 1, 2, character => 1, line => 4);
          fitter.fitToLine();
          expect(fitter.currentLine).toBe(2);
          expect(fitter.word).toBe('ab cde');
          expect(fitter.currentLineIndex).toBe(3);
        });
        it ('Two Breaks from start of line', () => {
          const fitter: LineOverflowFitter =
            new LineOverflowFitter('abcdefghijkl', 1, 0, character => 1, line => 4);
          fitter.fitToLine();
          expect(fitter.currentLine).toBe(3);
          expect(fitter.word).toBe('abcd efgh ijkl');
          expect(fitter.currentLineIndex).toBe(4);
        });
        it ('Four Breaks from middle of line', () => {
          const fitter: LineOverflowFitter =
            new LineOverflowFitter('abcdefghijklmno', 2, 3, character => 1, line => 4);
          fitter.fitToLine();
          expect(fitter.currentLine).toBe(6;
          expect(fitter.word).toBe('a bcde fghi jklm no');
          expect(fitter.currentLineIndex).toBe(2);
        });
      });

      describe('Long overflowing word', () => {
        it('2 line word', () => {
          let fitter: LineFitter = createFitter(
            ['abcdef'], 5, 0);
          expect(fitter.lines).toBe(2);
          expect(fitter.summary).toBe('abcde f');

          fitter = createFitter(
            ['a', 'bcdefgh'], 5, 0);
          expect(fitter.lines).toBe(2);
          expect(fitter.summary).toBe('a bcd efgh');

          fitter = createFitter(
            ['ab', 'cdefgh'], 5, 0);
          expect(fitter.lines).toBe(2);
          expect(fitter.summary).toBe('ab cd efgh');


          fitter = createFitter(
            ['abc', 'defghi'], 5, 0);
          expect(fitter.lines).toBe(2);
          expect(fitter.summary).toBe('abc d efghi');

          fitter = createFitter(
            ['abcd', 'efghij'], 5, 0);
          expect(fitter.lines).toBe(3);
          expect(fitter.summary).toBe('abcd efghi j');

          fitter = createFitter(
            ['a', 'b', 'cd', 'ef', 'ghijkl'], 5, 0);
          expect(fitter.lines).toBe(4);
          expect(fitter.summary).toBe('a b cd ef ghijk l');

        });
        it('Current', () => {
          const fitter: LineFitter = createFitter(
            ['a', 'b', 'cd', 'efghij', 'kl'], 5, 0);
          expect(fitter.lines).toBe(4);
          expect(fitter.summary).toBe('a b cd ef ghij kl');

        });

        it('3 line word', () => {
          let fitter: LineFitter = createFitter(
            ['abcdefghijklmno'], 5, 0);
          expect(fitter.lines).toBe(3);
          expect(fitter.summary).toBe('abcde fghij klmno');

          fitter = createFitter(
            ['a', 'bcdefghijklmno'], 5, 0);
          expect(fitter.lines).toBe(4);
          expect(fitter.summary).toBe('a bcd efghi jklmn o');

          fitter = createFitter(
            ['abcd', 'efghijklmno'], 5, 0);
          expect(fitter.lines).toBe(4);
          expect(fitter.summary).toBe('abcd efghi jklmn o');
        });

        it ('Mixed short and long words', () => {
          let fitter: LineFitter = createFitter(
            ['a', 'bcde', 'f', 'ghijk', 'l'], 4, 0);
          expect(fitter.lines).toBe(4);
          expect(fitter.summary).toBe('a bcde f gh ijk l');

          fitter = createFitter(
            ['ab', 'cdefg', 'hi', 'jklmn', 'pq', 'rstuvwxyz'], 4, 0);
          expect(fitter.lines).toBe(7);
          expect(fitter.summary).toBe('ab c defg hi j klmn pq r stuv wxyz');
        })
      });

    });

    function createFitter(words: string[], lineWidth: number, maxLines: number): LineFitter {
      const wordWidths: number[] = words.map(word => word.length);
      return LineFitter.create(null, words, wordWidths, maxLines, character => 1, line =>  lineWidth);
    }
  });
})
