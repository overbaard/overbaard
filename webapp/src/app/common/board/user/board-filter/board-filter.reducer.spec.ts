import {Dictionary} from '../../../utils/dictionary';
import {BoardFilterState, BoardFilterUtil, initialBoardFilterState} from './board-filter.model';
import {BoardFilterActions, boardFilterReducer} from './board-filter.reducer';
import {Map, Set} from 'immutable';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES, FilterAttributes, FilterAttributesUtil, FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from './board-filter.constants';

describe('BoardFilter reducer tests', () => {

  describe('Querystring tests', () => {
    it('No querystring', () => {
      const qs: Dictionary<string> = {};
      const state: BoardFilterState = boardFilterReducer(initialBoardFilterState, BoardFilterActions.createInitialiseFromQueryString(qs));
      for (const key of BoardFilterUtil.toStateRecord(state).keySeq().toArray()) {
        expect(state[key].size).toEqual(0);
      }
    });

    it ('With querystring', () => {
      const qs: Dictionary<string> = {
        project: 'P%201,P2',
        priority: 'Pr%201,Pr2',
        'issue-type': 'T%201,T2',
        assignee: 'A%201,A2',
        component: 'C%201,C2',
        label: 'L%201,L2',
        'fix-version': 'F%201,F2',
        'cf.Custom%201': 'CF%2011,CF12',
        'cf.Custom2': 'CF%2021,CF22',
        'pt.Par%201': 'PT%2011,PT12',
        'pt.Par2': 'PT%2021,PT22'
      };
      const state: BoardFilterState = boardFilterReducer(initialBoardFilterState, BoardFilterActions.createInitialiseFromQueryString(qs));
      checkSetContents(state.project, ['P 1', 'P2']);
      checkSetContents(state.priority, ['Pr 1', 'Pr2']);
      checkSetContents(state.issueType, ['T 1', 'T2']);
      checkSetContents(state.assignee, ['A 1', 'A2']);
      checkSetContents(state.component, ['C 1', 'C2']);
      checkSetContents(state.label, ['L 1', 'L2']);
      checkSetContents(state.fixVersion, ['F 1', 'F2']);
      expect(state.customField.size).toBe(2);
      checkSetContents(state.customField.get('Custom 1'), ['CF 11', 'CF12']);
      checkSetContents(state.customField.get('Custom2'), ['CF 21', 'CF22']);
      expect(state.parallelTask.size).toBe(2);
      checkSetContents(state.parallelTask.get('Par 1'), ['PT 11', 'PT12']);
      checkSetContents(state.parallelTask.get('Par2'), ['PT 21', 'PT22']);
    });

    function checkSetContents(set: Set<string>, expected: string[]) {
      expect(set.size).toEqual(expected.length, 'state.field=' + name);
      for (const curr of expected) {
        expect(set.contains(curr)).toBe(true);
      }
    }
  });

  describe('Update tests', () => {
    let state: BoardFilterState
    beforeEach(() => {
      const qs: Dictionary<string> = {
        project: 'P1',
        priority: 'Pr1',
        'issue-type': 'T1',
        assignee: 'A1',
        component: 'C1',
        label: 'L1',
        'fix-version': 'F1',
        'cf.Custom1': 'CF11',
        'cf.Custom2': 'CF21',
        'pt.Par1': 'PT11',
        'pt.Par2': 'PT21'
      };
      state = boardFilterReducer(initialBoardFilterState, BoardFilterActions.createInitialiseFromQueryString(qs));
    });

    it ('Update project', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(PROJECT_ATTRIBUTES, {P1: false, P2: true, P3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.project = ['P2', 'P3'];
      checker.check(state);
    });

    it ('Update priority', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(PRIORITY_ATTRIBUTES, {Pr1: false, Pr2: true, Pr3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.priority = ['Pr2', 'Pr3'];
      checker.check(state);
    });

    it ('Update issue type', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(ISSUE_TYPE_ATTRIBUTES, {T1: false, T2: true, T3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.issueType = ['T2', 'T3'];
      checker.check(state);
    });

    it ('Update assignee', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(ASSIGNEE_ATTRIBUTES, {A1: false, A2: true, A3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.assignee = ['A2', 'A3'];
      checker.check(state);
    });

    it ('Update component', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(COMPONENT_ATTRIBUTES, {C1: false, C2: true, C3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.component = ['C2', 'C3'];
      checker.check(state);
    });

    it ('Update label', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(LABEL_ATTRIBUTES, {L1: false, L2: true, L3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.label = ['L2', 'L3'];
      checker.check(state);
    });

    it ('Update fix version', () => {
      state = boardFilterReducer(state, BoardFilterActions.createUpdateFilter(FIX_VERSION_ATTRIBUTES, {F1: false, F2: true, F3: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.fixVersion = ['F2', 'F3'];
      checker.check(state);
    });

    it ('Update custom field', () => {
      const customFieldAttributes: FilterAttributes = FilterAttributesUtil.createCustomFieldFilterAttributes('Custom2');
      state = boardFilterReducer(
        state, BoardFilterActions.createUpdateFilter(customFieldAttributes, {CF21: false, CF22: true, CF23: true}));
      const checker: UpdateChecker = new UpdateChecker();
      checker.customField['Custom2'] = ['CF22', 'CF23'];
      checker.check(state);
    })

    it ('Update parallel tasks', () => {
      fail('NYI')
    })
  });
});

class UpdateChecker {
  project: string[] = ['P1'];
  priority: string[] = ['Pr1'];
  issueType: string[] = ['T1'];
  assignee: string[] = ['A1'];
  component: string[] = ['C1'];
  label: string[] = ['L1'];
  fixVersion: string[] = ['F1'];
  customField: Dictionary<string[]> = {Custom1: ['CF11'], Custom2: ['CF21']};
  parallelTask: Dictionary<string[]> = {Par1: ['PT11'], Par2: ['PT21']};

  check(filterState: BoardFilterState) {
    this.checkFilter(this.project, filterState.project);
    this.checkFilter(this.priority, filterState.priority);
    this.checkFilter(this.issueType, filterState.issueType);
    this.checkFilter(this.assignee, filterState.assignee);
    this.checkFilter(this.component, filterState.component);
    this.checkFilter(this.label, filterState.label);
    this.checkFilter(this.fixVersion, filterState.fixVersion);
    this.checkMapFilter(this.customField, filterState.customField);
    this.checkMapFilter(this.parallelTask, filterState.parallelTask);
  }

  checkMapFilter(expected: Dictionary<string[]>, actual: Map<string, Set<string>>) {
    expect(actual.size).toBe(Object.keys(expected).length);
    for (const key of Object.keys(expected)) {
      this.checkFilter(expected[key], actual.get(key));
    }
  }

  checkFilter(expected: string[], actual: Set<string>) {
    expect(actual.size).toBe(expected.length);
    const eSorted: string[] = expected.sort((a, b) => a.localeCompare(b));
    const aSorted: string[] = actual.toArray().sort((a, b) => a.localeCompare(b));
    expect(aSorted).toEqual(eSorted);
  }
}
