import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BoardsComponent} from './boards.component';
import {RouterTestingModule} from '@angular/router/testing';
import {RestUrlService} from '../../services/rest-url.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BoardsService} from '../../services/boards.service';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {AppHeaderService} from '../../services/app-header.service';


class MockBoardsService extends BoardsService {

  constructor() {
    super(null, null);
  }

  getProviders(): Array<any> {
    return [{ provide: BoardsService, useValue: this }];
  }

  loadBoardsList(summaryOnly: boolean): Observable<any[]> {
    return Observable.of([
      {'id': 1, 'code': 'POC1', 'name': 'Board 1'},
      {'id': 2, 'code': 'POC2', 'name': 'Board 2'}]
    );
  }
}

xdescribe('BoardsComponent', () => {
  let component: BoardsComponent;
  let fixture: ComponentFixture<BoardsComponent>;
  const mockBoardsService: MockBoardsService = new MockBoardsService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [ BoardsComponent ],
      providers: [
        AppHeaderService,
        RestUrlService,
        mockBoardsService.getProviders()
        ]
    })
    .compileComponents();

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('check list data', () => {
    component.boards.subscribe(
      data => {
        expect(data.length).toBe(2);
      },
      error => fail('Unexpected error ' + error)
    );
  });

  it ('check rendering ', () => {
    // TODO
    // const compiled = fixture.debugElement.nativeElement;
    // expect(compiled.querySelector('h1').textContent).toContain('app works!');

  })

});

