import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Map, OrderedMap} from 'immutable';
import {IssueQlNode} from '../../../../common/parsers/issue-ql/ast/node.iql';
import {CustomFieldState} from '../custom-field/custom-field.model';
import {AppState} from '../../../../app-store';
import {BoardProject, LinkedProject, ProjectState} from '../project/project.model';
import {createSelector} from '@ngrx/store';


export interface ManualSwimlaneState {
  swimlanes: OrderedMap<string, ManualSwimlane>;
}

export interface ManualSwimlane {
  name: string;
  swimlaneEntries: OrderedMap<string, ManualSwimlaneEntry>;
}

export interface ManualSwimlaneEntry {
  name: string;
  issueQl: string;
  parsedIssueQl: IssueQlNode;
}

const DEFAULT_STATE: ManualSwimlaneState = {
  swimlanes: OrderedMap<string, ManualSwimlane>()
};

const DEFAULT_MANUAL_SWIMLANE: ManualSwimlane = {
  name: null,
  swimlaneEntries: OrderedMap<string, ManualSwimlaneEntry>()
};

const DEFAULT_MANUAL_SWIMLANE_ENTRY: ManualSwimlaneEntry = {
  name: null,
  issueQl: null,
  parsedIssueQl: null
};

interface ManualSwimlaneStateRecord extends TypedRecord<ManualSwimlaneStateRecord>, ManualSwimlaneState {
}

interface ManualSwimlaneRecord extends TypedRecord<ManualSwimlaneRecord>, ManualSwimlane {

}

interface ManualSwimlaneEntryRecord extends TypedRecord<ManualSwimlaneEntryRecord>, ManualSwimlaneEntry {
}

const STATE_FACTORY = makeTypedFactory<ManualSwimlaneState, ManualSwimlaneStateRecord>(DEFAULT_STATE);
const MANUAL_SWIMLANE_FACTORY = makeTypedFactory<ManualSwimlane, ManualSwimlaneRecord>(DEFAULT_MANUAL_SWIMLANE);
const MANUAL_SWIMLANE_ENTRY_FACTORY = makeTypedFactory<ManualSwimlaneEntry, ManualSwimlaneEntryRecord>(DEFAULT_MANUAL_SWIMLANE_ENTRY);
export const initialManualSwimlaneState: ManualSwimlaneState = STATE_FACTORY(DEFAULT_STATE);

export class ManualSwimlaneUtil {
  static createSwimlane(mutable: ManualSwimlane): ManualSwimlane {
    return MANUAL_SWIMLANE_FACTORY(mutable);
  }

  static createSwimlaneEntry(mutable: ManualSwimlaneEntry): ManualSwimlaneEntry {
    return MANUAL_SWIMLANE_ENTRY_FACTORY(mutable);
  }

  static withMutations(s: ManualSwimlaneState, mutate: (mutable: ManualSwimlaneState) => any): ManualSwimlaneState {
    return (<ManualSwimlaneStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}

const getManualSwimlanes = (state: AppState): ManualSwimlaneState => state.board.manualSwimlanes;
const getSwimlanes = (state: ManualSwimlaneState): OrderedMap<string, ManualSwimlane> => state.swimlanes;
export const manualSwimlanesSelector = createSelector(getManualSwimlanes, getSwimlanes);


