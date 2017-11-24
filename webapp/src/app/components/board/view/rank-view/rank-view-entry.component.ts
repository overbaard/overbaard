import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {BoardIssueView} from '../../../../view-model/board/board-issue-view';

@Component({
  selector: 'app-rank-view-entry',
  templateUrl: './rank-view-entry.component.html',
  styleUrls: ['./rank-view-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewEntryComponent implements OnInit {

  @Input()
  rankEntry: RankViewEntry

  @Input()
  issue: BoardIssueView;

  // Just an array here to be able to do 'for s of states; let i = index' in the template
  @Input()
  statesDummyArray: number[];

  constructor() {
  }

  ngOnInit() {
  }

}
