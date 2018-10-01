import {FontSizeTableService} from '../../../services/font-size-table.service';
import {BoardViewModel} from '../board-view';
import {BoardState} from '../../../model/board/data/board';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {IssueTable} from '../issue-table';
import {BoardHeaders} from '../board-headers';
import {IssueDetailState} from '../../../model/board/user/issue-detail/issue-detail.model';
import {BoardViewModelUtil} from '../board-view.model';
import {ChangeType} from './change-type';
import {HeadersBuilder} from './headers.builder';
import {IssueTableBuilder} from './issue-table.builder';

export class BoardViewBuilder {
  constructor(
    private readonly _fontSizeTable: FontSizeTableService,
    private readonly _jiraUrl: string,
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
        this._fontSizeTable, this._jiraUrl,
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
        model.headers = newHeaders;
        model.issueTable = issueTable;
        model.issueDetail = newIssueDetail;
      });
    } else {
      return this._oldBoardView;
    }
  }
}
