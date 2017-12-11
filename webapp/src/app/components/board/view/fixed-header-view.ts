/**
 * Abstract base class for a board containing a fixed header.
 */
import {Input, OnChanges, SimpleChange, SimpleChanges} from '@angular/core';
import {BoardViewModel} from '../../../view-model/board/board-view';
import {BOARD_HEADERS_HEIGHT, TOOLBAR_HEIGHT} from '../../../common/view-constants';

export class FixedHeaderView implements OnChanges {

  @Input()
  board: BoardViewModel;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

  boardLeftOffset = 0;

  // Initialise to the same value as in the CSS. This will be calculated by ngOnChanges
  boardBodyHeight = '200px';

  onScrollBoardX(event: Event) {
    const boardLeftOffset: number = event.target['scrollLeft'] * -1
    if (this.boardLeftOffset !== boardLeftOffset) {
      this.boardLeftOffset = boardLeftOffset;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const heightChange: SimpleChange = changes['windowHeight'];
    if (heightChange) {
      const height = heightChange.currentValue;
      this.boardBodyHeight = (height - TOOLBAR_HEIGHT - BOARD_HEADERS_HEIGHT) + 'px';
    }
  }
}
