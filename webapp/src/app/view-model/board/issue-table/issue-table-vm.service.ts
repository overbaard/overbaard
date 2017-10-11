import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {Observable} from 'rxjs/Observable';
import {initialIssueTableVm, IssueTableVmUtil} from './issue-table-vm.model';
import {BoardState} from '../../../model/board/data/board';
import 'rxjs/add/observable/combineLatest';
import {List} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardProject, ProjectUtil} from '../../../model/board/data/project/project.model';
import {IssueTableVm} from './issue-table-vm';

@Injectable()
export class IssueTableVmService {

  private _issueTableVmHandler: IssueTableVmHandler = new IssueTableVmHandler();

  constructor(private _store: Store<AppState>) {
    console.log('Creating issue table service')
  }

  getIssueTableVm(): Observable<IssueTableVm> {
    return this._issueTableVmHandler.getIssueTableVm(
      this._store.select('board')
    );
  }
}

/**
 * This class is mainly internal for IssueTableVmService, and a hook for testing. When used by IssueTableVmService,
 * its lifecycle follows that of the service
 */
export class IssueTableVmHandler {
  lastBoardState: BoardState;
  lastIssueTable: IssueTableVm;

  getIssueTableVm(boardState$: Observable<BoardState>):  Observable<IssueTableVm> {
    return Observable
      .combineLatest(boardState$, (boardState) => {
        if (boardState.viewId < 0) {
          return initialIssueTableVm;
        }
        const tableCreator: IssueTableCreator = new IssueTableCreator(boardState);
        let issueTable: IssueTableVm = null;
        if (!this.lastBoardState) {
          // We are populating the table for the first time
          issueTable = tableCreator.createIssueTable();
        } else {
          // We are updating the table
          issueTable = tableCreator.updateIssueTable(this.lastIssueTable);
        }
        this.lastIssueTable = issueTable;
        this.lastBoardState = boardState;
        return issueTable;
      });
  }
}

class IssueTableCreator {
  constructor(private _boardState: BoardState) {
  }

  createIssueTable(): IssueTableVm {
    const table: List<BoardIssue>[] = this.createTable();
    return IssueTableVmUtil.createIssueTableVm(this.makeTableImmutable(table));
  }

  updateIssueTable(oldState: IssueTableVm): IssueTableVm {

    const newTable: List<BoardIssue>[] = this.createTable();

    let noChanges = true;
    for (let i = 0 ; i < newTable.length ; i++) {
      const oldIssues: List<BoardIssue> = oldState.table.get(i);
      const newIssues: List<BoardIssue> = newTable[i];
      if (oldIssues.equals(newIssues)) {
        // If the tables are the same, use the old table here to avoid updating the column components unnecessarily
        newTable[i] = oldIssues;
      } else {
        noChanges = false;
      }
    }
    if (noChanges) {
      return oldState;
    }
    return IssueTableVmUtil.createIssueTableVm(this.makeTableImmutable(newTable));
  }

  private createTable(): List<BoardIssue>[] {
    const table: List<BoardIssue>[] = new Array<List<BoardIssue>>(this._boardState.headers.states.size);
    for (let i = 0 ; i < table.length ; i++) {
      table[i] = List<BoardIssue>().asMutable();
    }

    this.addProjectIssues(table, this._boardState.projects.boardProjects.get(this._boardState.projects.owner));
    this._boardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._boardState.projects.owner) {
        this.addProjectIssues(table, project);
      }
    });
    return table;
  }

  private makeTableImmutable(table: List<BoardIssue>[]): List<List<BoardIssue>> {
    // Make the table immutable
    return List<List<BoardIssue>>().withMutations(mutable => {
      table.forEach((v, i) => mutable.push(table[i].asImmutable()));
    });
  }

  private addProjectIssues(list: List<BoardIssue>[], project: BoardProject) {
    const ownToBoardIndex: number[] = ProjectUtil.getOwnIndexToBoardIndex(this._boardState.headers, project);
    this._boardState.ranks.rankedIssueKeys.get(project.key).forEach((key) => {
      const issue: BoardIssue = this._boardState.issues.issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      list[boardIndex].push(issue);
    });
  }

}
