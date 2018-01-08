import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  Output, SimpleChange, SimpleChanges
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {ParallelTask, ParallelTaskOption} from '../../../model/board/data/project/project.model';
import {ParallelTaskSelectorComponent} from './parallel-task-selector.component';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {BOARD_HEADERS_HEIGHT, TOOLBAR_HEIGHT} from '../../../common/view-constants';
import {UpdateParallelTaskEvent} from '../../../events/update-parallel-task.event';
import {LinkedIssue} from '../../../model/board/data/issue/linked-issue';
import {UrlService} from '../../../services/url.service';

@Component({
  selector: 'app-linked-issue',
  templateUrl: './linked-issue.component.html',
  styleUrls: ['./linked-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkedIssueComponent implements OnInit {

  @Input()
  linkedIssue: LinkedIssue;

  url: string;
  tooltip: string;

  constructor(private _urlService: UrlService) {
  }

  ngOnInit(): void {
    this.url = this._urlService.jiraUrl + 'browse/' + this.linkedIssue.key;
    this.tooltip = `${this.linkedIssue.key}\n${this.linkedIssue.summary}\n${this.linkedIssue.stateName}`;
  }
}
