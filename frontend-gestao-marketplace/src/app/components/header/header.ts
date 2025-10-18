import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 👈 Importe as diretivas

@Component({
  selector: 'app-header',
  standalone: true, // É um componente standalone
  imports: [
    RouterLink,       // Para a diretiva routerLink
    RouterLinkActive  // Para as diretivas routerLinkActive e [routerLinkActiveOptions]
    // ... outros módulos necessários
  ],
  templateUrl: './header.html', // Ou o nome correto
  styleUrls: ['./header.css']
})
export class Header {
  // ...
}