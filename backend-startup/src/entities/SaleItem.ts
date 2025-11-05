import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './Sale';       
import { Product } from './Product'; 

@Entity('SaleItems')
export class SaleItem {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column() 
    saleId!: number;

    @ManyToOne(() => Sale, (sale) => sale.items, {
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'saleId' }) 
    sale!: Sale; 

    @Column() 
    productId!: number;

    @ManyToOne(() => Product, (product) => product.saleItems, {
        onDelete: 'NO ACTION' 
    })
    @JoinColumn({ name: 'productId' }) 
    product!: Product; 

    @Column({ type: 'int' })
    quantitySold!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    pricePerUnit!: number; 

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    costPerUnit!: number; 
}