import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {BoardComponent} from './board.component';
import {AppHeaderService} from '../../services/app-header.service';
import {RouterTestingModule} from '@angular/router/testing';
import {RestUrlService} from '../../services/rest-url.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {reducer} from '../../app-store';
import {StoreModule} from '@ngrx/store';
import {RankViewComponent} from './view/rank-view/rank-view.component';
import {KanbanViewComponent} from './view/kanban-view/kanban-view.component';
import {KanbanViewHeadersComponent} from './view/kanban-view/kanban-view-headers/kanban-view-headers.component';
import {KanbanViewHeaderRowComponent} from './view/kanban-view/kanban-view-headers/kanban-view-header-row.component';
import {KanbanViewHeaderComponent} from './view/kanban-view/kanban-view-headers/kanban-view-header.component';
import {BoardIssueComponent} from './issue/board-issue.component';
import {KanbanViewColumnComponent} from './view/kanban-view/kanban-view-column/kanban-view-column.component';
import {ControlPanelComponent} from './control-panel/control-panel.component';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, StoreModule.provideStore(reducer)],
      declarations: [
        BoardComponent,
        BoardIssueComponent,
        ControlPanelComponent,
        KanbanViewComponent,
        KanbanViewColumnComponent,
        KanbanViewHeadersComponent,
        KanbanViewHeaderRowComponent,
        KanbanViewHeaderComponent,
        RankViewComponent ],
      providers: [AppHeaderService, RestUrlService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
