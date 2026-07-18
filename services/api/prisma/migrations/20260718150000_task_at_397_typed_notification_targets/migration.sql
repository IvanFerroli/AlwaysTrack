ALTER TABLE "InAppNotification"
  ADD COLUMN "targetType" TEXT,
  ADD COLUMN "targetParamsJson" TEXT,
  ADD COLUMN "targetStatus" TEXT;

UPDATE "InAppNotification"
SET
  "targetType" = CASE
    WHEN "type" = 'faq.thread.promoted_to_wiki' AND "entityType" = 'FaqThread' THEN 'WIKI_PAGE'
    WHEN "entityType" IN ('SupportShiftAssignment', 'SupportShiftOccurrence', 'SupportExtraShiftSlot', 'SupportExtraShiftClaim', 'SupportShiftOffer') THEN 'SUPPORT_SCHEDULE'
    WHEN "entityType" IN ('SupportPauseSlot', 'SupportPauseBooking', 'SupportPauseSwap') THEN 'SUPPORT_PAUSE'
    WHEN "entityType" IN ('Announcement', 'AnnouncementOccurrence') THEN 'ANNOUNCEMENT'
    WHEN "entityType" IN ('WikiPage', 'WikiEditRequest') THEN 'WIKI_PAGE'
    WHEN "entityType" = 'FaqThread' THEN 'FAQ_THREAD'
    WHEN "entityType" = 'SupportCampaign' THEN 'SUPPORT_CAMPAIGN'
    WHEN "entityType" = 'SupportKpiEntry' THEN 'SUPPORT_PERFORMANCE'
    WHEN "entityType" = 'ServiceFlow' THEN 'SERVICE_FLOW'
    WHEN "entityType" IN ('OperationalScript', 'OperationalScriptSuggestion') THEN 'SCRIPT_LIBRARY'
    WHEN "entityType" = 'SalesDocument' THEN 'SALES_DOCUMENT'
    WHEN "entityType" = 'User' THEN 'PROFILE'
  END,
  "targetParamsJson" = CASE
    WHEN "type" = 'faq.thread.promoted_to_wiki' AND "entityType" = 'FaqThread' THEN jsonb_build_object('faqThreadId', "entityId")::text
    WHEN "entityType" = 'SupportShiftAssignment' THEN jsonb_build_object('scheduleId', "entityId")::text
    WHEN "entityType" = 'SupportShiftOccurrence' THEN jsonb_build_object('occurrenceId', "entityId")::text
    WHEN "entityType" = 'SupportExtraShiftSlot' THEN jsonb_build_object('slotId', "entityId")::text
    WHEN "entityType" = 'SupportExtraShiftClaim' THEN jsonb_build_object('claimId', "entityId")::text
    WHEN "entityType" = 'SupportShiftOffer' THEN jsonb_build_object('offerId', "entityId")::text
    WHEN "entityType" = 'SupportPauseSlot' THEN jsonb_build_object('slotId', "entityId")::text
    WHEN "entityType" = 'SupportPauseBooking' THEN jsonb_build_object('bookingId', "entityId")::text
    WHEN "entityType" = 'SupportPauseSwap' THEN jsonb_build_object('swapId', "entityId")::text
    WHEN "entityType" = 'Announcement' THEN jsonb_build_object('announcementId', "entityId")::text
    WHEN "entityType" = 'AnnouncementOccurrence' THEN jsonb_build_object('occurrenceId', "entityId")::text
    WHEN "entityType" = 'WikiPage' THEN jsonb_build_object('pageId', "entityId")::text
    WHEN "entityType" = 'WikiEditRequest' THEN jsonb_build_object('requestId', "entityId")::text
    WHEN "entityType" = 'FaqThread' THEN jsonb_build_object('threadId', "entityId")::text
    WHEN "entityType" = 'SupportCampaign' THEN jsonb_build_object('campaignId', "entityId")::text
    WHEN "entityType" = 'SupportKpiEntry' THEN jsonb_build_object('entryId', "entityId")::text
    WHEN "entityType" = 'ServiceFlow' THEN jsonb_build_object('flowId', "entityId")::text
    WHEN "entityType" = 'OperationalScript' THEN jsonb_build_object('scriptId', "entityId")::text
    WHEN "entityType" = 'OperationalScriptSuggestion' THEN jsonb_build_object('suggestionId', "entityId")::text
    WHEN "entityType" = 'SalesDocument' THEN jsonb_build_object('documentId', "entityId")::text
    WHEN "entityType" = 'User' THEN jsonb_build_object('userId', "entityId")::text
  END,
  "targetStatus" = 'AVAILABLE'
WHERE "entityId" IS NOT NULL
  AND (
    ("type" = 'faq.thread.promoted_to_wiki' AND "entityType" = 'FaqThread')
    OR "entityType" IN (
      'SupportShiftAssignment', 'SupportShiftOccurrence', 'SupportExtraShiftSlot', 'SupportExtraShiftClaim', 'SupportShiftOffer',
      'SupportPauseSlot', 'SupportPauseBooking', 'SupportPauseSwap', 'Announcement', 'AnnouncementOccurrence', 'WikiPage',
      'WikiEditRequest', 'FaqThread', 'SupportCampaign', 'SupportKpiEntry', 'ServiceFlow', 'OperationalScript',
      'OperationalScriptSuggestion', 'SalesDocument', 'User'
    )
  );

CREATE INDEX "InAppNotification_targetType_targetStatus_idx"
  ON "InAppNotification"("targetType", "targetStatus");
