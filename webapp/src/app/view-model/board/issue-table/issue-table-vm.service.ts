import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {Observable} from 'rxjs/Observable';
import {initialIssueTableVm, IssueTableVmUtil} from './issue-table-vm.model';
import {BoardState} from '../../../model/board/data/board';
import 'rxjs/add/observable/combineLatest';
import {List, Map} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardProject, ProjectUtil} from '../../../model/board/data/project/project.model';
import {IssueTableVm} from './issue-table-vm';
import {initialUserSettingState, UserSettingState} from '../../../model/board/user/user-setting.model';
import {initialBoardState} from '../../../model/board/data/board.model';
import {BoardIssueVm} from './board-issue-vm';
import {BoardIssueVmUtil} from './board-issue-vm.model';
import {IssueChange} from '../../../model/board/data/issue/issue.model';
import {AllFilters} from './filter.util';

@Injectable()
export class IssueTableVmService {

  private _issueTableVmHandler: IssueTableVmHandler = new IssueTableVmHandler();

  constructor(private _store: Store<AppState>) {
  }

  getIssueTableVm(): Observable<IssueTableVm> {
    return this._issueTableVmHandler.getIssueTableVm(
      this._store.select('board'),
      this._store.select('userSettings')
    );
  }
}

/**
 * This class is mainly internal for IssueTableVmService, and a hook for testing. When used by IssueTableVmService,
 * its lifecycle follows that of the service
 */
export class IssueTableVmHandler {
  // Last inputs
  lastBoardState: BoardState = initialBoardState;
  lastUserSettingState: UserSettingState = initialUserSettingState;
  // Last result
  lastIssueTable: IssueTableVm = initialIssueTableVm;

  getIssueTableVm(
    boardState$: Observable<BoardState>,
    userSettingState$: Observable<UserSettingState>):  Observable<IssueTableVm> {
    return Observable
      .combineLatest(boardState$, userSettingState$, (boardState, userSettingState) => {
        let issueTable = this.lastIssueTable;
        if (boardState !== this.lastBoardState) {
          const tableCreator: IssueTableCreator = new IssueTableCreator(boardState, userSettingState);
          if (this.lastBoardState === initialBoardState) {
            // We are populating the table for the first time
            issueTable = tableCreator.createIssueTable();
          } else {
            // We are updating the table
            issueTable = tableCreator.updateIssueTable(issueTable);
          }
        }
        if (boardState.viewId >= 0) {
          if (userSettingState.filters !== this.lastUserSettingState.filters) {
            // Filter all the issues (we can optimise this later)
            const filters: AllFilters = new AllFilters(userSettingState.filters);
            let visibilities: Map<string, boolean> = this.lastIssueTable.issueVisibilities.asMutable();
            this.lastIssueTable.issues.forEach((issue, key) => {
              const visible: boolean = !filters.filter(issue);
              if (visible !== visibilities.get(key)) {
                visibilities.set(key, visible);
              }
            });
            visibilities = visibilities.asImmutable();
            issueTable =
              IssueTableVmUtil.createIssueTableVm(this.lastIssueTable.issues, this.lastIssueTable.table, visibilities);
          }
        }
        this.lastIssueTable = issueTable;
        this.lastBoardState = boardState;
        this.lastUserSettingState = userSettingState
        return issueTable;
      });
  }
}

class IssueTableCreator {

  constructor(private _boardState: BoardState, private _userSettingState: UserSettingState) {
  }

  createIssueTable(): IssueTableVm {
    const issues: Map<string, BoardIssueVm> = Map<string, BoardIssueVm>().asMutable();
    const issueVisibilities: Map<string, boolean> = Map<string, boolean>().asMutable();
    const filters: AllFilters = new AllFilters(this._userSettingState.filters);

    this._boardState.issues.issues.forEach((issue, key) => {
      const issueVm: BoardIssueVm = BoardIssueVmUtil.createBoardIssueVm(issue);
      issues.set(key, issueVm);
      issueVisibilities.set(key, !filters.filter(issueVm));
    });

    const table: List<string>[] = this.createTable();
    return IssueTableVmUtil.createIssueTableVm(issues.asImmutable(), this.makeTableImmutable(table), issueVisibilities);
  }

  updateIssueTable(oldState: IssueTableVm): IssueTableVm {

    const noIssueChanges = this._boardState.issues.lastChanged.size > 0;

    let issues: Map<string, BoardIssueVm> = oldState.issues;
    let visibilities: Map<string, boolean> = oldState.issueVisibilities;

    if (!noIssueChanges) {
      issues = issues.asMutable();
      visibilities = visibilities.asMutable();
      const filters: AllFilters = new AllFilters(this._userSettingState.filters);

      this._boardState.issues.lastChanged.forEach((change, key) => {
        if (change.change === IssueChange.DELETE) {
          issues.delete(key);
          visibilities.delete(key);
        } else {
          const issue: BoardIssue = this._boardState.issues.issues.get(key);
          issues.set(key, BoardIssueVmUtil.createBoardIssueVm(issue));
          const visible: boolean = !filters.filter(issue);
          if (change.change === IssueChange.NEW ||
            (change.change === IssueChange.UPDATE && !visibilities.get(key) === visible)) {
            visibilities.set(key, visible);
          }
        }
      });

      issues = issues.asImmutable();
      visibilities = visibilities.asImmutable();
    }


    let noTableChanges = true;
    const newTable: List<string>[] = this.createTable();
    for (let i = 0 ; i < newTable.length ; i++) {
      const oldIssues: List<string> = oldState.table.get(i);
      const newIssues: List<string> = newTable[i];
      if (oldIssues.equals(newIssues)) {
        // If the tables are the same, use the old table here to avoid updating the column components unnecessarily
        newTable[i] = oldIssues;
      } else {
        noTableChanges = false;
      }
    }
    if (noTableChanges && noIssueChanges) {
      return oldState;
    }

    const table: List<List<string>> = noTableChanges ? oldState.table : this.makeTableImmutable(newTable);
    return IssueTableVmUtil.createIssueTableVm(issues, table, visibilities);
  }

  private createTable(): List<string>[] {
    const table: List<string>[] = new Array<List<string>>(this._boardState.headers.states.size);
    for (let i = 0 ; i < table.length ; i++) {
      table[i] = List<string>().asMutable();
    }

    this.addProjectIssues(table, this._boardState.projects.boardProjects.get(this._boardState.projects.owner));
    this._boardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._boardState.projects.owner) {
        this.addProjectIssues(table, project);
      }
    });
    return table;
  }

  private makeTableImmutable(table: List<string>[]): List<List<string>> {
    // Make the table immutable
    return List<List<string>>().withMutations(mutable => {
      table.forEach((v, i) => mutable.push(table[i].asImmutable()));
    });
  }

  private addProjectIssues(list: List<string>[], project: BoardProject) {
    const ownToBoardIndex: number[] = ProjectUtil.getOwnIndexToBoardIndex(this._boardState.headers, project);
    this._boardState.ranks.rankedIssueKeys.get(project.key).forEach((key) => {
      const issue: BoardIssue = this._boardState.issues.issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      list[boardIndex].push(key);
    });
  }
}

