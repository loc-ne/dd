import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVnpayTransactionNoToTransactions1735458000000 implements MigrationInterface {
    name = 'AddVnpayTransactionNoToTransactions1735458000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "vnpay_transaction_no" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "vnpay_transaction_no"`);
    }
}
