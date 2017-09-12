import {Action} from '@ngrx/store';
import {BoardProject, ProjectState} from '../../project/project.model';
import {BoardIssue, IssueState} from '../../issue/issue.model';
import {initialIssueTableState, IssueTableState, IssueTableUtil} from './issue-table.model';
import {HeaderState} from '../../header/header.model';
import {List} from 'immutable';


const CREATE_ISSUE_TABLE = 'CREATE_ISSUE_TABLE';

class CreateIssueTableAction implements Action {
  readonly type = CREATE_ISSUE_TABLE;

  constructor(readonly payload: IssueTableCreator) {
  }
}

export class IssueTableActions {
  static createCreateIssueTable(headerState: HeaderState, issueState: IssueState, projectState: ProjectState): Action {
    return new CreateIssueTableAction(new IssueTableCreator(headerState, issueState, projectState));
  }
}



export function issueTableReducer(state: IssueTableState = initialIssueTableState, action: Action): IssueTableState {

  switch (action.type) {
    case CREATE_ISSUE_TABLE: {
      const payload: IssueTableCreator = (<CreateIssueTableAction>action).payload;
      const newState: IssueTableState = payload.createIssueTableState();
      if (IssueTableUtil.toStateRecord(newState).equals(IssueTableUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};

class IssueTableCreator {
  constructor(private _headerState: HeaderState, private _issueState: IssueState, private  _projectState: ProjectState) {
  }

  get headerState(): HeaderState {
    return this._headerState;
  }

  get projectState(): ProjectState {
    return this._projectState;
  }

  createIssueTableState(): IssueTableState {
    const table: List<BoardIssue>[] = new Array<List<BoardIssue>>(this.headerState.states.size);
    for (let i = 0 ; i < table.length ; i++) {
      table[i] = List<BoardIssue>().asMutable();
    }

    this.addProjectIssues(table, this.projectState.boardProjects.get(this.projectState.owner));
    this.projectState.boardProjects.forEach((project, key) => {
      if (key !== this.projectState.owner) {
        this.addProjectIssues(table, project);
      }
    });

    // Make the table immutable
    const tableList: List<List<BoardIssue>> = List<List<BoardIssue>>().withMutations(mutable => {
      table.forEach((v, i) => mutable.push(table[i].asImmutable()));
    });

    return IssueTableUtil.createIssueTableState(tableList);

  }

  private addProjectIssues(list: List<BoardIssue>[], project: BoardProject) {
    const ownToBoardIndex: number[] = this.getOwnIndexToBoardIndex(project);
    this.projectState.rankedIssueKeys.get(project.key).forEach((key) => {
      const issue: BoardIssue = this._issueState.issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      list[boardIndex].push(issue);
    });
  }

  private getOwnIndexToBoardIndex(project: BoardProject): number[] {
    const ownToBoard: number[] = new Array<number>(this._headerState.states.size);
    let currentOwn = 0;
    this._headerState.states.forEach((name, index) => {
      const ownState: string = project.boardStateNameToOwnStateName.get(name);
      if (ownState) {
        ownToBoard[currentOwn++] = index;
      }
    });

    return ownToBoard;
  }
}

