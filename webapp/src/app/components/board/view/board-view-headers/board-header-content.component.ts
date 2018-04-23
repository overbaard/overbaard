import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';

@Component({
  selector: 'app-board-header-content',
  templateUrl: './board-header-content.component.html',
  styleUrls: ['./board-header-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardHeaderContentComponent implements OnInit, OnChanges {

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

  // Whether we handle our own hovering events or get the ones from the parent
  @Input()
  handleHover = false;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  classObj: Object = {};

  tooltip: string;

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

  ngOnChanges(changes: SimpleChanges): void {
    const headerChange: SimpleChange = changes['header'];
    if (headerChange) {
      if (headerChange.previousValue !== headerChange.currentValue) {
        this.createTooltip();
      }
    }
  }

  onMouseEnter(event: MouseEvent) {
    if (!this.handleHover) {
      this.hovering = true;
    }
  }

  onMouseLeave(event: MouseEvent) {
    if (!this.handleHover) {
      this.hovering = false;
    }
  }

  @Input()
  set hovering(hovering: boolean) {
    if (hovering) {
      this.classObj[this.header.backlog ? 'hover-colour-backlog' : 'hover-colour'] = true;
    } else {
      this.classObj['hover-colour-backlog'] = false;
      this.classObj['hover-colour'] = false;
    }
  }

  get exceededWip(): boolean {
    return this.header.wip > 0 && this.header.totalIssues > this.header.wip;
  }

  private createTooltip() {
    this.tooltip =
      `${this.header.name}\n\n`;

    if (this.header.helpText) {
      this.tooltip +=
        `${this.header.helpText}\n\n`;
    }
    this.tooltip +=
      `Visible issues: ${this.header.visibleIssues}\nTotal issues: ${this.header.totalIssues}`;

    if (this.header.wip) {
      this.tooltip +=
        `\nWip: ${this.header.wip}`;
    }
  }
}
