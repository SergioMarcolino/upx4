// Em src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Users') // Nome da tabela no SQL Server
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'nvarchar', length: 255 }) // Armazena o HASH da senha
    password!: string;

    // Você pode adicionar outras colunas aqui se precisar (nome, data de criação, etc.)
    // Ex: @Column({ type: 'nvarchar', length: 100, nullable: true })
    //     name: string | null;

    // Não há relacionamentos diretos de User com outras tabelas neste esquema,
    // mas você poderia adicionar um @OneToMany para Sales se quisesse rastrear qual usuário fez qual venda.
}