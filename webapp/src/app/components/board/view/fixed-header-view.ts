/**
 * Abstract base class for a board containing a fixed header.
 */
import {BoardState} from '../../../model/board/board';
import {Input} from '@angular/core';
import {List} from 'immutable';
import {HeaderState} from '../../../model/board/header/header.state';
import {BoardIssue} from '../../../model/board/issue/board-issue';

export class FixedHeaderView {

  @Input()
  boardState: BoardState;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

  @Input()
  boardLeftOffset: number;

  get headers(): HeaderState {
    return this.boardState.headers;
  }

  get issueTable(): List<List<BoardIssue>> {
    return this.boardState.issueTable.table;
  }

  scrollTableBodyX($event: Event) {
    this.boardLeftOffset = event.target['scrollLeft'] * -1
  }
}
