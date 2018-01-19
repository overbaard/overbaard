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


  constructor(private _boardIssue: BoardIssue, private _fontSizeTable: FontSizeTableService, private _userSettingState) {
  }


  calculateHeight(): number {
    const summaryLines: number = this.calculateSummaryLines();

    return 0;
  }

  private calculateSummaryHeight(): number {
    const issueSummaryLevel: IssueSummaryLevel = this._userSettingState.issueSummaryLevel;
    let lines = 0;
    if (issueSummaryLevel === IssueSummaryLevel.SHORT_SUMMARY || issueSummaryLevel === IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR) {
      lines = 2;
    } else {
      lines = this.calculateSummaryLines();
    }
    return lines * IssueSizeCalculator.ISSUE_SUMMARY_LINE_HEIGHT;
  }

  private calculateSummaryLines(): number {
    const sizeLookup: Dictionary<number> = this._fontSizeTable.getTable(ISSUE_SUMMARY_NAME);
    const wordAndWidths: WordAndWidthSplitter = this.splitWordsAndGetSizes(sizeLookup);

    const lineFitter: LineFitter = new LineFitter(
      wordAndWidths.words,
      wordAndWidths.wordWidths,
      character => sizeLookup[character],
      line => line > 2 ?
        IssueSizeCalculator.ISSUE_SUMMARY_WIDTH : IssueSizeCalculator.ISSUE_SUMMARY_WIDTH - IssueSizeCalculator.AVATAR_WIDTH);

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
}



export class LineFitter {
  private _spaceWidth: number;
  constructor(
    private _words: string[],
    private _wordWidths: number[],
    private _charWidthLookup: (character: string) => number,
    private _getLineWidth: (line: number) => number) {
    this._spaceWidth = _charWidthLookup(' ');
  }

  countLines(): number {
    let currentLine = 1;
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
    return currentLine;
  }
}

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
