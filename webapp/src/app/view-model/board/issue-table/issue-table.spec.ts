import {List, OrderedSet, Set} from 'immutable';
import {IssueTable} from './issue-table';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import {IssuesFactory, IssueTableObservableUtil} from './issue-table.common.spec';
import {Dictionary} from '../../../common/dictionary';
import {DeserializeIssueLookupParams} from '../../../model/board/data/issue/issue.model';


describe('Issue Table observer tests', () => {

  describe('Create tests', () => {
    describe('One project issues', () => {
      it('All states mapped, issues in all states', () => {
        new IssueTableObservableUtil(
          'ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 1)
            .addIssue('ONE-3', 2)
            .addIssue('ONE-4', 3)
            .addIssue('ONE-5', 2)
            .addIssue('ONE-6', 2),
          4)
          .setRank('ONE', 5, 1, 2, 3, 4, 6)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .emitBoardChange()
          .tableObserver().subscribe(
          issueTable => checkTable(issueTable,
            [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']],
            []));
      });
      it('All states mapped, issues in some states', () => {
        new IssueTableObservableUtil('ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 1)
            .addIssue('ONE-2', 1)
            .addIssue('ONE-3', 2)
            .addIssue('ONE-4', 3)
            .addIssue('ONE-5', 2),
          4)
          .setRank('ONE', 5, 1, 2, 3, 4)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .emitBoardChange()
          .tableObserver().subscribe(
          issueTable => checkTable(issueTable,
            [[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']],
            []));
      });

      it('Not all states mapped, issues in all states', () => {
        new IssueTableObservableUtil('ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('ONE-4', 1),
          4)
          .setRank('ONE', 4, 3, 2, 1)
          .mapState('ONE', 'S-2', '1-1')
          .mapState('ONE', 'S-4', '1-2')
          .emitBoardChange()
          .tableObserver().subscribe(
          issueTable => checkTable(issueTable,
            [[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']],
            []));
      });
    });

    describe('Two project issues', () => {
      it('All states mapped, issues in all states', () => {
        new IssueTableObservableUtil('ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 1)
            .addIssue('ONE-3', 2)
            .addIssue('ONE-4', 3)
            .addIssue('ONE-5', 2)
            .addIssue('ONE-6', 2)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1)
            .addIssue('TWO-3', 2)
            .addIssue('TWO-4', 3)
            .addIssue('TWO-5', 2)
            .addIssue('TWO-6', 2),
          4)
          .setRank('ONE', 1, 2, 3, 4, 5, 6)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .setRank('TWO', 6, 5, 4, 3, 2, 1)
          .mapState('TWO', 'S-1', '2-1')
          .mapState('TWO', 'S-2', '2-2')
          .mapState('TWO', 'S-3', '2-3')
          .mapState('TWO', 'S-4', '2-4')
          .emitBoardChange()
          .tableObserver().subscribe(
          issueTable => checkTable(issueTable,
            [
              ['ONE-1', 'TWO-1'],
              ['ONE-2', 'TWO-2'],
              ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-3'],
              ['ONE-4', 'TWO-4']],
            []));
      });

      it('Not all states mapped, issues in all states', () => {
        new IssueTableObservableUtil('ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1)
            .addIssue('TWO-3', 1)
          , 5)
          .setRank('ONE', 3, 2, 1)
          .mapState('ONE', 'S-2', '1-1')
          .mapState('ONE', 'S-3', '1-2')
          .setRank('TWO', 3, 2, 1)
          .mapState('TWO', 'S-3', '2-1')
          .mapState('TWO', 'S-4', '2-2')
          .emitBoardChange()
          .tableObserver().subscribe(
          issueTable => checkTable(issueTable,
            [
              [],
              ['ONE-2', 'ONE-1'],
              ['ONE-3', 'TWO-1'],
              ['TWO-3', 'TWO-2'],
              []],
            []));
      });
    });
  });

  describe('Update tests', () => {
    let util: IssueTableObservableUtil;
    let original: IssueTable;
    beforeEach(() => {
      util = new IssueTableObservableUtil('ONE',
        new SimpleIssueFactory()
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 1)
          .addIssue('ONE-3', 2)
          .addIssue('ONE-4', 3)
          .addIssue('ONE-5', 2)
          .addIssue('ONE-6', 2)
          .addIssue('ONE-7', 3),
        4)
        .setRank('ONE', 1, 2, 3, 4, 5, 6, 7)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('ONE', 'S-4', '1-4');
      util.emitBoardChange()
        .tableObserver()
        .take(1)
        .subscribe(
        issueTable => {
          checkTable(issueTable,
            [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']],
            [])
          original = issueTable;
        });
    });

    it( 'Update issue detail', () => {
      util
        .issueChanges({update: [{key: 'ONE-2', summary: 'Test summary'}]})
        .emitBoardChange()
        .tableObserver()
        .subscribe(
        issueTable => {
          checkTable(issueTable,
            [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']],
            []);
          expect(issueTable.table).toBe(original.table)
        });
    });

    it ('Update issue state', () => {
      util
        .issueChanges({update: [{key: 'ONE-5', state: '1-2'}]})
        .emitBoardChange()
        .tableObserver().take(1).subscribe(
          issueTable => {
            checkTable(issueTable,
              [['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']],
              []);
            checkSameColumns(original, issueTable, 0, 3);
            original = issueTable;
          });
      // Empty a state completely
      util
        .issueChanges({update: [{key: 'ONE-1', state: '1-2'}]})
        .emitBoardChange()
        .tableObserver().take(1).subscribe(
        issueTable => {
          checkTable(issueTable,
            [[], ['ONE-1', 'ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']],
            []);
          checkSameColumns(original, issueTable, 2, 3);
          original = issueTable;
        });
      // Populate an empty state again
      util
        .issueChanges({update: [{key: 'ONE-1', state: '1-1'}]})
        .emitBoardChange()
        .tableObserver().take(1).subscribe(
        issueTable => {
          checkTable(issueTable,
            [['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']],
            []);
          checkSameColumns(original, issueTable, 2, 3);
        });

    });

    it ('Delete issue', () => {
      util
        .issueChanges({delete: ['ONE-5']})
        .emitBoardChange()
        .tableObserver().take(1).subscribe(
          issueTable => {
            checkTable(issueTable,
              [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']],
              []);
            checkSameColumns(original, issueTable, 0, 1, 3);
            original = issueTable;
          });
      // Empty a state completely
      util
        .issueChanges({delete: ['ONE-1']})
        .emitBoardChange()
        .tableObserver().take(1).subscribe(
        issueTable => {
          checkTable(issueTable,
            [[], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']],
            []);
          checkSameColumns(original, issueTable, 1, 2, 3);
          original = issueTable;
        });

    });

    describe('New issue', () => {
      it ('Main project', () => {
        util
          .issueChanges({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({ONE: [{index: 7, key: 'ONE-8'}]})
          .emitBoardChange()
          .tableObserver()
          .subscribe(
            issueTable => {
              checkTable(issueTable,
                [['ONE-1', 'ONE-8'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']],
                []);
              checkSameColumns(original, issueTable, 1, 2, 3);
            });
      });
      it ('Other project', () => {
        util = new IssueTableObservableUtil('ONE',
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 1)
            .addIssue('ONE-3', 2)
            .addIssue('ONE-4', 3)
            .addIssue('ONE-5', 2)
            .addIssue('ONE-6', 2)
            .addIssue('ONE-7', 3)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1),
          4)
          .setRank('ONE', 1, 2, 3, 4, 5, 6, 7)
          .setRank('TWO', 1, 2)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .mapState('TWO', 'S-3', '2-1')
          .mapState('TWO', 'S-4', '2-2');
        util.emitBoardChange()
          .tableObserver()
          .take(1)
          .subscribe(
            issueTable => {
              checkTable(issueTable,
                [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1'], ['ONE-4', 'ONE-7', 'TWO-2']],
                [])
              original = issueTable;
            });
        util
          .issueChanges({new: [{key: 'TWO-3', state: '2-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({TWO: [{index: 2, key: 'TWO-3'}]})
          .emitBoardChange()
          .tableObserver()
          .subscribe(
            issueTable => {
              checkTable(issueTable,
                [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1', 'TWO-3'], ['ONE-4', 'ONE-7', 'TWO-2']],
                []);
              checkSameColumns(original, issueTable, 0, 1, 3);
            });
      });
    });


    it ('Rerank issue - no effect on existing states', () => {
      util
        .rankChanges({ONE: [{index: 0, key: 'ONE-3'}]})
        .emitBoardChange()
        .tableObserver()
        .subscribe(
          issueTable => {
            // Everything should be the same in the issue table
            expect(issueTable).toBe(original);
          });

    });


    it ('Rerank issue - effect on existing states', () => {
      util
        .rankChanges({ONE: [{index: 6, key: 'ONE-3'}]})
        .emitBoardChange()
        .tableObserver()
        .subscribe(
          issueTable => {
            checkTable(issueTable,
              [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']],
              []);
            checkSameColumns(original, issueTable, 0, 1, 3);
          });
    });
  });
});

describe('Issue table filter tests', () => {
  // We only test filtering on priority here - we have other tests doing in-depth testing of the filters

  it('Update filter for existing table', () => {
    const util: IssueTableObservableUtil = setupTable(false);
    util.tableObserver().take(1).subscribe(issueTable => {
      checkTable(issueTable,
        [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
        []);
    });

    util.updateUserSettings({priority: 'Blocker'});
    util.tableObserver().take(1).subscribe(issueTable => {
      checkTable(issueTable,
        [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
        ['ONE-1', 'ONE-3', 'ONE-5', 'ONE-7', 'ONE-9']);
      // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
      expect(issueTable.visibleIssueCounts.toArray()).toEqual([1, 1, 2]);
    });

    util.updateUserSettings({priority: 'Major'});
    util.tableObserver().take(1).subscribe(issueTable => {
      checkTable(issueTable,
        [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
        ['ONE-2', 'ONE-4', 'ONE-6', 'ONE-8']);
      // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
      expect(issueTable.visibleIssueCounts.toArray()).toEqual([1, 2, 2]);
    });
  });

  it('Filter exists when creating table', () => {
    const util: IssueTableObservableUtil = setupTable(true);
    util.tableObserver().subscribe(issueTable => {
      checkTable(issueTable,
        [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
        ['ONE-2', 'ONE-4', 'ONE-6', 'ONE-8']);
    });
  });

  describe('Update table when filter exists ', () => {
    describe('New Issue', () => {
      it('Matching filter', () => {
        setupTable(true)
          .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
          .emitBoardChange()
          .tableObserver().subscribe(issueTable => {
          checkTable(issueTable,
            [['ONE-1', 'ONE-2', 'ONE-10'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
            ['ONE-2', 'ONE-4', 'ONE-6', 'ONE-8']);
        });
      });
      it('Not matching filter', () => {
        setupTable(true)
          .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Blocker', type: 'task'}]})
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
          .emitBoardChange()
          .tableObserver().subscribe(issueTable => {
          checkTable(issueTable,
            [['ONE-1', 'ONE-2', 'ONE-10'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
            ['ONE-2', 'ONE-4', 'ONE-6', 'ONE-8', 'ONE-10']);
        });
      });
    });
    describe('Update Issue', () => {
      it('Matching filter', () => {
        setupTable(true)
          .issueChanges({update: [{key: 'ONE-2', priority: 'Major'}]})
          .emitBoardChange()
          .tableObserver().subscribe(issueTable => {
          checkTable(issueTable,
            [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
            ['ONE-4', 'ONE-6', 'ONE-8']);
        });
      });
      it('Not matching filter', () => {
        setupTable(true)
          .issueChanges({update: [{key: 'ONE-1', priority: 'Blocker'}]})
          .emitBoardChange()
          .tableObserver().subscribe(issueTable => {
          checkTable(issueTable,
            [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']],
            ['ONE-1', 'ONE-2', 'ONE-4', 'ONE-6', 'ONE-8']);
        });
      });
    });
  });

  function setupTable(filter: boolean): IssueTableObservableUtil {
    const params: Dictionary<string> = filter ? {priority: 'Major'} : null;
    const util: IssueTableObservableUtil = new IssueTableObservableUtil('ONE',
      new SimpleIssueFactory()
        .addIssue('ONE-1', 0)
        .addIssue('ONE-2', 0)
        .addIssue('ONE-3', 1)
        .addIssue('ONE-4', 1)
        .addIssue('ONE-5', 1)
        .addIssue('ONE-6', 2)
        .addIssue('ONE-7', 2)
        .addIssue('ONE-8', 2)
        .addIssue('ONE-9', 2),
      3, params)
      .setRank('ONE', 1, 2, 3, 4, 5, 6, 7, 8, 9)
      .mapState('ONE', 'S-1', '1-1')
      .mapState('ONE', 'S-2', '1-2')
      .mapState('ONE', 'S-3', '1-3')

    util.emitBoardChange();
    return util;
  }
});

export function checkTable(issueTable: IssueTable, expected: string[][], invisible: string[]) {
  // Check table layout
  const actualTable: string[][] = [];
  issueTable.table.forEach((v, i) => {
    actualTable.push(issueTable.table.get(i).toArray());
  });
  expect(actualTable).toEqual(expected);

  // Check the size of the issues map
  expect(issueTable.issues.size).toBe(expected.map(issues => issues.length).reduce((s, c) => s + c));

  // Check issue visibilities
  const invisibleKeys: string[] =
    issueTable.issues.filter(issue => !issue.visible).keySeq().toArray().sort((a, b) => a.localeCompare(b));
  expect(invisibleKeys).toEqual(invisible.sort((a, b) => a.localeCompare(b)));

  // Check issue counts
  const invisibleSet: Set<string> = Set<string>(invisible);
  const visibleIssueCounts: number[] = new Array<number>(expected.length);
  for (let i = 0 ; i < expected.length ; i++) {
    visibleIssueCounts[i] = expected[i].reduce((s, v, ind, arr) => {
      return invisibleSet.contains(arr[ind]) ? s : s + 1;
      }, 0);
  }
  expect(issueTable.visibleIssueCounts.toArray()).toEqual(visibleIssueCounts);
}

function checkSameColumns(oldState: IssueTable, newState: IssueTable, ...cols: number[]) {
  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldState.table.size).toBe(newState.table.size);
  for (let i = 0 ; i < oldState.table.size ; i++) {
    const oldCol: List<string> = oldState.table.get(i);
    const newCol: List<string> = newState.table.get(i);
    if (expectedEqual.contains(i)) {
      expect(oldCol).toBe(newCol, 'Column ' + i);
    } else {
      expect(oldCol).not.toBe(newCol, 'Column ' + i);
    }
  }
}

class SimpleIssueFactory implements IssuesFactory {
  _issueKeys: string[];
  _issueStates: number[];

  addIssue(key: string, state: number): SimpleIssueFactory {
    if (!this._issueKeys) {
      this._issueKeys = [];
      this._issueStates = [];
    }
    this._issueKeys.push(key);
    this._issueStates.push(state);
    return this;
  }

  clear() {
    this._issueKeys = null;
    this._issueStates = null;
  }

  createIssueStateInput(params: DeserializeIssueLookupParams): any {
    const input: any = {};
    for (let i = 0 ; i < this._issueKeys.length ; i++) {
      const id = Number(this._issueKeys[i].substr(this._issueKeys[i].indexOf('-') + 1));
      input[this._issueKeys[i]] = {
        key: this._issueKeys[i],
        type: id % 2,
        priority: id % 2,
        summary: '-',
        state: this._issueStates[i]
      };
    }
    return input;
  }
}



