import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {
  BoardViewModelUtil, initialBoardViewModel} from './board-view.model';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../model/board/data/board';
import {initialUserSettingState} from '../../model/board/user/user-setting.model';
import {initialBoardState} from '../../model/board/data/board.model';
import {List, Map, OrderedMap, OrderedSet, Set} from 'immutable';
import {HeaderState} from '../../model/board/data/header/header.state';
import {BoardIssueView} from './board-issue-view';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES, FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES, LABEL_ATTRIBUTES, NONE_FILTER, PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../model/board/user/board-filter/board-filter.constants';
import {CustomField} from '../../model/board/data/custom-field/custom-field.model';
import {NO_ASSIGNEE} from '../../model/board/data/assignee/assignee.model';
import {BoardProject, ProjectUtil} from '../../model/board/data/project/project.model';
import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {BoardIssueViewUtil} from './board-issue-view.model';
import {IssueChange} from '../../model/board/data/issue/issue.model';
import {AllFilters} from './filter.util';
import {BoardViewModel} from './board-view';
import {SwimlaneData} from './swimlane-data';
import {BoardHeader} from './board-header';
import {IssueTable} from './issue-table';
import {BoardHeaders} from './board-headers';
import {SwimlaneInfo} from './swimlane-info';
import 'rxjs/add/observable/combineLatest';
import {UserSettingState} from '../../model/board/user/user-setting';

@Injectable()
export class BoardViewModelService {
  private _boardViewModelHandler: BoardViewModelHandler = new BoardViewModelHandler();

  constructor(private _store: Store<AppState>) {
  }

  getBoardViewModel(): Observable<BoardViewModel> {
    return this._boardViewModelHandler.getBoardViewModel(
      this._store.select('board'),
      this._store.select('userSettings'));
  }
}

/**
 * This class is mainly internal for _BoardViewModelService, and a hook for testing. When used by BoardViewModelService,
 * its lifecycle follows that of the service
 */
export class BoardViewModelHandler {
  private _lastBoardState: BoardState = initialBoardState;
  private _lastUserSettingState: UserSettingState = initialUserSettingState;

  private _lastBoardView: BoardViewModel = initialBoardViewModel;

  getBoardViewModel(boardState$: Observable<BoardState>,
                    userSettingState$: Observable<UserSettingState>): Observable<BoardViewModel> {
    return Observable.combineLatest(boardState$, userSettingState$, (boardState, userSettingState) => {
      if (boardState === initialBoardState || userSettingState === initialUserSettingState) {
        return this._lastBoardView;
      }

      let changeType: ChangeType = null;
      if (boardState !== this._lastBoardState) {
        changeType = this._lastBoardState === initialBoardState ? ChangeType.LOAD_BOARD : ChangeType.UPDATE_BOARD;
      } else if (boardState.viewId >= 0) {
        if (userSettingState.filters !== this._lastUserSettingState.filters) {
          changeType = ChangeType.APPLY_FILTERS;
        } else if (userSettingState.swimlane !== this._lastUserSettingState.swimlane) {
          changeType = ChangeType.CHANGE_SWIMLANE;
        } else if (userSettingState.showBacklog !== this._lastUserSettingState.showBacklog) {
          changeType = ChangeType.TOGGLE_BACKLOG;
        } else if (userSettingState.columnVisibilities !== this._lastUserSettingState.columnVisibilities) {
          changeType = ChangeType.CHANGE_COLUMN_VISIBILITY;
        } else if (userSettingState.swimlaneShowEmpty !== this._lastUserSettingState.swimlaneShowEmpty) {
          changeType = ChangeType.TOGGLE_SWIMLANE_SHOW_EMPTY;
        } else if (userSettingState.collapsedSwimlanes !== this._lastUserSettingState.collapsedSwimlanes) {
          changeType = ChangeType.TOGGLE_SWIMLANE_COLLAPSED;
        }
      }

      if (changeType === null) {
        return this._lastBoardView;
      }

      const boardView: BoardViewModel =
        new BoardViewBuilder(changeType, this._lastBoardView,
            this._lastBoardState, boardState, this._lastUserSettingState, userSettingState)
          .build();

      this._lastBoardState = boardState;
      this._lastUserSettingState = userSettingState;
      this._lastBoardView = boardView;
      return this._lastBoardView;
    });
  }
}

class BoardViewBuilder {
  constructor(
    private readonly _changeType: ChangeType,
    private readonly _oldBoardView: BoardViewModel,
    private readonly _oldBoardState: BoardState,
    private readonly _currentBoardState: BoardState,
    private readonly _lastUserSettingState: UserSettingState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  build(): BoardViewModel {
    const headersBuilder: HeadersBuilder =
      new HeadersBuilder(this._changeType, this._oldBoardView, this._oldBoardState.headers,
      this._currentBoardState.headers, this._lastUserSettingState, this._currentUserSettingState);

    headersBuilder.initialiseHeaders();

    const issueTableBuilder: IssueTableBuilder =
      new IssueTableBuilder(this._changeType, this._oldBoardView.issueTable, this._currentBoardState, this._currentUserSettingState);
    const issueTable: IssueTable = issueTableBuilder.build();

    headersBuilder.updateIssueHeaderCounts(issueTable, issueTableBuilder.visibleIssueCounts);

    const newHeaders: BoardHeaders = headersBuilder.build();
    if (newHeaders !== this._oldBoardView.headers || issueTable !== this._oldBoardView.issueTable) {
      return BoardViewModelUtil.updateBoardViewModel(this._oldBoardView, model => {
        model.headers = newHeaders,
        model.issueTable = issueTable
      });
    } else {
      return this._oldBoardView;
    }
  }
}

class HeadersBuilder {
  private _headers: BoardHeaders;

  constructor(
    private readonly _changeType: ChangeType,
    private readonly _oldBoardView: BoardViewModel,
    private readonly _oldHeaderState: HeaderState,
    private readonly _currentHeaderState: HeaderState,
    private readonly _lastUserSettingState: UserSettingState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  initialiseHeaders(): HeadersBuilder {
    this._headers = this._oldBoardView.headers;

    if (this._oldHeaderState !== this._currentHeaderState) {
      this.populateHeaders();
    }

    switch (this._changeType) {
      case ChangeType.TOGGLE_BACKLOG:
        this.toggleBacklog();
        break;
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
        this.updateStateVisibility();
        break;
    }

    return this;
  }

  private populateHeaders() {
    const headerList: List<BoardHeader> = List<BoardHeader>().asMutable();
    const headerState: HeaderState = this._currentHeaderState;
    // Create the backlog group
    if (headerState.backlog > 0) {
      headerList.push(this.createBacklogHeader());
    }

    // Create the other groups
    for (let i = headerState.backlog ; i < headerState.states.size ; i++) {
      const nonBlIndex = i - headerState.backlog;
      const categoryIndex: number = headerState.stateToCategoryMappings.get(nonBlIndex);
      if (categoryIndex < 0) {
        const visible: boolean = this.calculateVisibility(this._currentUserSettingState, i);
        headerList.push(StateHeader(headerState.states.get(i), false, i, headerState.wip.get(nonBlIndex), visible));
      } else {
        let visibleCategory = false;
        const stateList: List<BoardHeader> = List<BoardHeader>().asMutable();
        for (let j = i ; j < headerState.states.size ; j++) {
          if (headerState.stateToCategoryMappings.get(j - headerState.backlog) !== categoryIndex) {
            break;
          }
          const visible: boolean = this.calculateVisibility(this._currentUserSettingState, j);
          visibleCategory = visibleCategory || visible;
          stateList.push(StateHeader(headerState.states.get(j), false, j, headerState.wip.get(j - headerState.backlog), visible));
        }
        i += stateList.size - 1;
        headerList.push(CategoryHeader(headerState.categories.get(categoryIndex), false, visibleCategory, stateList.asImmutable()));
      }
    }
    this._headers = BoardViewModelUtil.createBoardHeaders(headerList.asImmutable());
  }

  private toggleBacklog() {
    const backlog = this.createBacklogHeader();
    this._headers = BoardViewModelUtil.updateBoardHeaders(this._headers, boardHeaders => {
      boardHeaders.headersList = boardHeaders.headersList.set(0, backlog);
    });
  }

  private updateStateVisibility() {
    const statesList: List<BoardHeader> = this.flattenHeaders();

    const updatedStateValues: Map<number, boolean> =
      this._currentUserSettingState.columnVisibilities
        .filter((v, k) => {return this.calculateVisibility(this._lastUserSettingState, k) !== v}).toMap();
    const updatedStates: Map<number, BoardHeader> = Map<number, BoardHeader>().asMutable();
    updatedStateValues.forEach((v, k) => {
      const header: BoardHeader = BoardViewModelUtil.updateBoardHeader(statesList.get(k), mutable => {
        mutable.visible = v;
      });
      updatedStates.set(k, header);
    });

    let allFalse = true;
    const headersList: List<BoardHeader> =
      this.updateHeaders(
        updatedStates,
        // Reset the counter for a new category header
        h => allFalse = true,
        // Called for each state in the category
        s => allFalse = allFalse && !s.visible,
        // Update the category
        mutable => mutable.visible = !allFalse);

    this._headers = BoardViewModelUtil.updateBoardHeaders(this._headers, boardHeaders => {
      boardHeaders.headersList = headersList;
    });
  }

  updateIssueHeaderCounts(issueTable: IssueTable, visibleIssueCounts: List<number>): HeadersBuilder {
    switch (this._changeType) {
      case ChangeType.UPDATE_BOARD:
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS:
        break;
      default:
        return this;
    }

    const statesList: List<BoardHeader> = this.flattenHeaders();
    const updatedStates: Map<number, BoardHeader> = Map<number, BoardHeader>().asMutable();
    statesList.forEach((h, i) => {
      const newTotal = issueTable.table.get(i).size;
      const newVisible = visibleIssueCounts.get(i);

      if (newTotal !== h.totalIssues || newVisible !== h.visibleIssues) {
        const header: BoardHeader = BoardViewModelUtil.updateBoardHeader(h, mutable => {
          mutable.visibleIssues = newVisible;
          mutable.totalIssues = newTotal;
        });
        updatedStates.set(Number(i), header);
      }
    });

    let totalIssues = 0;
    let visibleIssues = 0;
    const headersList: List<BoardHeader> =
      this.updateHeaders(
        updatedStates,
        // Reset the counter for a new category header
        h => {
          totalIssues = 0;
          visibleIssues = 0;
        },
        // Called for each state in the category
        s => {
          totalIssues += s.totalIssues;
          visibleIssues += s.visibleIssues;
        },
        // Update the category
        mutable => {
          mutable.totalIssues = totalIssues;
          mutable.visibleIssues = visibleIssues;
        });

    this._headers = BoardViewModelUtil.updateBoardHeaders(this._headers, boardHeaders => {
      boardHeaders.headersList = headersList;
    });
    return this;
  }

  private updateHeaders(updatedStates: Map<number, BoardHeader>,
                        startCategory: (h: BoardHeader) => void,
                        categoryState: (updated: BoardHeader) => void,
                        finaliseCategory: (mutable: BoardHeader) => void): List<BoardHeader> {
    let headersList: List<BoardHeader> = this._headers.headersList;
    this._headers.headersList.forEach((h, i) => {
      if (!h.category) {
        const updated: BoardHeader = updatedStates.get(h.stateIndices.get(0));
        if (updated) {
          headersList = headersList.asMutable().set(i, updated);
        }
      } else {
        startCategory(h);
        let stateHeaderList: List<BoardHeader> = h.states;
        h.states.forEach((stateHeader, index) => {
          const updated: BoardHeader = updatedStates.get(stateHeader.stateIndices.get(0));
          if (updated) {
            stateHeaderList = stateHeaderList.asMutable().set(index, updated);
          }
          categoryState(updated ? updated : stateHeader);
        });
        if (stateHeaderList !== h.states) {
          const updated: BoardHeader = BoardViewModelUtil.updateBoardHeader(h, mutable => {
            mutable.states = stateHeaderList.asImmutable();
            finaliseCategory(mutable);
          });
          headersList = headersList.asMutable().set(i, updated);
        }
      }
    });
    return headersList.asImmutable();
  }

  private createBacklogHeader(): BoardHeader {
    const showBacklog: boolean = this._currentUserSettingState.showBacklog;
    const headerState: HeaderState = this._currentHeaderState;
    const list: List<BoardHeader> = List<BoardHeader>().asMutable();
    for (let i = 0 ; i < headerState.backlog ; i++) {
      const name: string = headerState.states.get(i);
      // If showBacklog is false, the state is not shown
      const defaultVisibility = showBacklog ? this._currentUserSettingState.defaultColumnVisibility : false;
      const visible: boolean =
        this._currentUserSettingState.columnVisibilities.get(i, defaultVisibility);
      list.push(StateHeader(name, true, i, 0, visible));
    }
    return CategoryHeader('Backlog', true, showBacklog, list.asImmutable());
  }

  private flattenHeaders(): List<BoardHeader> {
    const statesList: List<BoardHeader> = List<BoardHeader>().asMutable();
    this._headers.headersList.forEach(h => {
      if (!h.category) {
        statesList.push(h);
        // headersList.push(null);
      } else {
        h.states.forEach(s => {
          statesList.push(s);
          // headersList.push(h);
        });
      }
    });

    return statesList.asImmutable();
  }

  private calculateVisibility(userSettingState: UserSettingState, index: number): boolean {
    return userSettingState.columnVisibilities.get(index, userSettingState.defaultColumnVisibility);
  }

  build(): BoardHeaders {
    return this._headers;
  }
}


function StateHeader(name: string, backlog: boolean, stateIndex: number, wip: number, visible: boolean): BoardHeader {
  return BoardViewModelUtil.createBoardHeaderRecord({
    name: name,
    abbreviation: abbreviate(name),
    backlog: backlog,
    category: false,
    stateIndices: List<number>([stateIndex]),
    wip: wip,
    totalIssues: 0,
    visibleIssues: 0,
    visible: visible});
}

function CategoryHeader(name: string, backlog: boolean, visible: boolean, states: List<BoardHeader>): BoardHeader {
  let wip = 0;
  let stateIndices: List<number> = List<number>().asMutable();
  states.forEach(state => {
    stateIndices.push(state.stateIndices.get(0));
    wip += state.wip;
  });

  stateIndices = stateIndices.asImmutable();

  return BoardViewModelUtil.createBoardHeaderRecord({
    name: name,
    abbreviation: abbreviate(name),
    backlog: backlog,
    category: true,
    stateIndices: stateIndices,
    states: states,
    wip: wip,
    totalIssues: 0,
    visibleIssues: 0,
    visible: visible});
}

function abbreviate(str: string): string {
  let words: string[] = str.split(' ');
  if (!words) {
    words = [str];
  }
  let abbreviated = '';
  let length: number = words.length;
  if (length > 3) {
    length = 3;
  }
  for (let i = 0; i < length; i++) {
    const s = words[i].trim();
    if (s.length > 0) {
      abbreviated += s.charAt(0).toUpperCase();
    }
  }
  return abbreviated;
}

class IssueTableBuilder {

  private _visibleIssueCounts: List<number>;

  constructor(
    private readonly _changeType: ChangeType,
    private readonly _oldIssueTableState: IssueTable,
    private readonly _currentBoardState: BoardState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  get visibleIssueCounts(): List<number> {
    return this._visibleIssueCounts;
  }

  build (): IssueTable {
    let issues: Map<string, BoardIssueView> = this.populateIssues();
    issues = this.filterIssues(issues);
    const table: List<List<string>> = this.createTable(issues);
    this._visibleIssueCounts = this.calculateVisibleIssueCounts(issues, table);
    const swimlaneInfo: SwimlaneInfo = this.calculateSwimlane(issues, table);
    if (issues === this._oldIssueTableState.issues &&
      table === this._oldIssueTableState.table &&
      swimlaneInfo === this._oldIssueTableState.swimlaneInfo) {
      return this._oldIssueTableState;
    }


    return BoardViewModelUtil.createIssueTable(issues, table, swimlaneInfo);
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

    this.addProjectIssues(tableBuilder, this._currentBoardState.projects.boardProjects.get(this._currentBoardState.projects.owner));
    this._currentBoardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._currentBoardState.projects.owner) {
        this.addProjectIssues(tableBuilder, project);
      }
    });

    return tableBuilder.getTable();
  }

  private addProjectIssues(tableBuilder: TableBuilder, project: BoardProject) {
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
    return visibilities;
  }

  private calculateSwimlane(issues: Map<string, BoardIssueView>, table: List<List<string>>): SwimlaneInfo {
    if (!this._currentUserSettingState.swimlane) {
      return null;
    }
    let swimlaneBuilder: SwimlaneInfoBuilder;
    switch (this._changeType) {
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
      case ChangeType.TOGGLE_BACKLOG:
        return this._oldIssueTableState.swimlaneInfo;
      case ChangeType.LOAD_BOARD:
      case ChangeType.CHANGE_SWIMLANE:
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, null);
        break;
      case ChangeType.APPLY_FILTERS:
      case ChangeType.UPDATE_BOARD: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, oldSwimlane);
        break;
      }
      case ChangeType.TOGGLE_SWIMLANE_SHOW_EMPTY: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        return BoardViewModelUtil.createSwimlaneInfoView(this._currentUserSettingState.swimlaneShowEmpty, oldSwimlane.swimlanes);
      }
      case ChangeType.TOGGLE_SWIMLANE_COLLAPSED: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, oldSwimlane);
        // The builder does the updating for us
        return swimlaneBuilder.updateCollapsed();
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
    let builderNone: SwimlaneDataBuilder =
      new SwimlaneDataBuilder(NONE_FILTER, 'None', states, collapsed(userSettingState, NONE_FILTER),  existingInfo);
    let issueMatcher:
      (issue: BoardIssueView, dataBuilders: Map<string, SwimlaneDataBuilder>) => SwimlaneDataBuilder[];
    switch (userSettingState.swimlane) {
      case PROJECT_ATTRIBUTES.key:
        boardState.projects.boardProjects.forEach(
          p => {
            builderMap.set(p.key,
              new SwimlaneDataBuilder(p.key, p.key, states, collapsed(userSettingState, p.key), existingInfo))});
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.projectCode)]);
        builderNone = null;
        break;
      case ISSUE_TYPE_ATTRIBUTES.key:
        boardState.issueTypes.types.forEach(
          t => {
            builderMap.set(
              t.name, new SwimlaneDataBuilder(t.name, t.name, states, collapsed(userSettingState, t.name), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.type.name)]);
        builderNone = null;
        break;
      case PRIORITY_ATTRIBUTES.key:
        boardState.priorities.priorities.forEach(
          p => {
            builderMap.set(p.name,
              new SwimlaneDataBuilder(p.name, p.name, states, collapsed(userSettingState, p.name), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.priority.name)]);
        builderNone = null;
        break;
      case ASSIGNEE_ATTRIBUTES.key:
        boardState.assignees.assignees.forEach(
          a => {
            builderMap.set(a.key,
              new SwimlaneDataBuilder(a.key, a.name, states, collapsed(userSettingState, a.key), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) =>
          [dataBuilders.get(issue.assignee === NO_ASSIGNEE ? NONE_FILTER : issue.assignee.key)]);
        break;
      case COMPONENT_ATTRIBUTES.key:
        boardState.components.components.forEach(
          c => {
            builderMap.set(c, new SwimlaneDataBuilder(c, c, states, collapsed(userSettingState, c), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.components, dataBuilders));
        break;
      case LABEL_ATTRIBUTES.key:
        boardState.labels.labels.forEach(
          l => {
            builderMap.set(l,
              new SwimlaneDataBuilder(l, l, states, collapsed(userSettingState, l), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.labels, dataBuilders));
        break;
      case FIX_VERSION_ATTRIBUTES.key:
        boardState.fixVersions.versions.forEach(
          f => {
            builderMap.set(f,
              new SwimlaneDataBuilder(f, f, states, collapsed(userSettingState, f), existingInfo))
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.fixVersions, dataBuilders));
        break;
      default: {
        const customFields: OrderedMap<string, CustomField> = boardState.customFields.fields.get(userSettingState.swimlane);
        if (customFields) {
          customFields.forEach(
            f => {
              builderMap.set(f.key,
                new SwimlaneDataBuilder(f.key, f.value, states, collapsed(userSettingState, f.key), existingInfo))
            });
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
    } else if (this._existing.showEmpty !== this._userSettingState.swimlaneShowEmpty) {
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
    return BoardViewModelUtil.createSwimlaneInfoView(this._userSettingState.swimlaneShowEmpty, swimlanes.asImmutable());
  }

  updateCollapsed(): SwimlaneInfo {
    const updatedSwimlanes: Map<string, SwimlaneData> = this._existing.swimlanes.withMutations(mutable => {
      this._dataBuilders.forEach((sdb, k) => {
        const existing = mutable.get(k);
        const data: SwimlaneData = sdb.updateCollapsed();
        if (existing !== data) {
          mutable.set(k, data);
        }
      });
    });
    return BoardViewModelUtil.updateSwimlaneInfo(this._existing, mutable => {
      mutable.swimlanes = updatedSwimlanes;
    });
  }
}

class SwimlaneDataBuilder {
  private readonly _existing: SwimlaneData;
  private readonly _tableBuilder: TableBuilder;
  private _visibleIssuesCount = 0;
  filterVisible = true;


  constructor(private readonly _key: string, private readonly _display: string,
              states: number, private _collapsed: boolean, exisitingInfo: SwimlaneInfo) {
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

  private isChangedCollapsed(): boolean {
    if (!this._existing) {
      return true;
    }
    return this._existing.collapsed !== this._collapsed;
  }

  isChanged(): boolean {
    return this.isChangedTable() || this.isChangedFilterVisibility() || this.isChangedCollapsed();
  }

  build(): SwimlaneData {
    const table: List<List<string>> = this._tableBuilder.getTable();
    if (this._existing) {
      if (!this.isChanged()) {
        return this._existing;
      }
    }
    return BoardViewModelUtil.createSwimlaneDataView(
      this._key, this._display, this._tableBuilder.getTable(), this._visibleIssuesCount, this.filterVisible, this._collapsed);
  }

  updateCollapsed() {
    // This code path is only used when the swimlanes have been populated already. So if the visibility was changed we need
    // to basically update the old one
    if (!this.isChangedCollapsed()) {
      return this._existing;
    }
    // _existing can't be null here
    return BoardViewModelUtil.updateSwimlaneData(this._existing, mutable => {
      mutable.collapsed = this._collapsed;
    });
  }
}

class TableBuilder {
  private readonly _current: ColumnBuilder[];

  constructor(states: number, private readonly _existing: List<List<string>>) {
    this._current = new Array<ColumnBuilder>(states);
    for (let i = 0 ; i < this._current.length ; i++) {
      if (_existing) {
        this._current[i] = new ExistingColumnBuilder(i, this._existing.get(i));
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

  constructor(private _column: number, private _existing: List<string>) {
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

enum ChangeType {
  LOAD_BOARD,
  UPDATE_BOARD,
  APPLY_FILTERS,
  CHANGE_SWIMLANE,
  CHANGE_COLUMN_VISIBILITY,
  TOGGLE_BACKLOG,
  TOGGLE_SWIMLANE_SHOW_EMPTY,
  TOGGLE_SWIMLANE_COLLAPSED
}

function collapsed(userSettingState: UserSettingState, key: string): boolean {
  return userSettingState.collapsedSwimlanes.get(key, userSettingState.defaultCollapsedSwimlane);
}


