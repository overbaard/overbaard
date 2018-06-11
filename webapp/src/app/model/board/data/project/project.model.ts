import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from '../header/header.state';
import {ColourTable} from '../../../../common/colour-table';
import {Dictionary} from '../../../../common/dictionary';
import {BoardIssue} from '../issue/board-issue';

export interface ProjectState {
  boardProjects: OrderedMap<string, BoardProject>;
  linkedProjects: Map<string, LinkedProject>;
  // Parallel tasks ordered by project
  parallelTasks: Map<string, List<List<ParallelTask>>>;
}

export interface BaseProject {
  key: string;
}

export interface BoardProject extends BaseProject {
  colour: string;
  canRank: boolean;
  boardStateNameToOwnStateName: Map<string, string>;
  boardStateNameToOwnStateNameIssueTypeOverrides: Map<string, Map<string, string>>;
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
  name: string;
  colour: string;
}

export interface ParallelTaskPosition {
  groupIndex: number;
  taskIndex: number;
}

const DEFAULT_STATE: ProjectState = {
  boardProjects: OrderedMap<string, BoardProject>(),
  linkedProjects: Map<string, LinkedProject>(),
  parallelTasks: Map<string, List<List<ParallelTask>>>()
};

const DEFAULT_BOARD_PROJECT: BoardProject = {
  key: null,
  colour: null,
  canRank: false,
  boardStateNameToOwnStateName: Map<string, string>(),
  boardStateNameToOwnStateNameIssueTypeOverrides: Map<string, Map<string, string>>()
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
};

const DEFAULT_PARALLEL_TASK_POSITION: ParallelTaskPosition = {
  groupIndex: -1,
  taskIndex: -1
};


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

interface ParallelTaskPositionRecord extends TypedRecord<ParallelTaskPositionRecord>, ParallelTaskPosition {
}

// This class only has short-lived use so only best-effort immutability
export class OwnToBoardStateMappings {
  private readonly _projectWide: List<number>;
  private readonly _overriddenByIssueType: Map<string, List<number>>;

  constructor(projectWide: List<number>, overriddenByIssueType: Map<string, List<number>>) {
    this._projectWide = projectWide;
    this._overriddenByIssueType = overriddenByIssueType;
  }

  static create(headerState: HeaderState, project: BoardProject): OwnToBoardStateMappings {
    const projectWide: List<number> = OwnToBoardStateMappings.createMap(headerState, project.boardStateNameToOwnStateName);
    const issueTypeOverrides: Map<string, Map<string, string>> = project.boardStateNameToOwnStateNameIssueTypeOverrides;
    const overriddenByIssueType: Map<string, List<number>> = Map<string, List<number>>().withMutations(overrides => {
      issueTypeOverrides.forEach((map, issueType) => {
        overrides.set(issueType, OwnToBoardStateMappings.createMap(headerState, map));
      });
    });

    return new OwnToBoardStateMappings(List<number>(projectWide), overriddenByIssueType);
  }

  private static createMap(headerState: HeaderState, stateMap: Map<string, string>): List<number> {
    return List<number>().withMutations(result => {
      headerState.states.forEach((name, index) => {
        const ownState: string = stateMap.get(name);
        if (ownState) {
          result.push(index);
        }
      });
    });
  }

  getBoardIndex(issue: BoardIssue): number {
    let list: List<number> = this._overriddenByIssueType.get(issue.type.name);
    if (!list) {
      list = this._projectWide;
    }
    return list.get(issue.ownState);
  }
}


const STATE_FACTORY = makeTypedFactory<ProjectState, ProjectStateRecord>(DEFAULT_STATE);
const BOARD_PROJECT_FACTORY = makeTypedFactory<BoardProject, BoardProjectRecord>(DEFAULT_BOARD_PROJECT);
const LINKED_PROJECT_FACTORY = makeTypedFactory<LinkedProject, LinkedProjectRecord>(DEFAULT_LINKED_PROJECT);
const PARALLEL_TASK_FACTORY = makeTypedFactory<ParallelTask, ParallelTaskRecord>(DEFAULT_PARALLEL_TASK);
const PARALLEL_TASK_OPTION_FACTORY = makeTypedFactory<ParallelTaskOption, ParallelTaskOptionRecord>(DEFAULT_PARALLEL_TASK_OPTION);
const PARALLEL_TASK_POSITION_FACTORY = makeTypedFactory<ParallelTaskPosition, ParallelTaskPositionRecord>(DEFAULT_PARALLEL_TASK_POSITION);

export const initialProjectState: ProjectState = STATE_FACTORY(DEFAULT_STATE);

export class ProjectUtil {
  static boardProjectFromJs(input: any): BoardProject {
    const boardStateNameToOwnStateName: Map<string, string> = Map<string, string>(input['state-links']);

    const boardStateNameToOwnStateNameIssueTypeOverrides: Map<string, Map<string, string>> = Map<string, Map<string, string>>()
      .withMutations(mutable => {
        const overrides: any = input['overrides'];
        if (overrides) {
          const stateLinksOverrides: any = overrides['state-links'];
          if (stateLinksOverrides) {
            for (const stateLinksOverride of <any[]>stateLinksOverrides) {
              const overrideMap: Map<string, string> = Map<string, string>(stateLinksOverride['override']);
              for (const issueType of <string>stateLinksOverride['issue-types']) {
                mutable.set(issueType, overrideMap);
              }
            }
          }
        }
      });

    const projectInput: BoardProject = {
      key: input['code'],
      colour: input['colour'],
      canRank: input['rank'] ? input['rank'] : false,
      boardStateNameToOwnStateName: boardStateNameToOwnStateName,
      boardStateNameToOwnStateNameIssueTypeOverrides: boardStateNameToOwnStateNameIssueTypeOverrides
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


  static createParallelTaskPosition(groupIndex: number, taskIndex: number): ParallelTaskPosition {
    return PARALLEL_TASK_POSITION_FACTORY({groupIndex: groupIndex, taskIndex: taskIndex});
  }
}
