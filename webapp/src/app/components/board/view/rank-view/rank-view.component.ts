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

@Component({
  selector: 'app-rank-view',
  templateUrl: './rank-view.component.html',
  styleUrls: ['./rank-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewComponent extends FixedHeaderView implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  readonly viewMode = BoardViewMode.RANK;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  // Just an array here to be able to do 'for s of states; let i = index' in the template
  statesDummyArray: number[];

  private destroy$: Subject<void> = new Subject<void>();

  @ViewChild('boardBody')
  bodyElement: ElementRef;

  private _disposeScrollHandler: () => void | undefined;
  private refreshHandler = () => {
    this.refresh();
  };

  constructor(
              changeDetector: ChangeDetectorRef,
              zone: NgZone,
              private readonly _renderer: Renderer2,
              private readonly _zone: NgZone) {
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

  ngAfterViewInit(): void {
    this.addParentEventHandlers(this.bodyElement.nativeElement);
  }

  private createEmptyStatesDummyArray() {
    const numberStates =
      this.board.headers.headersList.reduce((sum, header) => sum += header.stateIndices.size, 0);
    this.statesDummyArray = new Array<number>(numberStates);
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  private addParentEventHandlers(parentScroll: Element) {
    this.removeParentEventHandlers();
    console.log(parentScroll);
    this._zone.runOutsideAngular(() => {
      this._disposeScrollHandler =
        this._renderer.listen(parentScroll, 'scroll', this.refreshHandler);
    });
  }

  private removeParentEventHandlers() {
    if (this._disposeScrollHandler) {
      this._disposeScrollHandler();
      this._disposeScrollHandler = undefined;
    }
  }

  refresh() {
    this._zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this._zone.run(() => {
          console.log('test' + this.bodyElement.nativeElement.scrollTop);
        });
      });
    });
  }
}
