import { Component, inject, OnInit, Renderer2 } from '@angular/core'; 
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms'; 
import { ProductService } from '../../services/product';
import { SaleService } from '../../services/sale';
import { SaleItemDTO, SaleRequestDTO } from '../../interfaces/sale-request';
import { IProductResponse } from '../../interfaces/product-response';
import { SaleResponse } from '../../interfaces/sale-response';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface ProductForSale extends IProductResponse {
  quantityToSell: number;
}

@Component({
  selector: 'app-sales',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule, 
    DecimalPipe
  ],
  providers: [ DecimalPipe ],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css']
})
export class SalesComponent implements OnInit {

  // Injeção de dependência
  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private renderer = inject(Renderer2); 

  // Listas
  allProducts: ProductForSale[] = []; 
  filteredProducts: ProductForSale[] = []; 
  cart: SaleItemDTO[] = [];           

  // Estado da UI
  isLoading = false;
  isSearching = false; 
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  isProductModalOpen = false;
  isProductModalClosing = false;
  productSearchTerm = new FormControl('');
  private searchSubscription: Subscription;

  constructor() {
    this.searchSubscription = this.productSearchTerm.valueChanges.pipe(
      debounceTime(300) 
    ).subscribe(term => {
      this.filterProducts(term || '');
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
   
    this.searchSubscription.unsubscribe();
  }

  loadProducts(): void {
    this.isLoading = true; 
    this.errorMessage = null;
    
    this.productService.listActiveProducts().subscribe({
      next: (activeProducts) => {
        this.allProducts = activeProducts.map(p => ({
          ...p,
          quantityToSell: 1 
        }));
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = `Falha ao carregar produtos: ${err.message}`;
        this.isLoading = false;
      }
    });
  }


  filterProducts(term: string): void {
    this.isSearching = true;
    if (!term) {
      this.filteredProducts = this.allProducts; 
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredProducts = this.allProducts.filter(p => 
        p.title.toLowerCase().includes(lowerTerm)
      );
    }
    this.isSearching = false;
  }

  addToCart(product: ProductForSale): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (product.status === 'desativado') {
      this.errorMessage = 'Este produto está desativado.';
      return;
    }
    if (product.quantityToSell <= 0) {
      this.errorMessage = 'A quantidade deve ser maior que zero.';
      return;
    }
    if (product.quantityToSell > product.quantity) {
      this.errorMessage = `Estoque insuficiente. Disponível: ${product.quantity}`;
      return;
    }
    
    const existingItem = this.cart.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantityToSell;
    } else {
      this.cart.push({
        productId: product.id,
        quantity: product.quantityToSell
      });
    }
    
    this.successMessage = `${product.title} (x${product.quantityToSell}) adicionado ao carrinho.`;
    product.quantityToSell = 1; 
    this.closeProductModal(); 
  }


  finalizeSale(): void {
    if (this.cart.length === 0) {
      this.errorMessage = 'O carrinho está vazio.';
      return;
    }
    
    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const saleRequest: SaleRequestDTO = {
      items: this.cart
    };

  	this.saleService.createSale(saleRequest).subscribe({
  	  next: (saleResponse: SaleResponse) => { 
  		this.isLoading = false;
  		this.successMessage = `Venda #${saleResponse.id} finalizada! Total: R$ ${saleResponse.totalAmount}`;
  		this.cart = []; 
  		this.loadProducts(); 
  	  },
  	  error: (err: Error) => {
  		this.isLoading = false;
  		this.errorMessage = err.message; 
  	  }
  	});
  }

  openProductModal(): void {
    this.isProductModalOpen = true;
    this.isProductModalClosing = false;
    this.renderer.addClass(document.body, 'modal-open');
    this.filterProducts(this.productSearchTerm.value || ''); 
  }

  closeProductModal(): void {
    if (this.isProductModalClosing) return;
    this.isProductModalClosing = true;

    setTimeout(() => {
      this.isProductModalOpen = false;
      this.isProductModalClosing = false;
      this.renderer.removeClass(document.body, 'modal-open');
    }, 300); 
  }

  getCartTotal(): number {
    let total = 0;
    for (const item of this.cart) {
      const product = this.allProducts.find(p => p.id === item.productId);
      if (product) {
        total += Number(product.sale_price) * Number(item.quantity);
      }
    }
    return total;
  }
  
  getProductTitle(productId: number): string {
    return this.allProducts.find(p => p.id === productId)?.title || 'Produto desconhecido';
  }
  
  removeFromCart(productId: number): void {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.successMessage = null;
  }
}