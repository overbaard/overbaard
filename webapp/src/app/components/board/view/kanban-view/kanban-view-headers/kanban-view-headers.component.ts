import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HeadersView, HeaderView} from '../../../../../view-model/board/issue-table/headers-view';

@Component({
  selector: 'app-kanban-view-headers',
  templateUrl: './kanban-view-headers.component.html',
  styleUrls: ['./kanban-view-headers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewHeadersComponent implements OnInit {

  @Input()
  headers: HeadersView;

  @Input()
  boardLeftOffset = 0;

  @Output()
  toggleColumnVisibility: EventEmitter<HeaderView> = new EventEmitter<HeaderView>();

  constructor() { }

  ngOnInit() {
  }


  onToggleVisibility(header: HeaderView) {
    this.toggleColumnVisibility.emit(header);
  }

}
