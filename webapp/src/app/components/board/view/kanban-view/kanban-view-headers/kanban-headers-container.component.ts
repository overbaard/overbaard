import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeaders} from '../../../../../view-model/board/board-headers';
import {List} from 'immutable';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {BoardHeader} from '../../../../../view-model/board/board-header';

@Component({
  selector: 'app-kanban-headers-container',
  templateUrl: './kanban-headers-container.component.html',
  styleUrls: ['./kanban-headers-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanHeadersContainerComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  @Input()
  boardLeftOffset = 0;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  constructor() { }

  ngOnInit() {
  }

  get headers(): BoardHeaders {
    return this.board.headers;
  }

  onToggleVisibility(header: BoardHeader) {
    this.toggleColumnVisibility.emit(header);
  }

  onToggleBacklog(header: BoardHeader) {
    this.toggleBacklog.next(header);
  }
}
