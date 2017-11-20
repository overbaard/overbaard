import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';

@Component({
  selector: 'app-kanban-swimlane-entry',
  templateUrl: './kanban-swimlane-entry.component.html',
  styleUrls: ['./kanban-swimlane-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneEntryComponent implements OnInit {

  @Input()
  board: BoardViewModel

  @Input()
  swimlane: SwimlaneData;


  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }
}
