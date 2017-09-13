import {FixVersionActions, fixVersionReducer} from './fix-version.reducer';
import {FixVersionState, initialFixVersionState} from './fix-version.model';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestFixVersionsInput(): any {
  return cloneObject(['F-10', 'F-20', 'F-30']);
}

describe('Fix Version reducer tests', () => {
  describe('Deserialize', () => {
    it('Deserialize initial state', () => {
      const state: FixVersionState =
        fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      expect(state.versions.toArray()).toEqual(['F-10', 'F-20', 'F-30']);
    });

    it ('Deserialize same state', () => {
      const stateA: FixVersionState =
        fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      const stateB: FixVersionState =
        fixVersionReducer(stateA, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      expect(stateA).toBe(stateB);
    });
  });

  describe('Changes', () => {
    it ('Add components', () => {
      const state: FixVersionState =
        fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      const newState: FixVersionState =
        fixVersionReducer(state, FixVersionActions.createAddFixVersions(['f-05', 'F-14', 'f-13', 'F-25']));
      expect(newState.versions.toArray()).toEqual(['f-05', 'F-10', 'f-13', 'F-14', 'F-20', 'F-25', 'F-30']);
    });

    it ('No change', () => {
      const state: FixVersionState =
        fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      const newState: FixVersionState =
        fixVersionReducer(state, FixVersionActions.createAddFixVersions(null));
      expect(newState).toBe(state);
    });
  });
});


