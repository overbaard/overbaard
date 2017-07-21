import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStoreComponent } from './test-store.component';

describe('TestStoreComponent', () => {
  let component: TestStoreComponent;
  let fixture: ComponentFixture<TestStoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestStoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
