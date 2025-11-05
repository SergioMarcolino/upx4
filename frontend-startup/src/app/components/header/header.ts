import { Component, Output, EventEmitter } from '@angular/core'; 
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
  
  @Output() logoutClick = new EventEmitter<void>();

  constructor() { }

  onAvatarClick(): void {
    console.log('Avatar clicado no HeaderComponent!'); 
    this.logoutClick.emit(); 
  }
}