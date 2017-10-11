/**
 * Abstract base class for a board containing a fixed header.
 */
import {Input} from '@angular/core';
import {List} from 'immutable';
import {Header} from '../../../model/board/header/header';

export class FixedHeaderView {

  @Input()
  headers: List<List<Header>>;

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
