import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AppState} from '../../../app-store';
import {Store} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {FormControl, FormGroup} from '@angular/forms';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {boardProjectsSelector, parallelTasksSelector} from '../../../model/board/data/project/project.reducer';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {List, OrderedMap, Set} from 'immutable';
import {issuesTypesSelector} from '../../../model/board/data/issue-type/issue-type.reducer';
import {prioritiesSelector} from '../../../model/board/data/priority/priority.reducer';
import {assigneesSelector} from '../../../model/board/data/assignee/assignee.reducer';
import {componentsSelector} from '../../../model/board/data/component/component.reducer';
import {labelsSelector} from '../../../model/board/data/label/label.reducer';
import {fixVersionsSelector} from '../../../model/board/data/fix-version/fix-version.reducer';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FilterAttributesUtil,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterActions} from '../../../model/board/user/board-filter/board-filter.reducer';
import {customFieldsSelector} from '../../../model/board/data/custom-field/custom-field.reducer';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {ParallelTask} from '../../../model/board/data/project/project.model';
import {UserSettingActions} from '../../../model/board/user/user-setting.reducer';
import {Subject} from 'rxjs/Subject';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {BoardViewMode} from '../../../model/board/user/board-view-mode';

@Component({
  selector: 'app-board-settings-drawer',
  templateUrl: './settings-drawer.component.html',
  styleUrls: ['./settings-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardSettingsDrawerComponent implements OnInit, OnDestroy {

  readonly none = NONE_FILTER;

  // Have this come in via an input to be able to decide the state of showing/hiding empty swimlanes
  @Input()
  userSettings: UserSettingState;

  swimlaneForm: FormGroup;
  filterForm: FormGroup;

  swimlaneList: FilterFormEntry[];
  filterList: FilterAttributes[] = [];
  filterEntries: Dictionary<FilterFormEntry[]> = {};

  filtersToDisplay: FilterAttributes = null;
  currentFilterEntries: FilterFormEntry[];

  private _destroy$: Subject<null> = new Subject<null>();

  // Expose the enum to the template
  enumViewMode = BoardViewMode;
  @Output()
  switchViewMode: EventEmitter<null> = new EventEmitter<null>();


  constructor(private _store: Store<AppState>) {
  }

  ngOnInit() {
    // As the control panel is recreated each time we display it, don't try to follow the live data by listening to changes
    // (Apart from whether to show/hide empty swimlanes which is handled by this.userSetting)
    const filterList: FilterAttributes[] =
      [PROJECT_ATTRIBUTES, ISSUE_TYPE_ATTRIBUTES, PRIORITY_ATTRIBUTES, ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES,
        LABEL_ATTRIBUTES, FIX_VERSION_ATTRIBUTES];

    this.filterList = filterList;

    this.swimlaneForm = new FormGroup({});
    this.filterForm = new FormGroup({});

    this.swimlaneForm.addControl('swimlane', new FormControl(this.userSettings.swimlane));

    this.createGroupFromObservable(this._store.select(boardProjectsSelector), PROJECT_ATTRIBUTES,
      project => project.map(p => FilterFormEntry(p.key, p.key)).toArray(),
      () => this.userSettings.filters.project);
    this.createGroupFromObservable(this._store.select(issuesTypesSelector), ISSUE_TYPE_ATTRIBUTES,
      types => types.map(t => FilterFormEntry(t.name, t.name)).toArray(),
      () => this.userSettings.filters.issueType);
    this.createGroupFromObservable(this._store.select(prioritiesSelector), PRIORITY_ATTRIBUTES,
      priorities => priorities.map(p => FilterFormEntry(p.name, p.name)).toArray(),
      () => this.userSettings.filters.priority);
    this.createGroupFromObservable(this._store.select(assigneesSelector), ASSIGNEE_ATTRIBUTES,
      assignees => assignees.map(a => FilterFormEntry(a.key, a.name)).toArray(),
      () => this.userSettings.filters.assignee);
    this.createGroupFromObservable(this._store.select(componentsSelector), COMPONENT_ATTRIBUTES,
      components => components.map(c => FilterFormEntry(c, c)).toArray(),
      () => this.userSettings.filters.component);
    this.createGroupFromObservable(this._store.select(labelsSelector), LABEL_ATTRIBUTES,
      labels => labels.map(l => FilterFormEntry(l, l)).toArray(),
      () => this.userSettings.filters.label);
    this.createGroupFromObservable(this._store.select(fixVersionsSelector), FIX_VERSION_ATTRIBUTES,
      fixVersions => fixVersions.map(f => FilterFormEntry(f, f)).toArray(),
      () => this.userSettings.filters.fixVersion);
    this.createCustomFieldGroups(this.userSettings.filters, this._store.select(customFieldsSelector));
    this.createParallelTaskGroup(this.userSettings.filters, this._store.select(parallelTasksSelector));


    this.filterForm.valueChanges
      .takeUntil(this._destroy$)
      .debounceTime(150)  // Timeout here for when we clear form to avoid costly recalculation of everything
      .subscribe(value => this.processFormValueChanges(value));
    this.swimlaneForm.valueChanges
      .takeUntil(this._destroy$)
      .subscribe(value => this.processSwimlaneChange(value));

    this.swimlaneList = this.filterList
      .filter(fa => fa.swimlaneOption)
      .map(fa => FilterFormEntry(fa.key, fa.display));
  }

  ngOnDestroy() {
    this._destroy$.next(null);
  }

  private createGroupFromObservable<T>(observable: Observable<T>,
                                       filter: FilterAttributes,
                                       mapper: (t: T) => FilterFormEntry[],
                                       setFilterGetter: () => Set<string>) {
    observable
      .take(1)
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
      .take(1)
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
      .take(1)
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

  onOpenFilterPane(filter: FilterAttributes) {
    this.filtersToDisplay = filter;
    this.currentFilterEntries = this.filterEntries[filter.key];
  }

  onCloseFilterPanel(filter: FilterAttributes) {
    if (this.filtersToDisplay === filter) {
      this.filtersToDisplay = null;
    }
  }

  processFormValueChanges(value: any) {
    const obj: Object = value[this.filtersToDisplay.key];
    this._store.dispatch(BoardFilterActions.createUpdateFilter(this.filtersToDisplay, obj));
    this.filterForm.reset(value);
  }

  processSwimlaneChange(value: any) {
    const sl: string = value['swimlane'];
    this._store.dispatch(UserSettingActions.createUpdateSwimlane(sl));
  }

  onShowEmptySwimlanes(event: MouseEvent) {
    event.preventDefault();
    this._store.dispatch(UserSettingActions.createToggleShowEmptySwimlanes());
  }

  onSwitchViewMode(event: Event) {
    // There is some logic here which belongs better in the board component so emit an event and let the board
    // handle it
    this.switchViewMode.emit();
    event.preventDefault();
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
