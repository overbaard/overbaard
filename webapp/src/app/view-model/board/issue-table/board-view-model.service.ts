import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../app-store';
import {Observable} from 'rxjs/Observable';
import {initialIssueTable, IssueTableUtil} from './issue-table.model';
import {BoardState} from '../../../model/board/data/board';
import 'rxjs/add/observable/combineLatest';
import {List, Map, OrderedMap, OrderedSet, Set} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardProject, ProjectUtil} from '../../../model/board/data/project/project.model';
import {IssueTable, SwimlaneData, SwimlaneInfo} from './issue-table';
import {initialUserSettingState, UserSettingState} from '../../../model/board/user/user-setting.model';
import {initialBoardState} from '../../../model/board/data/board.model';
import {BoardIssueView} from './board-issue-view';
import {BoardIssueViewUtil} from './board-issue-view.model';
import {IssueChange} from '../../../model/board/data/issue/issue.model';
import {AllFilters} from './filter.util';
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
import {HeaderState} from '../../../model/board/data/header/header.state';
import {HeadersView, HeaderView} from './headers-view';
import {initialHeaderState} from '../../../model/board/data/header/header.model';
import {getHeadersState} from '../../../model/board/data/header/header.reducer';
import {HeaderViewUtil, initialHeadersView} from './headers-view.model';
import {Header} from '../../../model/board/data/header/header';

@Injectable()
export class BoardViewModelService {

  private _issueTableHandler: IssueTableViewModelHandler = new IssueTableViewModelHandler();
  private _headersHandler: HeadersViewModelHandler = new HeadersViewModelHandler()

  constructor(private _store: Store<AppState>) {
  }

  getIssueTable(): Observable<IssueTable> {
    return this._issueTableHandler.getIssueTable(
      this._store.select('board'),
      this._store.select('userSettings')
    );
  }

  getHeaders(issueTable$: Observable<IssueTable>): Observable<HeadersView> {
    const headerState: Observable<HeaderState> = this._store.select(getHeadersState);
    return this._headersHandler.getHeaders(
      headerState,
      issueTable$
    )
  }
}

export class HeadersViewModelHandler {
  private _lastHeaderState: HeaderState = initialHeaderState;
  private _lastIssueTable: IssueTable = initialIssueTable;
  private _lastHeadersView: HeadersView = initialHeadersView;

  getHeaders(
    headerState$: Observable<HeaderState>,
    issueTable$: Observable<IssueTable>): Observable<HeadersView>  {
    return Observable.combineLatest(headerState$, issueTable$, (headerState, issueTable) => {
      let headersView: HeadersView = this._lastHeadersView;
      if (issueTable !== initialIssueTable && headerState !== initialHeaderState) {
        if (headerState !== this._lastHeaderState) {
          headersView = this.populateHeaders(headerState, issueTable);
        } else if (issueTable !== this._lastIssueTable) {
          if (issueTable.visibleIssueCounts !== this._lastIssueTable.visibleIssueCounts ||
            issueTable.table !== this._lastIssueTable.table ||
            issueTable.visibleColumns !== this._lastIssueTable.visibleColumns) {

            headersView = this.populateHeaders(headerState, issueTable);
          }
        }
      }
      this._lastHeaderState = headerState;
      this._lastIssueTable = issueTable;
      this._lastHeadersView = headersView;
      return this._lastHeadersView;
    });
  }

  private populateHeaders(headerState: HeaderState, issueTable: IssueTable): HeadersView {
    const headerList: List<List<HeaderView>> = List<List<HeaderView>>().asMutable();

    let changed = false;
    for (let i = 0 ; i < headerState.headers.size ; i++) {
      const headerRow: List<Header> = headerState.headers.get(i);
      const row: List<HeaderView> = List<HeaderView>().asMutable();

      let changedRow = false;
      for (let j = 0 ; j < headerRow.size ; j++) {
        let oldHeader: Header = null;
        let oldHeaderView: HeaderView = null;

        if (this._lastHeadersView.headers.size > i && this._lastHeadersView.headers.get(i).size > j) {
          oldHeader = this._lastHeaderState.headers.get(i).get(j);
          oldHeaderView = this._lastHeadersView.headers.get(i).get(j);
        }

        const headerView: HeaderView = this.createHeaderView(issueTable, headerRow.get(j), oldHeader, oldHeaderView);
        if (headerView !== oldHeaderView) {
          changedRow = true;
        }
        row.push(headerView);
      }
      headerList.push(changedRow ? row.asImmutable() : this._lastHeadersView.headers.get(i));
      changed = changedRow || changed;
    }

    return changed ? HeaderViewUtil.creaateHeadersView(headerList.asImmutable(), headerState.states) : this._lastHeadersView;
  }

  private createHeaderView(issueTable: IssueTable, header: Header, oldHeader: Header, oldHeaderView: HeaderView): HeaderView {
    let visibleColumn = false;
    let totalIssues = 0;
    let visibleIssues = 0;
    header.states.forEach(stateIndex => {
      if (issueTable.visibleColumns.get(stateIndex)) {
        visibleColumn = true;
      }
      totalIssues += issueTable.table.get(stateIndex).size;
      visibleIssues += issueTable.visibleIssueCounts.get(stateIndex);
    });
    if (oldHeader === header &&
      oldHeaderView.visibleColumn === visibleColumn &&
      oldHeaderView.visibleIssues === visibleIssues &&
      oldHeaderView.totalIssues === totalIssues) {
      return oldHeaderView;
    }
    const headerView: HeaderView = HeaderViewUtil.createHeaderView(header, visibleColumn, totalIssues, visibleIssues);
    return headerView;
  }
}
/**
 * This class is mainly internal for BoardViewModelService, and a hook for testing. When used by BoardViewModelService,
 * its lifecycle follows that of the service
 */
export class IssueTableViewModelHandler {
  // Last inputs
  private _lastBoardState: BoardState = initialBoardState;
  private _lastUserSettingState: UserSettingState = initialUserSettingState;
  // Last result
  private _lastIssueTable: IssueTable = initialIssueTable;

  getIssueTable(
    boardState$: Observable<BoardState>,
    userSettingState$: Observable<UserSettingState>):  Observable<IssueTable> {
    return Observable
      .combineLatest(boardState$, userSettingState$, (boardState, userSettingState) => {
        let changeType: ChangeType = null;
        if (boardState !== this._lastBoardState) {
          changeType = this._lastBoardState === initialBoardState ? ChangeType.LOAD_BOARD : ChangeType.UPDATE_BOARD;
        } else if (boardState.viewId >= 0) {
          if (userSettingState.filters !== this._lastUserSettingState.filters) {
            changeType = ChangeType.APPLY_FILTERS;
          } else if (userSettingState.swimlane !== this._lastUserSettingState.swimlane) {
            changeType = ChangeType.CHANGE_SWIMLANE;
          } else if (userSettingState.columnVisibilities !== this._lastUserSettingState.columnVisibilities) {
            changeType = ChangeType.CHANGE_COLUMN_VISIBILITY;
          }
        }

        if (changeType === null) {
          return this._lastIssueTable;
        }

        const issueTableBuilder: IssueTableBuilder = new IssueTableBuilder(
          changeType,
          this._lastIssueTable,
          boardState,
          userSettingState);
        const issueTable: IssueTable = issueTableBuilder.updateIssueTable();
        this._lastIssueTable = issueTable;
        this._lastBoardState = boardState;
        this._lastUserSettingState = userSettingState;
        return issueTable;
      });
  }
}

enum ChangeType {
  LOAD_BOARD,
  UPDATE_BOARD,
  APPLY_FILTERS,
  CHANGE_SWIMLANE,
  CHANGE_COLUMN_VISIBILITY
}

class IssueTableBuilder {

  constructor(
    private readonly _changeType: ChangeType,
    private readonly _oldIssueTableState: IssueTable,
    private readonly _currentBoardState: BoardState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  updateIssueTable (): IssueTable {
    let issues: Map<string, BoardIssueView> = this.populateIssues();
    issues = this.filterIssues(issues);
    const table: List<List<string>> = this.createTable(issues);
    const visibleIssueCounts: List<number> = this.calculateVisibleIssueCounts(issues, table);
    const swimlaneInfo: SwimlaneInfo = this.calculateSwimlane(issues, table);
    const visibleColumns: List<boolean> = this.calculateVisibleColumns(table.size);

    if (issues === this._oldIssueTableState.issues &&
        table === this._oldIssueTableState.table &&
        swimlaneInfo === this._oldIssueTableState.swimlaneInfo &&
        visibleIssueCounts === this._oldIssueTableState.visibleIssueCounts &&
        visibleColumns === this._oldIssueTableState.visibleColumns) {
      return this._oldIssueTableState;
    }
    return IssueTableUtil.createIssueTable(issues, table, swimlaneInfo, visibleIssueCounts, visibleColumns);
  }

  private populateIssues(): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD: {
        const issues: Map<string, BoardIssueView> = Map<string, BoardIssueView>().asMutable();
        this._currentBoardState.issues.issues.forEach((issue, key) => {
          const issueView: BoardIssueView = BoardIssueViewUtil.createBoardIssue(issue, true);
          issues.set(key, issueView);
        });
        return issues.asImmutable();
      }
      case ChangeType.UPDATE_BOARD: {
        const issueChanges = this._currentBoardState.issues.lastChanged.size > 0;
        let issues: Map<string, BoardIssueView> = this._oldIssueTableState.issues;
        if (issueChanges) {
          issues = this._oldIssueTableState.issues;
          this._currentBoardState.issues.lastChanged.forEach((change, key) => {
            if (change.change === IssueChange.DELETE) {
              issues = issues.asMutable();
              issues.delete(key);
            } else {
              issues = issues.asMutable();
              const issue: BoardIssue = this._currentBoardState.issues.issues.get(key);
              const issueView: BoardIssueView = BoardIssueViewUtil.createBoardIssue(issue, true);
              issues.set(key, issueView);
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

  private filterIssues(issues: Map<string, BoardIssueView>): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS: {
        const filters: AllFilters = new AllFilters(this._currentUserSettingState.filters, this._currentBoardState.projects);
        issues.forEach((issue, key) => {
          const visible = filters.filterVisible(issue);
          if (visible !== issue.visible) {
            issues = issues.asMutable();
            issue = BoardIssueViewUtil.updateVisibility(issue, visible);
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
            let issue: BoardIssueView = issues.get(key);
            const visible: boolean = filters.filterVisible(issue);
            if (visible !== issue.visible) {
              issues = issues.asMutable();
              issue = BoardIssueViewUtil.updateVisibility(issue, visible);
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

  private createTable(issues: Map<string, BoardIssueView>): List<List<string>> {
    switch (this._changeType) {
      case ChangeType.APPLY_FILTERS:
      case ChangeType.CHANGE_SWIMLANE:
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
        return this._oldIssueTableState.table;
    }

    const oldTable: List<List<string>> = this._changeType === ChangeType.LOAD_BOARD ? null : this._oldIssueTableState.table;
    const tableBuilder: TableBuilder = new TableBuilder(this._currentBoardState.headers.states.size, oldTable);

    this.addProjectIssues(issues, tableBuilder, this._currentBoardState.projects.boardProjects.get(this._currentBoardState.projects.owner));
    this._currentBoardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._currentBoardState.projects.owner) {
        this.addProjectIssues(issues, tableBuilder, project);
      }
    });

    return tableBuilder.getTable();
  }

  private addProjectIssues(issues: Map<string, BoardIssueView>, tableBuilder: TableBuilder, project: BoardProject) {
    const rankedKeysForProject: List<string> = this._currentBoardState.ranks.rankedIssueKeys.get(project.key);
    if (!rankedKeysForProject) {
      return;
    }
    const ownToBoardIndex: number[] = ProjectUtil.getOwnIndexToBoardIndex(this._currentBoardState.headers, project);
    rankedKeysForProject.forEach((key) => {
      const issue: BoardIssue = this._currentBoardState.issues.issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      tableBuilder.push(boardIndex, key);
    });
  }

  private calculateVisibleIssueCounts(issues: Map<string, BoardIssueView>, table: List<List<string>>): List<number> {
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

  private calculateVisibleColumns(numColumns: number): List<boolean> {
    if (this._changeType === ChangeType.LOAD_BOARD || this._changeType === ChangeType.CHANGE_COLUMN_VISIBILITY) {
      const visibleMap: Map<number, boolean> = this._currentUserSettingState.columnVisibilities;
      const visibilities: List<boolean> = List<boolean>().withMutations(mutable => {
        for (let i = 0 ; i < numColumns ; i++) {
          if (!visibleMap.has(i)) {
            mutable.push(this._currentUserSettingState.defaultColumnVisibility);
          } else {
            mutable.push(visibleMap.get(i));
          }
        }
      });
      if (!visibilities.equals(this._oldIssueTableState.visibleColumns)) {
        return visibilities;
      }
    }
    return this._oldIssueTableState.visibleColumns;
  }

  private calculateSwimlane(issues: Map<string, BoardIssueView>, table: List<List<string>>): SwimlaneInfo {
    if (!this._currentUserSettingState.swimlane) {
      return null;
    }
    let swimlaneBuilder: SwimlaneInfoBuilder;
    switch (this._changeType) {
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
        return this._oldIssueTableState.swimlaneInfo;
      case ChangeType.LOAD_BOARD:
      case ChangeType.CHANGE_SWIMLANE: {
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, null);
      }
      break;
      case ChangeType.APPLY_FILTERS:
      case ChangeType.UPDATE_BOARD: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, oldSwimlane);
      }
    }

    this.populateSwimlanes(swimlaneBuilder, issues, table);
    swimlaneBuilder.applySwimlaneFilters();

    return swimlaneBuilder.build();
  }

  private populateSwimlanes(swimlaneBuilder: SwimlaneInfoBuilder,
                            issues: Map<string, BoardIssueView>, table: List<List<string>>): SwimlaneInfoBuilder {
    for (let i = 0 ; i < table.size ; i++) {
      const column: List<string> = table.get(i);
      column.forEach(key => {
        const issue: BoardIssueView = issues.get(key);
        swimlaneBuilder.indexIssue(issue, i);
      });
    }

    return swimlaneBuilder;
  }
}

class SwimlaneInfoBuilder {
  static create(boardState: BoardState,
                userSettingState: UserSettingState, existingInfo: SwimlaneInfo): SwimlaneInfoBuilder {
    const states: number = boardState.headers.states.size;
    let builderMap: OrderedMap<string, SwimlaneDataBuilder> = OrderedMap<string, SwimlaneDataBuilder>().asMutable();
    let builderNone: SwimlaneDataBuilder = new SwimlaneDataBuilder(NONE_FILTER, 'None', states, existingInfo);
    let issueMatcher:
      (issue: BoardIssueView, dataBuilders: Map<string, SwimlaneDataBuilder>) => SwimlaneDataBuilder[];
    switch (userSettingState.swimlane) {
      case PROJECT_ATTRIBUTES.key:
        boardState.projects.boardProjects.forEach(
          p => builderMap.set(p.key, new SwimlaneDataBuilder(p.key, p.key, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.projectCode)]);
        builderNone = null;
        break;
      case ISSUE_TYPE_ATTRIBUTES.key:
        boardState.issueTypes.types.forEach(
          t => builderMap.set(t.name, new SwimlaneDataBuilder(t.name, t.name, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.type.name)]);
        builderNone = null;
        break;
      case PRIORITY_ATTRIBUTES.key:
        boardState.priorities.priorities.forEach(
          p => builderMap.set(p.name, new SwimlaneDataBuilder(p.name, p.name, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.priority.name)]);
        builderNone = null;
        break;
      case ASSIGNEE_ATTRIBUTES.key:
        boardState.assignees.assignees.forEach(
          a => builderMap.set(a.key, new SwimlaneDataBuilder(a.key, a.name, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) =>
          [dataBuilders.get(issue.assignee === NO_ASSIGNEE ? NONE_FILTER : issue.assignee.key)]);
        break;
      case COMPONENT_ATTRIBUTES.key:
        boardState.components.components.forEach(
          c => builderMap.set(c, new SwimlaneDataBuilder(c, c, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.components, dataBuilders));
        break;
      case LABEL_ATTRIBUTES.key:
        boardState.labels.labels.forEach(
          l => builderMap.set(l, new SwimlaneDataBuilder(l, l, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.labels, dataBuilders));
        break;
      case FIX_VERSION_ATTRIBUTES.key:
        boardState.fixVersions.versions.forEach(
          f => builderMap.set(f, new SwimlaneDataBuilder(f, f, states, existingInfo)));
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.fixVersions, dataBuilders));
        break;
      default: {
        const customFields: OrderedMap<string, CustomField> = boardState.customFields.fields.get(userSettingState.swimlane);
        if (customFields) {
          customFields.forEach(
            f => builderMap.set(f.key, new SwimlaneDataBuilder(f.key, f.value, states, existingInfo)));
          issueMatcher = ((issue, dataBuilders) => {
            const issueField: CustomField = issue.customFields.get(userSettingState.swimlane);
            return [dataBuilders.get(issueField ? issueField.key : NONE_FILTER)];
          });
        }
      }
    }
    if (builderNone) {
      builderMap.set(builderNone.key, builderNone);
    }
    builderMap = builderMap.asImmutable();
    return new SwimlaneInfoBuilder(boardState, userSettingState, issueMatcher, builderMap, existingInfo);
  }

  private static multiStringMatcher(issueSet: OrderedSet<string>,
                                    dataBuilders: OrderedMap<string, SwimlaneDataBuilder>): SwimlaneDataBuilder[] {
    if (!issueSet || issueSet.size === 0) {
      return [dataBuilders.get(NONE_FILTER)];
    }
    return issueSet.map(v => dataBuilders.get(v)).toArray();
  }

  private constructor(
    private _boardState: BoardState,
    private _userSettingState: UserSettingState,
    private readonly _issueMatcher:
      (issue: BoardIssueView, dataBuilders:
        OrderedMap<string, SwimlaneDataBuilder>) => SwimlaneDataBuilder[],
    private readonly _dataBuilders: Map<string, SwimlaneDataBuilder>,
    private readonly _existing: SwimlaneInfo) {
  }

  indexIssue(issue: BoardIssueView, boardIndex: number) {
    const swimlaneBuilders: SwimlaneDataBuilder[] = this._issueMatcher(issue, this._dataBuilders);
    for (const swimlaneDataBuilder of swimlaneBuilders) {
      swimlaneDataBuilder.addIssue(issue, boardIndex);
    }
  }

  get dataBuilders(): Map<string, SwimlaneDataBuilder> {
    return this._dataBuilders;
  }

  applySwimlaneFilters() {
    this._dataBuilders.forEach(swimlaneBuilder => {
      swimlaneBuilder.filterVisible = this.filterSwimlane(swimlaneBuilder);
    });
  }

  private filterSwimlane(swimlaneBuilder: SwimlaneDataBuilder) {
    switch (this._userSettingState.swimlane) {
      case PROJECT_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.project, swimlaneBuilder.key);
      }
      case ISSUE_TYPE_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.issueType, swimlaneBuilder.key);
      }
      case PRIORITY_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.priority, swimlaneBuilder.key);
      }
      case ASSIGNEE_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.assignee, swimlaneBuilder.key);
      }
      case COMPONENT_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.component, swimlaneBuilder.key);
      }
      case LABEL_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.label, swimlaneBuilder.key);
      }
      case FIX_VERSION_ATTRIBUTES.key: {
        return this.applyFilterToSwimlaneKey(this._userSettingState.filters.fixVersion, swimlaneBuilder.key);
      }
      default: {
        const customFields: OrderedMap<string, CustomField> =
          this._boardState.customFields.fields.get(this._userSettingState.swimlane);
        if (customFields) {
          const filterSet: Set<string> = this._userSettingState.filters.customField.get(this._userSettingState.swimlane);
          if (filterSet) {
            return this.applyFilterToSwimlaneKey(filterSet, swimlaneBuilder.key);
          }
        }
      }
        return true;
    }
  }

  private applyFilterToSwimlaneKey(filterSet: Set<string>, key: string): boolean {
    if (filterSet.size > 0 && !filterSet.contains(key)) {
      return false;
    }
    return true;
  }

  build(): SwimlaneInfo {
    const keys: string[] = this._dataBuilders.keySeq().toArray();
    let changed = false;
    if (!this._existing) {
      changed = true;
    } else {
      changed = keys.length !== this._existing.swimlanes.size;
    }

    const swimlanes: OrderedMap<string, SwimlaneData> = OrderedMap<string, SwimlaneData>().asMutable();
    for (const key of keys) {
      const dataBuilder: SwimlaneDataBuilder = this._dataBuilders.get(key);
      if (dataBuilder.isChanged()) {
        changed = true;
      }
      swimlanes.set(key, dataBuilder.build());
    }

    if (!changed) {
      return this._existing;
    }
    return IssueTableUtil.createSwimlaneInfoView(swimlanes.asImmutable());
  }
}

class SwimlaneDataBuilder {
  private readonly _existing: SwimlaneData;
  private readonly _tableBuilder: TableBuilder;
  private _visibleIssuesCount = 0;
  filterVisible = true;


  constructor(private readonly _key: string, private readonly _display: string, states: number, exisitingInfo: SwimlaneInfo) {
    this._existing = exisitingInfo ? exisitingInfo.swimlanes.get(_key) : null;
    this._tableBuilder = new TableBuilder(states, this._existing ? this._existing.table : null);
  }

  addIssue(issue: BoardIssueView, boardIndex: number) {
    this._tableBuilder.push(boardIndex, issue.key);
    if (issue.visible) {
      this._visibleIssuesCount++;
    }
  }

  get table() {
    return this._tableBuilder.getTable();
  }

  get visibleIssuesCount(): number {
    return this._visibleIssuesCount;
  }

  get key(): string {
    return this._key;
  }

  private isChangedFilterVisibility(): boolean {
    if (!this._existing) {
      return true;
    }
    return this._existing.filterVisible !== this.filterVisible;
  }

  private isChangedTable(): boolean {
    if (!this._existing) {
      return true;
    }
    return this._key !== this._existing.key ||
      this._display !== this._existing.display ||
      this.table !== this._existing.table ||
      this._visibleIssuesCount !== this._existing.visibleIssues;
  }

  isChanged(): boolean {
    return this.isChangedTable() || this.isChangedFilterVisibility();
  }

  build(): SwimlaneData {
    const table: List<List<string>> = this._tableBuilder.getTable();
    if (this._existing) {
      if (!this.isChanged()) {
        return this._existing;
      }
    }
    return IssueTableUtil.createSwimlaneDataView(
      this._key, this._display, this._tableBuilder.getTable(), this._visibleIssuesCount, this.filterVisible);
  }
}

class TableBuilder {
  private readonly _current: ColumnBuilder[];

  constructor(states: number, private readonly _existing: List<List<string>>) {
    this._current = new Array<ColumnBuilder>(states);
    for (let i = 0 ; i < this._current.length ; i++) {
      if (_existing) {
        this._current[i] = new ExistingColumnBuilder(this._existing.get(i));
      } else {
        this._current[i] = new NewColumnBuilder();
      }
    }

  }

  push(index: number, value: string) {
    this._current[index].push(value);
  }

  getTable(): List<List<string>> {
    if (!this._existing) {
      return List<List<string>>().withMutations(mutable => {
        for (const column of this._current) {
          mutable.push(column.getList());
        }
      });
    } else {
      let changed = false;
      const table: List<List<string>> = List<List<string>>().withMutations(mutable => {
        for (const column of this._current) {
            changed = changed || column.isChanged();
            mutable.push(column.getList());
        }
      });
      if (!changed) {
        return this._existing;
      }
      return table;
    }
  }
}

interface ColumnBuilder {
  push(value: string);
  isChanged(): boolean;
  getList(): List<string>;
}

class ExistingColumnBuilder implements ColumnBuilder {
  private _current: List<string>;
  private _index = 0;
  private _changed = false;

  constructor(private _existing: List<string>) {
  }

  push(value: string) {
    if (!this._changed) {
      if (this._existing.size <= this._index) {
        this._changed = true;
      } else {
        if (this._existing.get(this._index) !== value) {
          this._changed = true;
        }
      }
      this._index++;
    }
    if (!this._current) {
      this._current = List<string>().asMutable();
    }
    this._current.push(value);
  }

  isChanged(): boolean {
      return this._changed || this.safeSize(this._existing) !== this.safeSize(this._current);
  }

  private safeSize(list: List<string>): number {
    if (!list) {
      return 0;
    }
    return list.size;
  }

  getList(): List<string> {
    if (this.isChanged()) {
      return this._current ? this._current.asImmutable() : List<string>();
    }
    return this._existing;
  }
}

class NewColumnBuilder implements ColumnBuilder {
  private _current: List<string> = List<string>().asMutable();
  private _changed = true;

  push(value: string) {
    this._current.push(value);
  }

  isChanged(): boolean {
    return this._changed;
  }

  getList(): List<string> {
    return this._current.asImmutable();
  }
}



