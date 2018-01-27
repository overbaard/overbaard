import {
  AfterViewInit,
  Directive, ElementRef, EventEmitter, HostListener, NgZone, OnDestroy, OnInit, Output,
  Renderer2
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import {Observable} from 'rxjs/Observable';


@Directive({
  selector: '[appScrollListener]'
})
export class ScrollListenerDirective implements OnInit, OnDestroy, AfterViewInit {
  @Output()
  scrollLeft: EventEmitter<number> = new EventEmitter<number>();

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private _ref: ElementRef,
              private readonly _renderer: Renderer2,
              private readonly _zone: NgZone) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this._zone.runOutsideAngular(() => {
      Observable.fromEvent(this._ref.nativeElement, 'scroll')
        .takeUntil(this.destroy$)
        .debounceTime(20)
        .subscribe(
          res => {
            const left: number = this._ref.nativeElement.scrollLeft;
              this._zone.run(() => this.scrollLeft.next(left * -1))
          });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
