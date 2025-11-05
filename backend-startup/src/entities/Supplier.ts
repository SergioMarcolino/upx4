// Em src/entities/Supplier.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from './Product'; // Importa a entidade relacionada

@Entity('Suppliers') // Nome da tabela no SQL Server (sensível a maiúsculas/minúsculas dependendo da collation)
export class Supplier {

    @PrimaryGeneratedColumn() // Mapeia para INT IDENTITY(1,1) PRIMARY KEY
    id!: number;

    @Column({ type: 'nvarchar', length: 255 }) // Mapeia para NVARCHAR(255) NOT NULL
    companyName!: string;

    @Column({ type: 'nvarchar', length: 20, unique: true }) // Mapeia para NVARCHAR(20) NOT NULL UNIQUE
    cnpj!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true }) // Mapeia para NVARCHAR(255) NULL
    contactName!: string | null; // Usa ' | null ' para colunas opcionais

    @Column({ type: 'nvarchar', length: 20, nullable: true }) // Mapeia para NVARCHAR(20) NULL
    phone!: string | null;

    // --- Relacionamento (Opcional, mas útil) ---
    // Um fornecedor pode ter muitos produtos
    @OneToMany(() => Product, (product) => product.supplier)
    products!: Product[]; // Array de produtos associados a este fornecedor
}