// Em src/app/directives/scroll-fade-in.directive.ts
import { Directive, ElementRef, inject, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollFadeIn]', // Como vamos usar a diretiva: <div appScrollFadeIn>
  standalone: true
})
export class ScrollFadeInDirective implements OnInit, OnDestroy {

  // Injeta a referência ao elemento HTML onde a diretiva foi colocada
  private element = inject(ElementRef); 
  private observer: IntersectionObserver | null = null;

  // Input opcional para definir um delay (ex: [delay]="100")
  @Input() delay: string = '0s'; 
  // Input opcional para definir a distância (ex: [translateY]="20")
  @Input() translateY: string = '20px'; 

  ngOnInit(): void {
    this.initObserver();
  }

  ngOnDestroy(): void {
    // Limpa o observer quando o componente é destruído
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initObserver(): void {
    // Prepara o estado inicial do elemento: invisível e ligeiramente deslocado
    const el = this.element.nativeElement as HTMLElement;
    el.style.opacity = '0';
    el.style.transform = `translateY(${this.translateY})`;
    el.style.transition = `opacity 0.6s ease-out, transform 0.6s ease-out`;
    el.style.transitionDelay = this.delay;

    const options = {
      root: null, // Observa em relação ao viewport principal
      rootMargin: '0px',
      threshold: 0.1 // Dispara quando 10% do elemento está visível
    };

    this.observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // O elemento entrou na tela! Aplica o estado final (visível)
          el.style.opacity = '1';
          el.style.transform = 'translateY(0px)';

          // Para de observar este elemento (a animação só acontece uma vez)
          obs.unobserve(el); 
        }
      });
    }, options);

    // Começa a observar o elemento
    this.observer.observe(el);
  }
}