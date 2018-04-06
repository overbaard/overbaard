import {AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/fromEvent';


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
    this.refreshPosition(
      this.scrollLeftObserver,
      () => this._ref.nativeElement.scrollLeft);
  }

  private refreshTop() {
    this.refreshPosition(
      this.scrollTopObserver,
      () => this._ref.nativeElement.scrollTop);
  }

  private refreshPosition(
    observer: Subject<number>,
    positionGetter: () => number) {

    const pos = positionGetter();
    if (observer) {
      requestAnimationFrame((timestamp: any) => {
        this._zone.runOutsideAngular(() => {
          observer.next(pos)
        });
      });
    }
  }
}
