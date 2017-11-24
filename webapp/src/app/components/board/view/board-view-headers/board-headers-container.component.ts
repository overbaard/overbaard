import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeaders} from '../../../../view-model/board/board-headers';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';

@Component({
  selector: 'app-board-headers-container',
  templateUrl: './board-headers-container.component.html',
  styleUrls: ['./board-headers-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardHeadersContainerComponent implements OnInit {

  @Input()
  headers: BoardHeaders;

  @Input()
  viewMode: BoardViewMode;

  @Input()
  boardLeftOffset = 0;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  // Expose the enum to the component
  readonly enumViewMode = BoardViewMode;


  constructor() { }

  ngOnInit() {
  }

  onToggleVisibility(header: BoardHeader) {
    this.toggleColumnVisibility.emit(header);
  }

  onToggleBacklog(header: BoardHeader) {
    this.toggleBacklog.next(header);
  }
}
