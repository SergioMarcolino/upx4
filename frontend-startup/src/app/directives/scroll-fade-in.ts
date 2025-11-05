import { Directive, ElementRef, inject, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollFadeIn]', 
  standalone: true
})
export class ScrollFadeInDirective implements OnInit, OnDestroy {

  private element = inject(ElementRef); 
  private observer: IntersectionObserver | null = null;

  @Input() delay: string = '0s'; 
  @Input() translateY: string = '20px'; 

  ngOnInit(): void {
    this.initObserver();
  }

  ngOnDestroy(): void {
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
      root: null, 
      rootMargin: '0px',
      threshold: 0.1 
    };

    this.observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0px)';

          obs.unobserve(el); 
        }
      });
    }, options);

    // Começa a observar o elemento
    this.observer.observe(el);
  }
}