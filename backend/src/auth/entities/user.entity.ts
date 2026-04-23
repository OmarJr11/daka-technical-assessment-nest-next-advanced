import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * Represents persisted user credentials and identity.
 */
@Entity('users', { schema: 'system' })
export class User {
  @Index({ unique: true })
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ select: false, length: 100 })
  password?: string;
}
