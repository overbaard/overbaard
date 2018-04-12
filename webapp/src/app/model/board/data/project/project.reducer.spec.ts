import {ProjectActions, projectMetaReducer} from './project.reducer';
import {List} from 'immutable';
import {BoardProject, initialProjectState, LinkedProject, ParallelTask, ProjectState} from './project.model';
import {cloneObject} from '../../../../common/object-util';

export function getTestProjectsInput(): any {
  return cloneObject(
    {
      owner: 'P1',
      main: [
        {
          code: 'P1',
          colour: '#FF0000',
          rank: true,
          'state-links': {
            Board1: 'Test1',
            Board3: 'Test3'
          },
          ranked: [
            'P1-1',
            'P1-3',
            'P1-2'
          ],
        },
        {
          code: 'P2',
          colour: '#00FF00',
          'state-links': {
            'Board1': 'Test1',
            'Board2': 'Test2'
          },
          ranked: [
            'P2-3',
            'P2-2',
            'P2-1'
          ],
          'parallel-tasks' : [
            {
              name : 'X Parallel Task',
              display : 'X',
              options : [
                'One',
                'Two',
                'Three',
                'Four']
            },
            {
              name : 'Y Parallel Task',
              display : 'Y',
              options : [
                'Uno',
                'Dos',
                'Tres']
            }]
        }
      ],
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
    }
  );
}

describe('Projects reducer tests', () => {

  describe('Deserialization tests', () => {
    it('Deserialize', () => {
      const projectState: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(getTestProjectsInput()));

      // Board projects
      expect(projectState.boardProjects.size).toBe(2);
      const p1: BoardProject = projectState.boardProjects.get('P1');
      expect(p1.key).toEqual('P1');
      expect(p1.colour).toEqual('#FF0000');
      expect(p1.canRank).toBe(true);
      expect(p1.boardStateNameToOwnStateName.toObject()).toEqual({
        Board1: 'Test1',
        Board3: 'Test3'
      });

      const p2: BoardProject = projectState.boardProjects.get('P2');
      expect(p2.key).toEqual('P2');
      expect(p2.colour).toEqual('#00FF00');
      expect(p2.canRank).toBe(false);
      expect(p2.boardStateNameToOwnStateName.toObject()).toEqual({
        Board1: 'Test1',
        Board2: 'Test2'
      });

      // Linked projects
      expect(projectState.linkedProjects.size).toBe(3);
      const l1: LinkedProject = projectState.linkedProjects.get('L1');
      expect(l1.key).toEqual('L1');
      expect(l1.states.toArray()).toEqual(['L1-1', 'L1-2', 'L1-3', 'L1-4']);

      const l2: LinkedProject = projectState.linkedProjects.get('L2');
      expect(l2.key).toEqual('L2');
      expect(l2.states.toArray()).toEqual(['L2-1', 'L2-2']);

      const l3: LinkedProject = projectState.linkedProjects.get('L3');
      expect(l3.key).toEqual('L3');
      expect(l3.states.toArray()).toEqual(['L3-1']);

      // Parallel tasks
      expect(projectState.parallelTasks.get('P1')).not.toEqual(jasmine.anything());
      const parallelTasks: List<ParallelTask> = projectState.parallelTasks.get('P2');
      expect(parallelTasks.size).toBe(2);

    });

    it('Deserialize same', () => {
      const projectStateA: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(getTestProjectsInput()));
      const projectStateB: ProjectState = projectMetaReducer(
        projectStateA, ProjectActions.createDeserializeProjects((getTestProjectsInput())));
      expect(projectStateB).toBe(projectStateA);
    });
  });

});
