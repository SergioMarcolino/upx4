// Em src/app/pages/layout/layout.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router'; 
import { UserAuthService } from '../../services/user-auth'; // Seu serviço de Auth
import { HeaderComponent } from '../../components/header/header'; // Importado
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal'; // Importado

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,       
    ConfirmModalComponent  
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout {

  private authService = inject(UserAuthService);
  private router = inject(Router);

  public isLogoutModalOpen = false;

  onLogoutClicked(): void {
    console.log('LayoutComponent ouviu o clique!'); 
    this.isLogoutModalOpen = true; 
  }

  handleLogoutConfirm(): void {
    this.authService.removeUserToken(); 
    
    this.router.navigate(['/']); 
    
    this.isLogoutModalOpen = false; 
  }
  
  handleLogoutCancel(): void {
    this.isLogoutModalOpen = false;
  }
}