import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {KanbanViewComponent} from './kanban-view.component';
import {KanbanViewHeadersComponent} from './kanban-view-headers/kanban-view-headers.component';

describe('KanbanViewComponent', () => {
  let component: KanbanViewComponent;
  let fixture: ComponentFixture<KanbanViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KanbanViewComponent, KanbanViewHeadersComponent ]
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
