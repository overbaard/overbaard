import {cloneObject} from '../../../../common/object-util';
import {BoardProject, initialProjectState, ParallelTask, ParallelTaskOption, ProjectState, ProjectUtil} from './project.model';
import {List, OrderedMap} from 'immutable';
import {ProjectInputBuilder} from './project.reducer.spec';
import {ProjectActions, projectMetaReducer} from './project.reducer';
import {ParallelTaskFlattener} from './parallel-task.flattener';



describe('Parallel Task Flattener Tests', () => {

  let builder: ProjectsInputBuilder;
  beforeEach(() => {
    builder = new ProjectsInputBuilder();
    builder.addProject('ONE');
  });

  it ('No PTs', () => {
    const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
    new FlattenedTasksChecker().check(flattenedTasks);
  });

  describe('Project only PTs', () => {
    it ('One project', () => {
      builder.getProject('ONE')
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
      const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
      new FlattenedTasksChecker()
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
        .check(flattenedTasks);
    });

    describe('Two projects', () => {
      it ('Different PTs', () => {
        builder.getProject('ONE')
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three');
        builder.addProject('TWO')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
        const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
        new FlattenedTasksChecker()
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
          .check(flattenedTasks);
      });

      it ('Overlapping PTs', () => {
        builder.getProject('ONE')
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
        builder.addProject('TWO')
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'Dos', 'Tre', 'Cuatro');
        const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
        new FlattenedTasksChecker()
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre', 'Dos', 'Cuatro')
          .check(flattenedTasks);
      });
    });
  });

  describe('With overrides', () => {
    it ('Different PTs', () => {
      builder.getProject('ONE')
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addIssueTypeOverride('task')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
      const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
      new FlattenedTasksChecker()
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
        .check(flattenedTasks);
    });

    it ('Overlapping PTs', () => {
      builder.getProject('ONE')
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
        .addIssueTypeOverride('task')
          .addParallelTask('B', 'PT B', 'En', 'Dos', 'Tre', 'Cuatro');
      const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
      new FlattenedTasksChecker()
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre', 'Dos', 'Cuatro')
        .check(flattenedTasks);
    });
  });

  describe('Overrides Only', () => {
    it ('Different PTs', () => {
      builder.getProject('ONE')
        .addIssueTypeOverride('task')
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
      const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
      new FlattenedTasksChecker()
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
        .check(flattenedTasks);

    });

    it ('Overlapping PTs', () => {
      builder.getProject('ONE')
        .addIssueTypeOverride('task')
          .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
          .addParallelTask('B', 'PT B', 'En', 'To', 'Tre');
      builder.getProject('ONE')
        .addIssueTypeOverride('bug')
          .addParallelTask('B', 'PT B', 'En', 'Dos', 'Tre', 'Cuatro');
      const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
      new FlattenedTasksChecker()
        .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
        .addParallelTask('B', 'PT B', 'En', 'To', 'Tre', 'Dos', 'Cuatro')
        .check(flattenedTasks);
    });
  });

  it ('Null overrides', () => {
    builder.getProject('ONE')
      .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
      .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
      .addIssueTypeOverride('task');
    const flattenedTasks: List<ParallelTask> = flattenTasks(builder);
    new FlattenedTasksChecker()
      .addParallelTask('A', 'PT A', 'One', 'Two', 'Three')
      .addParallelTask('B', 'PT B', 'En', 'To', 'Tre')
      .check(flattenedTasks);
  });
});

function flattenTasks(builder: ProjectsInputBuilder): List<ParallelTask> {
  return new ParallelTaskFlattener(builder.build()).flattenParallelTasks();
}

class FlattenedTasksChecker {
  private _names: string[] = [];
  private _displays: string[] = [];
  private _options: string[][] = [];

  addParallelTask(name: string, display: string, ...options: string[]): FlattenedTasksChecker {
    this._names.push(name);
    this._displays.push(display);
    this._options.push(options);
    return this;
  }

  check(flattenedTasks: List<ParallelTask>) {
    expect(flattenedTasks.size).toBe(this._names.length);

    for (let i = 0 ; i < this._names.length ; i++) {
      const pt: ParallelTask = flattenedTasks.get(i);
      expect(pt.name).toEqual(this._names[i]);
      expect(pt.display).toEqual(this._displays[i]);

      const ptOptions: List<ParallelTaskOption> = pt.options;
      expect(ptOptions.size).toEqual(this._options[i].length);
      for (let j = 0 ; j < ptOptions.size ; j++) {
        expect(ptOptions.get(j).name).toBe(this._options[i][j]);
      }
    }
  }
}

class ProjectsInputBuilder {

  private _projectKeys: string[] = [];
  private _projects: ProjectBuilder[] = [];

  addProject(key: string): ProjectBuilder {
    const projectBuilder: ProjectBuilder = new ProjectBuilder(key);
    this._projectKeys.push(key);
    this._projects.push(projectBuilder);
    return projectBuilder;
  }

  getProject(key: string): ProjectBuilder {
    const index: number = this._projectKeys.indexOf(key);
    return this._projects[index];
  }

  build(): OrderedMap<string, BoardProject> {
    const main: any[] = [];
    for (const projectBuilder of this._projects) {
      main.push(projectBuilder.build());
    }

    const projects: any = {
      main: main
    };

    const projectState: ProjectState =
      projectMetaReducer(initialProjectState, ProjectActions.createDeserializeProjects(projects));
    return projectState.boardProjects;
  }

}

class ProjectBuilder {
  constructor(private _key: string) {
  }

  _parallelTasks: ParallelTaskBuilder[] = [];
  _parallelTaskOverrides: IssueTypePTOverrideBuilder[] = [];

  addParallelTask(name: string, display: string, ...options: string[]): ProjectBuilder {
    this._parallelTasks.push(new ParallelTaskBuilder(name, display, ...options));
    return this;
  }

  addIssueTypeOverride(issueType: string): IssueTypePTOverrideBuilder {
    const overrideBuilder: IssueTypePTOverrideBuilder = new IssueTypePTOverrideBuilder(issueType);
    this._parallelTaskOverrides.push(overrideBuilder);
    return overrideBuilder;
  }

  build(): any {
    const project: any = {
      code: this._key,
      colour: '#FF0000',
      rank: true,
      'state-links': {
      },
      ranked: []
    };

    if (this._parallelTasks.length > 0) {
      const parallelTasks: any[] = [];
      for (const pt of this._parallelTasks) {
        // Create a new group for each of the PTs, we're testing the grouping elsewhere
        parallelTasks.push([pt.build()]);
      }
      project['parallel-tasks'] = parallelTasks;
    }
    if (this._parallelTaskOverrides.length > 0) {
      const overrides: any[] = [];
      for (let i = 0 ; i < this._parallelTaskOverrides.length ; i++) {
        overrides.push(this._parallelTaskOverrides[i].build());
      }

      const ptOverrides: any = {
        'parallel-tasks': overrides
      };

      project['overrides'] = ptOverrides;
    }

    return project;
  }
}

class IssueTypePTOverrideBuilder {
  _parallelTasks: ParallelTaskBuilder[] = [];

  constructor(private _type: string) {
  }

  addParallelTask(name: string, display: string, ...options: string[]): IssueTypePTOverrideBuilder {
    this._parallelTasks.push(new ParallelTaskBuilder(name, display, ...options));
    return this;
  }

  build(): any {
    const parallelTasks: any[] = this._parallelTasks.length > 0 ? [] : null;
    for (const pt of this._parallelTasks) {
      // Create a new group for each of the PTs, we're testing the grouping elsewhere
      parallelTasks.push([pt.build()]);
    }
    const override: any = {
      type: this._type,
      override: parallelTasks
    };

    return override;
  }
}

class ParallelTaskBuilder {
  private _options: string[];

  constructor(private _name: string, private _display: string, ...options: string[]) {
    this._options = options;
  }

  build(): any {
    return {
      name: this._name,
      display: this._display,
      options: this._options
    };
  }
}
