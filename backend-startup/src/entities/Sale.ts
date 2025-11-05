import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';

import { SaleItem } from './SaleItem'; 

@Entity('Sales')
export class Sale {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount!: number;


    @CreateDateColumn({ type: 'datetime2' })
    createdAt!: Date;

    @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true /*, eager: true */ })
    items!: SaleItem[];

}