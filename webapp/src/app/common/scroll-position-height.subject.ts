import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ScrollPositionAndHeight} from './scroll-position-height';

export class ScrollPositionAndHeightSubject extends BehaviorSubject<ScrollPositionAndHeight> {

  private static readonly INITIAL_POSITION: ScrollPositionAndHeight = {scrollPos: 0, height: 0};

  private _position: ScrollPositionAndHeight = ScrollPositionAndHeightSubject.INITIAL_POSITION;

  constructor() {
    super(ScrollPositionAndHeightSubject.INITIAL_POSITION);
  }

  next(value: ScrollPositionAndHeight): void {
    super.next(value);
  }

  nextScrollPos(scrollPos: number) {
    this._position.scrollPos = scrollPos;
    this.next(this._position);
  }

  nextHeight(height: number) {
    this._position.height = height;
    this.next(this._position);
  }
}

