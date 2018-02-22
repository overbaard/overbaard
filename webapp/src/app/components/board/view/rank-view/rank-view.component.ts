import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter, NgZone,
  OnChanges, OnDestroy,
  OnInit,
  Output, Renderer2,
  SimpleChange,
  SimpleChanges, ViewChild
} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

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

  // Just an array here to be able to do 'for s of states; let i = index' in the template
  statesDummyArray: number[];

  private destroy$: Subject<void> = new Subject<void>();

  // Passed in to the ScrollListenerDirective. Values here are emitted OUTSIDE the angular zone
  scrollTopObserver$: Subject<number> = new BehaviorSubject<number>(0);

  constructor(
              changeDetector: ChangeDetectorRef,
              zone: NgZone,
              private readonly _renderer: Renderer2) {
    super(changeDetector, zone);
  }

  ngOnInit() {
    this.createEmptyStatesDummyArray();
    super.observeLeftScroll(this.destroy$);
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['board']) {
      const change: SimpleChange = changes['board'];
      if (change) {
        this.createEmptyStatesDummyArray();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  private createEmptyStatesDummyArray() {
    const numberStates =
      this.board.headers.headersList.reduce((sum, header) => sum += header.stateIndices.size, 0);
    this.statesDummyArray = new Array<number>(numberStates);
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
