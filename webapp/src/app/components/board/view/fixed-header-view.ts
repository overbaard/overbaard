/**
 * Abstract base class for a board containing a fixed header.
 */
import {Input} from '@angular/core';
import {List} from 'immutable';
import {Header} from '../../../model/board/data/header/header';
import {HeadersView} from '../../../view-model/board/issue-table/headers-view';

export class FixedHeaderView {

  @Input()
  headers: HeadersView;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

  @Input()
  boardLeftOffset: number;

  scrollTableBodyX($event: Event) {
    this.boardLeftOffset = event.target['scrollLeft'] * -1
  }
}
