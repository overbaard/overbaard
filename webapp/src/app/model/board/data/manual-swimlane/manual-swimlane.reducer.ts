import {Action} from '@ngrx/store';
import {OrderedMap} from 'immutable';
import {
  initialManualSwimlaneState,
  ManualSwimlane,
  ManualSwimlaneEntry,
  ManualSwimlaneState,
  ManualSwimlaneUtil
} from './manual-swimlane.model';
import {IssueQlUtil} from '../../../../common/parsers/issue-ql/issue-ql.util';
import * as issueQlParser from '../../../../common/parsers/issue-ql/pegjs/issue-ql.generated';


const DESERIALIZE_MANUAL_SWIMLANES = 'DESERIALIZE_MANUAL_SWIMLANES';

class DeserializeManualSwimlanesAction implements Action {
  readonly type = DESERIALIZE_MANUAL_SWIMLANES;

  constructor(readonly payload: OrderedMap<string, ManualSwimlane>) {
  }
}

export class ManualSwimlanesActions {
  static createDeserializeManualSwimlanes(input: any): Action {
    let map: OrderedMap<string, ManualSwimlane> = OrderedMap<string, ManualSwimlane>();
    if (input) {
      map = map.withMutations(mutable => {
        for (const slInput of input) {
          try {
            const swimlane: ManualSwimlane = ManualSwimlanesActions.parseSwimlane(slInput);
            mutable.set(swimlane.name, swimlane);
          } catch (e) {
            // The idea here is that if something goes wrong in parsing the Issue QL for a ManualSwimlaneEntry that that ManualSwimlane does
            // not show up. Other manual swimlanes should be unaffected
            if (!(e instanceof issueQlParser.SyntaxError)) {
              throw e;
            }
          }
        }
      });
    }
    return new DeserializeManualSwimlanesAction(map);
  }

  static parseSwimlane(input: any): ManualSwimlane {
    let entries: OrderedMap<string, ManualSwimlaneEntry> = OrderedMap<string, ManualSwimlaneEntry>();
    entries = entries.withMutations(mutable => {
      for (const entryInput of input['entries']) {
        const entry: ManualSwimlaneEntry = ManualSwimlanesActions.parseSwimlaneEntry(entryInput);
        mutable.set(entry.name, entry);
      }
    });
    return ManualSwimlaneUtil.createSwimlane({
      name: input['name'],
      swimlaneEntries: entries
    });
  }

  static parseSwimlaneEntry(input: any): ManualSwimlaneEntry {
    const issueQl = input['issue-ql'];
    let parsedIssueQl;
    try {
      parsedIssueQl = IssueQlUtil.createIssueQlNode(issueQl);
    } catch (e) {
      console.error(`Could not parse issue-ql: ${issueQl}`);
      throw e;
    }
    return ManualSwimlaneUtil.createSwimlaneEntry({
      name: input['name'],
      issueQl: issueQl,
      parsedIssueQl: parsedIssueQl
    });
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function manualSwimlaneReducer(state: ManualSwimlaneState = initialManualSwimlaneState, action: Action): ManualSwimlaneState {

  switch (action.type) {
    case DESERIALIZE_MANUAL_SWIMLANES: {
      const payload: OrderedMap<string, ManualSwimlane> = (<DeserializeManualSwimlanesAction>action).payload;
      const newState = ManualSwimlaneUtil.withMutations(state, mutable => {
        if (!checkEqualsState(mutable.swimlanes, payload)) {
          mutable.swimlanes = payload;
        }
      });
      return newState;
    }
    default:
      return state;
  }
}

function checkEqualsState(a: OrderedMap<string, ManualSwimlane>, b: OrderedMap<string, ManualSwimlane>): boolean {
  if (!a.keySeq().equals(b.keySeq())) {
    return false;
  }
  let equals = true;
  a.forEach((mslA, key) => {
    const mslB = b.get(key);
    if (!checkEqualsSwimlane(mslA, mslB)) {
      equals = false;
      return false;
    }
  });
  return equals;
}

function checkEqualsSwimlane(a: ManualSwimlane, b: ManualSwimlane) {
  if (!a.swimlaneEntries.keySeq().equals(b.swimlaneEntries.keySeq())) {
    return false;
  }
  let equals = true;

  a.swimlaneEntries.forEach((msleA, key) => {
    const msleB = b.swimlaneEntries.get(key);
    if (!checkEqualsSwimlaneEntry(msleA, msleB)) {
      equals = false;
      return false;
    }
  });
  return equals;
}

function checkEqualsSwimlaneEntry(msleA: ManualSwimlaneEntry, msleB: ManualSwimlaneEntry) {
  return msleA.name === msleB.name && msleA.issueQl === msleB.issueQl;
}

