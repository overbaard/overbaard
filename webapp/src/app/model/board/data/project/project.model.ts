import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from '../header/header.state';
import {CustomFieldState} from '../custom-field/custom-field.model';
import {ColourTable} from '../../../../common/colour-table';

export interface ProjectState {
  owner: string;
  boardProjects: OrderedMap<string, BoardProject>;
  linkedProjects: Map<string, LinkedProject>;
  // Parallel tasks ordered by project
  parallelTasks: Map<string, List<ParallelTask>>;
}

export interface BaseProject {
  key: string;
}

export interface BoardProject extends BaseProject {
  colour: string;
  canRank: boolean;
  boardStateNameToOwnStateName: Map<string, string>;
}

export interface LinkedProject extends BaseProject {
  states: List<string>;
}

export interface ParallelTask {
  name: string;
  display: string;
  options: List<ParallelTaskOption>;
}

export interface ParallelTaskOption {
  name: string,
  colour: string
}

const DEFAULT_STATE: ProjectState = {
  owner: null,
  boardProjects: OrderedMap<string, BoardProject>(),
  linkedProjects: Map<string, LinkedProject>(),
  parallelTasks: Map<string, List<ParallelTask>>()
};

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

const DEFAULT_PARALLEL_TASK: ParallelTask = {
  name: null,
  display: null,
  options: null
};

const DEFAULT_PARALLEL_TASK_OPTION: ParallelTaskOption = {
  name: null,
  colour: null
}


interface ProjectStateRecord extends TypedRecord<ProjectStateRecord>, ProjectState {
}

interface BoardProjectRecord extends TypedRecord<BoardProjectRecord>, BoardProject {
}

interface LinkedProjectRecord extends TypedRecord<LinkedProjectRecord>, LinkedProject {
}

interface ParallelTaskRecord extends TypedRecord<ParallelTaskRecord>, ParallelTask {
}

interface ParallelTaskOptionRecord extends TypedRecord<ParallelTaskOptionRecord>, ParallelTaskOption {
}

const STATE_FACTORY = makeTypedFactory<ProjectState, ProjectStateRecord>(DEFAULT_STATE);
const BOARD_PROJECT_FACTORY = makeTypedFactory<BoardProject, BoardProjectRecord>(DEFAULT_BOARD_PROJECT);
const LINKED_PROJECT_FACTORY = makeTypedFactory<LinkedProject, LinkedProjectRecord>(DEFAULT_LINKED_PROJECT);
const PARALLEL_TASK_FACTORY = makeTypedFactory<ParallelTask, ParallelTaskRecord>(DEFAULT_PARALLEL_TASK);
const PARALLEL_TASK_OPTION_FACTORY = makeTypedFactory<ParallelTaskOption, ParallelTaskOptionRecord>(DEFAULT_PARALLEL_TASK_OPTION);

export const initialProjectState: ProjectState = STATE_FACTORY(DEFAULT_STATE);

export class ProjectUtil {
  static boardProjectFromJs(key: string, input: any): BoardProject {
    const boardStateNameToOwnStateName: Map<string, string> = Map<string, string>(input['state-links']);
    const projectInput: BoardProject = {
      key: key,
      colour: input['colour'],
      canRank: input['rank'] ? input['rank'] : false,
      boardStateNameToOwnStateName: boardStateNameToOwnStateName
    };
    return BOARD_PROJECT_FACTORY(projectInput);
  }

  static linkedProjectFromJs(key: string, input: any): LinkedProject {
    const projectInput: LinkedProject = {
      key: key,
      states: List<string>(input['states'])
    };
    return LINKED_PROJECT_FACTORY(projectInput);
  }

  static parallelTaskFromJs(input: any): ParallelTask {
    const optionsInput: string[] = input['options'];
    const colours: string[] = ColourTable.INSTANCE.getColourTable(optionsInput.length);

    const options: List<ParallelTaskOption> = List<ParallelTaskOption>().withMutations(mutable => {
      for (let i = 0 ; i < optionsInput.length ; i++) {
        mutable.push(PARALLEL_TASK_OPTION_FACTORY({name: optionsInput[i], colour: colours[i]}));
      }
    });

    return PARALLEL_TASK_FACTORY({
      name: input['name'],
      display: input['display'],
      options: options
    });
  }

  static withMutations(s: ProjectState, mutate: (mutable: ProjectState) => any): ProjectState {
    return (<ProjectStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }

  // TOOD store this as a field in the project? It would mean more stuff to compare if doing the plain equals of the state in the reducer
  static getOwnIndexToBoardIndex(headerState: HeaderState, project: BoardProject): number[] {
    const ownToBoard: number[] = new Array<number>(headerState.states.size);
    let currentOwn = 0;
    headerState.states.forEach((name, index) => {
      const ownState: string = project.boardStateNameToOwnStateName.get(name);
      if (ownState) {
        ownToBoard[currentOwn++] = index;
      }
    });

    return ownToBoard;
  }
}
