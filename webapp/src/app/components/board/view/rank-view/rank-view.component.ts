import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
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
