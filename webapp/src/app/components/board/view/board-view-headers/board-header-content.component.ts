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

  @Input()
  performSizing;

  @Input()
  leftBorder = false;

  @Input()
  rightBoarder = false;

  @Input()
  handleHover = false;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  classList: string[];

  toggleColours = false;

  // Expose the enum to the component
  readonly enumViewMode = BoardViewMode;

  constructor() { }

  ngOnInit() {
    if (this.performSizing) {
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

    if (this.leftBorder) {
      this.classList.push('left-border');
    }
    if (this.rightBoarder) {
      this.classList.push('right-border');
    }
  }

  onMouseEnter(event: MouseEvent) {
    if (!this.handleHover && this.viewMode === BoardViewMode.KANBAN) {
      this.toggleColours = true;
    }
  }

  onMouseLeave(event: MouseEvent) {
    this.toggleColours = false;
  }
}
