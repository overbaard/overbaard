import {ProjectActions, projectReducer} from './project.reducer';
import {List, Map} from 'immutable';
import {initialProjectState, LinkedProject, ProjectState} from './project.model';

describe('Projects reducer tests', () => {

  it('Deserialize', () => {
    const projectsInput = {
      owner: 'P1',
      main: {
        P1: {
          colour: '#FF0000',
          rank: true,
          'state-links': {
            Board1: 'Test1',
            Board3: 'Test3'
          },
          'ranked': [
            'P1-1',
            'P1-3',
            'P1-2'
          ]
        },
        P2: {
          colour: '#00FF00',
          'state-links': {
            'Board1': 'Test1',
            'Board2': 'Test2'
          },
          'ranked': [
            'P2-3',
            'P2-2',
            'P2-1'
          ]
        }
      },
      linked: {
        L1: {
          states: [
            'L1-1',
            'L1-2',
            'L1-3',
            'L1-4'
          ]
        },
        L2: {
          states: [
            'L2-1',
            'L2-2'
          ]
        },
        L3: {
          states: [
            'L3-1'
          ]
        }
      }
    };

    const projectState: ProjectState = projectReducer(initialProjectState, ProjectActions.createDeserializeProjects(projectsInput));
    expect(projectState.owner).toBe('P1');

    // Board projects
    expect(projectState.boardProjects.size).toBe(2);
    const p1 = projectState.boardProjects.get('P1');
    expect(p1.key).toEqual('P1');
    expect(p1.colour).toEqual('#FF0000');
    expect(p1.canRank).toBe(true);
    expect(p1.boardStateNameToOwnStateName).toEqual(Map<string, string>({
      Board1: 'Test1',
      Board3: 'Test3'
    }));

    const p2 = projectState.boardProjects.get('P2');
    expect(p2.key).toEqual('P2');
    expect(p2.colour).toEqual('#00FF00');
    expect(p2.canRank).toBe(false);
    expect(p2.boardStateNameToOwnStateName).toEqual(Map<string, string>({
      Board1: 'Test1',
      Board2: 'Test2'
    }));

    // Ranked keys
    expect(projectState.rankedIssueKeys.size).toBe(2);
    const p1Ranked = projectState.rankedIssueKeys.get('P1');
    expect(p1Ranked).toEqual(List<string>(['P1-1', 'P1-3', 'P1-2']));
    const p2Ranked = projectState.rankedIssueKeys.get('P2');
    expect(p2Ranked).toEqual(List<string>(['P2-3', 'P2-2', 'P2-1']));

    // Linked projects
    expect(projectState.linkedProjects.size).toBe(3);
    const l1: LinkedProject = projectState.linkedProjects.get('L1');
    expect(l1.key).toEqual('L1');
    expect(l1.states).toEqual(List<string>(['L1-1', 'L1-2', 'L1-3', 'L1-4']));

    const l2: LinkedProject = projectState.linkedProjects.get('L2');
    expect(l2.key).toEqual('L2');
    expect(l2.states).toEqual(List<string>(['L2-1', 'L2-2']));

    const l3: LinkedProject = projectState.linkedProjects.get('L3');
    expect(l3.key).toEqual('L3');
    expect(l3.states).toEqual(List<string>(['L3-1']));
  });
});
