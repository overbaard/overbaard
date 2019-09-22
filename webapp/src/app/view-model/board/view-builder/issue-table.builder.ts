import {List, Map} from 'immutable';
import {RankViewEntry} from '../rank-view-entry';
import {BoardIssueView} from '../board-issue-view';
import {Dictionary} from '../../../common/dictionary';
import {FontSizeTableService} from '../../../services/font-size-table.service';
import {IssueTable} from '../issue-table';
import {BoardState} from '../../../model/board/data/board';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {SwimlaneInfo} from '../swimlane-info';
import {BoardViewModelUtil, initialIssueTable} from '../board-view.model';
import {IssueChange} from '../../../model/board/data/issue/issue.model';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardIssueViewUtil} from '../board-issue-view.model';
import {AllFilters} from '../filter.util';
import {BoardViewMode} from '../../../model/board/user/board-view-mode';
import {BoardProject, OwnToBoardStateMappings} from '../../../model/board/data/project/project.model';
import {ChangeType} from './change-type';
import {TableBuilder} from './table.builder';
import {RankViewBuilder} from './rank-view.builder';
import {SwimlaneInfoBuilder} from './swimlane-info.builder';
import {IssueHeightCalculator} from './issue-height-calculator';

export class IssueTableBuilder {
  // Initialised in createTableAndRankView
  private _rankView: List<RankViewEntry>;
  private _table: List<List<BoardIssueView>>;
  private _issueRanksByProject: Map<string, Map<string, number>>;

  private _totalIssueCounts: List<number>;
  private _visibleIssueCounts: List<number>;

  // Just throwaway lookups so don't bother making this immutable
  private _ownStateNames: Dictionary<string[]> = {};
  private _ownStateNamesForOverriddenIssueTypes: Dictionary<Dictionary<string[]>> = {};

  constructor(
    private readonly _fontSizeTable: FontSizeTableService,
    private readonly _jiraUrl: string,
    private readonly _changeType: ChangeType,
    private readonly _oldIssueTableState: IssueTable,
    private readonly _currentBoardState: BoardState,
    private readonly _oldUserSettingState: UserSettingState,
    private readonly _currentUserSettingState: UserSettingState) {
    this._table = _oldIssueTableState.table;
    this._rankView = _oldIssueTableState.rankView;
    this._issueRanksByProject = _oldIssueTableState.issueRanksByProject;

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
      swimlaneInfo === this._oldIssueTableState.swimlaneInfo &&
      this._issueRanksByProject === this._oldIssueTableState.issueRanksByProject) {
      return this._oldIssueTableState;
    }

    return BoardViewModelUtil.createIssueTable(
      issues,
      this._totalIssueCounts,
      this._visibleIssueCounts,
      this._rankView,
      this._table,
      this._issueRanksByProject,
      swimlaneInfo);
  }

  private populateIssues(): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.UPDATE_ISSUE_DETAIL:
      case ChangeType.LOAD_BOARD: {
        const issues: Map<string, BoardIssueView> = Map<string, BoardIssueView>().asMutable();
        this._currentBoardState.issues.issues.forEach((issue, key) => {
          const issueView: BoardIssueView = this.createIssueView(issue);
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
              const issueView: BoardIssueView = this.createIssueView(issue);
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

  private createIssueView(issue: BoardIssue): BoardIssueView {
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
      issue, this._jiraUrl, colour, ownStateName, true, true, summaryLines, height);
  }


  private filterIssues(issues: Map<string, BoardIssueView>): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.LOAD_BOARD:
      case ChangeType.UPDATE_ISSUE_DETAIL:
      case ChangeType.UPDATE_SEARCH:
      case ChangeType.TOGGLE_HIDE_SEARCH_NON_MATCHES:
      case ChangeType.APPLY_FILTERS: {

        const filters: AllFilters =
          new AllFilters(
            this._currentUserSettingState.filters,
            this._currentUserSettingState.searchFilters,
            this._currentBoardState.projects,
            this._currentBoardState.customFields,
            this._currentBoardState.currentUser);
        issues.forEach((issue, key) => {
          const updated: BoardIssueView = this.filterIssue(issue, filters);
          if (updated !== issue) {
            issues = issues.asMutable();
            issues.set(key, updated);
          }
        });
        return issues.asImmutable();
      }
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
      case ChangeType.UPDATE_BOARD: {
        const filters: AllFilters =
          new AllFilters(
            this._currentUserSettingState.filters,
            this._currentUserSettingState.searchFilters,
            this._currentBoardState.projects,
            this._currentBoardState.customFields,
            this._currentBoardState.currentUser);
        this._currentBoardState.issues.lastChanged.forEach((change, key) => {
          if (change.change === IssueChange.DELETE) {
            issues = issues.asMutable();
            issues.delete(key);
          } else {
            const issue: BoardIssueView = issues.get(key);
            const updated: BoardIssueView = this.filterIssue(issue, filters);
            if (updated !== issue) {
              issues = issues.asMutable();
              issues.set(key, updated);
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

  private filterIssue(issue: BoardIssueView, filters: AllFilters): BoardIssueView {
    let doFilter = true;
    let doSearch = true;
    if (this._changeType === ChangeType.APPLY_FILTERS) {
      doFilter = true;
    } else if (this._changeType === ChangeType.UPDATE_SEARCH) {
      doSearch = true;
    }

    let visible: boolean = issue.visible;
    let matchesSearch: boolean = issue.matchesSearch;
    if (doFilter) {
      visible = filters.filterVisible(issue);
      if (!visible) {
        // Reset this to the default
        matchesSearch = true;
      } else {
        if (!issue.visible) {
          // We increased visibility, so we need to force the search
          doSearch = true;
        }
      }
    }
    if (visible && doSearch) {
      const hideNonMatches: boolean = this._currentUserSettingState.searchFilters.hideNonMatches;

      const temp = filters.filterMatchesSearch(issue);
      if (hideNonMatches) {

        visible = temp;

        if (!visible) {
          // Reset this to the default
          matchesSearch = true;
        }
      } else {
        matchesSearch = temp;
      }
    }

    if (visible !== issue.visible || matchesSearch !== issue.matchesSearch) {
      return BoardIssueViewUtil.updateVisibilityAndMatchesSearch(issue, visible, matchesSearch);
    }
    return issue;
  }

  /*private filterIssue(issue: BoardIssueView, filters: AllFilters): BoardIssueView {
    const hideNonMatches: boolean = this._currentUserSettingState.searchFilters.hideNonMatches;
    const filterVisible = this._changeType !== ChangeType.UPDATE_SEARCH;
    const filterSearch = this._changeType !== ChangeType.APPLY_FILTERS;

    let visible: boolean = issue.visible;
    if (filterVisible) {
      visible = filters.filterVisible(issue);
    }

    let matchesSearch: boolean = issue.matchesSearch;
    if (visible) {
      if (hideNonMatches) {
        visible = filters.filterMatchesSearch(issue);
        matchesSearch = true;
      } else {
        if (filterSearch) {
          matchesSearch = filters.filterMatchesSearch(issue);
        }
      }
    }
    if (visible || hideNonMatches) {
      if (filterSearch) {
        const tempMatchesSearch = filters.filterMatchesSearch(issue);
        if (!hideNonMatches) {
          matchesSearch = tempMatchesSearch;
        } else {
          // If we have decided to hide all the issues, then we update that setting here
          visible = tempMatchesSearch;
          matchesSearch = true;
        }
      }
    }
    if (visible !== issue.visible || matchesSearch !== issue.matchesSearch) {
      return BoardIssueViewUtil.updateVisibilityAndMatchesSearch(issue, visible, matchesSearch);
    }
    return issue;
  }*/

  private createTableAndRankView(issues: Map<string, BoardIssueView>): Map<string, BoardIssueView> {
    switch (this._changeType) {
      case ChangeType.CHANGE_SWIMLANE:
      case ChangeType.CHANGE_COLUMN_VISIBILITY:
      case ChangeType.TOGGLE_SWIMLANE_COLLAPSED:
        this._totalIssueCounts = this._oldIssueTableState.totalIssues;
        this._visibleIssueCounts = this._oldIssueTableState.visibleIssues;
        if (this._changeType === ChangeType.CHANGE_COLUMN_VISIBILITY && this._currentUserSettingState.viewMode !== BoardViewMode.RANK) {
          return;
        }
    }

    const viewMode: BoardViewMode = this._currentUserSettingState.viewMode;
    const oldTable: List<List<BoardIssueView>> = this._changeType === ChangeType.LOAD_BOARD ? null : this._oldIssueTableState.table;
    const oldRank: List<RankViewEntry> = this._changeType === ChangeType.LOAD_BOARD ? null : this._oldIssueTableState.rankView;

    const statesSize = this._currentBoardState.headers.states.size;
    // We always need this since the issue table is used to calculate the total issues
    const tableBuilder: TableBuilder<BoardIssueView> =
      new TableBuilder<BoardIssueView>(statesSize, oldTable);
    // Only calculate the rank view if we have that viewMode
    const rankViewBuilder: RankViewBuilder =
      viewMode === BoardViewMode.RANK ? new RankViewBuilder(oldRank, this._currentUserSettingState) : null;

    const totalIssues: number[] = [];
    const visibleIssues: number[] = [];
    for (let i = 0 ; i < statesSize ; i++) {
      totalIssues.push(0);
      visibleIssues.push(0);
    }

    this._currentBoardState.projects.boardProjects.forEach((project, key) => {
      const oldIssueRanks: Map<string, number> =
        this._issueRanksByProject.has(key) ? this._issueRanksByProject.get(key) : Map<string, number>();
      const issueRanks: Dictionary<number> = {};

      this.addProjectIssues(issues, totalIssues, visibleIssues, tableBuilder, rankViewBuilder, project, issueRanks);

      const newRanks: Map<string, number> = Map<string, number>(issueRanks);
      if (!newRanks.equals(oldIssueRanks)) {
        this._issueRanksByProject = this._issueRanksByProject.set(key, newRanks);
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
    project: BoardProject,
    issueRanks: Dictionary<number>) {

    const rankedKeysForProject: List<string> = this._currentBoardState.ranks.rankedIssueKeys.get(project.key);
    if (!rankedKeysForProject) {
      return;
    }

    let rankOrder = 0;
    const ownToBoardIndex: OwnToBoardStateMappings = OwnToBoardStateMappings.create(this._currentBoardState.headers, project);
    rankedKeysForProject.forEach((key) => {
      if (this._currentUserSettingState.issueDetail.rankingOrder) {
        rankOrder++;
        issueRanks[key] = rankOrder;
      }

      const issue: BoardIssueView = issues.get(key);
      if (!this._currentUserSettingState.showBacklog && !issue) {
        // The server sends us the full list of issues, whether or not the backlog is visible or not. However, backlog issues are
        // not part of the issue map, so we can't load the issue here.
        return;
      }
      // find the index and add the issue
      const boardIndex: number = ownToBoardIndex.getBoardIndex(issue);

      if (!this._currentUserSettingState.showBacklog && boardIndex < this._currentBoardState.headers.backlog) {
        // When loading the board normally (ie. in the Jira plugin), we don't get the backlog issues when the backlog is collapsed.
        // However, when using the sample data for UI development, and the demo site we have these issues. In turn, they
        // skew the height calculations.
        // So don't add these issues to the issue table
        return;
      }


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
        swimlaneBuilder = SwimlaneInfoBuilder.create(
          this._currentBoardState, this._currentUserSettingState, null, this._jiraUrl);
        break;
      case ChangeType.APPLY_FILTERS:
      case ChangeType.UPDATE_SEARCH:
      case ChangeType.TOGGLE_HIDE_SEARCH_NON_MATCHES:
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
      case ChangeType.UPDATE_BOARD: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        swimlaneBuilder = SwimlaneInfoBuilder.create(
          this._currentBoardState, this._currentUserSettingState, oldSwimlane, this._jiraUrl);
        break;
      }
      case ChangeType.TOGGLE_SWIMLANE_SHOW_EMPTY: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        return SwimlaneInfoBuilder.updateSwimlaneShowEmpty(this._currentUserSettingState, oldSwimlane);
      }
      case ChangeType.TOGGLE_SWIMLANE_COLLAPSED: {
        const oldSwimlane = this._oldIssueTableState.swimlaneInfo;
        swimlaneBuilder = SwimlaneInfoBuilder.create(
          this._currentBoardState, this._currentUserSettingState, oldSwimlane, this._jiraUrl);
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
    let ownStateNamesForOverriddenTypes: Dictionary<string[]> = this._ownStateNamesForOverriddenIssueTypes[issue.projectCode];
    if (!ownStateNames) {
      const boardProject: BoardProject = this._currentBoardState.projects.boardProjects.get(issue.projectCode);
      const boardStates: List<string> = this._currentBoardState.headers.states;

      // Populate the own state names for the project
      ownStateNames = [];
      boardStates.forEach((boardState) => {
        const ownState: string = boardProject.boardStateNameToOwnStateName.get(boardState);
        if (ownState) {
          ownStateNames.push(ownState);
        }
      });
      this._ownStateNames[issue.projectCode] = ownStateNames;

      // Populate the issue type overrides for the project
      ownStateNamesForOverriddenTypes = {};
      boardProject.boardStateNameToOwnStateNameIssueTypeOverrides.forEach((issueTypeStates, type) => {
        const issueTypeNames = [];
        boardStates.forEach(boardState => {
          const ownState: string = issueTypeStates.get(boardState);
          if (ownState) {
            issueTypeNames.push(ownState);
          }
        });
        ownStateNamesForOverriddenTypes[type] = issueTypeNames;
      });
      this._ownStateNamesForOverriddenIssueTypes[issue.projectCode] = ownStateNamesForOverriddenTypes;
    }

    // Check the override
    if (ownStateNamesForOverriddenTypes[issue.type.name]) {
      return ownStateNamesForOverriddenTypes[issue.type.name][issue.ownState];
    }
    return ownStateNames[issue.ownState];
  }
}
