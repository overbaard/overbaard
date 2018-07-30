import {ProjectActions, projectMetaReducer} from './project.reducer';
import {List} from 'immutable';
import {BoardProject, EMPTY_PARALLEL_TASK_OVERRIDE, initialProjectState, LinkedProject, ParallelTask, ProjectState} from './project.model';
import {cloneObject} from '../../../../common/object-util';

export function getTestProjectsInput(): any {
  return new ProjectInputBuilder().linkedProjects().projectParallelTasks().build();
}

export class ProjectInputBuilder {
  private _projectParallelTasks: boolean;
  private _stateLinkOverrides: boolean;
  private _parallelTaskOverrides: boolean;
  private _emptyParallelTaskOverrides: boolean;
  private _linkedProjects: boolean;
  private _linkedProjectOverrides: boolean;

  projectParallelTasks(): ProjectInputBuilder {
    this._projectParallelTasks = true;
    return this;
  }

  stateLinkOverrides(): ProjectInputBuilder {
    this._stateLinkOverrides = true;
    return this;
  }

  parallelTaskOverrides(): ProjectInputBuilder {
    this._parallelTaskOverrides = true;
    return this;
  }

  linkedProjects(): ProjectInputBuilder {
    this._linkedProjects = true;
    return this;
  }

  linkedProjectOverrides(): ProjectInputBuilder {
    if (!this._linkedProjects) {
      throw new Error('linkedProjects is not true');
    }
    this._linkedProjectOverrides = true;
    return this;
  }

  emptyParallelTaskOverrides() {
    this._emptyParallelTaskOverrides = true;
    return this;
  }


  build(): any {

    let projectParallelTasks: any;
    if (this._projectParallelTasks) {
      projectParallelTasks = [
        [
          {
            name : 'X Parallel Task',
            display : 'X',
            options : ['One', 'Two', 'Three', 'Four']
          },
          {
            name : 'Y Parallel Task',
            display : 'Y',
            options : ['Uno', 'Dos', 'Tres']
          }
        ],
        [
          {
            name : 'Z Parallel Task',
            display : 'Z',
            options : ['Ein', 'Zwei', 'Drei', 'Vier']
          }
        ]
      ];
    }

    let overridesP1: any;
    let overridesP2: any;
    if (this._stateLinkOverrides || this._parallelTaskOverrides || this._emptyParallelTaskOverrides) {
      if (this._parallelTaskOverrides && this._emptyParallelTaskOverrides) {
        throw new Error('Can\'t set both to use parallel task overrides, and empty ones');
      }
      let stateLinkOverridesP1: any;
      let stateLinkOverridesP2: any;
      if (this._stateLinkOverrides) {
        stateLinkOverridesP1 = [
          {
            'issue-types': ['bug', 'task'],
            override: {
              'Board2': 'Test3',
              'Board3': 'Test4',
              'Board4': 'Test5'
            }
          }
        ];
        stateLinkOverridesP2 = [
          {
            'issue-types': ['bug'],
            override: {
              'Board1': 'Test1',
              'Board2': 'Test2',
              'Board3': 'Test3'
            }
          },
          {
            'issue-types': ['task'],
            override: {
              'Board1': 'Test1',
              'Board2': 'Test2',
              'Board3': 'Test3'
            }
          }
        ];
      }

      let parallelTaskOverridesP2: any;
      if (this._parallelTaskOverrides) {
        const overridePTs = [
          [
            {
              name : 'Z Parallel Task',
              display : 'Z',
              options : ['Ein', 'Zwei', 'Drei', 'Vier']
            }
          ],
          [
            {
              name : 'Y Parallel Task',
              display : 'Y',
              options : ['Uno', 'Dos', 'Tres']
            },
            {
              name : 'X Parallel Task',
              display : 'X',
              options : ['One', 'Two', 'Three', 'Four']
            }
          ]
        ];
        parallelTaskOverridesP2 = [
          {
            type: 'task',
            override: cloneObject(overridePTs)
          },
          {
            type: 'bug',
            override: cloneObject(overridePTs)
          }
        ];
      } else if (this._emptyParallelTaskOverrides) {
        parallelTaskOverridesP2 = [
          {
            type: 'task',
            override: null
          },
          {
            type: 'bug',
            override: null
          }
        ];
      }


      if (stateLinkOverridesP1) {
        overridesP1 = {};
        overridesP1['state-links'] = stateLinkOverridesP1;
      }

      overridesP2 = {};
      if (stateLinkOverridesP2) {
        overridesP2['state-links'] = stateLinkOverridesP2;
      }
      if (parallelTaskOverridesP2) {
        overridesP2['parallel-tasks'] = parallelTaskOverridesP2;
      }
    }

    const projectInput = cloneObject({
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
          ]
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
          ]
        }
      ]
    });

    if (overridesP1) {
      projectInput['main'][0]['overrides'] = overridesP1;
    }
    if (overridesP2) {
      projectInput['main'][1]['overrides'] = overridesP2;
    }
    if (projectParallelTasks) {
      projectInput['main'][1]['parallel-tasks'] = projectParallelTasks;
    }
    if (this._linkedProjects) {
      projectInput['linked'] = {
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
            'L3-1',
            'L3-2',
            'L3-3'
          ]
        }
      };
      if (this._linkedProjectOverrides) {
        projectInput['linked']['L3']['type-states'] = {
          task: ['L3-1t', 'L3-2t']
        };
      }
    }

    return projectInput;
  }

}

describe('Projects reducer tests', () => {

  describe('Deserialization tests', () => {
    it('Deserialize - No overrides', () => {
      deserializeTest(false);
    });

    it('Deserialize - Overrides', () => {
      deserializeTest(true);
    });

    it ('Deserialize - PT overrides but no project ones', () => {
      const projectState: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(
          new ProjectInputBuilder()
            .parallelTaskOverrides()
            .build()
        ));


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

      // P1 does not have any parallel tasks or parallel task overrides
      expect(p1.parallelTasks).toBeFalsy();
      expect(p1.parallelTaskIssueTypeOverrides.size).toBe(0);

      expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
      const p2: BoardProject = projectState.boardProjects.get('P2');
      expect(p2.key).toEqual('P2');
      expect(p2.colour).toEqual('#00FF00');
      expect(p2.canRank).toBe(false);
      expect(p2.boardStateNameToOwnStateName.toObject()).toEqual({
        Board1: 'Test1',
        Board2: 'Test2'
      });

      expect(p2.parallelTasks).toBeFalsy();
      expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
      expect(p2.parallelTaskIssueTypeOverrides.size).toBe(2);
      const p2Bug: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('bug');
      checkParallelTaskOverrides(p2Bug);
      const p2Task: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('task');
      checkParallelTaskOverrides(p2Task);

      // Linked projects
      expect(projectState.linkedProjects.size).toBe(0);
    });

    it ('Deserialize - Empty PT overrides', () => {
      const projectState: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(
          new ProjectInputBuilder()
            .projectParallelTasks()
            .emptyParallelTaskOverrides()
            .build()
        ));


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

      // P1 does not have any parallel tasks or parallel task overrides
      expect(p1.parallelTasks).toBeFalsy();
      expect(p1.parallelTaskIssueTypeOverrides.size).toBe(0);

      expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
      const p2: BoardProject = projectState.boardProjects.get('P2');
      expect(p2.key).toEqual('P2');
      expect(p2.colour).toEqual('#00FF00');
      expect(p2.canRank).toBe(false);
      expect(p2.boardStateNameToOwnStateName.toObject()).toEqual({
        Board1: 'Test1',
        Board2: 'Test2'
      });

      expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
      expect(p2.parallelTaskIssueTypeOverrides.size).toBe(2);
      const p2Bug: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('bug');
      expect(p2Bug).toBe(EMPTY_PARALLEL_TASK_OVERRIDE);
      const p2Task: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('task');
      expect(p2Task).toBe(EMPTY_PARALLEL_TASK_OVERRIDE);

      // Linked projects
      expect(projectState.linkedProjects.size).toBe(0);

      // Parallel tasks
      expect(projectState.boardProjects.get('P1').parallelTasks).not.toEqual(jasmine.anything());
      const parallelTasks: List<List<ParallelTask>> = projectState.boardProjects.get('P2').parallelTasks;
      expect(parallelTasks.size).toBe(2);
      expect(parallelTasks.get(0).size).toBe(2);
      checkParallelTask(parallelTasks.getIn([0, 0]), 'X Parallel Task', 'X', ['One', 'Two', 'Three', 'Four']);
      checkParallelTask(parallelTasks.getIn([0, 1]), 'Y Parallel Task', 'Y', ['Uno', 'Dos', 'Tres']);
      expect(parallelTasks.get(1).size).toBe(1);
      checkParallelTask(parallelTasks.getIn([1, 0]), 'Z Parallel Task', 'Z', ['Ein', 'Zwei', 'Drei', 'Vier']);
    });



    function deserializeTest(overrides: boolean) {
      const input: any = overrides ?
        new ProjectInputBuilder()
          .linkedProjects()
          .linkedProjectOverrides()
          .projectParallelTasks()
          .stateLinkOverrides()
          .parallelTaskOverrides()
          .build() :
        getTestProjectsInput();
      const projectState: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(input));

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

      // P1 does not have any parallel tasks or parallel task overrides
      expect(p1.parallelTasks).toBeFalsy();
      expect(p1.parallelTaskIssueTypeOverrides.size).toBe(0);

      if (!overrides) {
        expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
      } else {
        expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(2);
        expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.get('bug').toObject()).toEqual({
          'Board2': 'Test3',
          'Board3': 'Test4',
          'Board4': 'Test5'
        });
        expect(p1.boardStateNameToOwnStateNameIssueTypeOverrides.get('task').toObject()).toEqual({
          'Board2': 'Test3',
          'Board3': 'Test4',
          'Board4': 'Test5'
        });
      }

      const p2: BoardProject = projectState.boardProjects.get('P2');
      expect(p2.key).toEqual('P2');
      expect(p2.colour).toEqual('#00FF00');
      expect(p2.canRank).toBe(false);
      expect(p2.boardStateNameToOwnStateName.toObject()).toEqual({
        Board1: 'Test1',
        Board2: 'Test2'
      });

      if (!overrides) {
        expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(0);
        expect(p2.parallelTaskIssueTypeOverrides.size).toBe(0);
      } else {
        expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.size).toBe(2);
        expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.get('bug').toObject()).toEqual({
          'Board1': 'Test1',
          'Board2': 'Test2',
          'Board3': 'Test3'
        });
        expect(p2.boardStateNameToOwnStateNameIssueTypeOverrides.get('task').toObject()).toEqual({
          'Board1': 'Test1',
          'Board2': 'Test2',
          'Board3': 'Test3'
        });

        expect(p2.parallelTaskIssueTypeOverrides.size).toBe(2);
        const p2Bug: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('bug');
        checkParallelTaskOverrides(p2Bug);
        const p2Task: List<List<ParallelTask>> = p2.parallelTaskIssueTypeOverrides.get('task');
        checkParallelTaskOverrides(p2Task);
      }

      // Linked projects
      expect(projectState.linkedProjects.size).toBe(3);
      const l1: LinkedProject = projectState.linkedProjects.get('L1');
      expect(l1.key).toEqual('L1');
      expect(l1.states.toArray()).toEqual(['L1-1', 'L1-2', 'L1-3', 'L1-4']);
      expect(l1.typeStates.size).toBe(0);

      const l2: LinkedProject = projectState.linkedProjects.get('L2');
      expect(l2.key).toEqual('L2');
      expect(l2.states.toArray()).toEqual(['L2-1', 'L2-2']);
      expect(l2.typeStates.size).toBe(0);

      const l3: LinkedProject = projectState.linkedProjects.get('L3');
      expect(l3.key).toEqual('L3');
      expect(l3.states.toArray()).toEqual(['L3-1', 'L3-2', 'L3-3']);
      if (!overrides) {
        expect(l3.typeStates.size).toBe(0);
      } else {
        expect(l3.typeStates.size).toBe(1);
        const taskStates: List<string> = l3.typeStates.get('task');
        expect(taskStates.toArray()).toEqual(['L3-1t', 'L3-2t']);
      }

      // Parallel tasks
      expect(projectState.boardProjects.get('P1').parallelTasks).not.toEqual(jasmine.anything());
      const parallelTasks: List<List<ParallelTask>> = projectState.boardProjects.get('P2').parallelTasks;
      expect(parallelTasks.size).toBe(2);
      expect(parallelTasks.get(0).size).toBe(2);
      checkParallelTask(parallelTasks.getIn([0, 0]), 'X Parallel Task', 'X', ['One', 'Two', 'Three', 'Four']);
      checkParallelTask(parallelTasks.getIn([0, 1]), 'Y Parallel Task', 'Y', ['Uno', 'Dos', 'Tres']);
      expect(parallelTasks.get(1).size).toBe(1);
      checkParallelTask(parallelTasks.getIn([1, 0]), 'Z Parallel Task', 'Z', ['Ein', 'Zwei', 'Drei', 'Vier']);
    }

    function checkParallelTaskOverrides(pts: List<List<ParallelTask>>) {
      expect(pts.size).toBe(2);
      expect(pts.get(0).size).toBe(1);
      checkParallelTask(pts.getIn([0, 0]), 'Z Parallel Task', 'Z', ['Ein', 'Zwei', 'Drei', 'Vier']);
      expect(pts.get(1).size).toBe(2);
      checkParallelTask(pts.getIn([1, 0]), 'Y Parallel Task', 'Y', ['Uno', 'Dos', 'Tres']);
      checkParallelTask(pts.getIn([1, 1]), 'X Parallel Task', 'X', ['One', 'Two', 'Three', 'Four']);
    }

    function checkParallelTask(pt: ParallelTask, name: string, display: string, options: string[]) {
      expect(pt.name).toEqual(name);
      expect(pt.display).toEqual(display);
      expect(pt.options.map(o => o.name).toArray()).toEqual(options);
    }

    it('Deserialize same', () => {
      const projectStateA: ProjectState = projectMetaReducer(
        initialProjectState, ProjectActions.createDeserializeProjects(getTestProjectsInput()));
      const projectStateB: ProjectState = projectMetaReducer(
        projectStateA, ProjectActions.createDeserializeProjects((getTestProjectsInput())));
      expect(projectStateB).toBe(projectStateA);
    });
  });

});
