import {cloneObject} from '../../utils/test-util.spec';
import {BlacklistState, initialBlacklistState} from './blacklist.model';
import {BlacklistActions, blacklistReducer} from './blacklist.reducer';

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
  describe('Deserialize', () => {
    it('Deserialize initial state', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      expect(state.states.toArray()).toEqual(['State1', 'State2']);
      expect(state.priorities.toArray()).toEqual(['Priority1', 'Priority2']);
      expect(state.issueTypes.toArray()).toEqual(['Type1', 'Type2']);
      expect(state.issues.toArray()).toEqual(['BAD-1', 'BAD-2']);
    });

    it('Deserialize empty blacklist', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(null));
      expect(state.states.toArray()).toEqual([]);
      expect(state.priorities.toArray()).toEqual([]);
      expect(state.issueTypes.toArray()).toEqual([]);
      expect(state.issues.toArray()).toEqual([]);
    });

    it ('Deserialize same state', () => {
      const stateA: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const stateB: BlacklistState =
        blacklistReducer(stateA, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      expect(stateA).toBe(stateB);
    });
  });

  describe('Changes', () => {

    it ('Add states', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          states: ['aState', 'zState']}));
      expect(newState.states.toArray()).toEqual(['aState', 'State1', 'State2', 'zState']);
      expect(newState.priorities.toArray()).toEqual(['Priority1', 'Priority2']);
      expect(newState.issueTypes.toArray()).toEqual(['Type1', 'Type2']);
      expect(newState.issues.toArray()).toEqual(['BAD-1', 'BAD-2']);
    });

    it ('Add priorities', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          priorities: ['aPriority', 'zPriority']}));
      expect(newState.states.toArray()).toEqual(['State1', 'State2']);
      expect(newState.priorities.toArray()).toEqual(['aPriority', 'Priority1', 'Priority2', 'zPriority']);
      expect(newState.issueTypes.toArray()).toEqual(['Type1', 'Type2']);
      expect(newState.issues.toArray()).toEqual(['BAD-1', 'BAD-2']);
    });

    it ('Add issueTypes', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          'issue-types': ['aType', 'zType']}));
      expect(newState.states.toArray()).toEqual(['State1', 'State2']);
      expect(newState.priorities.toArray()).toEqual(['Priority1', 'Priority2']);
      expect(newState.issueTypes.toArray()).toEqual(['aType', 'Type1', 'Type2', 'zType']);
      expect(newState.issues.toArray()).toEqual(['BAD-1', 'BAD-2']);
    });

    it ('Add issues', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          issues: ['aIssue', 'zIssue']}));
      expect(newState.states.toArray()).toEqual(['State1', 'State2']);
      expect(newState.priorities.toArray()).toEqual(['Priority1', 'Priority2']);
      expect(newState.issueTypes.toArray()).toEqual(['Type1', 'Type2']);
      expect(newState.issues.toArray()).toEqual(['aIssue', 'BAD-1', 'BAD-2', 'zIssue']);
    });


    it ('Remove issues', () => {
      // Issues removed from the blacklist should be removed from the issue table if they exist (although this happens in another reducer)
      // This can happen if the change set includes adding the issue to the black list, and then the issue is deleted

      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          'removed-issues': ['BAD-1']}));
      expect(newState.states.toArray()).toEqual(['State1', 'State2']);
      expect(newState.priorities.toArray()).toEqual(['Priority1', 'Priority2']);
      expect(newState.issueTypes.toArray()).toEqual(['Type1', 'Type2']);
      expect(newState.issues.toArray()).toEqual(['BAD-2']);
    });

    it ('Combine changes', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState =
        blacklistReducer(state, BlacklistActions.createChangeBlacklist({
          states: ['aState', 'zState'],
          priorities: ['aPriority', 'zPriority'],
          'issue-types': ['aType', 'zType'],
          issues: ['aIssue', 'zIssue'],
          'removed-issues': ['BAD-1', 'BAD-2']
        }));
      expect(newState.states.toArray()).toEqual(['aState', 'State1', 'State2', 'zState']);
      expect(newState.priorities.toArray()).toEqual(['aPriority', 'Priority1', 'Priority2', 'zPriority']);
      expect(newState.issueTypes.toArray()).toEqual(['aType', 'Type1', 'Type2', 'zType']);
      expect(newState.issues.toArray()).toEqual(['aIssue', 'zIssue']);
    });

    it ('No change', () => {
      const state: BlacklistState =
        blacklistReducer(initialBlacklistState, BlacklistActions.createDeserializeBlacklist(getTestBlacklistInput()));
      const newState: BlacklistState = blacklistReducer(state, BlacklistActions.createChangeBlacklist(null));
      expect(newState).toBe(state);
    });

  });
});


