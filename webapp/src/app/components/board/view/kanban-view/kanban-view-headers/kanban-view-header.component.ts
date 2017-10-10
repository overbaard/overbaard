import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Header} from '../../../../../model/board/header/header';

/**
 * This uses an attribute selector, i.e. the 'selector' value is wrapped in square quotes. See
 * https://stackoverflow.com/questions/34556277/angular2-table-rows-as-component for why this is needed to use this
 * in a table.
 */
/* tslint:disable:component-selector */
@Component({
  selector: '[app-kanban-view-header]',
  templateUrl: './kanban-view-header.component.html',
  styleUrls: ['./kanban-view-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewHeaderComponent implements OnInit {
  @Input() header: Header;

  constructor() { }

  ngOnInit() {
  }

}
