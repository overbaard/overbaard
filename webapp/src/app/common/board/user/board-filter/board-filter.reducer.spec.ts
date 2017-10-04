import {Dictionary} from '../../../utils/dictionary';
import {BoardFilterState, BoardFilterUtil, initialBoardFilterState} from './board-filter.model';
import {BoardFilterActions, boardFilterReducer} from './board-filter.reducer';
import {Set} from 'immutable';

describe('BoardFilter reducer tests', () => {

  describe('Querystring tests', () => {
    it('No querystring', () => {
      const qs: Dictionary<string> = {};
      const state: BoardFilterState = boardFilterReducer(initialBoardFilterState, BoardFilterActions.createInitialiseFromQueryString(qs));
      for (const key of BoardFilterUtil.toStateRecord(state).keySeq().toArray()) {
        console.log('====> ' + key);
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
        'fix-version': 'F%201,F2'
      };
      const state: BoardFilterState = boardFilterReducer(initialBoardFilterState, BoardFilterActions.createInitialiseFromQueryString(qs));
      checkSetContents(state, 'project', ['P 1', 'P2']);
      checkSetContents(state, 'priority', ['Pr 1', 'Pr2']);
      checkSetContents(state, 'issueType', ['T 1', 'T2']);
      checkSetContents(state, 'assignee', ['A 1', 'A2']);
      checkSetContents(state, 'component', ['C 1', 'C2']);
      checkSetContents(state, 'label', ['L 1', 'L2']);
      checkSetContents(state, 'fixVersion', ['F 1', 'F2']);
    });

    function checkSetContents(state: BoardFilterState, name: string, expected: string[]) {
      const set: Set<string> = state[name];
      expect(set.size).toEqual(expected.length, 'state.field=' + name);
      for (const curr of expected) {
        expect(set.contains(curr)).toBe(true);
      }
    }
  });
});
