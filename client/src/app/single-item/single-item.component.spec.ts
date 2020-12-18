import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SingleItemComponent } from './single-item.component';

describe('SingleItemComponent', () => {
  let component: SingleItemComponent;
  let fixture: ComponentFixture<SingleItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
