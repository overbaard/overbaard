import {Directive, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import {Observable} from 'rxjs/Observable';


@Directive({
  selector: '[scroll-listener]'
})
export class ScrollListenerDirective implements OnInit, OnDestroy{
  @Output()
  scrollLeft: EventEmitter<number> = new EventEmitter<number>();

  private scrollSubject$: Subject<number> = new BehaviorSubject(0);
  private destroy$: Subject<void> = new Subject<void>();

  constructor(private _ref: ElementRef) {
  }

  ngOnInit(): void {
    this.scrollSubject$
      .asObservable()
      .throttleTime(25)
      .merge(
        // If just handling the scroll event, we miss out on some of the last values due to the throttleTime
        // so periodically ping here
        Observable.timer(0, 1000)
          .map(data => this._ref.nativeElement.scrollLeft)
      )
      .takeUntil(this.destroy$)
      .distinctUntilChanged()
      .subscribe(
        scroll => {
          // console.log('Subject:  ' + scroll);
          this.scrollLeft.next(scroll * -1);
        }
      );

    // Trigger this every so often since the original
    Observable.timer(0, 80)
      .takeUntil(this.destroy$)
      .subscribe(
        scroll => {
        this.scrollSubject$.next(this._ref.nativeElement.scrollLeft)
      });

  }

  ngOnDestroy(): void {
  }

  @HostListener('scroll') onScroll() {
    const offset: number = this._ref.nativeElement.scrollLeft;
    // console.log('Scroll: ' + offset);

    this.scrollSubject$.next(offset)


  }
}
