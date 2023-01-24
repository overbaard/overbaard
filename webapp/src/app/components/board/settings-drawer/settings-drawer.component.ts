import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AppState} from '../../../app-store';
import {Store} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {AbstractControl, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {boardProjectsSelector, linkedProjectsSelector} from '../../../model/board/data/project/project.reducer';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {List, OrderedMap, Set, Map} from 'immutable';
import {issuesTypesSelector} from '../../../model/board/data/issue-type/issue-type.reducer';
import {prioritiesSelector} from '../../../model/board/data/priority/priority.reducer';
import {assigneesSelector} from '../../../model/board/data/assignee/assignee.reducer';
import {componentsSelector} from '../../../model/board/data/component/component.reducer';
import {labelsSelector} from '../../../model/board/data/label/label.reducer';
import {fixVersionsSelector} from '../../../model/board/data/fix-version/fix-version.reducer';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  CURRENT_USER_FILTER_KEY,
  FilterAttributes,
  FilterAttributesUtil,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER_KEY,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterActions} from '../../../model/board/user/board-filter/board-filter.reducer';
import {customFieldsSelector} from '../../../model/board/data/custom-field/custom-field.reducer';
import {CustomFieldData, CustomFieldValue} from '../../../model/board/data/custom-field/custom-field.model';
import {BoardProject, ParallelTask} from '../../../model/board/data/project/project.model';
import {UserSettingActions} from '../../../model/board/user/user-setting.reducer';
import {UserSettingState} from '../../../model/board/user/user-setting';
import {BoardViewMode} from '../../../model/board/user/board-view-mode';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSliderChange } from '@angular/material/slider';
import {toIssueSummaryLevel} from '../../../model/board/user/issue-summary-level';
import {FilterFormEntry} from '../../../common/filter-form-entry';
import {debounceTime, map, take, takeUntil} from 'rxjs/operators';
import {ParallelTaskFlattener} from '../../../model/board/data/project/parallel-task.flattener';
import {FilterEntryEvent} from './filter-entry.event';
import {getNonParallelTaskSet} from './settings-drawer.util';
import {IssueState} from '../../../model/board/data/issue/issue.model';
import {BoardSearchFilterActions} from '../../../model/board/user/board-filter/board-search-filter.reducer';
import {ManualSwimlane, manualSwimlanesSelector} from '../../../model/board/data/manual-swimlane/manual-swimlane.model';
import {Epic, epicsByProjectSelector} from '../../../model/board/data/epic/epic.model';
import * as _ from 'underscore';


@Component({
  selector: 'app-board-settings-drawer',
  templateUrl: './settings-drawer.component.html',
  styleUrls: ['./settings-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardSettingsDrawerComponent implements OnInit, OnDestroy {

  readonly none: string = NONE_FILTER_KEY;
  readonly currentUser: string = CURRENT_USER_FILTER_KEY;

  // Have this come in via an input to be able to decide the state of showing/hiding empty swimlanes
  @Input()
  userSettings: UserSettingState;

  @Input()
  issueState: IssueState;

  @Output()
  switchViewMode: EventEmitter<null> = new EventEmitter<null>();

  viewModeForm: UntypedFormGroup;
  swimlaneForm: UntypedFormGroup;
  filterForm: UntypedFormGroup;

  swimlaneList: FilterFormEntry[];
  filterList: FilterAttributes[] = [];
  filterEntryDictionary: Dictionary<Dictionary<FilterFormEntry>> = {};
  filterEntries: Dictionary<FilterFormEntry[]> = {};

  filtersToDisplay: FilterAttributes = null;
  currentFilterEntries: FilterFormEntry[];
  filterSearch: string;

  private _destroy$: Subject<null> = new Subject<null>();

  // Expose the enum to the template
  enumViewMode = BoardViewMode;

  bulkUpdateFilter: FilterAttributes;

  hasLinkedIssues: boolean;

  private _lastForm: any;


  constructor(private _store: Store<AppState>) {
  }

  ngOnInit() {
    // As the control panel is recreated each time we display it, don't try to follow the live data by listening to changes
    // (Apart from whether to show/hide empty swimlanes which is handled by this.userSetting)
    const filterList: FilterAttributes[] =
      [PROJECT_ATTRIBUTES, ISSUE_TYPE_ATTRIBUTES, PRIORITY_ATTRIBUTES, ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES,
        LABEL_ATTRIBUTES, FIX_VERSION_ATTRIBUTES];

    this.filterList = filterList;

    this.viewModeForm = new UntypedFormGroup({});
    this.swimlaneForm = new UntypedFormGroup({});
    this.filterForm = new UntypedFormGroup({});

    this.viewModeForm.addControl('viewMode', new UntypedFormControl(this.getViewModeString(this.userSettings.viewMode)));
    this.swimlaneForm.addControl('swimlane', new UntypedFormControl(this.userSettings.swimlane));

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
    this.createParallelTaskGroup(this.userSettings.filters, this._store.select(boardProjectsSelector));


    this.filterForm.valueChanges
      .pipe(
        debounceTime(150),  // Timeout here for when we clear form to avoid costly recalculation of everything
        takeUntil(this._destroy$)
      )
      .subscribe(value => this.processFormValueChanges(value));
    this.swimlaneForm.valueChanges
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(value => this.processSwimlaneChange(value));
    this.viewModeForm.valueChanges
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(value => this.processViewModeChange(value));

    this.swimlaneList = this.filterList
      .filter(fa => fa.swimlaneOption)
      .map(fa => FilterFormEntry(fa.key, fa.display));

    // Add the Epics and manual swimlanes here since they are not part of the filters
    this._store.select(epicsByProjectSelector)
      .pipe(
        take(1)
      )
      .subscribe(
        (epicsByProject: Map<string, OrderedMap<string, Epic>>) => {
          let hasEpics = false;
          epicsByProject.forEach(epics => {
            if (epics.size > 0) {
              hasEpics = true;
              return false;
            }
          });
          if (hasEpics) {
            this.swimlaneList.push(FilterFormEntry('epic', 'Epic'));
          }
        }
      );

    this._store.select(manualSwimlanesSelector)
      .pipe(
        take(1),
      )
      .subscribe(
        (manualSwimlanes: OrderedMap<string, ManualSwimlane>) => {
          manualSwimlanes.forEach(manualSwimlane => {
            this.swimlaneList.push(FilterFormEntry(manualSwimlane.name, manualSwimlane.name));
          });
        }
      );


    this._store.select(linkedProjectsSelector)
      .pipe(
        take(1)
      )
      .subscribe(
        linkedProjects => {
          this.hasLinkedIssues = linkedProjects && linkedProjects.size > 0;
        }
      );
  }

  ngOnDestroy() {
    this._destroy$.next(null);
  }

  private createGroupFromObservable<T>(observable: Observable<T>,
                                       filterAttributes: FilterAttributes,
                                       mapper: (t: T) => FilterFormEntry[],
                                       setFilterGetter: () => Set<string>) {
    observable
      .pipe(
        take(1),
        map(v => mapper(v))
      )
      .subscribe(
        filterFormEntries => {
          this.createGroup(filterFormEntries, filterAttributes, setFilterGetter);
        }
      );
  }

  private createCustomFieldGroups(filterState: BoardFilterState,
                                  observable: Observable<OrderedMap<string, CustomFieldData>>) {
    observable
      .pipe(
        take(1)
      )
      .subscribe(
        customFields => {
          customFields.forEach((fieldData, key) => {
            const filterFormEntries: FilterFormEntry[] = fieldData.fieldValues.map(c => FilterFormEntry(c.key, c.value)).toArray();
            const cfFilterAttributes: FilterAttributes = FilterAttributesUtil.createCustomFieldFilterAttributes(key, fieldData);
            this.filterList.push(cfFilterAttributes);
            this.createGroup(filterFormEntries, cfFilterAttributes, () => filterState.customField.get(key));
          });
        }
      );
  }

  private createParallelTaskGroup(filterState: BoardFilterState, observable: Observable<OrderedMap<string, BoardProject>>) {
    observable
      .pipe(
        take(1)
      )
      .subscribe(
        boardProjects => {
          const filterFormEntryDictionary: Dictionary<FilterFormEntry> = {};
          const filterFormEntries: FilterFormEntry[] = [];
          const parallelTasksGroup: UntypedFormGroup = new UntypedFormGroup({});

          const flattenedTasks: List<ParallelTask> = new ParallelTaskFlattener(boardProjects).flattenParallelTasks();

          let hasParallelTasks = false;

          flattenedTasks.forEach((parallelTask: ParallelTask) => {
            if (!hasParallelTasks) {
              this.filterList.push(PARALLEL_TASK_ATTRIBUTES);
              hasParallelTasks = true;
            }

            const options: FilterFormEntry[] = new Array<FilterFormEntry>(parallelTask.options.size);
            const taskGroup: UntypedFormGroup = new UntypedFormGroup({});

            parallelTask.options.forEach((option, i) => {
              options[i] = FilterFormEntry(option.name, option.name);
              const filteredOptions: Set<string> = filterState.parallelTask.get(parallelTask.display);
              taskGroup.addControl(option.name, new UntypedFormControl(!!filteredOptions && filteredOptions.contains(option.name)));
            });

            const entry = FilterFormEntry(parallelTask.display, parallelTask.name, options);
            filterFormEntryDictionary[entry.key] = entry;
            filterFormEntries.push(entry);
            parallelTasksGroup.addControl(parallelTask.display, taskGroup);
          });

          if (hasParallelTasks) {
            this.filterEntryDictionary[PARALLEL_TASK_ATTRIBUTES.key] = filterFormEntryDictionary;
            this.filterEntries[PARALLEL_TASK_ATTRIBUTES.key] = filterFormEntries;
            this.filterForm.addControl(PARALLEL_TASK_ATTRIBUTES.key, parallelTasksGroup);
          }
        }
      );
  }



  private createGroup(filterFormEntries: FilterFormEntry[], filterAttributes: FilterAttributes, setFilterGetter: () => Set<string>) {
    if (filterAttributes.hasNone) {
      filterFormEntries.unshift(FilterFormEntry(this.none, 'None'));
    }
    if (filterAttributes.hasCurrentUser) {
      filterFormEntries.unshift(FilterFormEntry(this.currentUser, 'Current User'));
    }
    let set: Set<string> = setFilterGetter();
    if (!set) {
      set = Set<string>();
    }
    const filterFormEntryDictionary: Dictionary<FilterFormEntry> = {};
    const group: UntypedFormGroup = new UntypedFormGroup({});
    filterFormEntries.forEach(entry => {
      filterFormEntryDictionary[entry.key] = entry;
      const control: UntypedFormControl = new UntypedFormControl(set.contains(entry.key));
      group.addControl(entry.key, control);
    });

    this.filterEntries[filterAttributes.key] = filterFormEntries;
    this.filterEntryDictionary[filterAttributes.key] = filterFormEntryDictionary;
    this.filterForm.addControl(filterAttributes.key, group);
  }

  onFilterEntryEvent(event: FilterEntryEvent, filterAttributes: FilterAttributes) {
    switch (event) {
      case FilterEntryEvent.OPENED_ENTRY:
        this.onOpenFilterPanel(filterAttributes);
        break;
      case FilterEntryEvent.CLOSED_ENTRY:
        this.onCloseFilterPanel(filterAttributes);
        break;
      case FilterEntryEvent.CLEARED_FILTER:
        this.onClearFilter(filterAttributes);
        break;
      case FilterEntryEvent.INVERTED_FILTER:
        this.onInvertFilter(filterAttributes);
        break;
      case FilterEntryEvent.SELECTED_ALL_FILTER:
        this.onSelectAllFilter(filterAttributes);
        break;
      default:
        console.error(`Unknown FilterEntryEvent ${event}`);
    }
  }

  private onOpenFilterPanel(filterAttributes: FilterAttributes) {
    this.filtersToDisplay = filterAttributes;
    this.currentFilterEntries = this.filterEntries[filterAttributes.key];
    this.filterSearch = null;
  }

  private onCloseFilterPanel(filterAttributes: FilterAttributes) {
    if (this.filtersToDisplay === filterAttributes) {
      this.filtersToDisplay = null;
    }
  }

  private onClearFilter(filterAttributes: FilterAttributes) {
    // This gets cleared by processFormValueChanges
    this.bulkUpdateFilter = filterAttributes;
    const set: Set<string> = getNonParallelTaskSet(this.userSettings.filters, filterAttributes);
    const group: UntypedFormGroup = <UntypedFormGroup>this.filterForm.controls[filterAttributes.key];
    if (set) {
      set.forEach(k => {
        const control: AbstractControl = group.controls[k];
        if (control) {
          group.controls[k].setValue(false);
        }
      });
    }

    if (filterAttributes === PARALLEL_TASK_ATTRIBUTES) {
      this.userSettings.filters.parallelTask.forEach((ptSet, key) => {
        const taskGroup: UntypedFormGroup = <UntypedFormGroup>group.controls[key];
        ptSet.forEach(k => {
          const control: AbstractControl = taskGroup.controls[k];
          if (control) {
            control.setValue(false);
          }
        });
      });
    }
  }

  private onInvertFilter(filterAttributes: FilterAttributes) {
    this.bulkUpdateFilter = filterAttributes;
    const group: UntypedFormGroup = <UntypedFormGroup>this.filterForm.controls[filterAttributes.key];
    if (filterAttributes !== PARALLEL_TASK_ATTRIBUTES) {
      this.invertSelection(group);
    } else {
      this.userSettings.filters.parallelTask.forEach((ptSet, key) => {
        const taskGroup: UntypedFormGroup = <UntypedFormGroup>group.controls[key];
        this.invertSelection(taskGroup);
      });
    }
  }

  private invertSelection(group: UntypedFormGroup) {
    for (const name of Object.keys(group.controls)) {
      const control: AbstractControl = group.controls[name];
      const value: boolean = control.value;
      control.setValue(!value);
    }
  }

  private onSelectAllFilter(filterAttributes: FilterAttributes) {
    this.bulkUpdateFilter = filterAttributes;
    const group: UntypedFormGroup = <UntypedFormGroup>this.filterForm.controls[filterAttributes.key];
    if (filterAttributes !== PARALLEL_TASK_ATTRIBUTES) {
      this.selectAll(group);
    } else {
      this.userSettings.filters.parallelTask.forEach((ptSet, key) => {
        const taskGroup: UntypedFormGroup = <UntypedFormGroup>group.controls[key];
        this.selectAll(taskGroup);
      });
    }
  }

  private selectAll(group: UntypedFormGroup) {
    for (const name of Object.keys(group.controls)) {
      group.controls[name].setValue(true);
    }
  }

  processFormValueChanges(value: any) {
    // bulkUpdateFilter is set by the onXXXFilter()


    const filterAttributes: FilterAttributes = this.bulkUpdateFilter ? this.bulkUpdateFilter : this.filtersToDisplay;
    if (filterAttributes && !_.isEqual(value, this._lastForm)) {
      this._lastForm = value;
      const obj: Object = value[filterAttributes.key];
      this._store.dispatch(BoardFilterActions.createUpdateFilter(filterAttributes, obj));
      this.filterForm.reset(value);
      this.bulkUpdateFilter = null;
    }
  }

  processSwimlaneChange(value: any) {
    const sl: string = value['swimlane'];
    this._store.dispatch(UserSettingActions.createUpdateSwimlane(sl));
  }

  processViewModeChange(value: any) {
    const vm: string = value['viewMode'];
    // TODO make the reducers take something better than just a toggle
    if (this.getViewModeString(this.userSettings.viewMode) !== vm) {
      // There is some logic here which belongs better in the board component so emit an event and let the board
      // handle it
      this.switchViewMode.emit();

    }
  }

  onShowEmptySwimlanes(event: MouseEvent) {
    event.preventDefault();
    this._store.dispatch(UserSettingActions.createToggleShowEmptySwimlanes());
  }

  private getViewModeString(viewMode: BoardViewMode) {
    if (viewMode === BoardViewMode.KANBAN) {
      return 'kanban';
    } else if (viewMode === BoardViewMode.RANK) {
      return 'rank';
    }
    return null;
  }

  onIssueDetailsChange(event: MatSliderChange) {
    this._store.dispatch(UserSettingActions.createUpdateIssueSummaryLevel(toIssueSummaryLevel(event.value)));
  }

  onChangeShowParallelTasks(event: MatCheckboxChange) {
    this._store.dispatch(UserSettingActions.createUpdateShowParallelTasks(event.checked));
  }

  onChangeShowLinkedIssues(event: MatCheckboxChange) {
      this._store.dispatch(UserSettingActions.createUpdateShowLinkedIssues(event.checked));
  }

  onChangeShowRankingOrder(event: MatCheckboxChange) {
    this._store.dispatch(UserSettingActions.createUpdateShowRankingOrder(event.checked));
  }

  onSelectedSearchIssueIds(event: Set<string>) {
    this._store.dispatch(BoardSearchFilterActions.createUpdateIssueIds(event));
  }

  onChangeContainingText(event: string) {
    this._store.dispatch(BoardSearchFilterActions.createUpdateContainingText(event));
  }

  onChangeIssueQl(event: string) {
    this._store.dispatch(BoardSearchFilterActions.createUpdateIssueQl(event));
  }

  onChangeHideNonMatches(event: boolean) {
    this._store.dispatch(BoardSearchFilterActions.createUpdateHideNonMatches(event));
  }

  get hasParallelTasks(): boolean {
    return !!this.filterEntries[PARALLEL_TASK_ATTRIBUTES.key];
  }

}

function FilterFormEntry(key: string, display: string, children?: FilterFormEntry[]): FilterFormEntry {
  return {key: key, display: display, children: children};
}
