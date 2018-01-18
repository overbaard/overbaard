import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {FontSizeTableService} from '../../services/font-size-table.service';

export const ISSUE_SUMMARY_NAME = 'issue-summary';

export class IssueSizeCalculator {

  private static readonly ISSUE_SUMMARY_WIDTH = 186;
  private static readonly AVATAR_WIDTH = 32;
  private static readonly ISSUE_SUMMARY_AVATAR_LINES = 2;


  constructor(private _boardIssue: BoardIssue, private _fontSizeTable: FontSizeTableService, private _userSettingState) {
  }


  calculateHeight(): number {
    const summaryLines: number = this.calculateSummaryLines();

    return 0;
  }

  private calculateSummaryLines(): number {
    const wordAndWidths: WordAndWidthSplitter = this.splitWordsAndGetSizes();


    return 0;
  }

  private splitWordsAndGetSizes(): WordAndWidthSplitter {
    const sizeLookup = this._fontSizeTable.getTable(ISSUE_SUMMARY_NAME);
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
