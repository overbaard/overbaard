import {FixVersionActions, fixVersionReducer} from './fix-version.reducer';
import {FixVersionState, initialFixVersionState} from './fix-version.model';
import {cloneObject} from '../../../common/object-util';

export function getTestFixVersionsInput(): any {
  return cloneObject(['F-10', 'F-20', 'F-30']);
}

export function getTestFixVersionState(): FixVersionState {
  const input: any = getTestFixVersionsInput();
  return fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(input));
}

describe('Fix Version reducer tests', () => {
  describe('Deserialize', () => {
    it('Deserialize initial state', () => {
      const state: FixVersionState = getTestFixVersionState();
      expect(state.versions.toArray()).toEqual(['F-10', 'F-20', 'F-30']);
    });

    it ('Deserialize same state', () => {
      const stateA: FixVersionState = getTestFixVersionState();
      const stateB: FixVersionState =
        fixVersionReducer(stateA, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
      expect(stateA).toBe(stateB);
    });
  });

  describe('Changes', () => {
    it ('Add components', () => {
      const state: FixVersionState = getTestFixVersionState();
      const newState: FixVersionState =
        fixVersionReducer(state, FixVersionActions.createAddFixVersions(['f-05', 'F-14', 'f-13', 'F-25']));
      expect(newState.versions.toArray()).toEqual(['f-05', 'F-10', 'f-13', 'F-14', 'F-20', 'F-25', 'F-30']);
    });

    it ('No change', () => {
      const state: FixVersionState = getTestFixVersionState();
      const newState: FixVersionState =
        fixVersionReducer(state, FixVersionActions.createAddFixVersions(null));
      expect(newState).toBe(state);
    });
  });
});


