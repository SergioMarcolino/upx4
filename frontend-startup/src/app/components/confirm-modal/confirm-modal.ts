import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.css']
})
export class ConfirmModalComponent {

  // Inputs para customizar o modal
  @Input() title: string = 'Confirmar Ação';
  @Input() message: string = 'Você tem certeza que deseja continuar?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() theme: 'primary' | 'danger' = 'primary'; // 'danger' para ações destrutivas (como deletar)
  
  // Input/Output para controlar a visibilidade (two-way binding)
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  // Eventos de saída
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // Helper para classes do botão de confirmação
  get confirmButtonClasses(): string {
    if (this.theme === 'danger') {
      return 'bg-red-600 hover:bg-red-700'; // Vermelho para perigo
    }
    return 'bg-blue-600 hover:bg-blue-700'; // Azul padrão
  }

  // Funções
  onConfirm(): void {
    this.confirm.emit();
    this.close();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
  }
}