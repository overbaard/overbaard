import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {Subject, BehaviorSubject} from 'rxjs';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {List} from 'immutable';
import {BoardViewModel} from '../../../../view-model/board/board-view';
import {BoardHeaders} from '../../../../view-model/board/board-headers';

@Component({
  selector: 'app-rank-view',
  templateUrl: './rank-view.component.html',
  styleUrls: ['./rank-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewComponent extends FixedHeaderView implements OnInit, OnChanges, OnDestroy {

  readonly viewMode = BoardViewMode.RANK;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private destroy$: Subject<void> = new Subject<void>();

  // Passed in to the ScrollListenerDirective. Values here are emitted OUTSIDE the angular zone
  scrollTopObserver$: Subject<number> = new BehaviorSubject<number>(0);

  flattenedHeaders: List<BoardHeader>;

  constructor(
              changeDetector: ChangeDetectorRef,
              zone: NgZone,
              private readonly _renderer: Renderer2) {
    super(changeDetector, zone);
  }

  ngOnInit() {
    this.flattenHeaders();
    super.observeLeftScroll(this.destroy$);
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    const boardChange: SimpleChange = changes['board'];
    if (boardChange) {
      const currentHeaders: BoardHeaders = this.getChangeHeaders(boardChange.currentValue);
      const oldHeaders: BoardHeaders = this.getChangeHeaders(boardChange.previousValue);
      if (currentHeaders !== oldHeaders) {
        this.flattenHeaders();
      }
    }
  }

  private getChangeHeaders(board: BoardViewModel): BoardHeaders {
    return board ? board.headers : null;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  private flattenHeaders() {
    this.flattenedHeaders = List<BoardHeader>().withMutations(mutable => {
      this.board.headers.headersList.forEach(hdr => {
        if (!hdr.category) {
          mutable.push(hdr);
        } else {
          hdr.states.forEach(child => {
            mutable.push(child);
          });
        }
      });
    });
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}
