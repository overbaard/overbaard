import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {FontSizeTable, FontSizeTableService} from '../../services/font-size-table.service';
import {IssueSummaryLevel} from '../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {UserSettingState} from '../../model/board/user/user-setting';
import {List} from 'immutable';

export class IssueHeightCalculator {

  private static readonly ISSUE_SUMMARY_WIDTH = 186;
  private static readonly AVATAR_WIDTH = 32;
  private static readonly ISSUE_SUMMARY_AVATAR_LINES = 2;
  private static readonly ISSUE_SUMMARY_LINE_HEIGHT = 20;

  private static readonly LINKED_ISSUE_HEIGHT = 19;
  private static readonly PARALLEL_TASK_HEIGHT = 19;

  private _issueDetail: IssueDetailState;
  private _summaryCalcConfig: SummaryCalulationConfig;

  private _calculatedHeight: number;
  private _summaryLines: string[];

  private constructor(private _boardIssue: BoardIssue, private _fontSizeTable: FontSizeTableService, userSettingState: UserSettingState) {
    this._issueDetail = userSettingState.issueDetail;
    this._summaryCalcConfig = SummaryCalculationConfig(this._issueDetail.issueSummaryLevel);
  }

  /* tslint:disable:member-ordering */
  static create(boardIssue: BoardIssue, fontSizeTable: FontSizeTableService, userSettingState: UserSettingState): IssueHeightCalculator {
    const calc: IssueHeightCalculator = new IssueHeightCalculator(boardIssue, fontSizeTable, userSettingState);
    calc.calculateHeight();
    return calc;
  }

  get calculatedHeight(): number {
    return this._calculatedHeight;
  }

  get summaryLines(): string[] {
    return this._summaryLines;
  }

  calculateHeight(): void {
    let issueHeight =
      3 + 3 +       // card top and bottom padding
      10 +          // card bottom margin
      24 +          // card title height
      4;            // Height of div containing colours for project, issue type and priority

    issueHeight += this.calculateSummaryHeight();
    issueHeight += this.calculateLinkedIssueLines() * IssueHeightCalculator.LINKED_ISSUE_HEIGHT;
    issueHeight += this.calculateParallelTaskLines() * IssueHeightCalculator.PARALLEL_TASK_HEIGHT;
    this._calculatedHeight = issueHeight;
  }

  private calculateSummaryHeight(): number {
    if (this._issueDetail.issueSummaryLevel === IssueSummaryLevel.HEADER_ONLY) {
      // HEADER_ONLY has zero lines
      return 0;
    }
    this.calculateSummaryLines();
    let lines = this._summaryLines.length;
    if (lines < this._summaryCalcConfig.minLines) {
      lines = this._summaryCalcConfig.minLines;
    }
    if (lines > this._summaryCalcConfig.maxLines && this._summaryCalcConfig.maxLines >= 0) {
      lines = this._summaryCalcConfig.maxLines;
    }
    return lines * IssueHeightCalculator.ISSUE_SUMMARY_LINE_HEIGHT;
  }

  private calculateSummaryLines() {
    const sizeLookup: FontSizeTable = this._fontSizeTable.getTable('12px');
    const splitter: WordAndWidthSplitter = this.splitWordsAndGetSizes(sizeLookup);

    const lineFitter: LineFitter = this.fitWordsToLines(sizeLookup, splitter.words, splitter.wordWidths);
    this._summaryLines = lineFitter.summaryLines;
  }

  private splitWordsAndGetSizes(sizeLookup: FontSizeTable): WordAndWidthSplitter {
    return WordAndWidthSplitter.create(
        this._boardIssue.summary,
        (character => {
          const width: number = sizeLookup.getWidth(character);
          if (!width) {
            // TODO record characters not in the lookup table
          }
          return width;

        }));
  }

  private fitWordsToLines(sizeLookup: FontSizeTable, words: string[], wordWidths: number[]): LineFitter {
    return LineFitter.create(
      words, wordWidths, this._summaryCalcConfig.maxLines,
      character => sizeLookup.getWidth(character),
      line => {
        if (this._summaryCalcConfig.trimFirstTwoLines && line < IssueHeightCalculator.ISSUE_SUMMARY_AVATAR_LINES) {
          return IssueHeightCalculator.ISSUE_SUMMARY_WIDTH - IssueHeightCalculator.AVATAR_WIDTH;
        }
        return IssueHeightCalculator.ISSUE_SUMMARY_WIDTH;
      }
    );
  }

  private calculateParallelTaskLines(): number {
    const extraWidth = 3; // 3px right margin
    return this.calculateExtraInfoLines(
      this._issueDetail.parallelTasks, extraWidth, this._boardIssue.parallelTasks, pt => pt.display);
  }


  private calculateLinkedIssueLines(): number {
    const extraWidth = 5; // 5px right margin
    return this.calculateExtraInfoLines(
      this._issueDetail.linkedIssues, extraWidth, this._boardIssue.linkedIssues, li => li.key);
  }

  private calculateExtraInfoLines<T>(detailSetting: boolean, extraWidth: number,
                                     list: List<T>, textGetter: (t: T) => string): number {

    if (!detailSetting || !list || list.size === 0) {
      return 0;
    }

    const lookup: FontSizeTable = this._fontSizeTable.getTable('14px');
    let lines = 1;
    let currentWidth = 0;
    list.forEach(infoItem => {
      const word: string = textGetter(infoItem);
      let wordSize = 0;
      for (let ci = 0 ; ci < word.length ; ci++) {
        wordSize += lookup.getWidth(word.charAt(ci));
      }
      wordSize += extraWidth;
      if (currentWidth + wordSize > IssueHeightCalculator.ISSUE_SUMMARY_WIDTH) {
        lines++;
        currentWidth = 0;
      }
      currentWidth += wordSize;
    });
    return lines;
  }
}

export class LineFitter {
  static create(
    words: string[],
    wordWidths: number[],
    maxLines: number,
    charWidthLookup: (character: string) => number,
    getLineWidth: (line: number) => number): LineFitter {
    const fitter: LineFitter = new LineFitter(words, wordWidths, maxLines, charWidthLookup, getLineWidth);
    fitter.fitIntoLines();
    return fitter;
  }

  private _spaceWidth: number;
  private _summaryLines: string[] = [];



  private constructor(
    private _words: string[],
    private _wordWidths: number[],
    private _maxLines: number,
    private _charWidthLookup: (character: string) => number,
    private _getLineWidth: (line: number) => number) {
    this._spaceWidth = _charWidthLookup(' ');
  }

  private fitIntoLines(): void {
    const ctx: LineFitterContext = new LineFitterContext(this._spaceWidth, this._getLineWidth);

    for (let wi = 0 ; wi < this._words.length ; wi++) {
      let test = ctx.currentLineWidth;

      const nextWord = this._words[wi];
      const nextWordWidth = this._wordWidths[wi];

      if (ctx.currentLineWidth > 0) {
        test += this._spaceWidth;
      }

      test += nextWordWidth;
      test = this.round(test);

      if (test < ctx.currentLineMaxWidth) {
        // It fits, continue with everything
        ctx.appendWord(nextWord, nextWordWidth);
        continue;
      }

      if (nextWordWidth < ctx.nextLineMaxWidth) {
        // The word all fits on the next line, so put it there
        ctx.newLine();
        ctx.appendWord(nextWord, nextWordWidth);
      } else {
        // It is a long word spanning more than one line. Put what we can on the current line, and the rest
        // on the next. In the summary text, we introduce a space to allow the line break
        test = ctx.currentLineWidth === 0 ? ctx.currentLineWidth : ctx.currentLineWidth + this._spaceWidth;
        test = this.round(test);

        if (test >= ctx.currentLineMaxWidth) {
          ctx.newLine();
        } else if (ctx.currentLineWidth > 0) {
          ctx.appendCharacter(' ', this._spaceWidth);
        }

        for (let ci = 0 ; ci < nextWord.length ; ci++) {
          const char: string = nextWord[ci];
          const charWidth: number = this._charWidthLookup(char);
          test = ctx.currentLineWidth + charWidth;
          test = this.round(test);

          if (test >= ctx.currentLineMaxWidth) {
            ctx.newLine();
          }
          ctx.appendCharacter(char, charWidth);
        }
      }
    }
    this._summaryLines = ctx.summaryLines;
  }

  get summaryLines(): string[] {
    return this._summaryLines;
  }

  private round(width: number): number {
    return Math.ceil(width);
  }
}

/**
 * Breaks a string into its individual words, and calculates the sizes of each word from
 * a font size lookup table.
 */
export class WordAndWidthSplitter {

  static create(summary: string, lookup: (character: string) => number): WordAndWidthSplitter {
    const splitter: WordAndWidthSplitter = new WordAndWidthSplitter(summary, lookup);
    splitter.createWordList();
    return splitter;
  }

  private _words: string[] = [];
  private _wordWidths: number[] = [];

  private constructor(private _summary: string, private _lookup: (character: string) => number) {
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
  minLines: number;
  trimFirstTwoLines: boolean;
}

function SummaryCalculationConfig(summaryLevel: IssueSummaryLevel): SummaryCalulationConfig {
  switch (summaryLevel) {
    case IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR:
      return {maxLines: 2, minLines: 1, trimFirstTwoLines: false};
    case IssueSummaryLevel.SHORT_SUMMARY:
      return {maxLines: 2, minLines: 2, trimFirstTwoLines: true};
    case IssueSummaryLevel.FULL:
      return {maxLines: -1, minLines: 2, trimFirstTwoLines: true};
  }
}

class LineFitterContext {
  /** The resulting lines */
  private _summaryLines: string[] = [''];

  /** the index of the current summary line we are building */
  private _currentLineIndex = 0;

  /** The max width of the current line */
  private _currentLineMaxWidth: number;

  /** The present width of the current line */
  private _currentLineWidth = 0;

  constructor(private _spaceWidth: number, private _getLineWidth: (line: number) => number) {
    this._currentLineMaxWidth = this._getLineWidth(0);
  }

  appendWord(word: string, width: number) {
    if (this._currentLineWidth > 0) {
      this.appendString(' ', this._spaceWidth);
    }
    this.appendString(word, width);
  }

  appendCharacter(char: string, width: number) {
    this.appendString(char, width);
  }

  private appendString(s: string, width: number) {
    this._summaryLines[this._currentLineIndex] = this._summaryLines[this._currentLineIndex] + s;
    this._currentLineWidth += width;
  }

  newLine() {
    if (this._currentLineWidth > 0) {
      this._currentLineIndex++;
      this._summaryLines.push('');
      this._currentLineWidth = 0;
      this._currentLineMaxWidth = this._getLineWidth(this._currentLineIndex);
    }
  }

  get summaryLines(): string[] {
    return this._summaryLines;
  }

  get currentLineWidth(): number {
    return this._currentLineWidth;
  }

  get nextLineMaxWidth(): number {
    return this._getLineWidth(this._currentLineIndex + 1);
  }

  get currentLineMaxWidth(): number {
    return this._currentLineMaxWidth;
  }
}
