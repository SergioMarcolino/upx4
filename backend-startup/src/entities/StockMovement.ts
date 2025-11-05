
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './Product'; 


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


    @Column() 
    productId!: number;

    @ManyToOne(() => Product, (product) => product.stockMovements, {
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'productId' })
    product!: Product;

    @Column({
        type: 'nvarchar',
        length: 50,
        enum: MovementType 
    })
    type!: MovementType;

    @Column({ type: 'int' })
    quantity!: number; 

    @CreateDateColumn({ type: 'datetime2' })
    createdAt!: Date;
}