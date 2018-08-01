/**
 * Abstract base class for a board containing a fixed header.
 */
import {ChangeDetectorRef, Input, NgZone, OnChanges, SimpleChange, SimpleChanges} from '@angular/core';
import {BoardViewModel} from '../../../view-model/board/board-view';
import {BOARD_HEADERS_HEIGHT, TOOLBAR_HEIGHT} from '../../../common/view-constants';
import {IssueDetailState} from '../../../model/board/user/issue-detail/issue-detail.model';
import {BehaviorSubject, Subject, Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export class FixedHeaderView implements OnChanges {

  @Input()
  board: BoardViewModel;

  @Input()
  windowHeight: number;

  @Input()
  windowWidth: number;

  @Input()
  issueDetailState: IssueDetailState;

  boardLeftOffset = 0;

  // Initialise to the same value as in the CSS. This will be calculated by ngOnChanges
  boardBodyHeight = 200;

  // Passed in to the ScrollListenerDirective. Values here are emitted OUTSIDE the angular zone
  scrollLeftObserver$: Subject<number> = new BehaviorSubject<number>(0);


  constructor(private readonly _changeDetector: ChangeDetectorRef, protected readonly _zone: NgZone) {
  }

  protected observeLeftScroll(until$: Observable<void>) {
    this.scrollLeftObserver$
      .pipe(
        takeUntil(until$)
      )
      .subscribe(
        value => {
          const leftOffset: number = value * -1;
          if (this.boardLeftOffset !== leftOffset) {
            this._zone.run(() => {
              this.boardLeftOffset = leftOffset;
            });
            this._changeDetector.markForCheck();
          }
        }
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const heightChange: SimpleChange = changes['windowHeight'];
    if (heightChange) {
      const height = heightChange.currentValue;
      this.boardBodyHeight = (height - TOOLBAR_HEIGHT - BOARD_HEADERS_HEIGHT);
      this.boardBodyHeightChanged();
    }
  }

  boardBodyHeightChanged() {
  }
}
