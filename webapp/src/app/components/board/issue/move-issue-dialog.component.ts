import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BoardProject} from '../../../model/board/data/project/project.model';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {boardSelector} from '../../../model/board/data/board.reducer';
import {Map} from 'immutable';
import {BoardState} from '../../../model/board/data/board';
import {BoardService} from '../../../services/board.service';
import {userSettingSelector} from '../../../model/board/user/user-setting.reducer';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-move-issue-dialog',
  templateUrl: './move-issue-dialog.component.html',
  styleUrls: ['./move-issue-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveIssueDialogComponent implements OnInit {

  issue: BoardIssueView;
  currentBoardState: string;
  currentOwnState: string;
  stateInfos: StateInfo[] = [];

  private _boardService: BoardService;

  constructor(
    public dialogRef: MatDialogRef<MoveIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _store: Store<AppState>) {
    this.issue = data['issue'];
    this._boardService = data['boardService'];
  }

  ngOnInit(): void {
    let ownStateIndex = 0;
    this._store.select(boardSelector)
      .pipe(
        take(1)
      )
      .subscribe(
      (board: BoardState) => {
        const projectState: BoardProject = board.projects.boardProjects.get(this.issue.projectCode);
        const stateMappings: Map<string, string> = projectState.boardStateNameToOwnStateName;
        board.headers.states.forEach(state => {
          const ownState: string = stateMappings.get(state);
          let currentState = false;
          if (ownStateIndex === this.issue.ownState) {
            this.currentBoardState = state;
            this.currentOwnState = ownState;
            currentState = true;
          }
          this.stateInfos.push({boardState: state, ownState: ownState, currentState: currentState});
          if (ownState) {
            ownStateIndex++;
          }
        });
    });
  }

  onSelectToState(stateInfo: StateInfo) {
    if (!stateInfo.ownState) {
      return;
    }
    this._store.select(userSettingSelector)
      .pipe(
        take(1)
      )
      .subscribe(userSetting => {
        this._boardService.moveIssue(
          userSetting.boardCode,
          userSetting.showBacklog,
          this.issue,
          stateInfo.boardState,
          stateInfo.ownState,
          () => this.dialogRef.close());
      });

  }
}

export interface StateInfo {
  boardState: string;
  ownState: string;
  currentState: boolean
}
