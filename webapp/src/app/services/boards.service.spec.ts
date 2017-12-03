import {async, TestBed} from '@angular/core/testing';

import {RouterTestingModule} from '@angular/router/testing';
import {RestUrlService} from '../services/rest-url.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {BoardsService} from './boards.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ProgressLogService} from './progress-log.service';

xdescribe('Boards Service', () => {
  let service: BoardsService;
  let httpMock: HttpTestingController;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [RestUrlService, BoardsService, ProgressLogService]
    })
      .compileComponents();

    service = TestBed.get(BoardsService);
    httpMock = TestBed.get(HttpTestingController);
  }));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it( 'Get Boards', () => {
    service.loadBoardsList(true)
      .subscribe(data => {
        expect(data).toEqual(getBordsListSummary());
      });

    httpMock.expectOne({url: 'rest/overbaard/1.0/boards.json', method: 'GET'})
      .flush({
      'configs': getBordsListSummary()});
    httpMock.verify();
  })

  it('Get Boards 401', () => {
    service.loadBoardsList(true)
      .subscribe(
        data => { expect(data).toBeFalsy() },
        error => {
          expect((<HttpErrorResponse>error).status).toBe(401);
          }
        );

    httpMock.expectOne('rest/overbaard/1.0/boards.json')
      .flush(null, {status: 401, statusText: 'Unauthorized'});
  });

  // TODO More tests of the other methods - perhaps it makes more sense to do that along with the component?
});

function  getBordsListSummary(): any {
  return [
    {'id': 1, 'code': 'POC1', 'name': 'Board 1'},
    {'id': 2, 'code': 'POC2', 'name': 'Board 2'}
  ];
}
