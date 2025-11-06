import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Importe seus serviços e interfaces
import { SupplierService } from '../../services/supplier';
import { ProductService } from '../../services/product';
import { ISupplierResponse } from '../../interfaces/supplier-response';
import { IProductResponse } from '../../interfaces/product-response';

@Component({
  selector: 'app-supplier-list', 
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    DecimalPipe 
  ],
  templateUrl: './supplier-list.html', 
  styleUrls: ['./supplier-list.css']
})
export class SupplierListComponent implements OnInit {

  // Injeções
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private renderer = inject(Renderer2);

  // Estado da UI
  isLoading = true;
  errorMessage: string | null = null;
  

  suppliers: ISupplierResponse[] = [];
  products: IProductResponse[] = [];

  public isModalOpen = false;
  public isModalClosing = false;
  public selectedSupplier: ISupplierResponse | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      suppliers: this.supplierService.listSuppliers(),
      products: this.productService.listProducts() 
    }).pipe(
      catchError((err: Error) => {
        this.errorMessage = `Erro ao carregar dados: ${err.message}`;
        return of({ suppliers: [], products: [] }); 
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      this.suppliers = response.suppliers;
      this.products = response.products;
    });
  }


  getProductsForSupplier(supplierId: number): IProductResponse[] {
    return this.products.filter(p => p.supplierId === supplierId);
  }


  openSupplierModal(supplier: ISupplierResponse): void {
    this.selectedSupplier = supplier;
    this.isModalClosing = false;
    this.isModalOpen = true;
    this.renderer.addClass(document.body, 'modal-open');
  }

  closeSupplierModal(): void {
    if (this.isModalClosing) return;
    this.isModalClosing = true;

    setTimeout(() => {
      this.isModalOpen = false;
      this.isModalClosing = false;
      this.selectedSupplier = null;
      this.renderer.removeClass(document.body, 'modal-open');
    }, 300); 
  }
}