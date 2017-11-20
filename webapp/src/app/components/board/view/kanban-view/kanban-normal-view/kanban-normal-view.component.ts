import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {BoardHeader} from '../../../../../view-model/board/board-header';
import {List} from 'immutable';
import {BoardViewModel} from '../../../../../view-model/board/board-view';

@Component({
  selector: 'app-kanban-normal-view',
  templateUrl: './kanban-normal-view.component.html',
  styleUrls: ['./kanban-normal-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanNormalViewComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  @Output()
  scrollTableBodyX: EventEmitter<number> = new EventEmitter<number>();

  private _lastLeftOffset = 0;

  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }
}
