import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ProductService } from '../../services/product';
import { SaleService } from '../../services/sale';
import { SaleItemDTO, SaleRequestDTO } from '../../interfaces/sale-request';
import { IProductResponse } from '../../interfaces/product-response';

interface ProductForSale extends IProductResponse {
  quantityToSell: number;
}

@Component({
  selector: 'app-sales',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule   
  ],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css']
})
export class SalesComponent implements OnInit {

  // Injeção de dependência no novo estilo
  private productService = inject(ProductService);
  private saleService = inject(SaleService);

  // Listas
  allProducts: ProductForSale[] = []; 
  cart: SaleItemDTO[] = [];           

  // Estado da UI
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }


  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    // Usa o productService (que já trata o 'response.data')
    this.productService.listProducts().subscribe({
      next: (products) => {
        this.allProducts = products.map(p => ({
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

  /**
   * Adiciona um item ao carrinho de venda
   */
  addToCart(product: ProductForSale): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (product.quantityToSell <= 0) {
      this.errorMessage = 'A quantidade deve ser maior que zero.';
      return;
    }
    
    // Validação extra: Não deixar adicionar mais do que o estoque
    if (product.quantityToSell > product.quantity) {
      this.errorMessage = `Estoque insuficiente. Disponível: ${product.quantity}`;
      return;
    }
    
    // Verifica se o item já está no carrinho
    const existingItem = this.cart.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity = product.quantityToSell;
    } else {
      this.cart.push({
        productId: product.id,
        quantity: product.quantityToSell
      });
    }
    
    this.successMessage = `${product.title} adicionado ao carrinho.`;
  }

  /**
   * Envia o carrinho para a API para finalizar a venda
   */
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
      next: (saleResponse) => {
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

  // --- Funções Auxiliares para o HTML ---
  
  getCartTotal(): number {
    let total = 0;
    for (const item of this.cart) {
      const product = this.allProducts.find(p => p.id === item.productId);
      if (product) {
        total += product.sale_price * item.quantity;
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