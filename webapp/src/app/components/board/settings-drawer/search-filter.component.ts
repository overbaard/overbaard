import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';
import {MatAutocompleteSelectedEvent, MatChipInputEvent} from '@angular/material';
import {SPACE} from '@angular/cdk/keycodes';
import {IssueState} from '../../../model/board/data/issue/issue.model';
import {Set} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {ProgressLogService} from '../../../services/progress-log.service';
import {BoardSearchFilterState} from '../../../model/board/user/board-filter/board-search-filter.model';


@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilterComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  issueState: IssueState;

  @Input()
  searchFilterState: BoardSearchFilterState;

  @Output()
  selectedIssueIds: EventEmitter<Set<string>> = new EventEmitter<Set<string>>();

  @Output()
  containingText: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('searchIssueIdInput') searchIssueIdInput: ElementRef;

  // Set/read by the template
  selected: boolean;

  searchForm: FormGroup;
  searchIssueIdCtrl: FormControl;
  searchContainingTextCtrl: FormControl;

  tooltip: string;

  private _issueList: BoardIssue[];
  filteredIssueList: BoardIssue[];
  selectedSearchIssueIds: string[] = [];
  searchContainingText: string;

  readonly separatorKeysCodes: number[] = [SPACE];


  private _destroy$: Subject<void> = new Subject<void>();

  constructor(private _progressLogService: ProgressLogService) {
  }


  ngOnInit(): void {
    this.searchForm = new FormGroup({});
    this.searchIssueIdCtrl = new FormControl();
    this.searchForm.addControl('searchIssueId', this.searchIssueIdCtrl);
    this.searchContainingTextCtrl = new FormControl(this.searchFilterState.containingText);
    this.searchForm.addControl('searchContainingText', new FormControl(this.searchFilterState.containingText));

    this.searchIssueIdCtrl.valueChanges.pipe(
      takeUntil(this._destroy$),
      startWith('')
    ).subscribe(value => {
      this.filteredIssueList = this.filterIssueList(value);
    });
    this.searchContainingTextCtrl.valueChanges.pipe(
      takeUntil(this._destroy$),
    ).subscribe((value: string) => {

      // TODO Do all this length stuff when populating the view model instead
      /*let emit = false;
      if (value && value.length > 2) {
        if (this.searchContainingText !== value) {
          emit = true;
          this.searchContainingText = value;
        }
      } else if (this.searchContainingText && this.searchContainingText.length > 2) {
        emit = true;
        this.searchContainingText = null;
      }
      if (emit) {
        this.emitContainingText();
      }*/
      this.searchContainingText = value ? value : '';
      this.tooltip = null;
      // TODO - debounce this a bit
      this.emitContainingText();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const issueStateChange: SimpleChange = changes['issueState'];
    if (issueStateChange) {
      if (issueStateChange.currentValue !== issueStateChange.previousValue) {
        const issueState: IssueState = issueStateChange.currentValue;
        this._issueList =
          issueState.issues.sort((issueA, issueB) => issueA.key.localeCompare(issueB.key)).toArray();
      }
    }
    const searchFilterStateChange: SimpleChange = changes['searchFilterState'];
    if (searchFilterStateChange) {
      console.log('Updated serch filter');
      if (searchFilterStateChange.currentValue !== searchFilterStateChange.previousValue) {
        console.log('Not equal');
        const searchFilterState: BoardSearchFilterState = searchFilterStateChange.currentValue;
        this.selectedSearchIssueIds = searchFilterState.issueIds.toArray().sort();
        if (!searchFilterStateChange.isFirstChange()) {
          this.searchContainingText = searchFilterState.containingText;
          this.searchContainingTextCtrl.setValue(searchFilterState.containingText);
        }
      }
    }
  }


  ngOnDestroy(): void {
    this._destroy$.next(null);
    this._destroy$.unsubscribe();
  }

  getSelectionTooltip(): string {
    if (!this.tooltip) {
      if (this.selectedSearchIssueIds.length > 0 || this.searchContainingText) {
        let tooltip = '';
        if (this.selectedSearchIssueIds.length > 0) {
          tooltip += 'Issue Ids:\n';
          for (const id of this.selectedSearchIssueIds) {
            tooltip += id + '\n';
          }
        }
        if (this.searchContainingText) {
          if (tooltip.length > 0) {
            tooltip += '\n';
          }
          tooltip += 'Text:\n';
          tooltip += this.searchContainingText;
        }
        this.tooltip = tooltip;
      } else {
        this.tooltip = '';
      }
    }
    return this.tooltip;
  }

  onClearFilter(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedSearchIssueIds = [];
    this.searchContainingTextCtrl.setValue(null);
    this.emitSelectedIssueIds();
  }


  onRemoveSearchIssueId(id: string) {
    const index = this.selectedSearchIssueIds.indexOf(id);

    if (index >= 0) {
      this.selectedSearchIssueIds.splice(index, 1);
    }
    this.emitSelectedIssueIds();
  }

  onAddSearchIssueId(event: MatChipInputEvent): void {
    const input = event.input;
    const value: string = event.value;

    if ((value || '').trim()) {
      if (this.issueState.issues.get(value)) {
        this.addSelectedIssueId(value);
      } else {
        // Do a brute force search as the user might have entered 'feat-1' while the issue is called 'FEAT-1'
        let realKey: string = null;
        const lowerCaseValue: string = value.toLowerCase();
        this._issueList.forEach(issue => {
          if (issue.key.toLowerCase() === lowerCaseValue) {
            realKey = issue.key;
            return false;
          }
        });

        if (realKey) {
          this.addSelectedIssueId(realKey);
        } else {
          this._progressLogService.startUserAction().logWarning(`Could not find issue '${value}'`);
        }
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.searchIssueIdCtrl.setValue('');
  }

  onSelectIssueId(event: MatAutocompleteSelectedEvent): void {
    const value: string = event.option.value;
    this.addSelectedIssueId(value);
    this.searchIssueIdInput.nativeElement.value = '';
    this.searchIssueIdCtrl.setValue('');
  }

  private addSelectedIssueId(issueId: string) {
    this.selectedSearchIssueIds.push(issueId.trim());
    this.selectedSearchIssueIds.sort();
    this.emitSelectedIssueIds();
  }

  private emitSelectedIssueIds() {
    this.tooltip = null;
    this.selectedIssueIds.emit(Set<string>(this.selectedSearchIssueIds));
  }

  private emitContainingText() {
    this.tooltip = null;
    this.containingText.emit(this.searchContainingText);
  }

  private filterIssueList(value: string): BoardIssue[] {
    const keySet: Set<string> = Set<string>(this.selectedSearchIssueIds);
    const filterValue = value ? value.toLowerCase() : '';
    return this._issueList.filter(issue => {
      if (keySet.contains(issue.key)) {
        // Skip the ones that were already selected
        return false;
      }
      return issue.key.toLowerCase().indexOf(filterValue) >= 0;
    });
  }

}
