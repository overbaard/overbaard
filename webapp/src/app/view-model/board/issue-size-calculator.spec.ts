import {IssueSizeCalculator, LineFitter, WordAndWidthSplitter} from './issue-size-calculator';

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
    it ('One line', () => {
      let fitter: LineFitter = createFitter(
        ['abc', 'de'], 7);
      expect(fitter.countLines()).toBe(1);

      fitter = createFitter(
        ['abc', 'def'], 7);
      expect(fitter.countLines()).toBe(1);

      fitter = createFitter(
        ['abc', 'de', 'i'], 8);
      expect(fitter.countLines()).toBe(1);
    });

    it ('Normal line break', () => {
      let fitter: LineFitter = createFitter(
        ['abc', 'def', 'ijkl'], 8);
      expect(fitter.countLines()).toBe(2);

      fitter = createFitter(
        ['abc', 'def', 'ij'], 8);
      expect(fitter.countLines()).toBe(2);

      fitter = createFitter(
        ['abc', 'def', 'ijkl', 'mno'], 8);
      expect(fitter.countLines()).toBe(2);

      fitter = createFitter(
        ['abc', 'def', 'ijkl', 'mnop'], 8);
      expect(fitter.countLines()).toBe(3);

      fitter = createFitter(
        ['abc', 'def', 'ijkl', 'mnop', 'qrs'], 8);
      expect(fitter.countLines()).toBe(3);

      fitter = createFitter(
        ['abc', 'def', 'ijkl', 'mnop', 'qrst'], 8);
      expect(fitter.countLines()).toBe(4);

    });

    it('Long overflowing word', () => {
      // Deal with this corner case later
      /*let fitter: LineFitter = createFitter(
        ['abddef'], 5);
      expect(fitter.countLines()).toBe(2);

      fitter = createFitter(
        ['abc', 'defghi'], 5);
      expect(fitter.countLines()).toBe(2);

      // TODO - more*/
    });

    function createFitter(words: string[], lineWidth: number): LineFitter {
      const wordWidths: number[] = words.map(word => word.length);
      return new LineFitter(words, wordWidths, character => 1, line =>  lineWidth);
    }
  });
})
