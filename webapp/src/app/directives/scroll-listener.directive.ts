import {
  AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output,
  Renderer2
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';


@Directive({
  selector: '[appScrollListener]'
})
export class ScrollListenerDirective implements OnInit, OnDestroy, AfterViewInit {

  /**
   * Values emitted on this observer are OUTSIDE the angular zone.
   * If null the left value is not emitted.
   */
  @Input()
  scrollLeftObserver: Subject<number>;

  /**
   * Values emitted on this observer are OUTSIDE the angular zone.
   * If null the top value is not emitted.
   */
  @Input()
  scrollTopObserver: Subject<number>;


  private _lastLeft = -1;
  private _lastTop = -1;

  private _disposeScrollHandler: () => void | undefined;
  private refreshHandler = () => {
    this.refresh();
  };


  constructor(private _ref: ElementRef,
              private readonly _renderer: Renderer2,
              private readonly _zone: NgZone) {
  }

  ngOnInit(): void {
    this.addParentEventHandlers(this._ref.nativeElement);
  }

  ngOnDestroy(): void {
    this.removeParentEventHandlers();
  }

  ngAfterViewInit(): void {
    this.refresh();
  }

  private addParentEventHandlers(parentScroll: Element) {
    this.removeParentEventHandlers();
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

  private refresh() {
    if (this.scrollLeftObserver) {
      this.refreshLeft();
    }
    if (this.scrollTopObserver) {
      this.refreshTop();
    }
  }

  private refreshLeft() {
    this._zone.runOutsideAngular(() => {
      requestAnimationFrame((timeStamp: any) => {
        const left: number = this._ref.nativeElement.scrollLeft;
        if (left !== this._lastLeft) {
          this._lastLeft = left;
          this.scrollLeftObserver.next(left);
        }
      });
    });
  }

  private refreshTop() {
    this._zone.runOutsideAngular(() => {
      requestAnimationFrame((timeStamp: any) => {
        if (this.scrollTopObserver) {
          const top: number = this._ref.nativeElement.scrollTop;
          if (top !== this._lastTop) {
            this._lastTop = top;
            this.scrollTopObserver.next(top);
          }
        }
      });
    });
  }
}
