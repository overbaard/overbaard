import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanViewHeadersComponent } from './kanban-view-headers.component';
import {KanbanViewHeaderRowComponent} from './kanban-view-header-row.component';
import {KanbanViewHeaderComponent} from './kanban-view-header.component';

describe('KanbanViewHeadersComponent', () => {
  let component: KanbanViewHeadersComponent;
  let fixture: ComponentFixture<KanbanViewHeadersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KanbanViewHeadersComponent,
        KanbanViewHeaderRowComponent,
        KanbanViewHeaderComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KanbanViewHeadersComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should be created', () => {
    // expect(component).toBeTruthy();
  });
});
