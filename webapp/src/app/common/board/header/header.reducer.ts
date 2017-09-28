import {List} from 'immutable';
import {Header, HeaderUtil, initialHeaderState} from './header.model';
import {Action} from '@ngrx/store';
import {Dictionary} from '../../utils/dictionary';
import {HeaderState} from './header.state';

const DESERIALIZE_PRIORITIES = 'DESERIALIZE_HEADERS';

class DeserializeHeadersAction implements Action {
  readonly type = DESERIALIZE_PRIORITIES;
  constructor(readonly payload: HeaderTableCreator) {
  }
}

export class HeaderActions {
  static createDeserializeHeaders(states: any[], headers: string[], backlog: number, done: number): Action {
    return new DeserializeHeadersAction(new HeaderTableCreator(states, headers, backlog, done));
  }
}

class HeaderTableCreator {
  // The raw input
  private _states: any[];
  private headers: string[];
  private backlog: number;
  private done: number;

  // The states contained in the backlog
  private backlogStates: number[];
  // The states contained in each header
  private headerStates: Dictionary<number[]>;


  constructor(states: any[], headers: string[], backlog: number, done: number) {
    // Only use the visible states
    this._states = states.slice(0, states.length - done);
    this.headers = headers;
    this.backlog = backlog;
    this.done = done;

    this.backlogStates = backlog && backlog > 0 ? [] : null;
    this.headerStates = this.backlogStates || headers.length > 0 ? {} : null;
    if (this.headerStates) {
      headers.forEach(v => this.headerStates[v] = [] );
    }
  }

  get states(): any[] {
    return this._states;
  }

  private hasHeaders(): boolean {
    return !!this.backlogStates || !!this.headerStates;
  }

  createHeaderTable(): List<List<Header>> {
    const stateHeaders: TempHeader[] = this.createStateHeaders();
    if (!this.hasHeaders()) {
      // Simple case - just return the states
      return List<List<Header>>().push(this.makeImmutable(stateHeaders));
    }

    return this.createCategoriesTable(stateHeaders);
  }

  private createStateHeaders(): TempHeader[] {
    const stateHeaders: TempHeader[] = new Array<TempHeader>(this._states.length);

    for (let i = 0; i < this._states.length ; i++) {
      const state: any = this._states[i];
      const header: number = state['header'];
      const rows = this.calculateRows(i, header);
      const stateHeader = new TempHeader(state['name'], i < this.backlog, rows, state['wip']);
      stateHeader.addState(i);
      stateHeaders[i] = stateHeader;

      // Add this state to the relevant headers
      if (this.backlogStates && i < this.backlog) {
        this.backlogStates.push(i);
      } else if (this.hasHeaders() && !isNaN(header)) {
        this.headerStates[this.headers[header]].push(i);
      }
    }
    return stateHeaders;
  }

  private calculateRows(index: number, header: number) {
    if (index < this.backlog) {
      return 1;
    }
    return (this.hasHeaders() && isNaN(header)) ? 2 : 1;
  }

  private createCategoriesTable(stateHeaders: TempHeader[]): List<List<Header>> {
    // Now create the headers
    const categoriesByFirstState: TempHeader[] = new Array<TempHeader>(stateHeaders.length);
    if (this.backlogStates) {
      const header: TempHeader =
        new TempHeader('Backlog', true, 1, 0);
      this.backlogStates.forEach((v) => {
        header.addState(v);
      });
      categoriesByFirstState[header.states.get(0)] = header;
      header.wip = this.calculateCategoryWip(stateHeaders, this.backlogStates);
    }
    for (const name of this.headers) {
      const states: number[] = this.headerStates[name];
      const header: TempHeader =
        new TempHeader(name, false, 1, 0);
      states.forEach((v) => {
        header.addState(v);
      });
      categoriesByFirstState[header.states.get(0)] = header;
      header.wip = this.calculateCategoryWip(stateHeaders, states);
    }

    const topRow: TempHeader[] = [];
    const bottomRow: TempHeader[] = [];
    for (let i = 0 ; i < stateHeaders.length ; i++) {
      const header = stateHeaders[i];
      if (isNaN(this._states[i]['header']) && !header.backlog) {
        topRow.push(header);
      } else {
        bottomRow.push(header);
        const category = categoriesByFirstState[i];
        if (category) {
          topRow.push(category);
        }
      }
    }

    return List<List<Header>>()
      .push(this.makeImmutable(topRow))
      .push(this.makeImmutable(bottomRow));
  }

  calculateCategoryWip(stateHeaders: TempHeader[], states: number[]): number {
    let wip = 0;
    states.forEach(s => {
      wip += stateHeaders[s].wip;
    });
    return wip;
  }


  private makeImmutable(headers: TempHeader[]): List<Header> {
    return List<Header>().withMutations(list => {
      headers.forEach(header => {
        list.push(HeaderUtil.fromObject(header));
      });
    });
  }
}

export function headerReducer(state: HeaderState = initialHeaderState, action: Action): HeaderState {
  switch (action.type) {
    case DESERIALIZE_PRIORITIES: {
      const payload: HeaderTableCreator = (<DeserializeHeadersAction>action).payload;

      const exisitingHeaders = state.headers;
      const headers: List<List<Header>> = payload.createHeaderTable();

      if (exisitingHeaders.equals(headers)) {
        return state;
      }
      const newState: HeaderState = HeaderUtil.toStateRecord(state).withMutations( mutable => {
        mutable.states = List<string>(payload.states.map(value => value['name']));
        mutable.headers = headers;
      });
      if (HeaderUtil.toStateRecord(newState).equals(HeaderUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
}

class TempHeader implements Header {
  name: string;
  abbreviated: string;
  rows: number;
  cols = 0;
  wip: number;
  backlog: boolean;
  states: List<number> = List<number>();

  constructor(name: string, backlog: boolean, rows: number, wip: number) {
    this.backlog = backlog;
    this.rows = rows;
    this.name = name;
    this.abbreviated = this.abbreviate(name);
    this.wip = isNaN(wip) ? 0 : wip;
  }

  addState(index: number) {
    this.states = this.states.push(index);
    this.cols++;
  }

  private abbreviate(str: string): string {
    let words: string[] = str.split(' ');
    if (!words) {
      words = [str];
    }
    let abbreviated = '';
    let length: number = words.length;
    if (length > 3) {
      length = 3;
    }
    for (let i = 0; i < length; i++) {
      const s = words[i].trim();
      if (s.length > 0) {
        abbreviated += s.charAt(0).toUpperCase();
      }
    }
    return abbreviated;
  }

}
