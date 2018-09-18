import {BoardHeaders} from '../board-headers';
import {ChangeType} from './change-type';
import {BoardViewModel} from '../board-view';
import {HeaderState} from '../../../model/board/data/header/header.state';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {List, Map} from 'immutable';
import {BoardHeader} from '../board-header';
import {BoardViewModelUtil} from '../board-view.model';
import {UserSettingUtil} from '../../../model/board/user/user-setting.model';

export class HeadersBuilder {
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
    let backlog = null;
    if (this._currentHeaderState.backlog > 0) {
      backlog = this.createBacklogHeader();
    }

    this._headers = BoardViewModelUtil.updateBoardHeaders(this._headers, boardHeaders => {
      if (backlog) {
        boardHeaders.headersList = boardHeaders.headersList.set(0, backlog);
      }
    });
  }

  private updateStateVisibility() {
    const statesList: List<BoardHeader> = this.flattenHeaders();

    const updatedStateValues: Map<number, boolean> =
      this._currentUserSettingState.columnVisibilities
        .filter((v, k) => this.calculateVisibility(this._oldUserSettingState, k) !== v).toMap();
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
    let handleChange = false;
    switch (this._changeType) {
      case ChangeType.UPDATE_BOARD:
      case ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE:
      case ChangeType.LOAD_BOARD:
      case ChangeType.APPLY_FILTERS:
      case ChangeType.TOGGLE_HIDE_SEARCH_NON_MATCHES:
        handleChange = true;
        break;
      case ChangeType.UPDATE_SEARCH: {
        if (this._currentUserSettingState.searchFilters.hideNonMatches) {
          handleChange = true;
          break;
        }
      }
    }

    if (!handleChange) {
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
    return UserSettingUtil.calculateVisibility(userSettingState, index);
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
