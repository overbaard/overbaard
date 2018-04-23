import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {List} from 'immutable';
import {BoardService} from '../../../services/board.service';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardState} from '../../../model/board/data/board';
import {boardSelector} from '../../../model/board/data/board.reducer';
import {userSettingSelector} from '../../../model/board/user/user-setting.reducer';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-rank-issue-dialog',
  templateUrl: './rank-issue-dialog.component.html',
  styleUrls: ['./rank-issue-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankIssueDialogComponent implements OnInit {

  issue: BoardIssueView;
  issues: List<BoardIssue>;
  private _boardService: BoardService;
  private _rankCustomFieldId;


  constructor(
    public dialogRef: MatDialogRef<RankIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _store: Store<AppState>) {
    this.issue = data['issue'];
    this._boardService = data['boardService'];
  }

  ngOnInit(): void {
    this.issues = List<BoardIssue>().withMutations(list => {
      this._store.select(boardSelector)
        .pipe(
          take(1)
        )
        .subscribe((board: BoardState) => {
          this._rankCustomFieldId = board.rankCustomFieldId;
          board.ranks.rankedIssueKeys.get(this.issue.projectCode).forEach(key => {
            const curr: BoardIssue = board.issues.issues.get(key);
            list.push(curr);
          });
        });
      });
  }

  onRankIssueBefore($event: MouseEvent, index: number) {
    event.preventDefault();
    let before: BoardIssue;
    let beforeKey: string;
    let afterKey: string;
    if (index >= 0) {
      before = this.issues.get(index);
      beforeKey = before.key;
      if (index > 0) {
        afterKey = this.issues.get(index - 1).key;
      }

    } else {
      afterKey = this.issues.get(this.issues.size - 1).key;
    }

    this._store.select(userSettingSelector)
      .pipe(
        take(1)
      )
      .subscribe(us => {
        this._boardService.rankIssue(
          this._rankCustomFieldId, us.boardCode, this.issue, beforeKey, afterKey, () => this.dialogRef.close());
      });
  }
}
