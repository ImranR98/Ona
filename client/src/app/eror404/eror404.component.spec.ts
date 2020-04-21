import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Eror404Component } from './eror404.component';

describe('Eror404Component', () => {
  let component: Eror404Component;
  let fixture: ComponentFixture<Eror404Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Eror404Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Eror404Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
