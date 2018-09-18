import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {FilterAttributes, PARALLEL_TASK_ATTRIBUTES} from '../../../model/board/user/board-filter/board-filter.constants';
import {List, Set} from 'immutable';
import {Dictionary} from '../../../common/dictionary';
import {FilterFormEntry} from '../../../common/filter-form-entry';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {FormGroup} from '@angular/forms';
import {FilterEntryEvent} from './filter-entry.event';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {getNonParallelTaskSet} from './settings-drawer.util';
import {IssueState} from '../../../model/board/data/issue/issue.model';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';


@Component({
  selector: 'app-setting-filter-entry',
  templateUrl: './filter-entry.component.html',
  styleUrls: ['./filter-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterEntryComponent implements OnInit, OnDestroy {

  @Input()
  filterAttributes: FilterAttributes;

  @Input()
  selected: boolean;

  @Input()
  filters: BoardFilterState;

  @Input()
  filterEntryDictionaryEntry: Dictionary<FilterFormEntry>;

  @Input()
  filterForm: FormGroup;

  @Input()
  filterEntries: FilterFormEntry[];

  @Output()
  filterEntryEvent: EventEmitter<FilterEntryEvent> = new EventEmitter<FilterEntryEvent>();


  private tooltip: string;

  filterSearch: string;

  issueList: List<string> = List<string>();

  destroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(v => {
      this.tooltip = null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  onOpenFilterPanel() {
    this.filterSearch = null;
    this.filterEntryEvent.emit(FilterEntryEvent.OPENED_ENTRY);
  }

  onCloseFilterPanel() {
    this.filterEntryEvent.emit(FilterEntryEvent.CLOSED_ENTRY);
  }

  onClearFilter(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.filterEntryEvent.emit(FilterEntryEvent.CLEARED_FILTER);
  }

  onInvertFilter() {
    this.filterEntryEvent.emit(FilterEntryEvent.INVERTED_FILTER);
  }

  onSelectAllFilter(filterAttributes: FilterAttributes) {
    this.filterEntryEvent.emit(FilterEntryEvent.SELECTED_ALL_FILTER);
  }

  getSelectionTooltip(): string {
    let tooltip: string = this.tooltip;
    if (!tooltip) {
      tooltip = this.createSelectionTooltip();
      if (tooltip.length > 0) {
        tooltip = this.filterAttributes.display + '\n\n' + tooltip;
      }
      this.tooltip = tooltip;
    }
    return tooltip;
  }

  createSelectionTooltip(): string {
    const set: Set<string> = getNonParallelTaskSet(this.filters, this.filterAttributes);
    if (set && set.size > 0) {
      const lookup: Dictionary<FilterFormEntry> = this.filterEntryDictionaryEntry;
      let first = true;
      let tooltip = '';
      set.forEach(key => {
        if (first) {
          first = false;
        } else {
          tooltip += '\n';
        }
        tooltip += lookup[key].display;
      });
      return tooltip;
    }
    if (this.filterAttributes === PARALLEL_TASK_ATTRIBUTES) {
      let first = true;
      let tooltip = '';
      const taskEntries: FilterFormEntry[] = this.filterEntries;
      for (const taskEntry of taskEntries) {
        const taskSet: Set<string> = this.filters.parallelTask.get(taskEntry.key);
        if (taskSet && taskSet.size > 0) {
          if (first) {
            first = false;
          } else {
            tooltip += '\n\n';
          }
          tooltip += taskEntry.display + ':';
          taskSet.forEach(key => {
            // For parallel tasks the key and the display value is the same so there is no need to look up
            tooltip += '\n' + key;
          });

        }
      }
      return tooltip;
    }
    return '';
  }
}
