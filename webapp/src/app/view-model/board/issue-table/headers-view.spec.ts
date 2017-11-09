import {HeadersViewModelHandler} from './board-view-model.service';
import {HeaderState} from '../../../model/board/data/header/header.state';
import {HeaderUtil, initialHeaderState} from '../../../model/board/data/header/header.model';
import {IssueTable} from './issue-table';
import {initialIssueTable, IssueTableUtil} from './issue-table.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {HeadersView, HeaderView} from './headers-view';
import {List, Map} from 'immutable';
import {BoardIssueView} from './board-issue-view';
import {HeaderActions, headerMetaReducer} from '../../../model/board/data/header/header.reducer';
import {Header} from '../../../model/board/data/header/header';
import {UserSettingState} from '../../../model/board/user/user-setting.model';

describe('Headers view model Tests', () => {
  let issueTable: IssueTable;
  beforeEach(() => {
    issueTable = IssueTableUtil.createIssueTable(
      null,
      List<List<string>>([List<string>().setSize(5), List<string>().setSize(6), List<string>().setSize(7)]),
      null,
      List<number>([5, 6, 7]),
      List<boolean>([true, true, true]));
  });

  describe('No categories', () => {
    let originalHeaderState: HeaderState;
    let util: HeadersViewObservableUtil;
    let original: HeadersView;
    beforeEach(() => {
      const states = [
        {name: 'S1'},
        {name: 'S2'},
        {name: 'S3'}
      ];
      originalHeaderState = headerMetaReducer(
        initialHeaderState,
        HeaderActions.createDeserializeHeaders(states, [], 0, 0));
      util = new HeadersViewObservableUtil(originalHeaderState, issueTable);
      util.headersViewObserver().take(1).subscribe(view => {
        original = view;
      });
    });

    it('Initial load', () => {
      expect(original.headers.size).toBe(1);
      const headers: List<HeaderView> = original.headers.get(0);
      expect(headers.size).toBe(3);
      checkTotalIssues(headers, 5, 6, 7);
      checkVisibleIssues(headers, 5, 6, 7);
      checkColumnVisibilities(headers, true, true, true);
    });

    it('Update unrelated stuff', () => {
      issueTable = IssueTableUtil.toStateRecord(issueTable).withMutations(mutable => {
        // Updating this should have no effect on anything
        mutable.issues = Map<string, BoardIssueView>();
      })
      util.updateIssueTable(issueTable)
        .headersViewObserver().take(1).subscribe(headers => {
          expect(headers).toBe(original)
      });
    });

    it('Update total issues', () => {
      util.updateTotalIssues(10, 11, 7)
        .headersViewObserver().take(1).subscribe(headersView => {
          expect(headersView.headers.size).toBe(1);
          const headers: List<HeaderView> = headersView.headers.get(0);
          expect(headers.size).toBe(3);
          checkTotalIssues(headers, 10, 11, 7);
          checkVisibleIssues(headers, 5, 6, 7);
          checkColumnVisibilities(headers, true, true, true);
          expect(headers.get(2)).toBe(original.headers.get(0).get(2));
        });
    });

    it('Update visible issues', () => {
      util.updateVisibleIssues(1, 2, 7)
        .headersViewObserver().take(1).subscribe(headersView => {
          expect(headersView.headers.size).toBe(1);
          const headers: List<HeaderView> = headersView.headers.get(0);
          expect(headers.size).toBe(3);
          checkTotalIssues(headers, 5, 6, 7);
          checkVisibleIssues(headers, 1, 2, 7);
          checkColumnVisibilities(headers, true, true, true);
          expect(headers.get(2)).toBe(original.headers.get(0).get(2));
        });
    });

    it('Update column visibility', () => {
      util.updateColumnVisibilities(originalHeaderState, 'S2', false)
        .headersViewObserver().take(1).subscribe(headersView => {
          expect(headersView.headers.size).toBe(1);
          const headers: List<HeaderView> = headersView.headers.get(0);
          expect(headers.size).toBe(3);
          checkTotalIssues(headers, 5, 6, 7);
          checkVisibleIssues(headers, 5, 6, 7);
          checkColumnVisibilities(headers, true, false, true);
          expect(headers.get(0)).toBe(original.headers.get(0).get(0));
          expect(headers.get(2)).toBe(original.headers.get(0).get(2));
        });
    });

    it ('Update header', () => {
      const states = [
        {name: 'S1'},
        {name: 'S2'},
        {name: 'S3-1'}
      ];
      util.updateHeaders(
        headerMetaReducer(
          originalHeaderState,
          HeaderActions.createDeserializeHeaders(states, [], 0, 0)))
        .headersViewObserver().take(1).subscribe(headersView => {
          expect(headersView.headers.size).toBe(1);
          const headers: List<HeaderView> = headersView.headers.get(0);
          expect(headers.size).toBe(3);
          checkTotalIssues(headers, 5, 6, 7);
          checkVisibleIssues(headers, 5, 6, 7);
          checkColumnVisibilities(headers, true, true, true);

          // TODO perhaps tighten up the stuff in header reducer to return equal issues?
          // expect(headers.get(0)).toBe(original.headers.get(0).get(0));
          // expect(headers.get(1)).toBe(original.headers.get(0).get(1));
          expect(headers.get(2)).not.toBe(original.headers.get(0).get(2));
          expect(headers.get(2).name).toEqual('S3-1');
      });
    });
  });

  describe('With categories', () => {
    let originalHeaderState: HeaderState;
    let util: HeadersViewObservableUtil;
    let original: HeadersView;
    beforeEach(() => {
      const states = [
        {name: 'S1'},
        {name: 'S2', header: 0},
        {name: 'S3', header: 0}
      ];
      originalHeaderState = headerMetaReducer(
        initialHeaderState,
        HeaderActions.createDeserializeHeaders(states, ['H1'], 0, 0));
      util = new HeadersViewObservableUtil(originalHeaderState, issueTable);
      util.headersViewObserver().take(1).subscribe(view => {
        original = view;
      });
    });

    it('Initial load', () => {
      expect(original.headers.size).toBe(2);
      let headers: List<HeaderView> = original.headers.get(0);
      expect(headers.size).toBe(2);
      checkTotalIssues(headers, 5, 13);
      checkVisibleIssues(headers, 5, 13);
      checkColumnVisibilities(headers, true, true);

      headers = original.headers.get(1);
      expect(headers.size).toBe(2);
      checkTotalIssues(headers, 6, 7);
      checkVisibleIssues(headers, 6, 7);
      checkColumnVisibilities(headers, true, true);
    });

    it('Update unrelated stuff', () => {
      issueTable = IssueTableUtil.toStateRecord(issueTable).withMutations(mutable => {
        // Updating this should have no effect on anything
        mutable.issues = Map<string, BoardIssueView>();
      })
      util.updateIssueTable(issueTable)
        .headersViewObserver().take(1).subscribe(headers => {
        expect(headers).toBe(original)
      });
    });

    it('Update total issues', () => {
      util.updateTotalIssues(10, 11, 7)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 10, 18);
        checkVisibleIssues(headers, 5, 13);
        checkColumnVisibilities(headers, true, true);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 11, 7);
        checkVisibleIssues(headers, 6, 7);
        checkColumnVisibilities(headers, true, true);
      });
    });

    it('Update visible issues', () => {
      util.updateVisibleIssues(1, 2, 7)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 5, 13);
        checkVisibleIssues(headers, 1, 9);
        checkColumnVisibilities(headers, true, true);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 6, 7);
        checkVisibleIssues(headers, 2, 7);
        checkColumnVisibilities(headers, true, true);
      });
    });

    it('Update column visibility - non category', () => {
      util.updateColumnVisibilities(originalHeaderState, 'S1', false)
        .headersViewObserver().take(1).subscribe(headersView => {
          let headers: List<HeaderView> = headersView.headers.get(0);
          expect(headers.size).toBe(2);
          checkTotalIssues(headers, 5, 13);
          checkVisibleIssues(headers, 5, 13);
          checkColumnVisibilities(headers, false, true);

          headers = headersView.headers.get(1);
          expect(headers.size).toBe(2);
          checkTotalIssues(headers, 6, 7);
          checkVisibleIssues(headers, 6, 7);
          checkColumnVisibilities(headers, true, true);
        });

      util.updateColumnVisibilities(originalHeaderState, 'S1', true)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 5, 13);
        checkVisibleIssues(headers, 5, 13);
        checkColumnVisibilities(headers, true, true);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 6, 7);
        checkVisibleIssues(headers, 6, 7);
        checkColumnVisibilities(headers, true, true);
      });
    });

    it('Update column visibility - category', () => {
      // Since we have not set up the full wiring, we test the actual toggling in user-setting.reducer.spec.ts
      util.updateColumnVisibilities(originalHeaderState, 'H1', false)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 5, 13);
        checkVisibleIssues(headers, 5, 13);
        checkColumnVisibilities(headers, true, false);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 6, 7);
        checkVisibleIssues(headers, 6, 7);
        checkColumnVisibilities(headers, false, false);
      });

      util.updateColumnVisibilities(originalHeaderState, 'S2', true)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 5, 13);
        checkVisibleIssues(headers, 5, 13);
        checkColumnVisibilities(headers, true, true);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 6, 7);
        checkVisibleIssues(headers, 6, 7);
        checkColumnVisibilities(headers, true, false);
      });

      util.updateColumnVisibilities(originalHeaderState, 'H1', false)
        .headersViewObserver().take(1).subscribe(headersView => {
        let headers: List<HeaderView> = headersView.headers.get(0);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 5, 13);
        checkVisibleIssues(headers, 5, 13);
        checkColumnVisibilities(headers, true, false);

        headers = headersView.headers.get(1);
        expect(headers.size).toBe(2);
        checkTotalIssues(headers, 6, 7);
        checkVisibleIssues(headers, 6, 7);
        checkColumnVisibilities(headers, false, false);
      });
    });
  });
});

function checkTotalIssues(headers: List<HeaderView>, ...counts: number[]) {
  const actual: number[] = headers.map(headerView => headerView.totalIssues).toArray();
  expect(actual).toEqual(counts);
}

function checkVisibleIssues(headers: List<HeaderView>, ...visible: number[]) {
  const actual: number[] = headers.map(headerView => headerView.visibleIssues).toArray();
  expect(actual).toEqual(visible);
}

function checkColumnVisibilities(headers: List<HeaderView>, ...visibilities: boolean[]) {
  const actual: boolean[] = headers.map(headerView => headerView.visible).toArray();
  expect(actual).toEqual(visibilities);
}

class HeadersViewObservableUtil {
  private _service: HeadersViewModelHandler = new HeadersViewModelHandler();
  private _headerStateSubject$: BehaviorSubject<HeaderState> = new BehaviorSubject(initialHeaderState);
  private _issueTableSubject$: BehaviorSubject<IssueTable> = new BehaviorSubject(initialIssueTable);
  private _headersView$: Observable<HeadersView>;

  private _currentUserSettingStage: UserSettingState;

  constructor(private _headerState: HeaderState, private _issueTable: IssueTable) {
    expect(_headerState.states.size).toBe(_issueTable.table.size);
    this._headersView$ = this._service.getHeaders(this._headerStateSubject$, this._issueTableSubject$);
    this.updateHeaders(_headerState);
    this.updateIssueTable(_issueTable);
  }

  updateHeaders(headerState: HeaderState): HeadersViewObservableUtil {
    this._headerState = headerState;
    this._headerStateSubject$.next(headerState);
    return this;
  }

  updateTotalIssues(...columnSizes: number[]): HeadersViewObservableUtil {
    return this.changeIssueTableAndUpdate(table => {
      table.table = table.table.withMutations(mutable => {
        expect(columnSizes.length).toBe(this._headerState.states.size);
        for (let i = 0 ; i < columnSizes.length ; i++) {
          if (columnSizes[i] !==  this._issueTable.table.get(i).size) {
            mutable.set(i, List<string>().setSize(columnSizes[i]));
          }
        }
      });
    });
  }

  updateColumnVisibilities(headerState: HeaderState, headerName: string, visible: boolean): HeadersViewObservableUtil {
    let actualHeader: Header = null;
    headerState.headers.forEach(row => {
      row.forEach(header => {
        if (header.name === headerName) {
          actualHeader = header;
          return false;
        }
      })
      if (actualHeader) {
        return false;
      }
    });
    expect(actualHeader).toBeTruthy(`Could not find header called ${headerName}`);
    return this.changeIssueTableAndUpdate(table => {
      table.visibleColumns = table.visibleColumns.withMutations(mutable => {
        actualHeader.states.forEach(state => {
          mutable.set(state, visible);
        });
      });
    });
  }

  updateVisibleIssues(...visible: number[]): HeadersViewObservableUtil {
    return this.changeIssueTableAndUpdate(table => {
      table.visibleIssueCounts = table.visibleIssueCounts.withMutations(mutable => {
        expect(visible.length).toBe(this._headerState.states.size);
        for (let i = 0 ; i < visible.length ; i++) {
          if (visible[i] !==  this._issueTable.visibleIssueCounts.get(i)) {
            mutable.set(i, visible[i]);
          }
        }
      });
    });
  }

  private changeIssueTableAndUpdate(callback: (table: IssueTable) => void): HeadersViewObservableUtil {
    const newTable: IssueTable = IssueTableUtil.toStateRecord(this._issueTable).withMutations(mutable => callback(mutable));
    return this.updateIssueTable(newTable);
  }

  updateIssueTable(issueTable: IssueTable): HeadersViewObservableUtil {
    this._issueTable = issueTable;
    this._issueTableSubject$.next(issueTable);
    return this;
  }



  headersViewObserver(): Observable<HeadersView> {
    return this._headersView$;
  }

}

