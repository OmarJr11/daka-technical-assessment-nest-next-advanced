import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUser1776909660430 implements MigrationInterface {
  name = 'CreateTableUser1776909660430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "system"`);
    await queryRunner.query(
      `CREATE TABLE "system"."users" ("id" SERIAL NOT NULL, "username" character varying(30) NOT NULL, "password" character varying(100) NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a3ffb1c0c8416b9fc6f907b743" ON "system"."users" ("id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "system"."users" ("username") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "system"."IDX_fe0bb3f6520ee0469504521e71"`,
    );
    await queryRunner.query(
      `DROP INDEX "system"."IDX_a3ffb1c0c8416b9fc6f907b743"`,
    );
    await queryRunner.query(`DROP TABLE "system"."users"`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS "system"`);
  }
}
