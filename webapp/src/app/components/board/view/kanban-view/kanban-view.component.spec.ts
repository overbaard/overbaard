import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {KanbanViewComponent} from './kanban-view.component';
import {KanbanViewHeadersComponent} from './kanban-view-headers/kanban-view-headers.component';
import {KanbanViewHeaderRowComponent} from './kanban-view-headers/kanban-view-header-row.component';
import {KanbanViewHeaderComponent} from './kanban-view-headers/kanban-view-header.component';

describe('KanbanViewComponent', () => {
  let component: KanbanViewComponent;
  let fixture: ComponentFixture<KanbanViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KanbanViewComponent,
        KanbanViewHeadersComponent,
        KanbanViewHeaderRowComponent,
        KanbanViewHeaderComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KanbanViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
