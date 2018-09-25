import {BoardState} from '../../../model/board/data/board';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {SwimlaneInfo} from '../swimlane-info';
import {List, Map, OrderedMap, OrderedSet, Set} from 'immutable';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES, FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES, LABEL_ATTRIBUTES,
  NONE_FILTER_KEY,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardIssueView} from '../board-issue-view';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {SwimlaneData} from '../swimlane-data';
import {BoardViewModelUtil} from '../board-view.model';
import {TableBuilder} from './table.builder';
import {UserSettingUtil} from '../../../model/board/user/user-setting.model';

export class SwimlaneInfoBuilder {
  static create(boardState: BoardState,
                userSettingState: UserSettingState, existingInfo: SwimlaneInfo): SwimlaneInfoBuilder {
    const states: number = boardState.headers.states.size;
    let builderMap: OrderedMap<string, SwimlaneDataBuilder> = OrderedMap<string, SwimlaneDataBuilder>().asMutable();
    let builderNone: SwimlaneDataBuilder =
      new SwimlaneDataBuilder(
        NONE_FILTER_KEY, 'None', states, collapsed(userSettingState, NONE_FILTER_KEY),  userSettingState, existingInfo);

    let issueMatcher:
      (issue: BoardIssueView, dataBuilders: Map<string, SwimlaneDataBuilder>) => SwimlaneDataBuilder[];
    switch (userSettingState.swimlane) {
      case PROJECT_ATTRIBUTES.key:
        boardState.projects.boardProjects.forEach(
          p => {
            builderMap.set(p.key,
              new SwimlaneDataBuilder(p.key, p.key, states, collapsed(userSettingState, p.key), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.projectCode)]);
        builderNone = null;
        break;
      case ISSUE_TYPE_ATTRIBUTES.key:
        boardState.issueTypes.types.forEach(
          t => {
            builderMap.set(
              t.name, new SwimlaneDataBuilder(t.name, t.name, states, collapsed(userSettingState, t.name), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.type.name)]);
        builderNone = null;
        break;
      case PRIORITY_ATTRIBUTES.key:
        boardState.priorities.priorities.forEach(
          p => {
            builderMap.set(p.name,
              new SwimlaneDataBuilder(p.name, p.name, states, collapsed(userSettingState, p.name), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => [dataBuilders.get(issue.priority.name)]);
        builderNone = null;
        break;
      case ASSIGNEE_ATTRIBUTES.key:
        boardState.assignees.assignees.forEach(
          a => {
            builderMap.set(a.key,
              new SwimlaneDataBuilder(a.key, a.name, states, collapsed(userSettingState, a.key), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) =>
          [dataBuilders.get(issue.assignee === NO_ASSIGNEE ? NONE_FILTER_KEY : issue.assignee.key)]);
        break;
      case COMPONENT_ATTRIBUTES.key:
        boardState.components.components.forEach(
          c => {
            builderMap.set(c, new SwimlaneDataBuilder(c, c, states, collapsed(userSettingState, c), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.components, dataBuilders));
        break;
      case LABEL_ATTRIBUTES.key:
        boardState.labels.labels.forEach(
          l => {
            builderMap.set(l,
              new SwimlaneDataBuilder(l, l, states, collapsed(userSettingState, l), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.labels, dataBuilders));
        break;
      case FIX_VERSION_ATTRIBUTES.key:
        boardState.fixVersions.versions.forEach(
          f => {
            builderMap.set(f,
              new SwimlaneDataBuilder(f, f, states, collapsed(userSettingState, f), userSettingState, existingInfo));
          });
        issueMatcher = ((issue, dataBuilders) => this.multiStringMatcher(issue.fixVersions, dataBuilders));
        break;
      default: {
        const customFields: OrderedMap<string, CustomField> = boardState.customFields.fields.get(userSettingState.swimlane);
        if (customFields) {
          customFields.forEach(
            f => {
              builderMap.set(f.key,
                new SwimlaneDataBuilder(f.key, f.value, states, collapsed(userSettingState, f.key), userSettingState, existingInfo));
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

  static updateSwimlaneShowEmpty(userSettingState: UserSettingState, swimlaneInfo: SwimlaneInfo): SwimlaneInfo {
    const visibleSwimlanes: OrderedMap<string, SwimlaneData> =
      this.filterVisibleSwimlanes(userSettingState, swimlaneInfo.allSwimlanes);

    return BoardViewModelUtil.createSwimlaneInfoView(
      userSettingState.swimlaneShowEmpty, visibleSwimlanes, swimlaneInfo.allSwimlanes);
  }

  private static filterVisibleSwimlanes(
    userSettingState: UserSettingState, allSwimlanes: OrderedMap<string, SwimlaneData>): OrderedMap<string, SwimlaneData> {

    if (userSettingState.swimlaneShowEmpty) {
      return allSwimlanes;
    } else {
      return OrderedMap<string, SwimlaneData>(allSwimlanes.filter(data => {
        return data.visibleIssues > 0;
      }));
    }
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
      changed = keys.length !== this._existing.allSwimlanes.size;
    }

    const allSwimlanes: OrderedMap<string, SwimlaneData> = OrderedMap<string, SwimlaneData>().withMutations(mutable => {
      for (const key of keys) {
        const dataBuilder: SwimlaneDataBuilder = this._dataBuilders.get(key);
        if (dataBuilder.isChanged()) {
          changed = true;
        }
        if (dataBuilder.filterVisible) {
          mutable.set(key, dataBuilder.build());
        }
      }
    });

    if (!changed) {
      return this._existing;
    }

    const visibleSwimlanes: OrderedMap<string, SwimlaneData> =
      SwimlaneInfoBuilder.filterVisibleSwimlanes(this._userSettingState, allSwimlanes);

    return BoardViewModelUtil.createSwimlaneInfoView(
      this._userSettingState.swimlaneShowEmpty, visibleSwimlanes, allSwimlanes);
  }

  updateCollapsed(): SwimlaneInfo {
    const updatedSwimlanes: Map<string, SwimlaneData> = this._existing.allSwimlanes.withMutations(mutable => {
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
      mutable.visibleSwimlanes = SwimlaneInfoBuilder.filterVisibleSwimlanes(this._userSettingState, updatedSwimlanes),
      mutable.allSwimlanes = updatedSwimlanes;
    });
  }
}

class SwimlaneDataBuilder {
  private readonly _existing: SwimlaneData;
  private readonly _tableBuilder: TableBuilder<BoardIssueView>;
  private _visibleIssuesCount = 0;
  filterVisible = true;
  private _table: List<List<BoardIssueView>>;
  private readonly _calculatedColumnHeights: number[];


  constructor(private readonly _key: string, private readonly _display: string,
              states: number, private _collapsed: boolean, private _userSettingState, exisitingInfo: SwimlaneInfo) {
    this._existing = exisitingInfo ? exisitingInfo.allSwimlanes.get(_key) : null;
    this._tableBuilder = new TableBuilder<BoardIssueView>(states, this._existing ? this._existing.table : null);
    this._calculatedColumnHeights = new Array<number>(states);
    for (let i = 0 ; i < states ; i++) {
      this._calculatedColumnHeights[i] = 0;
    }
  }

  addIssue(issue: BoardIssueView, boardIndex: number) {
    if (issue.visible) {
      this._tableBuilder.push(boardIndex, issue);
      this._visibleIssuesCount++;
      this._calculatedColumnHeights[boardIndex] += issue.calculatedTotalHeight;
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

    let maxColumnHeight = 0;
    this._calculatedColumnHeights.forEach((v, index) => {
      if (v > maxColumnHeight) {
        if (UserSettingUtil.calculateVisibility(this._userSettingState, index)) {
          maxColumnHeight = v;
        }
      }
    });

    return BoardViewModelUtil.createSwimlaneDataView(
      this._key,
      this._display,
      this._tableBuilder.build(),
      this._visibleIssuesCount,
      this._collapsed,
      maxColumnHeight);
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


function collapsed(userSettingState: UserSettingState, key: string): boolean {
  return userSettingState.collapsedSwimlanes.get(key, userSettingState.defaultCollapsedSwimlane);
}
