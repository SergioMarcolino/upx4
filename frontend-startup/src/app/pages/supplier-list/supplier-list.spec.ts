import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierListComponent } from './supplier-list';

describe('SupplierList', () => {
  let component: SupplierListComponent;
  let fixture: ComponentFixture<SupplierListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
