// Em src/entities/Product.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Supplier } from './Supplier'; // Importa a entidade relacionada
import { StockMovement } from './StockMovement'; // Importa StockMovement (criaremos depois)
import { SaleItem } from './SaleItem'; // Importa SaleItem (criaremos depois)

@Entity('Products')
export class Product {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 255 })
    title!: string;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    description!: string | null;

    @Column({ type: 'nvarchar', length: 100 })
    category!: string;

    @Column({ type: 'nvarchar', length: 50, default: 'anunciado' })
    status!: string; // 'anunciado' | 'desativado' (TypeORM não valida CHECK constraints diretamente)

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    imageBase64!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    purchase_price!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    sale_price!: number;

    @Column({ type: 'int', default: 0 })
    quantity!: number; // Cache do estoque

    @Column({ type: 'datetime2', default: () => 'GETDATE()' }) // Usa função SQL para default
    date!: Date; // TypeORM mapeia datetime2 para o tipo Date do JS

    // --- Relacionamento com Fornecedor ---
    @Column() // Coluna que armazena a chave estrangeira
    supplierId!: number;    

    @ManyToOne(() => Supplier, (supplier) => supplier.products, {
         // onDelete: 'NO ACTION', // Comportamento FK (gerenciado pelo DB)
         // onUpdate: 'CASCADE' 
    })
    @JoinColumn({ name: 'supplierId' }) // Especifica qual coluna desta entidade é a FK
    supplier!: Supplier; // Propriedade para acessar o objeto Supplier relacionado

    // --- Relacionamentos Inversos (Opcional) ---
    @OneToMany(() => StockMovement, (movement) => movement.product)
    stockMovements!: StockMovement[];

    @OneToMany(() => SaleItem, (item) => item.product)
    saleItems!: SaleItem[];
}