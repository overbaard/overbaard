import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {KanbanViewHeaderComponent} from './kanban-view-header.component';
import {List} from 'immutable';

describe('KanbanViewHeaderComponent', () => {
  let component: KanbanViewHeaderComponent;
  let fixture: ComponentFixture<KanbanViewHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KanbanViewHeaderComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KanbanViewHeaderComponent);
    component = fixture.componentInstance;
    component.header = {
      name: 'Test',
      abbreviated: '',
      rows: 1,
      cols: 1,
      wip: 0,
      backlog: false,
      states: List<number>(),
      visible: true,
      visibleIssues: 5,
      totalIssues: 10
    }
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should be created', () => {
    expect(component.header).toBeTruthy();
  });
});
