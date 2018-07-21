import {List, OrderedMap, Set} from 'immutable';
import {BoardProject, ParallelTask, ParallelTaskOption, ProjectUtil} from './project.model';
import {FormControl, FormGroup} from '@angular/forms';
import {FilterFormEntry} from '../../../../common/filter-form-entry';
import {Dictionary} from '../../../../common/dictionary';

/**
 * Used by the settings-drawer to get one view of parallel tasks which may come from different projects, each of which may have
 * overrides for different issue types. Also, each project and issue type override might have different options.
 */
export class ParallelTaskFlattener {
  private _names: string[] = [];
  private _displays: Dictionary<string> = {};
  private _options: Dictionary<ParallelTaskOption[]> = {};
  private _seenOptions: Dictionary<Dictionary<string>> = {};

  constructor(private _projects: OrderedMap<string, BoardProject>) {
  }

  flattenParallelTasks(): List<ParallelTask> {
    this._projects.forEach(boardProject => {
      if (boardProject.parallelTasks) {
        this.addParallelTaskGroups(boardProject.parallelTasks);
      }
      if (boardProject.parallelTaskIssueTypeOverrides) {
        boardProject.parallelTaskIssueTypeOverrides.forEach(ptOverrides => {
          this.addParallelTaskGroups(ptOverrides);
        });
      }
    });

    return List<ParallelTask>().withMutations(mutable => {
      for (const name of this._names) {
        const display: string = this._displays[name];
        const options: ParallelTaskOption[] = this._options[name];

        mutable.push(ProjectUtil.createParallelTask(name, display, options));
      }
    });
  }

  private addParallelTaskGroups(parallelTasks: List<List<ParallelTask>>) {
    if (!parallelTasks) {
      return;
    }
    parallelTasks.forEach((group: List<ParallelTask>) => {
      group.forEach(parallelTask => {
        this.addParallelTask(parallelTask);
      });
    });
  }

  private addParallelTask(parallelTask: ParallelTask) {
    const name: string = parallelTask.name;
    let options: ParallelTaskOption[] = [];
    let seenOptions = {};
    if (!this._displays[name]) {
      this._names.push(name);
      this._displays[name] = parallelTask.display;
    } else {
      options = this._options[name];
      seenOptions = this._seenOptions[name];
    }

    parallelTask.options.forEach(option => {

      // This is not perfect as it just adds unseen options onto the end of an existing PT,
      // rather than trying to find a logical order

      const optionName: string = option.name;
      if (!seenOptions[optionName]) {
        seenOptions[optionName] = true;
        options.push(option);
      }
    });

    this._options[name] = options;
    this._seenOptions[name] = seenOptions;
  }
}
