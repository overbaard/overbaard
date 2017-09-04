import {Action} from '@ngrx/store';
import {
  BoardProject, initialProjectState, LinkedProject, ProjectFactory, ProjectState,
  ProjectStateModifier
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
    let boardProjects: Map<string, BoardProject> = Map<string, BoardProject>().asMutable();
    let rankedIssueKeys: Map<string, List<string>> = Map<string, List<string>>().asMutable();
    let linkedProjects: Map<string, LinkedProject> = Map<string, LinkedProject>().asMutable();

    const owner: string = input['owner'];
    const mainInput: any = input['main'];

    for (const key of Object.keys(mainInput)) {
      const projectInput: any = mainInput[key];
      boardProjects.set(key, ProjectFactory.boardProjectFromJs(key, projectInput));
      rankedIssueKeys.set(key, List<string>(projectInput['ranked']));
    }

    const linkedInput = input['linked'];
    for (const key of Object.keys(linkedInput)) {
      const projectInput: any = linkedInput[key];
      linkedProjects.set(key, ProjectFactory.linkedProjectFromJs(key, projectInput));
    }

    boardProjects = boardProjects.asImmutable();
    rankedIssueKeys = rankedIssueKeys.asImmutable();
    linkedProjects = linkedProjects.asImmutable();

    const payload: ProjectState = {
      owner: owner,
      boardProjects: boardProjects,
      rankedIssueKeys: rankedIssueKeys,
      linkedProjects: linkedProjects
    };
    return new DeserializeProjectsAction(payload);
  }
}

export function projectReducer(state: ProjectState = initialProjectState, action: Action): ProjectState {
  switch (action.type) {
    case DESERIALIZE_PROJECTS: {
      const newState: ProjectState = (<DeserializeProjectsAction>action).payload;
      // TODO check if they equal each other and return the original if that is the case
      return ProjectStateModifier.update(state, copy => {
        copy.owner = newState.owner;
        copy.boardProjects = newState.boardProjects;
        copy.rankedIssueKeys = newState.rankedIssueKeys;
        copy.linkedProjects = newState.linkedProjects;
      });
    }
  }
  return state;
}
