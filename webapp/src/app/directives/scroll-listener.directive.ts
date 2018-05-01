import {AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {Subject} from 'rxjs/Subject';


@Directive({
  selector: '[appScrollListener]'
})
export class ScrollListenerDirective implements OnInit, OnDestroy, AfterViewInit {

  private static readonly supportsPassive: boolean = ScrollListenerDirective.initSupportsPassive();
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

  private _scrollOpts: any = ScrollListenerDirective.supportsPassive ? { passive: true } : false;

  private static initSupportsPassive(): boolean {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function() {
          supportsPassive = true;
        }
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {}
    return supportsPassive;
  }

  private refreshHandler = () => {
    this.refresh();
  }

  constructor(private _ref: ElementRef,
              private readonly _renderer: Renderer2,
              private readonly _zone: NgZone) {
  }

  ngOnInit(): void {
    this.addParentEventHandlers(this._ref.nativeElement);
  }

  ngOnDestroy(): void {
    this.removeParentEventHandlers(this._ref.nativeElement);
  }

  ngAfterViewInit(): void {
    this.refresh();
  }

  private addParentEventHandlers(parentScroll: HTMLElement) {
    this.removeParentEventHandlers(parentScroll);
    this._zone.runOutsideAngular(() => {
      parentScroll.addEventListener('scroll', this.refreshHandler, this._scrollOpts);
    });
  }

  private removeParentEventHandlers(parentScroll: HTMLElement) {
    parentScroll.removeEventListener('scroll', this.refreshHandler, this._scrollOpts);
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
          observer.next(pos);
        });
      });
    }
  }

}
