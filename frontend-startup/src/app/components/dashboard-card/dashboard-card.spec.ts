import { ComponentFixture, TestBed } from '@angular/core/testing';

import {DashboardCardComponent } from './dashboard-card';

describe('DashboardCard', () => {
  let component: DashboardCardComponent;
  let fixture: ComponentFixture<DashboardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
