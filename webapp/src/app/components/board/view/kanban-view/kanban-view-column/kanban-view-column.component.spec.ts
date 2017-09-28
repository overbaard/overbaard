import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanViewColumnComponent } from './kanban-view-column.component';
import {BoardIssueComponent} from '../../../issue/board-issue.component';

describe('KanbanViewColumnComponent', () => {
  let component: KanbanViewColumnComponent;
  let fixture: ComponentFixture<KanbanViewColumnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BoardIssueComponent,
        KanbanViewColumnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KanbanViewColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
