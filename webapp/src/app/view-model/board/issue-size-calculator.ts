import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {FontSizeTableService} from '../../services/font-size-table.service';
import {IssueSummaryLevel} from '../../model/board/user/issue-summary-level';
import {Dictionary} from '../../common/dictionary';

export const ISSUE_SUMMARY_NAME = 'issue-summary';

export class IssueSizeCalculator {

  private static readonly ISSUE_SUMMARY_WIDTH = 186;
  private static readonly AVATAR_WIDTH = 32;
  private static readonly ISSUE_SUMMARY_AVATAR_LINES = 2;
  private static readonly ISSUE_SUMMARY_LINE_HEIGHT = 20;


  private _summaryCalcConfig: SummaryCalulationConfig;

  constructor(private _boardIssue: BoardIssue, private _fontSizeTable: FontSizeTableService, private _userSettingState) {
    this._summaryCalcConfig = SummaryCalculationConfig(this._userSettingState.issueSummaryLevel);
  }

  calculateHeight(): number {
    const summaryLines: number = this.calculateSummaryLines();

    return 0;
  }

  private calculateSummaryHeight(): number {
    const issueSummaryLevel: IssueSummaryLevel = this._userSettingState.issueSummaryLevel;
    if (this._userSettingState.issueSummaryLevel === IssueSummaryLevel.HEADER_ONLY) {
      // HEADER_ONLY has zero lines
      return 0;
    }
    const lines = this.calculateSummaryLines()
    return lines * IssueSizeCalculator.ISSUE_SUMMARY_LINE_HEIGHT;
  }

  private calculateSummaryLines(): number {
    const sizeLookup: Dictionary<number> = this._fontSizeTable.getTable(ISSUE_SUMMARY_NAME);
    const splitter: WordAndWidthSplitter = this.splitWordsAndGetSizes(sizeLookup);

    const lineFitter: LineFitter = this.fitWordsToLines(sizeLookup, splitter.words, splitter.wordWidths);

    return 0;
  }

  private splitWordsAndGetSizes(sizeLookup: Dictionary<number>): WordAndWidthSplitter {
    return WordAndWidthSplitter.create(
        this._boardIssue.summary,
        (character => {
          const width: number = sizeLookup[character];
          if (!width) {
            // TODO record characters not in the lookup table
          }
          return width;

        }));
  }

  private fitWordsToLines(sizeLookup: Dictionary<number>, words: string[], wordWidths: number[]): LineFitter {
    return LineFitter.create(
      this._boardIssue.summary, words, wordWidths, this._summaryCalcConfig.maxLines,
      character => sizeLookup[character],
      line => {
        if (this._summaryCalcConfig.trimFirstTwoLines && line < 2) {
          return IssueSizeCalculator.ISSUE_SUMMARY_WIDTH - IssueSizeCalculator.AVATAR_WIDTH;
        }
        return IssueSizeCalculator.ISSUE_SUMMARY_WIDTH;
      }
    );
  }
}

export class LineFitter {
  private _spaceWidth: number;

  private _lines: number;

  private constructor(
    private _summary: string,
    private _words: string[],
    private _wordWidths: number[],
    private _maxLines: number,
    private _charWidthLookup: (character: string) => number,
    private _getLineWidth: (line: number) => number) {
    this._spaceWidth = _charWidthLookup(' ');
  }

  /* tslint:disable:member-ordering */
  static create(
    summary: string,
    words: string[],
    wordWidths: number[],
    maxLines: number,
    charWidthLookup: (character: string) => number,
    getLineWidth: (line: number) => number): LineFitter {
    const fitter: LineFitter = new LineFitter(summary, words, wordWidths, maxLines, charWidthLookup, getLineWidth);
    fitter.countLines();
    return fitter;
  }

  private countLines(): void {
    let currentLine = 0;
    let currentLineMaxWidth = this._getLineWidth(currentLine);
    let currentLineIndex = 0;

    for (let wi = 0 ; wi < this._words.length ; wi++) {
      let test = currentLineIndex;
      const nextWordWidth = this._wordWidths[wi];
      if (currentLineIndex > 0) {
        test += this._spaceWidth;
      }

      test += nextWordWidth;
      if (test <= currentLineMaxWidth) {
        // It fits, continue with everything
        currentLineIndex = test;
        continue;
      }

      if (nextWordWidth > this._getLineWidth(currentLine + 1)) {
        // TODO split it

      } else {
        currentLine++;
        currentLineMaxWidth = this._getLineWidth(currentLine);
        currentLineIndex = nextWordWidth;
      }
    }
    this._lines = currentLine + 1;
  }

  get lines(): number {
    return this._lines;
  }
}

/**
 * Breaks a string into its individual words, and calculates the sizes of each word from
 * a font size lookup table.
 */
export class WordAndWidthSplitter {
  private _words: string[] = [];
  private _wordWidths: number[] = [];
  private constructor(private _summary: string, private _lookup: (character: string) => number) {
  }

  /* tslint:disable:member-ordering */
  static create(summary: string, lookup: (character: string) => number): WordAndWidthSplitter {
    const splitter: WordAndWidthSplitter = new WordAndWidthSplitter(summary, lookup);
    splitter.createWordList();
    return splitter;
  }

  private createWordList() {
    let wordStart = -1;
    let currentWordWidth = 0;
    for (let i = 0 ; i < this._summary.length ; i++) {
      const curr: string = this._summary.charAt(i);
      if (curr !== ' ') {
        currentWordWidth += this._lookup(curr);
        if (wordStart === -1) {
          wordStart = i;
        }
      } else {
        if (wordStart !== -1) {
          this._words.push(this._summary.slice(wordStart, i));
          this._wordWidths.push(currentWordWidth);
          wordStart = -1;
          currentWordWidth = 0;
        }
      }
    }
    if (wordStart !== -1) {
      const last: number = this._summary.length;
      this._words.push(this._summary.slice(wordStart, last));
      this._wordWidths.push(currentWordWidth);
    }
  }

  get words(): string[] {
    return this._words;
  }

  get wordWidths(): number[] {
    return this._wordWidths;
  }
}

interface SummaryCalulationConfig {
  maxLines: number;
  trimFirstTwoLines: boolean;
}

function SummaryCalculationConfig(summaryLevel: IssueSummaryLevel): SummaryCalulationConfig {
  switch (summaryLevel) {
    case IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR:
      return {maxLines: 2, trimFirstTwoLines: false};
    case IssueSummaryLevel.SHORT_SUMMARY:
      return {maxLines: 2, trimFirstTwoLines: true};
    case IssueSummaryLevel.FULL:
      return {maxLines: 0, trimFirstTwoLines: true};
  }
}
