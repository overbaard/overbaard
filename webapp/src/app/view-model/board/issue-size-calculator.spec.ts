import {IssueSizeCalculator, WordAndWidthSplitter} from './issue-size-calculator';

describe('Issue Size Calculator Tests', () => {
  describe('Check splitting and word counts', () => {
    it ('', () => {
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

})
