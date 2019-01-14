import {Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {DeserializeEpicsPayload} from './epic.reducer';
import {AppState} from '../../../../app-store';
import {createSelector} from '@ngrx/store';
import {ManualSwimlane, ManualSwimlaneState} from '../manual-swimlane/manual-swimlane.model';

export interface EpicState {
  epicsByProject: Map<string, OrderedMap<string, Epic>>;
}

export interface Epic {
  key: string;
  name: string;
}


const DEFAULT_STATE: EpicState = {
  epicsByProject: Map<string, OrderedMap<string, Epic>>()
};

const DEFAULT_EPIC: Epic = {
  key: '',
  name: ''
};

interface EpicStateRecord extends TypedRecord<EpicStateRecord>, EpicState {
}

interface EpicRecord extends TypedRecord<EpicRecord>, Epic {
}

const STATE_FACTORY = makeTypedFactory<EpicState, EpicStateRecord>(DEFAULT_STATE);
const EPIC_FACTORY = makeTypedFactory<Epic, EpicRecord>(DEFAULT_EPIC);
export const initialEpicState: EpicStateRecord = STATE_FACTORY(DEFAULT_STATE);


export class EpicUtil {
  static stateFromJs(input: DeserializeEpicsPayload): EpicStateRecord {
    if (input) {
      const keys: string[] = Object.keys(input);
      if (keys.length > 0) {
        const epicsByProject: Map<string, OrderedMap<string, Epic>> =
          Map<string, OrderedMap<string, Epic>>().withMutations(mutable => {
            for (const projectCode of keys) {
              mutable.set(projectCode, EpicUtil.loadEpicsForProject(input[projectCode]));
            }
          });
        return STATE_FACTORY({epicsByProject: epicsByProject});
      }
    }
    return initialEpicState;
  }

  private static loadEpicsForProject(input: Epic[]): OrderedMap<string, Epic> {
    const epics: OrderedMap<string, Epic> =
      OrderedMap<string, Epic>().withMutations(mutable => {
        for (const epicInput of input) {
          const epic: Epic = this.epicFromJs(epicInput);
          mutable.set(epic.key, epic);
        }
      });
    return epics;
  }

  static epicFromJs(input: any): EpicRecord {
    return EPIC_FACTORY(input);
  }
}

const getEpicsState = (state: AppState): EpicState => state.board.epics;
const getEpicsByProject = (state: EpicState): Map<string, OrderedMap<string, Epic>> => state.epicsByProject;
export const epicsByProjectSelector = createSelector(getEpicsState, getEpicsByProject);
