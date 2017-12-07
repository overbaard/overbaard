import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';

@Component({
  selector: 'app-board-header-content',
  templateUrl: './board-header-content.component.html',
  styleUrls: ['./board-header-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardHeaderContentComponent implements OnInit {

  @Input()
  header: BoardHeader;

  @Input()
  viewMode: BoardViewMode;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  classList: string[];

  // Expose the enum to the component
  readonly enumViewMode = BoardViewMode;

  constructor() { }

  ngOnInit() {
    if (!this.header) {
      return;
    }

    if (!this.header.category) {
      if (this.viewMode === BoardViewMode.KANBAN) {
        if (this.header.visible) {
          this.classList = ['state', 'visible'];
        } else {
          this.classList = ['state', 'invisible'];
        }
      } else {
        this.classList = ['state', 'rank']
      }
    }
  }
}
