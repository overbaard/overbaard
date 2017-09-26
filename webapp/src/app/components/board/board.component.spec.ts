import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {BoardComponent} from './board.component';
import {AppHeaderService} from '../../services/app-header.service';
import {RouterTestingModule} from '@angular/router/testing';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ BoardComponent ],
      providers: [AppHeaderService]
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
