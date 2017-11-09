import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Header} from '../../../../../model/board/data/header/header';
import {List} from 'immutable';
import {HeaderView} from '../../../../../view-model/board/issue-table/headers-view';

/**
 * This uses an attribute selector, i.e. the 'selector' value is wrapped in square quotes. See
 * https://stackoverflow.com/questions/34556277/angular2-table-rows-as-component for why this is needed to use this
 * in a table.
 */
/* tslint:disable:component-selector */
@Component({
  selector: '[app-kanban-view-header-row]',
  templateUrl: './kanban-view-header-row.component.html',
  styleUrls: ['./kanban-view-header-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewHeaderRowComponent implements OnInit {

  @Input()
  headerRow: List<HeaderView>;

  @Output()
  toggleColumnVisibility: EventEmitter<HeaderView> = new EventEmitter<HeaderView>();

  constructor() { }

  ngOnInit() {
  }


  onToggleVisibility(header: HeaderView) {
    this.toggleColumnVisibility.emit(header);
  }

}
