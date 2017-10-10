import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../../../model/board/board';
import {FixedHeaderView} from '../fixed-header-view';

@Component({
  selector: 'app-rank-view',
  templateUrl: './rank-view.component.html',
  styleUrls: ['./rank-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewComponent extends FixedHeaderView implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
