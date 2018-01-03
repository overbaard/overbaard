import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from '../header/header.state';
import {CustomFieldState} from '../custom-field/custom-field.model';

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
    const colours: string[] = this.calculateColourTable(optionsInput.length);

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

  private static calculateColourTable(length: number): string[] {
    const odd: boolean = length % 2 === 1;
    let len: number = length;
    if (!odd) {
      // Insert a fake half-way element to simplify the calculations
      len = length + 1;
    }
    const max = 255;
    const halfLength: number = Math.floor(len / 2);

    const increment: number = max / 2 / halfLength;

    const table: string[] = new Array(length);
    let insertIndex = 0;

    for (let i = 0; i < len; i++) {
      let red = 0;
      let green = 0;
      if (i === halfLength) {
        red = max;
        green = max;
        if (!odd) {
          // Skip this fake element
          continue;
        }
      } else if (i < halfLength) {
        red = max;
        green = i === 0 ? 0 : Math.round(max / 2 + increment * i);
      } else {
        // The yellow to green part of the scale is a bit too shiny, so reduce the brightness
        // while keeping the red to green ratio
        const adjustment: number = 4 / 5;
        if (i === len - 1) {
          red = 0;
          green = 220;
        } else {
          red = Math.round((max - increment * (i - halfLength)));
          green = Math.round(max * adjustment);
        }
      }

      const colourString: string = '#' + this.toHex(red) + this.toHex(green) + '00';
      table[insertIndex] = colourString;
      // console.log(insertIndex + " " + colourString + " " + red + " " + green);
      insertIndex++;
    }
    return table;
  }

  private static toHex(i: number): string {
    let s: string = i.toString(16);
    if (s.length === 1) {
      s = '0' + s;
    }
    return s;
  }
}
