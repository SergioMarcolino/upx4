// Em src/entities/StockMovement.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './Product'; // Importa a entidade relacionada

// Re-define o Enum aqui ou importe do types.ts se preferir (cuidado com dependências circulares)
// Se importar do types.ts, garanta que types.ts não importe nada de /entities
enum MovementType {
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  INITIAL_ADJUSTMENT = "INITIAL_ADJUSTMENT",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"
}


@Entity('StockMovements')
export class StockMovement {

    @PrimaryGeneratedColumn()
    id!: number;

    // --- Relacionamento Muitos-para-Um com Product ---
    @Column() // Coluna da FK
    productId!: number;

    @ManyToOne(() => Product, (product) => product.stockMovements, {
        onDelete: 'CASCADE' // Se o Produto for deletado, suas movimentações também são
    })
    @JoinColumn({ name: 'productId' })
    product!: Product;

    @Column({
        type: 'nvarchar',
        length: 50,
        enum: MovementType // Usa o Enum para restringir os valores (TypeORM pode mapear para CHECK)
    })
    type!: MovementType;

    @Column({ type: 'int' })
    quantity!: number; // Negativo para saídas, Positivo para entradas

    @CreateDateColumn({ type: 'datetime2' })
    createdAt!: Date;
}