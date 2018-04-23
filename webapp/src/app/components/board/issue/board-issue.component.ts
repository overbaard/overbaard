import {
  AfterViewInit,
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
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Assignee, NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {Set} from 'immutable';
import {MatDialog} from '@angular/material';
import {UpdateParallelTaskEvent} from '../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../model/board/user/issue-detail/issue-detail.model';
import {MoveIssueDialogComponent} from './move-issue-dialog.component';
import {CommentIssueDialogComponent} from './comment-issue-dialog.component';
import {BoardService} from '../../../services/board.service';
import {RankIssueDialogComponent} from './rank-issue-dialog.component';
import {BoardViewMode} from '../../../model/board/user/board-view-mode';
import {ParallelTask, ParallelTaskOption} from '../../../model/board/data/project/project.model';
import {LinkedIssue} from '../../../model/board/data/issue/linked-issue';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardIssueComponent implements OnInit, OnChanges, AfterViewInit {

  readonly noAssignee: Assignee = NO_ASSIGNEE;

  @Input()
  issue: BoardIssueView;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  @Input()
  issueDetailState: IssueDetailState;

  @Input()
  viewMode: BoardViewMode = BoardViewMode.KANBAN;


  cardTooltip: string;

  viewModeEnum = BoardViewMode;


  constructor(public menuDialog: MatDialog, private _boardService: BoardService/*, private _elementRef: ElementRef*/) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const issue: SimpleChange = changes['issue'];
    if (issue && issue.currentValue !== issue.previousValue) {
      this.cardTooltip = null;
    }
  }

  ngAfterViewInit(): void {

    /*
    // Debug code only
    // This compares the measured height with the calculated height. Only enable this when that area is problematic,
    // as it has a performance overhead, which slows down the virtual scrolling.
    const calculatedHeight: number = this.issue.calculatedTotalHeight;
    const card: HTMLElement = this._elementRef.nativeElement.querySelector('mat-card');
    const margin = 10; // We need to add the margin ourselves
    let actualHeight: number = card.offsetHeight + margin;
    if (this.viewMode === this.viewModeEnum.RANK) {
      actualHeight += 2; // Add the border of the containing div
    }

    const s = `${this.issue.key} ${calculatedHeight} ${actualHeight}`;
    if (actualHeight !== calculatedHeight) {
      console.error(s);
    } else {
      console.log(s);
    }
    */
  }

  get showSummary(): boolean {
    return this.issueDetailState.issueSummaryLevel > IssueSummaryLevel.HEADER_ONLY;
  }

  get showAvatar(): boolean {
    return this.issueDetailState.issueSummaryLevel > IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR;
  }

  get shortSummary(): boolean {
    return this.issueDetailState.issueSummaryLevel < IssueSummaryLevel.FULL;
  }

  get hasLinkedIssues(): boolean {
    return this.issue.linkedIssues && this.issue.linkedIssues.size > 0;
  }

  calculateTooltips() {
    if (!this.cardTooltip) {
      let tooltip =
        `${this.issue.key}

        Project State: ${this.issue.ownStateName}
        Assignee: ${this.issue.assignee.name}
        Priority: ${this.issue.priority.name}
        Type: ${this.issue.type.name}
        Components: ${this.formatPossiblyEmptySet(this.issue.components)}
        Labels: ${this.formatPossiblyEmptySet(this.issue.labels)}
        Fix versions: ${this.formatPossiblyEmptySet(this.issue.fixVersions)}
        `;

      if (this.issue.customFields) {
        this.issue.customFields.forEach((cf, k) => {
          tooltip +=
            `${k}: ${cf.value}
            `;
        });
      }

      if (this.issue.parallelTasks) {
        tooltip += '\n';
        this.issue.parallelTasks.forEach((pt, i) => {
          const selectedIndex: number = this.issue.selectedParallelTasks.get(i);
          const option: ParallelTaskOption = pt.options.get(selectedIndex);
          tooltip +=
            `${pt.name}: ${option.name}
            `;
        });
      }

      this.cardTooltip = tooltip;
    }
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  private formatPossiblyEmptySet(set: Set<string>): string {
    if (!set || set.size === 0) {
      return '-';
    }
    let s = ' ';
    let first = true;
    set.forEach(v => {
      if (first) {
        first = false;
      } else {
        s += ', ';
      }
      s += v;
    });
    return s;
  }

  onOpenMoveIssueDialog(event: MouseEvent) {
    this.menuDialog.open(MoveIssueDialogComponent, {
      data: {
        issue: this.issue,
        boardService: this._boardService
      }
    });
  }

  onOpenCommentIssueDialog(event: MouseEvent) {
    this.menuDialog.open(CommentIssueDialogComponent, {
      data: {
        issue: this.issue,
        boardService: this._boardService
      }
    });
  }

  onOpenRankIssueDialog(event: MouseEvent) {
    this.menuDialog.open(RankIssueDialogComponent, {
      data: {
        issue: this.issue,
        boardService: this._boardService
      }
    });
  }

  parallelTaskTrackByFn(index: number, pt: ParallelTask) {
    return index;
  }

  linkedIssueTrackByFn(index: number, li: LinkedIssue) {
    return li.key;
  }
}
