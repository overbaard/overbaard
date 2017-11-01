import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {Observable} from 'rxjs/Observable';
import {initialIssueTableVm, IssueTableVmUtil} from './issue-table-vm.model';
import {BoardState} from '../../../model/board/data/board';
import 'rxjs/add/observable/combineLatest';
import {List, Map, OrderedMap, OrderedSet} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardProject, ProjectUtil} from '../../../model/board/data/project/project.model';
import {IssueTableVm, SwimlaneInfoVm} from './issue-table-vm';
import {initialUserSettingState, UserSettingState} from '../../../model/board/user/user-setting.model';
import {initialBoardState} from '../../../model/board/data/board.model';
import {BoardIssueVm} from './board-issue-vm';
import {BoardIssueVmUtil} from './board-issue-vm.model';
import {IssueChange} from '../../../model/board/data/issue/issue.model';
import {AllFilters} from './filter.util';
import {Dictionary} from '../../../common/dictionary';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';

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

function  initMutableTable(states: number): List<string>[] {
  const table: List<string>[] = new Array<List<string>>(states);
  for (let i = 0 ; i < table.length ; i++) {
    table[i] = List<string>().asMutable();
  }
  return table;
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
        let changeType: ChangeType = null;
        if (boardState !== this.lastBoardState) {
          changeType = this.lastBoardState === initialBoardState ? ChangeType.LOAD_BOARD : ChangeType.UPDATE_BOARD;
        } else if (boardState.viewId >= 0) {
          if (userSettingState.filters !== this.lastUserSettingState.filters) {
            changeType = ChangeType.APPLY_FILTERS;
          } else if (userSettingState.swimlane !== this.lastUserSettingState.swimlane) {
            changeType = ChangeType.CHANGE_SWIMLANE;
          }
        }

        if (changeType === null) {
          return this.lastIssueTable;
        }

        const issueTableBuilder: IssueTableBuilder = new IssueTableBuilder(
          changeType,
          this.lastIssueTable,
          this.lastBoardState,
          this.lastUserSettingState,
          boardState,
          userSettingState);
        const issueTable: IssueTableVm = issueTableBuilder.updateIssueTable();
        this.lastIssueTable = issueTable;
        this.lastBoardState = boardState;
        this.lastUserSettingState = userSettingState;
        return issueTable;
      });
  }
}

enum ChangeType {
  LOAD_BOARD,
  UPDATE_BOARD,
  APPLY_FILTERS,
  CHANGE_SWIMLANE
}

class IssueTableBuilder {

  constructor(
    private readonly _changeType: ChangeType,
    private readonly _oldIssueTableState: IssueTableVm,
    private readonly _oldBoardState: BoardState,
    private readonly _oldUserSettingState: UserSettingState,
    private readonly _currentBoardState: BoardState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  updateIssueTable (): IssueTableVm {
    let issues: Map<string, BoardIssueVm> = this.populateIssues();
    issues = this.filterIssues(issues);
    const table: List<List<string>> = this.createTable(issues);
    const visibleIssueCounts: List<number> = this.calculateVisibleIssueCounts(issues, table);
    const swimlaneInfo: SwimlaneInfoVm = this.calculateSwimlane(issues, table);

    if (issues === this._oldIssueTableState.issues &&
        table === this._oldIssueTableState.table &&
        swimlaneInfo === this._oldIssueTableState.swimlaneInfo &&
        visibleIssueCounts === this._oldIssueTableState.visibleIssueCounts) {
      return this._oldIssueTableState;
    }

    return IssueTableVmUtil.createIssueTableVm(issues, table, swimlaneInfo, visibleIssueCounts);
  }

  private populateIssues(): Map<string, BoardIssueVm> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD: {
        const issues: Map<string, BoardIssueVm> = Map<string, BoardIssueVm>().asMutable();
        this._currentBoardState.issues.issues.forEach((issue, key) => {
          const issueVm: BoardIssueVm = BoardIssueVmUtil.createBoardIssueVm(issue, true);
          issues.set(key, issueVm);
        });
        return issues.asImmutable();
      }
      case ChangeType.UPDATE_BOARD: {
        const issueChanges = this._currentBoardState.issues.lastChanged.size > 0;
        let issues: Map<string, BoardIssueVm> = this._oldIssueTableState.issues;
        if (issueChanges) {
          issues = this._oldIssueTableState.issues;
          this._currentBoardState.issues.lastChanged.forEach((change, key) => {
            if (change.change === IssueChange.DELETE) {
              issues = issues.asMutable();
              issues.delete(key);
            } else {
              issues = issues.asMutable();
              const issue: BoardIssue = this._currentBoardState.issues.issues.get(key);
              const issueVm: BoardIssueVm = BoardIssueVmUtil.createBoardIssueVm(issue, true);
              issues.set(key, issueVm);
            }
          });
          issues = issues.asImmutable();
        }
        return issues;
      }
      default:
        return this._oldIssueTableState.issues;
    }
  }

  private filterIssues(issues: Map<string, BoardIssueVm>): Map<string, BoardIssueVm> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS: {
        const filters: AllFilters = new AllFilters(this._currentUserSettingState.filters, this._currentBoardState.projects);
        issues.forEach((issue, key) => {
          const visible = filters.filterVisible(issue);
          if (visible !== issue.visible) {
            issues = issues.asMutable();
            issue = BoardIssueVmUtil.updateVisibility(issue, visible);
            issues.set(key, issue);
          }
        });
        return issues.asImmutable();
      }
      case ChangeType.UPDATE_BOARD: {
        const filters: AllFilters = new AllFilters(this._currentUserSettingState.filters, this._currentBoardState.projects);
        this._currentBoardState.issues.lastChanged.forEach((change, key) => {
          if (change.change === IssueChange.DELETE) {
            issues = issues.asMutable();
            issues.delete(key);
          } else {
            let issue: BoardIssueVm = issues.get(key);
            const visible: boolean = filters.filterVisible(issue);
            if (visible !== issue.visible) {
              issues = issues.asMutable();
              issue = BoardIssueVmUtil.updateVisibility(issue, visible);
              issues.set(key, issue);
            }
          }
        });
        return issues.asImmutable();
      }
      case ChangeType.CHANGE_SWIMLANE: {
        return issues;
      }
    }
    return issues;
  }

  private createTable(issues: Map<string, BoardIssueVm>): List<List<string>> {
    switch (this._changeType) {
      case ChangeType.APPLY_FILTERS:
      case ChangeType.CHANGE_SWIMLANE:
        return this._oldIssueTableState.table;
    }

    const table: List<string>[] = initMutableTable(this._currentBoardState.headers.states.size);
    this.addProjectIssues(issues, table, this._currentBoardState.projects.boardProjects.get(this._currentBoardState.projects.owner));
    this._currentBoardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._currentBoardState.projects.owner) {
        this.addProjectIssues(issues, table, project);
      }
    });

    if (this._changeType === ChangeType.LOAD_BOARD) {
      return this.makeTableImmutable(table);
    }
    // It was UPDATE_BOARD
    if (this.consolidateIssueTable(table)) {
      return this.makeTableImmutable(table);
    } else {
      return this._oldIssueTableState.table;
    }
  }

  private addProjectIssues(issues: Map<string, BoardIssueVm>, list: List<string>[], project: BoardProject) {
    const ownToBoardIndex: number[] = ProjectUtil.getOwnIndexToBoardIndex(this._currentBoardState.headers, project);
    this._currentBoardState.ranks.rankedIssueKeys.get(project.key).forEach((key) => {
      const issue: BoardIssue = this._currentBoardState.issues.issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      list[boardIndex].push(key);
    });
  }

  private makeTableImmutable(table: List<string>[]): List<List<string>> {
    // Make the table immutable
    return List<List<string>>().withMutations(mutable => {
      table.forEach((v, i) => mutable.push(table[i].asImmutable()));
    });
  }

  private consolidateIssueTable(newTable: List<string>[]): boolean {
    let changed = false;
    for (let i = 0 ; i < newTable.length ; i++) {
      const oldIssues: List<string> = this._oldIssueTableState.table.get(i);
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

  private calculateVisibleIssueCounts(issues: Map<string, BoardIssueVm>, table: List<List<string>>): List<number> {
    const visibilities: List<number> = List<number>().withMutations(mutable => {
      table.forEach(issueKeys => {
        let visible = 0;
        issueKeys.forEach(key => {
          if (issues.get(key).visible) {
            visible += 1;
          }
        });
        mutable.push(visible);
      });
    });
    return visibilities.equals(this._oldIssueTableState.visibleIssueCounts) ? this._oldIssueTableState.visibleIssueCounts : visibilities;
  }

  private calculateSwimlane(issues: Map<string, BoardIssueVm>, table: List<List<string>>): SwimlaneInfoVm {
    if (!this._currentUserSettingState.swimlane) {
      return null;
    }
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD:
      case ChangeType.CHANGE_SWIMLANE: {
        return this.createSwimlanes(issues, table);
      }
      case ChangeType.UPDATE_BOARD: {
        return this.updateSwimlanes(issues, table);
      }
    }
    const swimlaneBuilder: SwimlaneInfoBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState);
  }

  private createSwimlanes(issues: Map<string, BoardIssueVm>, table: List<List<string>>): SwimlaneInfoVm {
    const swimlaneBuilder: SwimlaneInfoBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState);
    for (let i = 0 ; i < table.size ; i++) {
      const column: List<string> = table.get(i);
      column.forEach(key => {
        const issue: BoardIssueVm = issues.get(key);
        swimlaneBuilder.indexIssue(issue, i);
      });
    }

    if (swimlaneBuilder.noneBuilder) {
      console.log(`${swimlaneBuilder.noneBuilder.key} ${swimlaneBuilder.noneBuilder.name} ${swimlaneBuilder.noneBuilder.table}`)
    }
    for (const key of Object.keys(swimlaneBuilder.dataBuilders)) {
      const builder: SwimlaneDataBuilder = swimlaneBuilder.dataBuilders[key];
      console.log(`${builder.key} ${builder.name} ${builder.table}`)
    }
    return null;
  }

  private updateSwimlanes(issues: Map<string, BoardIssueVm>, table: List<List<string>>): SwimlaneInfoVm {
    return null;
  }
}

class SwimlaneInfoBuilder {
  readonly swimlaneDataBuilders: Dictionary<SwimlaneDataBuilder>;

  static create(boardState: BoardState, userSettingState: UserSettingState): SwimlaneInfoBuilder {
    const states: number = boardState.headers.states.size;
    const builderMap: Dictionary<SwimlaneDataBuilder> = {};
    let builderNone: SwimlaneDataBuilder = new SwimlaneDataBuilder(NONE_FILTER, 'None', states);
    let issueMatcher:
      (issue: BoardIssueVm, dataBuilders: Dictionary<SwimlaneDataBuilder>, noneBuilder: SwimlaneDataBuilder) => SwimlaneDataBuilder[];
    switch (userSettingState.swimlane) {
      case PROJECT_ATTRIBUTES.key:
        boardState.projects.boardProjects.forEach(
          p => builderMap[p.key] = new SwimlaneDataBuilder(p.key, p.key, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => [dataBuilders[issue.projectCode]]);
        builderNone = null;
        break;
      case ISSUE_TYPE_ATTRIBUTES.key:
        boardState.issueTypes.types.forEach(
          t => builderMap[t.name] = new SwimlaneDataBuilder(t.name, t.name, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => [dataBuilders[issue.type.name]]);
        builderNone = null;
        break;
      case PRIORITY_ATTRIBUTES.key:
        boardState.priorities.priorities.forEach(
          p => builderMap[p.name] = new SwimlaneDataBuilder(p.name, p.name, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => [dataBuilders[issue.priority.name]]);
        builderNone = null;
        break;
      case ASSIGNEE_ATTRIBUTES.key:
        boardState.assignees.assignees.forEach(
          a => builderMap[a.key] = new SwimlaneDataBuilder(a.key, a.name, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => {
          return issue.assignee === NO_ASSIGNEE ? [noneBuilder] : [dataBuilders[issue.assignee.key]];
        } );
        break;
      case COMPONENT_ATTRIBUTES.key:
        boardState.components.components.forEach(
          c => builderMap[c] = new SwimlaneDataBuilder(c, c, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => this.multiStringMatcher(issue.components, dataBuilders, noneBuilder));
        break;
      case LABEL_ATTRIBUTES.key:
        boardState.labels.labels.forEach(
          l => builderMap[l] = new SwimlaneDataBuilder(l, l, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => this.multiStringMatcher(issue.labels, dataBuilders, noneBuilder));
        break;
      case FIX_VERSION_ATTRIBUTES.key:
        boardState.fixVersions.versions.forEach(
          f => builderMap[f] = new SwimlaneDataBuilder(f, f, states));
        issueMatcher = ((issue, dataBuilders, noneBuilder) => this.multiStringMatcher(issue.fixVersions, dataBuilders, noneBuilder));
        break;
      default: {
        const customFields: OrderedMap<string, CustomField> = boardState.customFields.fields.get(userSettingState.swimlane);
        if (customFields) {
          customFields.forEach(f => builderMap[f.key] = new SwimlaneDataBuilder(f.key, f.value, states));
          issueMatcher = ((issue, dataBuilders, noneBuilder) => {
            const issueField: CustomField = issue.customFields.get(userSettingState.swimlane);
            return issueField ? [dataBuilders[issueField.key]] : [noneBuilder];
          });
        }
      }
    }
    return new SwimlaneInfoBuilder(issueMatcher, builderMap, builderNone);
  }

  private static multiStringMatcher(issueSet: OrderedSet<string>,
                                    dataBuilders: Dictionary<SwimlaneDataBuilder>,
                                    noneBuilder: SwimlaneDataBuilder): SwimlaneDataBuilder[] {
    if (!issueSet || issueSet.size === 0) {
      return [noneBuilder];
    }
    return issueSet.map(v => dataBuilders[v]).toArray();
  }

  private constructor(
    private readonly _issueMatcher:
      (issue: BoardIssueVm, dataBuilders: Dictionary<SwimlaneDataBuilder>, noneMatcher: SwimlaneDataBuilder) => SwimlaneDataBuilder[],
    private readonly _dataBuilders: Dictionary<SwimlaneDataBuilder>,
    private readonly _noneBuilder: SwimlaneDataBuilder) {
  }

  indexIssue(issue: BoardIssueVm, boardIndex: number) {
    const swimlaneBuilders: SwimlaneDataBuilder[] = this._issueMatcher(issue, this._dataBuilders, this._noneBuilder);
    for (const swimlaneDataBuilder of swimlaneBuilders) {
      swimlaneDataBuilder.addIssue(issue, boardIndex);
    }
  }

  get noneBuilder() {
    return this._noneBuilder;
  }

  get dataBuilders() {
    return this._dataBuilders;
  }
}

class SwimlaneDataBuilder {
  private _table: List<string>[];
  private _visibleIssuesCount = 0;

  constructor(private _key: string, private _name: string, states: number) {
    this._table  = initMutableTable(states);
  }

  addIssue(issue: BoardIssueVm, boardIndex: number) {
    this._table[boardIndex].push(issue.key);
    if (issue.visible) {
      this._visibleIssuesCount++;
    }
  }

  get table() {
    return this._table;
  }

  get visibleIssuesCount(): number {
    return this._visibleIssuesCount;
  }

  get key(): string {
    return this._key;
  }

  get name(): string {
    return this._name;
  }
}


