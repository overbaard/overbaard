import {Directive, ElementRef, EventEmitter, HostListener, Output} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/distinctUntilChanged';


@Directive({
  selector: '[scroll-listener]'
})
export class ScrollListenerDirective {
  @Output()
  scrollLeft: EventEmitter<number> = new EventEmitter<number>();

  private scrollSubject: Subject<number> = new BehaviorSubject(0);

  constructor(private _ref: ElementRef) {
    console.log('SCROLL DIRECTIVE!!!!');

    this.scrollSubject
    // TODO Throttling etc.
      // .distinctUntilChanged((a, b) => a === b) DOES NOT WORK
      .throttleTime(40)
      .subscribe(
      scroll => {
        console.log('Subject:  ' + scroll);
        this.scrollLeft.next(scroll);
      }
    );

  }

  @HostListener('scroll') onScroll() {
    console.log('!!SCROLL!! ');
    const offset: number = this._ref.nativeElement.scrollLeft * -1;
    console.log(offset);

    this.scrollSubject.next(offset)


  }
}
