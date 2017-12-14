import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange,
  SimpleChanges
} from '@angular/core';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Assignee, NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {Set} from 'immutable';
import {ParallelTask} from '../../../model/board/data/project/project.model';
import {MatDialog} from '@angular/material';
import {ParallelTaskSelectorComponent} from './parallel-task-selector.component';
import {UpdateParallelTaskEvent} from '../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../model/board/user/issue-detail/issue-detail.model';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardIssueComponent implements OnInit, OnChanges {

  readonly noAssignee: Assignee = NO_ASSIGNEE;

  @Input()
  issue: BoardIssueView;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  @Input()
  issueDetailState: IssueDetailState;

  cardTooltip: string;


  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const issue: SimpleChange = changes['issue'];
    if (issue && issue.currentValue !== issue.previousValue) {
      this.cardTooltip = null;
    }
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

  calculateTooltips() {
    if (!this.cardTooltip) {
      let tooltip =
        `${this.issue.key}

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

      // TODO Parallel tasks

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
}
