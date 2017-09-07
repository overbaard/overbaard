import {cloneObject} from '../../utils/test-util.spec';
import {BlacklistState, initialBlacklistState} from './blacklist.model';
import {BlacklistActions, blacklistReducer} from './blacklist.reducer';
import {List} from 'immutable';

export function getTestBlacklistInput() {
  return cloneObject({
    states: [
      'State1', 'State2'
    ],
    priorities: [
      'Priority1', 'Priority2'
    ],
    'issue-types': [
      'Type1', 'Type2'
    ],
    issues: [
      'BAD-1',
      'BAD-2'
    ]
  });
}
describe('Blacklist reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: BlacklistState =
      blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
    expect(state.states).toEqual(List<string>(['State1', 'State2']));
    expect(state.priorities).toEqual(List<string>(['Priority1', 'Priority2']));
    expect(state.issueTypes).toEqual(List<string>(['Type1', 'Type2']));
    expect(state.issues).toEqual(List<string>(['BAD-1', 'BAD-2']));
  });

  it('Deserialize empty blacklist', () => {
    const state: BlacklistState =
      blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(null));
    expect(state.states).toEqual(List<string>());
    expect(state.priorities).toEqual(List<string>());
    expect(state.issueTypes).toEqual(List<string>());
    expect(state.issues).toEqual(List<string>());
  });

  it ('Deserialize same state', () => {
    const stateA: BlacklistState =
      blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
    const stateB: BlacklistState =
      blacklistReducer(stateA, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
    expect(stateA).toBe(stateB);
  });
});


