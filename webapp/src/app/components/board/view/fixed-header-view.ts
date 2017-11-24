/**
 * Abstract base class for a board containing a fixed header.
 */
import {Input} from '@angular/core';
import {BoardViewModel} from '../../../view-model/board/board-view';

export class FixedHeaderView {

  @Input()
  board: BoardViewModel;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

  boardLeftOffset = 0;

  onScrollBoardX(event: Event) {
    console.log('SCROLLING header');
    const boardLeftOffset: number = event.target['scrollLeft'] * -1
    if (this.boardLeftOffset !== boardLeftOffset) {
      this.boardLeftOffset = boardLeftOffset;
    }
  }
}
