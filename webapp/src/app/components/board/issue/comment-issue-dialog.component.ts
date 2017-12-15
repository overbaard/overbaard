import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {
  BoardProject, ParallelTask, ParallelTaskOption,
  ProjectState
} from '../../../model/board/data/project/project.model';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {boardSelector} from '../../../model/board/data/board.reducer';
import {boardProjectsSelector} from '../../../model/board/data/project/project.reducer';
import {Map, OrderedMap} from 'immutable';
import {BoardState} from '../../../model/board/data/board';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {userSettingSelector} from '../../../model/board/user/user-setting.reducer';
import {BoardService} from '../../../services/board.service';

@Component({
  selector: 'app-comment-issue-dialog',
  templateUrl: './comment-issue-dialog.component.html',
  styleUrls: ['./comment-issue-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentIssueDialogComponent implements OnInit {

  issue: BoardIssueView;
  commentForm: FormGroup;
  private _boardService: BoardService

  constructor(
    public dialogRef: MatDialogRef<CommentIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _store: Store<AppState>) {
    this.issue = data['issue'];
    this._boardService = data['boardService'];
  }

  ngOnInit(): void {
    this.commentForm = new FormGroup({
      comment: new FormControl()
    });
  }

  onCancel(event: MouseEvent) {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSave(event: MouseEvent) {
    this._store.select(userSettingSelector)
      .take(1)
      .subscribe(userSetting => {
        this._boardService.saveIssueComment(
          userSetting.boardCode,
          userSetting.showBacklog,
          this.issue,
          this.commentForm.value['comment'],
          () => this.dialogRef.close());
      });
  }
}

export interface StateInfo {
  boardState: string;
  ownState: string;
  currentState: boolean
}
