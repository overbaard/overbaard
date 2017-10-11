import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {KanbanViewHeaderRowComponent} from './kanban-view-header-row.component';
import {KanbanViewHeaderComponent} from './kanban-view-header.component';

describe('KanbanViewHeaderRowComponent', () => {
  let component: KanbanViewHeaderRowComponent;
  let fixture: ComponentFixture<KanbanViewHeaderRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KanbanViewHeaderRowComponent,
        KanbanViewHeaderComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KanbanViewHeaderRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
