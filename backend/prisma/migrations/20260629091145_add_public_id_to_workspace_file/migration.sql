/*
  Warnings:

  - Added the required column `publicId` to the `WorkspaceFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkspaceFile" ADD COLUMN     "publicId" TEXT NOT NULL;
