-- CreateIndex
CREATE UNIQUE INDEX "NotificationJob_licenseId_notificationRuleId_periodKey_key" ON "NotificationJob"("licenseId", "notificationRuleId", "periodKey");

