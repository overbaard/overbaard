import {HeaderActions, headerReducer} from './header.reducer';
import {Header, initialHeaderState} from './header.model';
import {List} from 'immutable';
import {HeaderState} from './header.state';

describe('Header reducer tests', () => {

  it('No backlog; No categories; No wip', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2'},
      {name: 'S3'}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, [], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
    const headers: List<List<Header>> = headerState.headers;
    expect(headers.size).toBe(1);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(3);

    new HeaderChecker('S1').states(0).check(topRow.get(0));
    new HeaderChecker('S2').states(1).check(topRow.get(1));
    new HeaderChecker('S3').states(2).check(topRow.get(2));
  });

  it('No backlog; Categories, no non-categorised states; Wip', () => {
    const states = [
      {name: 'S1', header: 0, wip: 3},
      {name: 'S2', header: 0, wip: 4},
      {name: 'S3', header: 1},
      {name: 'S4', header: 1}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(2);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(4);

    new HeaderChecker('H1').wip(7).cols(2).states(0, 1).check(topRow.get(0));
    new HeaderChecker('H2').cols(2).states(2, 3).check(topRow.get(1));

    new HeaderChecker('S1').wip(3).states(0).check(bottomRow.get(0));
    new HeaderChecker('S2').wip(4).states(1).check(bottomRow.get(1));
    new HeaderChecker('S3').states(2).check(bottomRow.get(2));
    new HeaderChecker('S4').states(3).check(bottomRow.get(3));

  });

  it('No backlog; Categories, non-categorised states at start; No wip', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2', header: 0},
      {name: 'S3', header: 1},
      {name: 'S4', header: 1}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(3);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(3);

    new HeaderChecker('S1').rows(2).states(0).check(topRow.get(0));
    new HeaderChecker('H1').states(1).check(topRow.get(1));
    new HeaderChecker('H2').cols(2).states(2, 3).check(topRow.get(2));

    new HeaderChecker('S2').states(1).check(bottomRow.get(0));
    new HeaderChecker('S3').states(2).check(bottomRow.get(1));
    new HeaderChecker('S4').states(3).check(bottomRow.get(2));
  });


  it('No backlog; Categories, non-categorised states at end; No wip', () => {
    const states = [
      {name: 'S1', header: 0, wip: 2},
      {name: 'S2', header: 0, wip: 3},
      {name: 'S3', header: 1, wip: 4},
      {name: 'S4', wip: 6}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(3);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(3);

    new HeaderChecker('H1').wip(5).cols(2).states(0, 1).check(topRow.get(0));
    new HeaderChecker('H2').wip(4).states(2).check(topRow.get(1));
    new HeaderChecker('S4').wip(6).rows(2).states(3).check(topRow.get(2));

    new HeaderChecker('S1').wip(2).states(0).check(bottomRow.get(0));
    new HeaderChecker('S2').wip(3).states(1).check(bottomRow.get(1));
    new HeaderChecker('S3').wip(4).states(2).check(bottomRow.get(2));
  });


  it('No backlog; Categories, non-categorised states in middle; No wip', () => {
    const states = [
      {name: 'S1', header: 0},
      {name: 'S2', header: 0},
      {name: 'S3'},
      {name: 'S4', header: 1}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(3);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(3);

    new HeaderChecker('H1').cols(2).states(0, 1).check(topRow.get(0));
    new HeaderChecker('S3').rows(2).states(2).check(topRow.get(1));
    new HeaderChecker('H2').states(3).check(topRow.get(2));

    new HeaderChecker('S1').states(0).check(bottomRow.get(0));
    new HeaderChecker('S2').states(1).check(bottomRow.get(1));
    new HeaderChecker('S4').states(3).check(bottomRow.get(2));
  });

  it('Backlog; No categories; No wip', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2'},
      {name: 'S3'},
      {name: 'S4'}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, [], 2, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(3);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(2);

    new HeaderChecker('Backlog').backlog().cols(2).states(0, 1).check(topRow.get(0));
    new HeaderChecker('S3').rows(2).states(2).check(topRow.get(1));
    new HeaderChecker('S4').rows(2).states(3).check(topRow.get(2));

    new HeaderChecker('S1').backlog().states(0).check(bottomRow.get(0));
    new HeaderChecker('S2').backlog().states(1).check(bottomRow.get(1));
  });

  it('Backlog; Categories; No wip', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2', header: 0},
      {name: 'S3'},
      {name: 'S4', header: 1},
      {name: 'S5', header: 1}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 1, 0));
    expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(4);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(4);

    new HeaderChecker('Backlog').backlog().states(0).check(topRow.get(0));
    new HeaderChecker('H1').states(1).check(topRow.get(1));
    new HeaderChecker('S3').rows(2).states(2).check(topRow.get(2));
    new HeaderChecker('H2').cols(2).states(3, 4).check(topRow.get(3));

    new HeaderChecker('S1').backlog().states(0).check(bottomRow.get(0));
    new HeaderChecker('S2').states(1).check(bottomRow.get(1));
    new HeaderChecker('S4').states(3).check(bottomRow.get(2));
    new HeaderChecker('S5').states(4).check(bottomRow.get(3));
  });

  it('Same for same data', () => {
    const states = [
      {name: 'S1'},
      {name: 'S2', header: 0, wip: 10},
      {name: 'S3'},
      {name: 'S4', header: 1, wip: 3},
      {name: 'S5', header: 1, wip: 2}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 1, 0));

    const headerStateB: HeaderState = headerReducer(
      headerState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 1, 0));

    expect(headerStateB).toBe(headerState);
  });

  it ('Deserialize same state', () => {
    const states = [
      {name: 'S1', header: 0, wip: 3},
      {name: 'S2', header: 0, wip: 4},
      {name: 'S3', header: 1},
      {name: 'S4', header: 1}
    ];

    const stateA: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    const stateB: HeaderState = headerReducer(
      stateA,
      HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 0, 0));
    expect(stateB).toBe(stateA);
  });

  it('Check abbreviations', () => {
    const states = [
      {name: 'Backlog', header: 0, wip: 3},
      {name: 'Analysis', header: 0, wip: 4},
      {name: 'Dev in Progress', header: 1},
      {name: 'More work is needed', header: 1}
    ];

    const headerState: HeaderState = headerReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(states, ['Short Header', 'A much longer header'], 0, 0));
    expect(headerState.states.toArray()).toEqual(['Backlog', 'Analysis', 'Dev in Progress', 'More work is needed']);
    const headers: List<List<Header>> = headerState.headers;

    expect(headers.size).toBe(2);

    const topRow: List<Header> = headers.get(0);
    expect(topRow.size).toBe(2);

    const bottomRow: List<Header> = headers.get(1);
    expect(bottomRow.size).toBe(4);

    new HeaderChecker('Short Header', 'SH').wip(7).cols(2).states(0, 1).check(topRow.get(0));
    new HeaderChecker('A much longer header', 'AML').cols(2).states(2, 3).check(topRow.get(1));

    new HeaderChecker('Backlog', 'B').wip(3).states(0).check(bottomRow.get(0));
    new HeaderChecker('Analysis', 'A').wip(4).states(1).check(bottomRow.get(1));
    new HeaderChecker('Dev in Progress', 'DIP').states(2).check(bottomRow.get(2));
    new HeaderChecker('More work is needed', 'MWI').states(3).check(bottomRow.get(3));

  });
});

class HeaderChecker {
  _name: string;
  _abbreviated: string;
  _rows = 1;
  _cols = 1;
  _wip = 0;
  _backlog = false;
  _states: List<number> = List<number>();

  constructor(name: string, abbreviated?: string) {
    this._name = name;
    this._abbreviated = abbreviated;
  }

  rows(rows: number): HeaderChecker {
    this._rows = rows;
    return this;
  }

  cols(cols: number): HeaderChecker {
    this._cols = cols;
    return this;
  }

  wip(wip: number): HeaderChecker {
    this._wip = wip;
    return this;
  }

  backlog(): HeaderChecker {
    this._backlog = true;
    return this;
  }

  states(...states: number[]): HeaderChecker {
    this._states = this._states.withMutations(list => {
      states.forEach(v => list.push(v));
    });
    return this;
  }

  check(header: Header) {
    expect(header.name).toEqual(this._name);
    expect(header.rows).toEqual(this._rows);
    expect(header.cols).toEqual(this._cols);
    expect(header.wip).toEqual(this._wip);
    expect(header.backlog).toEqual(this._backlog);
    expect(header.states).toEqual(this._states);
    if (this._abbreviated) {
      expect(header.abbreviated).toEqual(this._abbreviated);
    }
  }

}
