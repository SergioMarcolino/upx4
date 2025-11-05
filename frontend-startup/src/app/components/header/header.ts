// Em src/app/components/header/header.component.ts
import { Component, Output, EventEmitter } from '@angular/core'; // 👈 Importar Output e EventEmitter
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ CommonModule, RouterLink, RouterLinkActive ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  
  // 👇 ADICIONE ESTA LINHA:
  // Cria um "emissor de eventos" chamado 'logoutClick'
  @Output() logoutClick = new EventEmitter<void>();

  constructor() { }

  // 👇 ADICIONE ESTA FUNÇÃO:
  // Esta função será chamada pelo HTML quando o avatar for clicado
  onAvatarClick(): void {
    console.log('Avatar clicado no HeaderComponent!'); // Log para debug
    this.logoutClick.emit(); // Emite o evento para o pai (Layout)
  }
}