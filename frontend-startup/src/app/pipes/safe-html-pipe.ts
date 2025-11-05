import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {

  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (value === null || value === undefined) {
      // Retorna um SVG vazio seguro como fallback, em vez de string vazia
      // Isso evita que o Angular reclame sobre innerHTML vazio em alguns casos
       return this.sanitizer.bypassSecurityTrustHtml('<svg></svg>');
    }
    // Marca o HTML (o path do SVG) como seguro
    // Usar sanitize pode ser mais seguro se a string SVG vier de fonte externa,
    // mas bypassSecurityTrustHtml é geralmente usado para SVGs internos.
    return this.sanitizer.bypassSecurityTrustHtml(value);
    // Alternativa mais segura se a string SVG pudesse vir de fora:
    // return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
  }
}