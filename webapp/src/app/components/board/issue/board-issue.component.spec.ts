import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardIssueComponent } from './board-issue.component';

describe('BoardIssueComponent', () => {
  let component: BoardIssueComponent;
  let fixture: ComponentFixture<BoardIssueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoardIssueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
