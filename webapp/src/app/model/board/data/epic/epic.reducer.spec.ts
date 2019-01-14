import {Epic, EpicState, initialEpicState} from './epic.model';
import {EpicActions, epicMetaReducer} from './epic.reducer';
import {cloneObject} from '../../../../common/object-util';
import {Map, OrderedMap} from 'immutable';

export function getTestEpicsInput(): any {
  return cloneObject( {
      'P1': [
        {key: 'P1-900', name: 'P1 First Epic'}
      ],
      'P2': [
        {key: 'P2-900', name: 'P2 First Epic'},
        {key: 'P2-901', name: 'P2 Second Epic'}
      ]
    });
}

export function getTestEpicState(): EpicState {
  const input = getTestEpicsInput();
  return epicMetaReducer(initialEpicState, EpicActions.createDeserializeAll(input));
}

describe ('Epic reducer tests', () => {
  it ('Empty payload', () => {
    const epicState: EpicState = epicMetaReducer(initialEpicState, EpicActions.createDeserializeAll({}));
    expect(epicState).toBe(initialEpicState);
  });
  it ('Deserialize', () => {
    const epicState: EpicState = getTestEpicState();
    expect(epicState).not.toBe(initialEpicState);
    const epicsByProject: Map<string, OrderedMap<string, Epic>> = epicState.epicsByProject;
    expect(epicsByProject.size).toBe(2);
    expect(epicsByProject.keySeq().toArray()).toEqual(['P1', 'P2']);

    const epics1: OrderedMap<string, Epic> = epicsByProject.get('P1');
    expect(epics1.size).toBe(1);
    checkEpic(epics1, 'P1-900', 'P1 First Epic');

    const epics2: OrderedMap<string, Epic> = epicsByProject.get('P2');
    expect(epics2.size).toBe(2);
    checkEpic(epics2, 'P2-900', 'P2 First Epic');
    checkEpic(epics2, 'P2-901', 'P2 Second Epic');
  });

  function checkEpic(epics: OrderedMap<string, Epic>, key: string, name: string) {
    const epic: Epic = epics.get(key);
    expect(epic.key).toBe(key);
    expect(epic.name).toBe(name);
  }
});
