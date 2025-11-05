
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from './Product'; 

@Entity('Suppliers') 
export class Supplier {

    @PrimaryGeneratedColumn() 
    id!: number;

    @Column({ type: 'nvarchar', length: 255 }) 
    companyName!: string;

    @Column({ type: 'nvarchar', length: 20, unique: true }) 
    cnpj!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true }) 
    contactName!: string | null; 

    @Column({ type: 'nvarchar', length: 20, nullable: true }) 
    phone!: string | null;


    @OneToMany(() => Product, (product) => product.supplier)
    products!: Product[]; 
}