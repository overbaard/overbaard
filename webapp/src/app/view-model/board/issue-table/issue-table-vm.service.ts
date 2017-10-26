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
          if (this.lastBoardState === initialBoardState) {
            // We are populating the table for the first time
            issueTable = new IssueTableCreator(boardState, userSettingState).createIssueTable();
          } else {
            // We are updating the table
            issueTable = new IssueTableUpdater(boardState, userSettingState, issueTable).updateIssueTable();
          }
        }
        if (boardState.viewId >= 0) {
          if (userSettingState.filters !== this.lastUserSettingState.filters) {
            // Filter all the issues (we can optimise this later)
            const filters: AllFilters = new AllFilters(userSettingState.filters);
            let issues: Map<string, BoardIssueVm> = this.lastIssueTable.issues;
            issues = issues.withMutations(mutable => {
              this.lastIssueTable.issues.forEach((issue, key) => {
                const visible: boolean = filters.filterVisible(issue);
                if (visible !== issue.visible) {
                  mutable.set(key, BoardIssueVmUtil.updateVisibility(issue, visible));
                }
              });
            });
            issueTable =
              IssueTableVmUtil.createIssueTableVm(issues, this.lastIssueTable.table);
          }
        }
        this.lastIssueTable = issueTable;
        this.lastBoardState = boardState;
        this.lastUserSettingState = userSettingState
        return issueTable;
      });
  }
}


class BaseIssueTableGenerator {
  // private readonly _visiblePerState: number[];

  constructor(protected _boardState: BoardState, protected _userSettingState: UserSettingState) {
    // this._visiblePerState = new Array<number>(this._boardState.headers.states.size);
  }

  protected makeTableImmutable(table: List<string>[]): List<List<string>> {
    // Make the table immutable
    return List<List<string>>().withMutations(mutable => {
      table.forEach((v, i) => mutable.push(table[i].asImmutable()));
    });
  }

  protected createTable(): List<string>[] {
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

class IssueTableCreator extends BaseIssueTableGenerator {

  constructor(boardState: BoardState, userSettingState: UserSettingState) {
    super(boardState, userSettingState);
  }

  createIssueTable(): IssueTableVm {
    const issues: Map<string, BoardIssueVm> = Map<string, BoardIssueVm>().asMutable();
    const filters: AllFilters = new AllFilters(this._userSettingState.filters);

    this._boardState.issues.issues.forEach((issue, key) => {
      let issueVm: BoardIssueVm = BoardIssueVmUtil.createBoardIssueVm(issue, true);
      const visible = filters.filterVisible(issueVm);
      if (!visible) {
        issueVm = BoardIssueVmUtil.updateVisibility(issueVm, false);
      }
      issues.set(key, issueVm);
    });

    const table: List<string>[] = this.createTable();
    return IssueTableVmUtil.createIssueTableVm(issues.asImmutable(), this.makeTableImmutable(table));
  }
}

class IssueTableUpdater extends BaseIssueTableGenerator {

  constructor(boardState: BoardState, userSettingState: UserSettingState, private _oldState: IssueTableVm) {
    super(boardState, userSettingState);
  }

  updateIssueTable(): IssueTableVm {

    const issueChanges = this._boardState.issues.lastChanged.size > 0;
    let issues: Map<string, BoardIssueVm> = this._oldState.issues;
    if (issueChanges) {
      issues = this.applyIssueChanges(issues);
    }

    const newTable: List<string>[] = this.createTable();

    const tableChanges = this.consolidateIssueTable(newTable);
    if (!issueChanges && !tableChanges) {
      return this._oldState;
    }
    const table: List<List<string>> = !tableChanges ? this._oldState.table : this.makeTableImmutable(newTable);
    return IssueTableVmUtil.createIssueTableVm(issues, table);
  }

  private applyIssueChanges(oldIssues: Map<string, BoardIssueVm>): Map<string, BoardIssueVm> {
    const issues = oldIssues.asMutable();
    const filters: AllFilters = new AllFilters(this._userSettingState.filters);
    this._boardState.issues.lastChanged.forEach((change, key) => {
      if (change.change === IssueChange.DELETE) {
        issues.delete(key);
      } else {
        const issue: BoardIssue = this._boardState.issues.issues.get(key);
        let issueVm: BoardIssueVm = BoardIssueVmUtil.createBoardIssueVm(issue, true);
        const visible: boolean = filters.filterVisible(issueVm);
        if (!visible) {
          issueVm = BoardIssueVmUtil.updateVisibility(issueVm, false);
        }
        issues.set(key, issueVm);
      }
    });

    return issues.asImmutable();
  }

  private consolidateIssueTable(newTable: List<string>[]): boolean {
    let changed = false;
    for (let i = 0 ; i < newTable.length ; i++) {
      const oldIssues: List<string> = this._oldState.table.get(i);
      const newIssues: List<string> = newTable[i];
      if (oldIssues.equals(newIssues)) {
        // If the tables are the same, use the old table here to avoid updating the column components unnecessarily
        newTable[i] = oldIssues;
      } else {
        changed = true;
      }
    }
    return changed;
  }
}

