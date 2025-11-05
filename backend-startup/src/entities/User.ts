
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Users') 
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'nvarchar', length: 255 }) 
    password!: string;

}