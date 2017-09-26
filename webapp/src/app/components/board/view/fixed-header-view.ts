/**
 * Abstract base class for a board containing a fixed header.
 */
import {BoardState} from '../../../common/board/board.reducer';
import {Observable} from 'rxjs/Observable';
import {Input} from '@angular/core';

export class FixedHeaderView {

  @Input()
  boardState$: Observable<BoardState>;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

}
