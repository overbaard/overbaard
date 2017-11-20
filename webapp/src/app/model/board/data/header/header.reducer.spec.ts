import {HeaderActions, headerMetaReducer} from './header.reducer';
import {initialHeaderState} from './header.model';
import {HeaderState} from './header.state';

describe('Header reducer tests', () => {

  it('Simple header', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2'},
      {name: 'S3'}
    ];

    const headerState: HeaderState = headerMetaReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, [], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
    expect(headerState.backlog).toEqual(0);
    expect(headerState.categories.toArray()).toEqual([]);
    expect(headerState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
    expect(headerState.wip.toArray()).toEqual([0, 0, 0]);
  });

  it('Full header', () => {
    const states = [
      {name: 'B1'},
      {name: 'B2'},
      {name: 'S1', header: 0, wip: 3},
      {name: 'S2', header: 0, wip: 4},
      {name: 'S3', header: 1},
      {name: 'S4', header: 1},
      {name: 'S5'}
    ];

    const headerState: HeaderState = headerMetaReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));
    expect(headerState.states.toArray()).toEqual(['B1', 'B2', 'S1', 'S2', 'S3', 'S4']);
    expect(headerState.backlog).toEqual(2);
    expect(headerState.categories.toArray()).toEqual(['H1', 'H2']);
    expect(headerState.stateToCategoryMappings.toArray()).toEqual([0, 0, 1, 1]);
    expect(headerState.wip.toArray()).toEqual([3, 4, 0, 0]);
  });


  it('Same for same data', () => {
    const states = [
      {name: 'B1'},
      {name: 'B2'},
      {name: 'S1', header: 0, wip: 3},
      {name: 'S2', header: 0, wip: 4},
      {name: 'S3', header: 1},
      {name: 'S4', header: 1},
      {name: 'S5'}
    ];

    const headerState: HeaderState = headerMetaReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));

    const headerStateB: HeaderState = headerMetaReducer(
      headerState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));

    expect(headerStateB).toBe(headerState);
  });
});
