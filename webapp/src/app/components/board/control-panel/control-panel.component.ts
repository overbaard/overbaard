import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AppState} from '../../../app-store';
import {Store} from '@ngrx/store';
import {Dictionary} from '../../../common/utils/dictionary';
import {FormControl, FormGroup} from '@angular/forms';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import {Observable} from 'rxjs/Observable';
import {boardProjectsSelector} from '../../../common/board/project/project.reducer';
import {BoardFilterState} from '../../../common/board/user/board-filter/board-filter.model';
import {Set} from 'immutable';
import {issuesTypesSelector} from '../../../common/board/issue-type/issue-type.reducer';
import {prioritiesSelector} from '../../../common/board/priority/priority.reducer';
import {assigneesSelector} from '../../../common/board/assignee/assignee.reducer';
import {componentsSelector} from '../../../common/board/component/component.reducer';
import {labelsSelector} from '../../../common/board/label/label.reducer';
import {fixVersionsSelector} from '../../../common/board/fix-version/fix-version.reducer';
import {
  ASSIGNEE_ATTRIBUTES, COMPONENT_ATTRIBUTES,
  FilterAttributes, FIX_VERSION_ATTRIBUTES, ISSUE_TYPE_ATTRIBUTES, LABEL_ATTRIBUTES, PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../common/board/user/board-filter/board-filter.constants';
import {BoardFilterActions} from '../../../common/board/user/board-filter/board-filter.reducer';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlPanelComponent implements OnInit, OnDestroy {

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
          this.createGroup(this._store.select(boardProjectsSelector), PROJECT_ATTRIBUTES,
            project => project.map(p => FilterFormEntry(p.key, p.key)).toArray(),
            () => filterState.project);
          this.createGroup(this._store.select(issuesTypesSelector), ISSUE_TYPE_ATTRIBUTES,
            types => types.map(t => FilterFormEntry(t.name, t.name)).toArray(),
            () => filterState.issueType);
          this.createGroup(this._store.select(prioritiesSelector), PRIORITY_ATTRIBUTES,
            priorities => priorities.map(p => FilterFormEntry(p.name, p.name)).toArray(),
            () => filterState.priority);
          this.createGroup(this._store.select(assigneesSelector), ASSIGNEE_ATTRIBUTES,
            assignees => assignees.map(a => FilterFormEntry(a.key, a.name)).toArray(),
            () => filterState.assignee);
          this.createGroup(this._store.select(componentsSelector), COMPONENT_ATTRIBUTES,
            components => components.map(c => FilterFormEntry(c, c)).toArray(),
            () => filterState.component);
          this.createGroup(this._store.select(labelsSelector), LABEL_ATTRIBUTES,
            labels => labels.map(l => FilterFormEntry(l, l)).toArray(),
            () => filterState.label);
          this.createGroup(this._store.select(fixVersionsSelector), FIX_VERSION_ATTRIBUTES,
            fixVersions => fixVersions.map(l => FilterFormEntry(l, l)).toArray(),
            () => filterState.fixVersion);
          // TODO custom fields and parallel tasks

        }
      );

    this.filterForm.valueChanges
      .debounceTime(150)
      .subscribe((value) => {
        this.processFormValueChanges(value);
      });
  }

  private createGroup<T>(observable: Observable<T>,
                         filter: FilterAttributes,
                         mapper: (t: T) => FilterFormEntry[],
                         setFilterGetter: () => Set<string>) {
    observable
      .takeWhile((v, i) => (i === 0))
      .map(v => mapper(v))
      .subscribe(
        filterFormEntries => {

          this.filterEntries[filter.key] = filterFormEntries;
          const set: Set<string> = setFilterGetter();
          const group: FormGroup = new FormGroup({});

          filterFormEntries.forEach(entry => {
            group.addControl(entry.key, new FormControl(set.contains(entry.key)));
          });

          this.filterForm.addControl(filter.key, group);
        }
      );
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
}
function FilterFormEntry(key: string, display: string): FilterFormEntry {
  return {key: key, display: display};
}
