import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../../../common/board/board.reducer';
import {FixedHeaderView} from '../fixed-header-view';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit {


  constructor() {
    super();
  }

  ngOnInit() {
    console.log('---> have boardState ' + this.boardState$);
    console.log(`---> width ${this.windowWidth} ${this.windowHeight}`);
  }

}
