import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AppState} from '../../../app-store';
import {Store} from '@ngrx/store';
import {Dictionary} from '../../../model/utils/dictionary';
import {FormControl, FormGroup} from '@angular/forms';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import {Observable} from 'rxjs/Observable';
import {boardProjectsSelector, parallelTasksSelector} from '../../../model/board/project/project.reducer';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {List, OrderedMap, Set} from 'immutable';
import {issuesTypesSelector} from '../../../model/board/issue-type/issue-type.reducer';
import {prioritiesSelector} from '../../../model/board/priority/priority.reducer';
import {assigneesSelector} from '../../../model/board/assignee/assignee.reducer';
import {componentsSelector} from '../../../model/board/component/component.reducer';
import {labelsSelector} from '../../../model/board/label/label.reducer';
import {fixVersionsSelector} from '../../../model/board/fix-version/fix-version.reducer';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES,
  FilterAttributes, FilterAttributesUtil, FIX_VERSION_ATTRIBUTES, ISSUE_TYPE_ATTRIBUTES, LABEL_ATTRIBUTES, NONE_FILTER,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterActions} from '../../../model/board/user/board-filter/board-filter.reducer';
import {customFieldsSelector} from '../../../model/board/custom-field/custom-field.reducer';
import {CustomField} from '../../../model/board/custom-field/custom-field.model';
import {ParallelTask} from '../../../model/board/project/project.model';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlPanelComponent implements OnInit, OnDestroy {

  readonly none = NONE_FILTER;

  filterForm: FormGroup;

  filterList: FilterAttributes[] = [];
  filterEntries: Dictionary<FilterFormEntry[]> = {};

  filtersToDisplay: FilterAttributes = null;
  currentFilterEntries: FilterFormEntry[];

  constructor(private _store: Store<AppState>) {
  }

  ngOnInit() {
    const filterList: FilterAttributes[] =
      [PROJECT_ATTRIBUTES, ISSUE_TYPE_ATTRIBUTES, PRIORITY_ATTRIBUTES, ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES,
        LABEL_ATTRIBUTES, FIX_VERSION_ATTRIBUTES];

    // TODO custom fields and parallel tasks
    this.filterList = filterList;

    this.filterForm = new FormGroup({});

    this._store.select<BoardFilterState>('filters')
      .takeWhile((filterState, i) => (i === 0))
      .subscribe(
        filterState => {
          this.createGroupFromObservable(this._store.select(boardProjectsSelector), PROJECT_ATTRIBUTES,
            project => project.map(p => FilterFormEntry(p.key, p.key)).toArray(),
            () => filterState.project);
          this.createGroupFromObservable(this._store.select(issuesTypesSelector), ISSUE_TYPE_ATTRIBUTES,
            types => types.map(t => FilterFormEntry(t.name, t.name)).toArray(),
            () => filterState.issueType);
          this.createGroupFromObservable(this._store.select(prioritiesSelector), PRIORITY_ATTRIBUTES,
            priorities => priorities.map(p => FilterFormEntry(p.name, p.name)).toArray(),
            () => filterState.priority);
          this.createGroupFromObservable(this._store.select(assigneesSelector), ASSIGNEE_ATTRIBUTES,
            assignees => assignees.map(a => FilterFormEntry(a.key, a.name)).toArray(),
            () => filterState.assignee);
          this.createGroupFromObservable(this._store.select(componentsSelector), COMPONENT_ATTRIBUTES,
            components => components.map(c => FilterFormEntry(c, c)).toArray(),
            () => filterState.component);
          this.createGroupFromObservable(this._store.select(labelsSelector), LABEL_ATTRIBUTES,
            labels => labels.map(l => FilterFormEntry(l, l)).toArray(),
            () => filterState.label);
          this.createGroupFromObservable(this._store.select(fixVersionsSelector), FIX_VERSION_ATTRIBUTES,
            fixVersions => fixVersions.map(l => FilterFormEntry(l, l)).toArray(),
            () => filterState.fixVersion);
          this.createCustomFieldGroups(filterState, this._store.select(customFieldsSelector));
          this.createParallelTaskGroup(filterState, this._store.select(parallelTasksSelector));
        }
      );

    this.filterForm.valueChanges
      .debounceTime(150)
      .subscribe((value) => {
        this.processFormValueChanges(value);
      });
  }

  private createGroupFromObservable<T>(observable: Observable<T>,
                                       filter: FilterAttributes,
                                       mapper: (t: T) => FilterFormEntry[],
                                       setFilterGetter: () => Set<string>) {
    observable
      .takeWhile((v, i) => (i === 0))
      .map(v => mapper(v))
      .subscribe(
        filterFormEntries => {
          this.createGroup(filterFormEntries, filter, setFilterGetter);
        }
      );
  }

  private createCustomFieldGroups(filterState: BoardFilterState,
                                  observable: Observable<OrderedMap<string,
                                    OrderedMap<string, CustomField>>>) {
    observable
      .takeWhile((v, i) => (i === 0))
      .subscribe(
        customFields => {
          customFields.forEach((fields, key) => {
            const filterFormEntries: FilterFormEntry[] = fields.map(c => FilterFormEntry(c.key, c.value)).toArray();
            const cfFilterAttributes: FilterAttributes = FilterAttributesUtil.createCustomFieldFilterAttributes(key);
            this.filterList.push(cfFilterAttributes);
            this.createGroup(filterFormEntries, cfFilterAttributes, () => filterState.customField.get(key));
          });
        }
      );
  }

  private createParallelTaskGroup(filterState: BoardFilterState, observable: Observable<OrderedMap<string, List<ParallelTask>>>) {
    observable
      .takeWhile((v, i) => (i === 0))
      .subscribe(
        parallelTasks => {
          if (parallelTasks.size === 0) {
            // No parallel tasks configured
            return;
          }
          this.filterList.push(PARALLEL_TASK_ATTRIBUTES);
          const filterFormEntries: FilterFormEntry[] = [];
          const done: Dictionary<boolean> = {};
          const parallelTasksGroup: FormGroup = new FormGroup({});

          parallelTasks.forEach((tasksForProject => {
            // TODO if we have different options for different projects, we should merge those here if that becomes needed
            tasksForProject.forEach((parallelTask: ParallelTask) => {
              if (done[parallelTask.name]) {
                return;
              };
              done[parallelTask.name] = true;

              const options: FilterFormEntry[] = new Array<FilterFormEntry>(parallelTask.options.size);
              const taskGroup: FormGroup = new FormGroup({});

              parallelTask.options.forEach((option, i) => {
                options[i] = FilterFormEntry(option, option);
                const filteredOptions: Set<string> = filterState.parallelTask.get(parallelTask.display);
                taskGroup.addControl(option, new FormControl(!!filteredOptions && filteredOptions.contains(option)));
              });

              filterFormEntries.push(FilterFormEntry(parallelTask.display, parallelTask.name, options));
              parallelTasksGroup.addControl(parallelTask.display, taskGroup);
            });
          }));

          this.filterEntries[PARALLEL_TASK_ATTRIBUTES.key] = filterFormEntries;
          this.filterForm.addControl(PARALLEL_TASK_ATTRIBUTES.key, parallelTasksGroup);
        }
      );
  }



  private createGroup(filterFormEntries: FilterFormEntry[], filter: FilterAttributes, setFilterGetter: () => Set<string>) {
    if (filter.hasNone) {
      filterFormEntries.unshift(FilterFormEntry(this.none, 'None'));
    }
    this.filterEntries[filter.key] = filterFormEntries;
    let set: Set<string> = setFilterGetter();
    if (!set) {
      set = Set<string>();
    }
    const group: FormGroup = new FormGroup({});

    filterFormEntries.forEach(entry => {
      const control: FormControl = new FormControl(set.contains(entry.key));
      group.addControl(entry.key, control);
    });

    this.filterForm.addControl(filter.key, group);

  }

  ngOnDestroy() {
  }

  onSelectFiltersToDisplay(event: MouseEvent, filter: FilterAttributes) {
    event.preventDefault();
    this.filtersToDisplay = filter;
    this.currentFilterEntries = this.filterEntries[filter.key];
  }

  processFormValueChanges(value: any) {
    const obj: Object = value[this.filtersToDisplay.key];
    this._store.dispatch(BoardFilterActions.createUpdateFilter(this.filtersToDisplay, obj));
    this.filterForm.reset(value);
  }
}

interface FilterFormEntry {
  key: string;
  display: string;
  children: FilterFormEntry[];
}
function FilterFormEntry(key: string, display: string, children?: FilterFormEntry[]): FilterFormEntry {
  return {key: key, display: display, children: children};
}
