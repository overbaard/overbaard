import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {BoardViewModel} from '../../../../view-model/board/board-view';

@Component({
  selector: 'app-rank-view-container',
  templateUrl: './rank-view-container.component.html',
  styleUrls: ['./rank-view-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewContainerComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  readonly viewMode = BoardViewMode.RANK;

  // Just an array here to be able to do 'for s of states; let i = index' in the entry template
  @Input()
  statesDummyArray: number[];

  constructor() {
  }

  ngOnInit() {
  }
}
