import {Action} from '@ngrx/store';
import {
  BoardProject,
  initialProjectState,
  LinkedProject,
  ParallelTask,
  ProjectState,
  ProjectUtil
} from './project.model';
import {List, Map, OrderedMap} from 'immutable';
import {AppState} from '../../../app-store';
import {createSelector} from 'reselect';

const DESERIALIZE_PROJECTS = 'DESERIALIZE_PROJECTS';

class DeserializeProjectsAction implements Action {
  readonly type = DESERIALIZE_PROJECTS;

  // TODO payload
  constructor(readonly payload: ProjectState) {
  }
}

export class ProjectActions {
  static createDeserializeProjects(input: any): DeserializeProjectsAction {
    const boardProjects: OrderedMap<string, BoardProject> = OrderedMap<string, BoardProject>().asMutable();
    const linkedProjects: Map<string, LinkedProject> = Map<string, LinkedProject>().asMutable();
    const parallelTasks: Map<string, List<ParallelTask>> = Map<string, List<ParallelTask>>().asMutable();

    const owner: string = input['owner'];
    const mainInput: any = input['main'];

    for (const key of Object.keys(mainInput)) {
      const projectInput: any = mainInput[key];
      boardProjects.set(key, ProjectUtil.boardProjectFromJs(key, projectInput));
      const parallelTasksInput: any[] = projectInput['parallel-tasks'];
      if (parallelTasksInput) {
        for (let i = 0 ; i < parallelTasksInput.length ; i++) {
          const task: ParallelTask = ProjectUtil.parallelTaskFromJs(parallelTasksInput[i]);
          parallelTasksInput[i] = task;
          parallelTasks.set(key, List<ParallelTask>(parallelTasksInput));
        }
      }
    }

    const linkedInput = input['linked'];
    if (linkedInput) {
      for (const key of Object.keys(linkedInput)) {
        const projectInput: any = linkedInput[key];
        linkedProjects.set(key, ProjectUtil.linkedProjectFromJs(key, projectInput));
      }
    }


    const payload: ProjectState = {
      owner: owner,
      boardProjects: boardProjects.asImmutable(),
      linkedProjects: linkedProjects.asImmutable(),
      parallelTasks: parallelTasks.asImmutable()
    };

    return new DeserializeProjectsAction(payload);
  }
}

export function projectReducer(state: ProjectState = initialProjectState, action: Action): ProjectState {
  switch (action.type) {
    case DESERIALIZE_PROJECTS: {
      const payload: ProjectState = (<DeserializeProjectsAction>action).payload;
      const newState: ProjectState = ProjectUtil.toStateRecord(state).withMutations(mutable => {
        mutable.owner = payload.owner;
        mutable.boardProjects = payload.boardProjects;
        mutable.linkedProjects = payload.linkedProjects;
        mutable.parallelTasks = payload.parallelTasks;
      });

      return ProjectUtil.toStateRecord(newState).equals(ProjectUtil.toStateRecord(state)) ? state : newState;
    }
  }
  return state;
}

const getProjectState = (state: AppState): ProjectState => state.board.projects;
const getBoardProjects = (state: ProjectState): OrderedMap<string, BoardProject> => state.boardProjects;
export const boardProjectsSelector = createSelector(getProjectState, getBoardProjects);
