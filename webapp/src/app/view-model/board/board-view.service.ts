import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {
  BoardViewModelUtil, initialBoardViewModel, initialIssueTable
} from './board-view.model';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../model/board/data/board';
import {initialUserSettingState} from '../../model/board/user/user-setting.model';
import {initialBoardState} from '../../model/board/data/board.model';
import {List, Map, OrderedMap, OrderedSet, Set} from 'immutable';
import {HeaderState} from '../../model/board/data/header/header.state';
import {BoardIssueView} from './board-issue-view';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES, FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES, LABEL_ATTRIBUTES, NONE_FILTER_KEY, PRIORITY_ATTRIBUTES,
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
import {boardSelector} from '../../model/board/data/board.reducer';
import {userSettingSelector} from '../../model/board/user/user-setting.reducer';
import {RankViewEntry} from './rank-view-entry';
import {BoardViewMode} from '../../model/board/user/board-view-mode';
import {IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {Dictionary} from '../../common/dictionary';
import {FontSizeTableService} from '../../services/font-size-table.service';
import {IssueHeightCalculator} from './issue-height-calculator';

@Injectable()
export class BoardViewModelService {
  private readonly _boardViewModelHandler: BoardViewModelHandler;

  constructor(private _store: Store<AppState>, private _fontSizeTable: FontSizeTableService) {
    this._boardViewModelHandler = new BoardViewModelHandler(this._fontSizeTable);
  }

  getBoardViewModel(): Observable<BoardViewModel> {
    return this._boardViewModelHandler.getBoardViewModel(
      this._store.select(boardSelector),
      this._store.select(userSettingSelector));
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
  private _forcedRefresh = false;

  constructor(private readonly _fontSizeTable: FontSizeTableService) {
  }

  getBoardViewModel(boardState$: Observable<BoardState>,
                    userSettingState$: Observable<UserSettingState>): Observable<BoardViewModel> {
    return Observable.combineLatest(boardState$, userSettingState$, (boardState, userSettingState) => {
      if (boardState === initialBoardState || userSettingState === initialUserSettingState) {
        return this._lastBoardView;
      }

      let changeType: ChangeType = null;
      if (boardState !== this._lastBoardState) {
        if (this._forcedRefresh) {
          changeType = ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE;
          this._forcedRefresh = false;
        } else {
          if (this._lastBoardState.headers.helpTexts !== boardState.headers.helpTexts) {
            changeType = ChangeType.INIT_HELP_TEXTS;
          } else {
            changeType = this._lastBoardState === initialBoardState ? ChangeType.LOAD_BOARD : ChangeType.UPDATE_BOARD;
          }
        }
      } else if (boardState.viewId >= 0) {
        if (userSettingState.filters !== this._lastUserSettingState.filters) {
          changeType = ChangeType.APPLY_FILTERS;
        } else if (userSettingState.swimlane !== this._lastUserSettingState.swimlane) {
          changeType = ChangeType.CHANGE_SWIMLANE;
        } else if (userSettingState.viewMode !== this._lastUserSettingState.viewMode) {
          if (this._lastUserSettingState.showBacklog !== userSettingState.showBacklog) {
            // Don't do anything for this update. The caller needs to do a full refresh (see comment in BoardComponent).
            this._forcedRefresh = true;
          } else {
            changeType = ChangeType.SWITCH_VIEW_MODE;
          }
        } else if (userSettingState.showBacklog !== this._lastUserSettingState.showBacklog) {
          // Don't do anything. The caller needs to do a full refresh (see comment in BoardComponent).
          this._forcedRefresh = true;
        } else if (userSettingState.columnVisibilities !== this._lastUserSettingState.columnVisibilities) {
          changeType = ChangeType.CHANGE_COLUMN_VISIBILITY;
        } else if (userSettingState.swimlaneShowEmpty !== this._lastUserSettingState.swimlaneShowEmpty) {
          changeType = ChangeType.TOGGLE_SWIMLANE_SHOW_EMPTY;
        } else if (userSettingState.collapsedSwimlanes !== this._lastUserSettingState.collapsedSwimlanes) {
          changeType = ChangeType.TOGGLE_SWIMLANE_COLLAPSED;
        } else if (userSettingState.issueDetail !== this._lastUserSettingState.issueDetail) {
          changeType = ChangeType.UPDATE_ISSUE_DETAIL;
        }
      }

      let boardView: BoardViewModel = this._lastBoardView;
      if (changeType != null) {
        boardView = new BoardViewBuilder(this._fontSizeTable, changeType, this._lastBoardView,
          this._lastBoardState, boardState, this._lastUserSettingState, userSettingState)
          .build();
      }

      this._lastBoardState = boardState;
      this._lastUserSettingState = userSettingState;
      this._lastBoardView = boardView;
      return this._lastBoardView;
    });
  }
}

class BoardViewBuilder {
  constructor(
    private readonly _fontSizeTable: FontSizeTableService,
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
      new IssueTableBuilder(
        this._fontSizeTable,
        this._changeType, this._oldBoardView.issueTable, this._currentBoardState,
        this._lastUserSettingState, this._currentUserSettingState);
    const issueTable: IssueTable = issueTableBuilder.build();

    headersBuilder.updateIssueHeaderCounts(issueTableBuilder.totalIssueCounts, issueTableBuilder.visibleIssueCounts);

    const newHeaders: BoardHeaders = headersBuilder.build();
    const newIssueDetail: IssueDetailState = this._currentUserSettingState.issueDetail;
    if (
      newHeaders !== this._oldBoardView.headers ||
      issueTable !== this._oldBoardView.issueTable ||
      newIssueDetail !== this._oldBoardView.issueDetail) {
      return BoardViewModelUtil.updateBoardViewModel(this._oldBoardView, model => {
        model.headers = newHeaders,
        model.issueTable = issueTable,
        model.issueDetail = newIssueDetail
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
    private readonly _oldUserSettingState: UserSettingState,
    private readonly _currentUserSettingState: UserSettingState) {
  }

  initialiseHeaders(): HeadersBuilder {
    this._headers = this._oldBoardView.headers;

    if (this._changeType === ChangeType.INIT_HELP_TEXTS) {
      this.populateHelpTexts();
    } else if (this._oldHeaderState !== this._currentHeaderState) {
      this.populateHeaders();
    }

    switch (this._changeType) {
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
        this.updateStateVisibility();
        break;
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
        this.toggleBacklog();
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

  private populateHelpTexts() {

    const statesList: List<BoardHeader> = this.flattenHeaders();

    const updatedStates: Map<number, BoardHeader> = Map<number, BoardHeader>().asMutable();
    statesList.forEach((state, i) => {
      const newState: BoardHeader = this.updateHeaderHelpText(state);
      if (newState !== state) {
        updatedStates.set(i, newState);
      }
    });

    // We have already modified the states with help texts so there is no need to update further
    // However this convenience method will take care of updating all the nested structures
    const headersList: List<BoardHeader> = this.updateHeaders(updatedStates);

    this._headers = BoardViewModelUtil.updateBoardHeaders(this._headers, boardHeaders => {
      boardHeaders.headersList = headersList;
    });
  }

  private updateHeaderHelpText(header: BoardHeader): BoardHeader {
    const help: string = this._currentHeaderState.helpTexts.get(header.name);
    if (!help) {
      return header;
    }
    return BoardViewModelUtil.updateBoardHeader(header, mutable => mutable.helpText = help);
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
        .filter((v, k) => {return this.calculateVisibility(this._oldUserSettingState, k) !== v}).toMap();
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

  updateIssueHeaderCounts(totalIssueCounts: List<number>, visibleIssueCounts: List<number>): HeadersBuilder {
    switch (this._changeType) {
      case ChangeType.UPDATE_BOARD:
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS:
        break;
      default:
        return this;
    }

    const statesList: List<BoardHeader> = this.flattenHeaders();
    const updatedStates: Map<number, BoardHeader> = Map<number, BoardHeader>().asMutable();
    statesList.forEach((h, i) => {
      const newTotal = totalIssueCounts.get(i);
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
                        startCategory?: (h: BoardHeader) => void,
                        categoryState?: (updated: BoardHeader) => void,
                        finaliseCategory?: (mutable: BoardHeader) => void): List<BoardHeader> {
    let headersList: List<BoardHeader> = this._headers.headersList;
    this._headers.headersList.forEach((h, i) => {
      if (!h.category) {
        const updated: BoardHeader = updatedStates.get(h.stateIndices.get(0));
        if (updated) {
          headersList = headersList.asMutable().set(i, updated);
        }
      } else {
        if (startCategory) {
          startCategory(h);
        }
        let stateHeaderList: List<BoardHeader> = h.states;
        h.states.forEach((stateHeader, index) => {
          const updated: BoardHeader = updatedStates.get(stateHeader.stateIndices.get(0));
          if (updated) {
            stateHeaderList = stateHeaderList.asMutable().set(index, updated);
          }
          if (categoryState) {
            categoryState(updated ? updated : stateHeader);
          }
        });
        if (stateHeaderList !== h.states) {
          const updated: BoardHeader = BoardViewModelUtil.updateBoardHeader(h, mutable => {
            mutable.states = stateHeaderList.asImmutable();
            if (finaliseCategory) {
              finaliseCategory(mutable);
            }
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
    visible: visible,
    helpText: null});
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
    visible: visible,
    helpText: null});
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
  // Initialised in createTableAndRankView
  private _rankView: List<RankViewEntry>;
  private _old_style_table: List<List<string>>;
  private _table: List<List<BoardIssueView>>;

  private _totalIssueCounts: List<number>;
  private _visibleIssueCounts: List<number>;

  // Just a throwaway lookup so don't bother making this immutable
  private _ownStateNames: Dictionary<string[]> = {};

  constructor(
    private readonly _fontSizeTable: FontSizeTableService,
    private readonly _changeType: ChangeType,
    private readonly _oldIssueTableState: IssueTable,
    private readonly _currentBoardState: BoardState,
    private readonly _oldUserSettingState: UserSettingState,
    private readonly _currentUserSettingState: UserSettingState) {
    this._table = _oldIssueTableState.table;
    this._rankView = _oldIssueTableState.rankView;

  }

  get totalIssueCounts(): List<number> {
    return this._totalIssueCounts;
  }

  get visibleIssueCounts(): List<number> {
    return this._visibleIssueCounts;
  }

  build (): IssueTable {
    let issues: Map<string, BoardIssueView> = this.populateIssues();
    issues = this.filterIssues(issues);

    this.createTableAndRankView(issues);

    const swimlaneInfo: SwimlaneInfo = this.calculateSwimlane(this._table);
    if (issues === this._oldIssueTableState.issues &&
      this._table === this._oldIssueTableState.table &&
      this._rankView === this._oldIssueTableState.rankView &&
      swimlaneInfo === this._oldIssueTableState.swimlaneInfo) {
      return this._oldIssueTableState;
    }

    return BoardViewModelUtil.createIssueTable(
      issues,
      this._totalIssueCounts,
      this._visibleIssueCounts,
      this._rankView,
      this._table,
      swimlaneInfo);
  }

  private populateIssues(): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.UPDATE_ISSUE_DETAIL:
      case ChangeType.LOAD_BOARD: {
        const issues: Map<string, BoardIssueView> = Map<string, BoardIssueView>().asMutable();
        this._currentBoardState.issues.issues.forEach((issue, key) => {
          const issueView: BoardIssueView = this.createIssueView(issue, true);
          issues.set(key, issueView);
        });
        return issues.asImmutable();
      }
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
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
              const issueView: BoardIssueView = this.createIssueView(issue, true);
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

  private createIssueView(issue: BoardIssue, visible: boolean): BoardIssueView {
    const colour: string = this._currentBoardState.projects.boardProjects.get(issue.projectCode).colour;
    const ownStateName: string = this.getOwnStateName(issue);

    // Some unit tests will not have the font size table
    let height = 0;
    let summaryLines: List<string>;
    if (this._fontSizeTable) {
      const heightCalculator: IssueHeightCalculator =
        IssueHeightCalculator.create(issue, this._fontSizeTable, this._currentUserSettingState);
      height = heightCalculator.calculatedHeight;
      summaryLines = List<string>(heightCalculator.summaryLines);
    }
    return BoardIssueViewUtil.createBoardIssue(
      issue, this._currentBoardState.jiraUrl, colour, ownStateName, visible, summaryLines, height);
  }


  private filterIssues(issues: Map<string, BoardIssueView>): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS: {
        const filters: AllFilters =
          new AllFilters(this._currentUserSettingState.filters, this._currentBoardState.projects, this._currentBoardState.currentUser);
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
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
      case ChangeType.UPDATE_BOARD: {
        const filters: AllFilters =
          new AllFilters(this._currentUserSettingState.filters, this._currentBoardState.projects, this._currentBoardState.currentUser);
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

  private createTableAndRankView(issues: Map<string, BoardIssueView>): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.CHANGE_SWIMLANE:
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
      case ChangeType.TOGGLE_SWIMLANE_COLLAPSED:
        this._totalIssueCounts = this._oldIssueTableState.totalIssues;
        this._visibleIssueCounts = this._oldIssueTableState.visibleIssues;
        return;
    }

    const viewMode: BoardViewMode = this._currentUserSettingState.viewMode;
    const oldTable: List<List<BoardIssueView>> = this._changeType === ChangeType.LOAD_BOARD ? null : this._oldIssueTableState.table;
    const oldRank: List<RankViewEntry> = this._changeType === ChangeType.LOAD_BOARD ? null : this._oldIssueTableState.rankView;

    const statesSize = this._currentBoardState.headers.states.size;
    // We always need this since the issue table is used to calculate the total issues
    const tableBuilder: TableBuilder<BoardIssueView> =
      new TableBuilder<BoardIssueView>(statesSize, oldTable);
    // Only calculate the rank view if we have that viewMode
    const rankViewBuilder: RankViewBuilder = viewMode === BoardViewMode.RANK ? new RankViewBuilder(oldRank) : null;

    const totalIssues: number[] = [];
    const visibleIssues: number[] = [];
    for (let i = 0 ; i < statesSize ; i++) {
      totalIssues.push(0);
      visibleIssues.push(0);
    }

    const mainProj: BoardProject = this._currentBoardState.projects.boardProjects.get(this._currentBoardState.projects.owner);
    this.addProjectIssues(
      issues, totalIssues, visibleIssues, tableBuilder, rankViewBuilder, mainProj);
    this._currentBoardState.projects.boardProjects.forEach((project, key) => {
      if (key !== this._currentBoardState.projects.owner) {
        this.addProjectIssues(issues, totalIssues, visibleIssues, tableBuilder, rankViewBuilder, project);
      }
    });

    this._totalIssueCounts = List<number>(totalIssues);
    this._visibleIssueCounts = List<number>(visibleIssues);

    this._table = tableBuilder.build();
    this._rankView = rankViewBuilder ? rankViewBuilder.getRankView() : initialIssueTable.rankView;
    return issues;
  }

  private addProjectIssues(
      issues: Map<string, BoardIssueView>,
      totalIssues: number[],
      visibleIssues: number[],
      tableBuilder: TableBuilder<BoardIssueView>,
      rankViewBuilder: RankViewBuilder,
      project: BoardProject) {

    const rankedKeysForProject: List<string> = this._currentBoardState.ranks.rankedIssueKeys.get(project.key);
    if (!rankedKeysForProject) {
      return;
    }
    const ownToBoardIndex: number[] = ProjectUtil.getOwnIndexToBoardIndex(this._currentBoardState.headers, project);
    rankedKeysForProject.forEach((key) => {
      const issue: BoardIssueView = issues.get(key);
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex[issue.ownState];
      totalIssues[boardIndex] += 1;
      if (issue.visible) {
        tableBuilder.push(boardIndex, issue);
        visibleIssues[boardIndex] += 1;
        if (rankViewBuilder) {
          rankViewBuilder.push(boardIndex, issue);
        }
      }
    });
  }

  private calculateSwimlane(table: List<List<BoardIssueView>>): SwimlaneInfo {
    if (!this._currentUserSettingState.swimlane) {
      return null;
    }
    let swimlaneBuilder: SwimlaneInfoBuilder;
    switch (this._changeType) {
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
      case ChangeType.LOAD_BOARD:
      case ChangeType.CHANGE_SWIMLANE:
      case ChangeType.UPDATE_ISSUE_DETAIL:
        swimlaneBuilder = SwimlaneInfoBuilder.create(this._currentBoardState, this._currentUserSettingState, null);
        break;
      case ChangeType.APPLY_FILTERS:
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
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

    if (swimlaneBuilder) {
      this.populateSwimlanes(swimlaneBuilder, table);
      swimlaneBuilder.applySwimlaneFilters();

      return swimlaneBuilder.build();
    }
    return this._oldIssueTableState.swimlaneInfo;
  }

  private populateSwimlanes(swimlaneBuilder: SwimlaneInfoBuilder,
                            table: List<List<BoardIssueView>>): SwimlaneInfoBuilder {
    for (let i = 0 ; i < table.size ; i++) {
      const column: List<BoardIssueView> = table.get(i);
      column.forEach(issue => {
        swimlaneBuilder.indexIssue(issue, i);
      });
    }

    return swimlaneBuilder;
  }

  private getOwnStateName(issue: BoardIssue): string {
    let ownStateNames: string[] = this._ownStateNames[issue.projectCode];
    if (!ownStateNames) {
      const boardProject: BoardProject = this._currentBoardState.projects.boardProjects.get(issue.projectCode);
      const boardStates: List<string> = this._currentBoardState.headers.states;
      ownStateNames = [];
      boardStates.forEach((boardState) => {
        const ownState: string = boardProject.boardStateNameToOwnStateName.get(boardState);
        if (ownState) {
          ownStateNames.push(ownState);
        }
      });
      this._ownStateNames[issue.projectCode] = ownStateNames;
    }
    return ownStateNames[issue.ownState];
  }
}

class SwimlaneInfoBuilder {
  static create(boardState: BoardState,
                userSettingState: UserSettingState, existingInfo: SwimlaneInfo): SwimlaneInfoBuilder {
    const states: number = boardState.headers.states.size;
    let builderMap: OrderedMap<string, SwimlaneDataBuilder> = OrderedMap<string, SwimlaneDataBuilder>().asMutable();
    let builderNone: SwimlaneDataBuilder =
      new SwimlaneDataBuilder(NONE_FILTER_KEY, 'None', states, collapsed(userSettingState, NONE_FILTER_KEY),  existingInfo);
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
          [dataBuilders.get(issue.assignee === NO_ASSIGNEE ? NONE_FILTER_KEY : issue.assignee.key)]);
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
            return [dataBuilders.get(issueField ? issueField.key : NONE_FILTER_KEY)];
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
      return [dataBuilders.get(NONE_FILTER_KEY)];
    }
    return issueSet.map(v => dataBuilders.get(v)).toArray();
  }

  private constructor(
    private _boardState: BoardState,
    private _userSettingState: UserSettingState,
    private _issueMatcher: (issue: BoardIssueView, dataBuilders: OrderedMap<string, SwimlaneDataBuilder>) => SwimlaneDataBuilder[],
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
      if (dataBuilder.filterVisible) {
        swimlanes.set(key, dataBuilder.build());
      }
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
        if (existing) {
          const data: SwimlaneData = sdb.updateCollapsed();
          if (existing !== data) {
            mutable.set(k, data);
          }
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
  private readonly _tableBuilder: TableBuilder<BoardIssueView>;
  private _visibleIssuesCount = 0;
  filterVisible = true;
  private _table: List<List<BoardIssueView>>;


  constructor(private readonly _key: string, private readonly _display: string,
              states: number, private _collapsed: boolean, exisitingInfo: SwimlaneInfo) {
    this._existing = exisitingInfo ? exisitingInfo.swimlanes.get(_key) : null;
    this._tableBuilder = new TableBuilder<BoardIssueView>(states, this._existing ? this._existing.table : null);
  }

  addIssue(issue: BoardIssueView, boardIndex: number) {
    if (issue.visible) {
      this._tableBuilder.push(boardIndex, issue);
      this._visibleIssuesCount++;
    }
  }

  get table() {
    if (!this._table) {
      this._table = this._tableBuilder.build();
    }
    return this._table;
  }

  get key(): string {
    return this._key;
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
    return this.isChangedTable() || this.isChangedCollapsed();
  }

  build(): SwimlaneData {
    if (this._existing) {
      if (!this.isChanged()) {
        return this._existing;
      }
    }
    return BoardViewModelUtil.createSwimlaneDataView(
      this._key,
      this._display,
      this._tableBuilder.build(),
      this._visibleIssuesCount,
      this._collapsed);
  };

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

class TableBuilder<T> {
  private readonly _current: ColumnBuilder<T>[];

  constructor(states: number, private readonly _existing: List<List<T>>) {
    this._current = new Array<ColumnBuilder<T>>(states);
    for (let i = 0 ; i < this._current.length ; i++) {
      if (_existing) {
        this._current[i] = new ExistingColumnBuilder(i, this._existing.get(i));
      } else {
        this._current[i] = new NewColumnBuilder();
      }
    }

  }

  push(index: number, value: T) {
    this._current[index].push(value);
  }

  build(): List<List<T>> {
    if (!this._existing) {
      return List<List<T>>().withMutations(mutable => {
        for (const column of this._current) {
          mutable.push(column.getList());
        }
      });
    } else {
      let changed = false;
      const table: List<List<T>> = List<List<T>>().withMutations(mutable => {
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

interface ColumnBuilder<T> {
  push(value: T);
  isChanged(): boolean;
  getList(): List<T>;
}

class ExistingColumnBuilder<T> implements ColumnBuilder<T> {
  private _current: List<T>;
  private _index = 0;
  private _changed = false;

  constructor(private _column: number, private _existing: List<T>) {
  }

  push(value: T) {
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
      this._current = List<T>().asMutable();
    }
    this._current.push(value);
  }

  isChanged(): boolean {
    return this._changed || this.safeSize(this._existing) !== this.safeSize(this._current);
  }

  private safeSize(list: List<T>): number {
    if (!list) {
      return 0;
    }
    return list.size;
  }

  getList(): List<T> {
    if (this.isChanged()) {
      return this._current ? this._current.asImmutable() : List<T>();
    }
    return this._existing;
  }
}

class NewColumnBuilder<T> implements ColumnBuilder<T> {
  private _current: List<T> = List<T>().asMutable();
  private _changed = true;


  push(value: T) {
    this._current.push(value);
  }

  isChanged(): boolean {
    return this._changed;
  }

  getList(): List<T> {
    return this._current.asImmutable();
  }
}

class RankViewBuilder {
  private readonly _current: List<RankViewEntry> = List<RankViewEntry>().asMutable();
  private readonly _currentMap: Map<string, RankViewEntry>;
  private _currentIndex = 0;
  private _changed = false;

  constructor(private readonly _existing: List<RankViewEntry>) {
    if (!_existing) {
      this._changed = true;
      this._currentMap = Map<string, RankViewEntry>();
    } else {
      this._currentMap =
        this._existing.reduce(
          (map, entry) => map.set(entry.issue.key, entry), Map<string, RankViewEntry>());
    }
  }

  push(boardIndex: number, issue: BoardIssueView): RankViewBuilder {
    let entry: RankViewEntry = null;
    if (!this._changed) {
      const existing: RankViewEntry = this._existing.get(this._currentIndex);
      if (existing && existing.issue === issue && existing.boardIndex === boardIndex) {
        entry = existing;
        this._currentIndex++;
      } else {
        this._changed = true;
      }
    }
    if (!entry) {
      entry = this._currentMap.get(issue.key);
      if (!entry || (entry.issue !== issue || entry.boardIndex !== boardIndex)) {
        entry = BoardViewModelUtil.createRankViewEntry(issue, boardIndex);
      }
    }
    if (entry.issue.visible) {
      this._current.push(entry);
    }
    return this;
  }

  getRankView(): List<RankViewEntry> {
    if (!this._changed) {
      if (this._current.size === this._existing.size) {
        return this._existing;
      }
    }
    return this._current.asImmutable();
  }
}


enum ChangeType {
  LOAD_BOARD,
  UPDATE_BOARD,
  UPDATE_BOARD_AFTER_BACKLOG_TOGGLE,
  APPLY_FILTERS,
  CHANGE_SWIMLANE,
  CHANGE_COLUMN_VISIBILITY,
  TOGGLE_SWIMLANE_SHOW_EMPTY,
  TOGGLE_SWIMLANE_COLLAPSED,
  SWITCH_VIEW_MODE,
  UPDATE_ISSUE_DETAIL,
  INIT_HELP_TEXTS
}

function collapsed(userSettingState: UserSettingState, key: string): boolean {
  return userSettingState.collapsedSwimlanes.get(key, userSettingState.defaultCollapsedSwimlane);
}


