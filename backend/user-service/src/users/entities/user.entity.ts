import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.PLAYER })
  role: Role;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
