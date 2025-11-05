// Em src/entities/Sale.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';

import { SaleItem } from './SaleItem'; 

@Entity('Sales')
export class Sale {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount!: number;

    // Usa @CreateDateColumn para que o TypeORM gerencie automaticamente a data/hora de criação
    // Mapeia para DATETIME2 automaticamente
    @CreateDateColumn({ type: 'datetime2' })
    createdAt!: Date;

    // --- Relacionamento Um-para-Muitos com SaleItem ---
    // Uma Venda (Sale) pode ter muitos Itens de Venda (SaleItem)
    // O 'cascade: true' faz com que, ao salvar uma Sale com novos items, os items também sejam salvos.
    // O 'eager: true' (opcional) faria com que os items fossem carregados automaticamente sempre que buscar uma Sale. Cuidado com performance.
    @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true /*, eager: true */ })
    items!: SaleItem[];

    // Poderia adicionar um @ManyToOne para User aqui se quisesse relacionar a venda a um usuário.
    // @Column({ nullable: true }) // Coluna para FK
    // userId: number | null;
    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'userId' })
    // user: User | null;
}