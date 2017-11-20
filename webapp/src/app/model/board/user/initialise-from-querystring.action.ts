import {Action} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {Map, Set} from 'immutable';

export const INITIALISE_SETTINGS_FROM_QUERYSTRING = 'INITIALISE_SETTINGS_FROM_QUERYSTRING';

export class InitialiseFromQueryStringAction implements Action {
  readonly type = INITIALISE_SETTINGS_FROM_QUERYSTRING;

  constructor(readonly payload: Dictionary<string>) {
  }

  parseCustomFieldFilters(): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('cf.');
  }

  parseParallelTaskFilters(): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('pt.');
  }

  private parsePrefixedMapFilters(prefix: string): Map<string, Set<string>> {
    return Map<string, Set<string>>().withMutations(mutable => {
      for (const key of Object.keys(this.payload)) {
        if (key.startsWith(prefix)) {
          const name: string = decodeURIComponent(key.substr(prefix.length));
          mutable.set(name, this.parseBooleanFilter(key));
        }
      }
    });
  }

  parseBooleanFilter(name: string): Set<string> {
    const valueString: string = this.payload[name];
    const set: Set<string> = Set<string>();
    if (valueString) {
      return set.withMutations(mutable => {
        const values: string[] = valueString.split(',');
        for (const value of values) {
          const decoded = decodeURIComponent(value);
          mutable.add(decoded);
        }
      });
    }
    return set;
  }

  getVisibleColumnDefault(): boolean {
    if (this.payload['visible']) {
      return false;
    } else if (this.payload['hidden']) {
      return true;
    } else {
      return true;
    }
  }

  parseVisibleColumns(): Map<number, boolean> {
    let visible: boolean;
    let valueString: string;
    if (this.payload['visible']) {
      valueString = this.payload['visible'];
      visible = true;
    } else if (this.payload['hidden']) {
      valueString = this.payload['hidden'];
      visible = false;
    }
    return Map<number, boolean>().withMutations(mutable => {
      if (valueString) {
        const values: string[] = valueString.split(',');
        for (const value of values) {
          mutable.set(Number(value), visible);
        }
      }
    });
  }
}
