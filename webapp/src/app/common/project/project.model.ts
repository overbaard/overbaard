import {List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface BaseProject {
  key: string;
}

export interface BoardProjectRecord extends TypedRecord<BoardProjectRecord>, BoardProject {
}

export interface BoardProject extends BaseProject {
  colour: string;
  canRank: boolean;
  boardStateNameToOwnStateName: Map<string, string>;
}

export interface LinkedProjectRecord extends TypedRecord<LinkedProjectRecord>, LinkedProject {
}


export interface LinkedProject extends BaseProject {
  states: List<string>;
}


const DEFAULT_BOARD_PROJECT: BoardProject = {
  key: null,
  colour: null,
  canRank: false,
  boardStateNameToOwnStateName: Map<string, string>()
};

const DEFAULT_LINKED_PROJECT: LinkedProject = {
  key: null,
  states: List<string>()
};

const BOARD_PROJECT_TYPED_FACTORY = makeTypedFactory<BoardProject, BoardProjectRecord>(DEFAULT_BOARD_PROJECT);
const LINKED_PROJECT_TYPED_FACTORY = makeTypedFactory<LinkedProject, LinkedProjectRecord>(DEFAULT_LINKED_PROJECT);

export class ProjectFactory {
  static boardProjectFromJs(key: string, input: any): BoardProject {
    const boardStateNameToOwnStateName: Map<string, string> = Map<string, string>(input['state-links']);
    const projectInput: BoardProject = {
      key: key,
      colour: input['colour'],
      canRank: input['rank'] ? input['rank'] : false,
      boardStateNameToOwnStateName: boardStateNameToOwnStateName
    };
    return BOARD_PROJECT_TYPED_FACTORY(projectInput);
  }

  static linkedProjectFromJs(key: string, input: any) {
    const projectInput: LinkedProject = {
      key: key,
      states: List<string>(input['states'])
    }
    return LINKED_PROJECT_TYPED_FACTORY(projectInput);
  }
}
