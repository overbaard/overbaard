import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {userSettingSelector} from '../../../model/board/user/user-setting.reducer';
import {BoardService} from '../../../services/board.service';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-comment-issue-dialog',
  templateUrl: './comment-issue-dialog.component.html',
  styleUrls: ['./comment-issue-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentIssueDialogComponent implements OnInit {

  issue: BoardIssueView;
  commentForm: UntypedFormGroup;
  private _boardService: BoardService;

  constructor(
    public dialogRef: MatDialogRef<CommentIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _store: Store<AppState>) {
    this.issue = data['issue'];
    this._boardService = data['boardService'];
  }

  ngOnInit(): void {
    this.commentForm = new UntypedFormGroup({
      comment: new UntypedFormControl()
    });
  }

  onCancel(event: MouseEvent) {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSave() {
    this._store.select(userSettingSelector)
      .pipe(
        take(1)
      )
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
  currentState: boolean;
}
