// Em src/entities/SaleItem.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './Sale';       // Importa a entidade Sale (Pai)
import { Product } from './Product'; // Importa a entidade Product (Referenciada)

@Entity('SaleItems')
export class SaleItem {

    @PrimaryGeneratedColumn()
    id!: number;

    // --- Relacionamento Muitos-para-Um com Sale ---
    @Column() // Coluna que armazena a FK para Sales.id
    saleId!: number;

    @ManyToOne(() => Sale, (sale) => sale.items, {
        onDelete: 'CASCADE' // Se a Sale for deletada, este item também é
    })
    @JoinColumn({ name: 'saleId' }) // Especifica o nome da coluna FK
    sale!: Sale; // Propriedade para acessar a Venda pai

    // --- Relacionamento Muitos-para-Um com Product ---
    @Column() // Coluna que armazena a FK para Products.id
    productId!: number;

    @ManyToOne(() => Product, (product) => product.saleItems, {
        onDelete: 'NO ACTION' // Impede deletar um Product se ele estiver em SaleItems
    })
    @JoinColumn({ name: 'productId' }) // Especifica o nome da coluna FK
    product!: Product; // Propriedade para acessar o Produto vendido

    @Column({ type: 'int' })
    quantitySold!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    pricePerUnit!: number; // Preço de venda congelado

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    costPerUnit!: number; // Custo congelado
}