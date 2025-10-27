import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common'; // Importa pipes
import { SafeHtmlPipe } from '../../pipes/safe-html-pipe';

// Define os temas de cores possíveis, inspirados no Nebular
type CardTheme = 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-dashboard-card', // Nome do seletor para usar no HTML
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, SafeHtmlPipe], // Adiciona pipes aos imports
  templateUrl: './dashboard-card.html',
  styleUrls: ['./dashboard-card.css']
})
export class DashboardCardComponent {
  // Entradas para customizar o card
  @Input() title: string = 'Título Padrão';
  @Input() value: number | string | null = 0; // Pode ser número ou string formatada
  @Input() icon: string = 'cube'; // Nome do ícone Heroicons (outline)
  @Input() theme: CardTheme = 'primary'; // Tema de cor padrão
  @Input() unit: string = ''; // Unidade (R$, %, unid., etc.) - Opcional
  @Input() subtitle: string | null = null; // Texto secundário (Opcional)
  @Input() loading: boolean = false; // Estado de carregamento (Opcional)
  @Input() valueIsCurrency: boolean = false; // Indica se o valor deve ser formatado como moeda

  // Helper para obter classes CSS baseadas no tema
  get themeClasses() {
    switch (this.theme) {
      case 'success':
        return {
          iconBg: 'bg-emerald-100', // Fundo do ícone
          iconText: 'text-emerald-600', // Cor do ícone
          valueText: 'text-emerald-600' // Cor do valor (opcional)
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-100',
          iconText: 'text-orange-600',
          valueText: 'text-orange-600'
        };
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
          valueText: 'text-red-600'
        };
      case 'info':
        return {
          iconBg: 'bg-cyan-100',
          iconText: 'text-cyan-600',
          valueText: 'text-cyan-600'
        };
      case 'primary': // Default
      default:
        return {
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          valueText: 'text-gray-900' // Valor geralmente é escuro no primário
        };
    }
  }

  // Objeto para mapear nomes de ícones para seus paths SVG (Outline do Heroicons)
  // Adicione mais ícones conforme precisar
  heroicons: { [key: string]: string } = {
    'currency-dollar': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.818V12m9 2.818V12m-9-6.75h.008v.008H7.5V8.068Zm2.25 0h.008v.008H9.75V8.068Zm2.25 0h.008v.008H12V8.068Zm2.25 0h.008v.008H14.25V8.068Zm2.25 0h.008v.008H16.5V8.068Zm-9.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm2.25 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm2.25 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm2.25 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm2.25 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />',
    'banknotes': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75H21a.75.75 0 0 0 .75-.75V5.25m-18 13.5-1.168-1.125a1.875 1.875 0 0 1 0-2.625l1.168-1.125" />',
    'archive-box': '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10.5 11.25h6" />',
    'cube': '<path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />',
    'exclamation-triangle': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />',
    'building-office': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 21h7.5M12 6.75h.008v.008H12V6.75Z" />'
    // Adicione outros ícones aqui (nome: path_d_do_svg)
  };
}