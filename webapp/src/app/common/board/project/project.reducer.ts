import {Action} from '@ngrx/store';
import {
  BoardProject, initialProjectState, LinkedProject, ProjectUtil, ProjectState, ProjectStateRecord
} from './project.model';
import {List, Map} from 'immutable';

const DESERIALIZE_PROJECTS = 'DESERIALIZE_PROJECTS';

class DeserializeProjectsAction implements Action {
  readonly type = DESERIALIZE_PROJECTS;

  // TODO payload
  constructor(readonly payload: ProjectState) {
  }
}

export class ProjectActions {
  static createDeserializeProjects(input: any): DeserializeProjectsAction {
    const boardProjects: Map<string, BoardProject> = Map<string, BoardProject>().asMutable();
    const rankedIssueKeys: Map<string, List<string>> = Map<string, List<string>>().asMutable();
    const linkedProjects: Map<string, LinkedProject> = Map<string, LinkedProject>().asMutable();

    const owner: string = input['owner'];
    const mainInput: any = input['main'];

    for (const key of Object.keys(mainInput)) {
      const projectInput: any = mainInput[key];
      boardProjects.set(key, ProjectUtil.boardProjectFromJs(key, projectInput));
      rankedIssueKeys.set(key, List<string>(projectInput['ranked']));
    }

    const linkedInput = input['linked'];
    for (const key of Object.keys(linkedInput)) {
      const projectInput: any = linkedInput[key];
      linkedProjects.set(key, ProjectUtil.linkedProjectFromJs(key, projectInput));
    }

    const payload: ProjectState = {
      owner: owner,
      boardProjects: boardProjects.asImmutable(),
      rankedIssueKeys: rankedIssueKeys.asImmutable(),
      linkedProjects: linkedProjects.asImmutable()
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
        mutable.rankedIssueKeys = payload.rankedIssueKeys;
        mutable.linkedProjects = payload.linkedProjects;
      });
      return (<ProjectStateRecord>newState).equals(<ProjectStateRecord>state) ? state : newState;
    }
  }
  return state;
}
