BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[SourceAsset]
ADD CONSTRAINT [SourceAsset_metadataJson_is_json]
CHECK ([metadataJson] IS NULL OR ISJSON([metadataJson]) = 1);

ALTER TABLE [dbo].[Source]
ADD CONSTRAINT [Source_processingStatus_valid]
CHECK ([processingStatus] IN (
  'new',
  'queued',
  'processing',
  'needs_review',
  'processed',
  'archived'
));

ALTER TABLE [dbo].[LearningItem]
ADD CONSTRAINT [LearningItem_usageMode_valid]
CHECK ([usageMode] IN ('active_use', 'understand_only'));

ALTER TABLE [dbo].[LearningItem]
ADD CONSTRAINT [LearningItem_learningStatus_valid]
CHECK ([learningStatus] IN (
  'unread',
  'ready',
  'learning',
  'active',
  'mastered',
  'archived'
));

ALTER TABLE [dbo].[ReviewEvent]
ADD CONSTRAINT [ReviewEvent_rating_valid]
CHECK ([rating] IN ('again', 'hard', 'good', 'easy'));

ALTER TABLE [dbo].[UsageEvent]
ADD CONSTRAINT [UsageEvent_outcome_valid]
CHECK ([outcome] IN ('used', 'partly_used', 'missed', 'needs_revision'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
