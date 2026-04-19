-- CreateEnum
CREATE TYPE "admin_audit_action_t" AS ENUM ('user_block', 'user_unblock', 'user_role_promote', 'user_role_demote', 'account_plan_change', 'account_limits_change', 'account_status_change');

-- CreateEnum
CREATE TYPE "admin_audit_target_t" AS ENUM ('portal_user', 'openclaw_account');

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_portal_user_id" UUID NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" "admin_audit_action_t" NOT NULL,
    "target_type" "admin_audit_target_t" NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_label" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_portal_user_id_idx" ON "admin_audit_logs"("actor_portal_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "admin_audit_logs"("target_type", "target_id");
