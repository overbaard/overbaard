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

  classObj: Object = {};

  // Expose the enum to the component
  readonly enumViewMode = BoardViewMode;

  constructor() { }

  ngOnInit() {
    if (this.header.backlog) {
      this.classObj['header-content-backlog'] = true;
    } else {
      this.classObj['header-content'] = true;
    }

    if (this.performSizing) {
      if (this.viewMode === BoardViewMode.KANBAN) {
        if (this.header.visible) {
          this.classObj['visible'] = true;
        } else {
          this.classObj['invisible'] = true;
        }
      } else {
        this.classObj['rank'] = true;
      }
    }

    if (this.leftBorder) {
      this.classObj['left-border'] = true;
    }
    if (this.rightBoarder) {
      this.classObj['right-border'] = true;
    }
  }

  onMouseEnter(event: MouseEvent) {
    if (!this.handleHover && this.viewMode === BoardViewMode.KANBAN) {
      this.classObj[this.header.backlog ? 'hover-colour-backlog' : 'hover-colour'] = true;
    }
  }

  onMouseLeave(event: MouseEvent) {
    this.classObj['hover-colour-backlog'] = false;
    this.classObj['hover-colour'] = false;
  }
}
