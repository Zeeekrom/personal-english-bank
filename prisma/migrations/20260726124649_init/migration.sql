BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Source] (
    [id] NVARCHAR(36) NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [sourceType] NVARCHAR(50) NOT NULL CONSTRAINT [Source_sourceType_df] DEFAULT 'unknown',
    [language] NVARCHAR(30) NOT NULL CONSTRAINT [Source_language_df] DEFAULT 'unknown',
    [scenario] NVARCHAR(100),
    [containsMySpeech] BIT NOT NULL CONSTRAINT [Source_containsMySpeech_df] DEFAULT 0,
    [processingPriority] INT NOT NULL CONSTRAINT [Source_processingPriority_df] DEFAULT 0,
    [processingStatus] NVARCHAR(30) NOT NULL CONSTRAINT [Source_processingStatus_df] DEFAULT 'new',
    [capturedAt] DATETIME2,
    [importedAt] DATETIME2 NOT NULL CONSTRAINT [Source_importedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Source_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Source_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SourceAsset] (
    [id] NVARCHAR(36) NOT NULL,
    [sourceId] NVARCHAR(36) NOT NULL,
    [assetType] NVARCHAR(30) NOT NULL CONSTRAINT [SourceAsset_assetType_df] DEFAULT 'transcript_text',
    [originalName] NVARCHAR(500) NOT NULL,
    [relativePath] NVARCHAR(1000) NOT NULL,
    [externalPath] NVARCHAR(2000) NOT NULL,
    [contentHash] NVARCHAR(64) NOT NULL,
    [mimeType] NVARCHAR(150),
    [byteSize] BIGINT NOT NULL,
    [metadataJson] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SourceAsset_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SourceAsset_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SourceAsset_contentHash_key] UNIQUE NONCLUSTERED ([contentHash])
);

-- CreateTable
CREATE TABLE [dbo].[Transcript] (
    [id] NVARCHAR(36) NOT NULL,
    [sourceId] NVARCHAR(36) NOT NULL,
    [provider] NVARCHAR(50) NOT NULL CONSTRAINT [Transcript_provider_df] DEFAULT 'import',
    [format] NVARCHAR(30) NOT NULL CONSTRAINT [Transcript_format_df] DEFAULT 'plain',
    [language] NVARCHAR(30) NOT NULL CONSTRAINT [Transcript_language_df] DEFAULT 'unknown',
    [originalText] NVARCHAR(max) NOT NULL,
    [cleanedText] NVARCHAR(max),
    [version] INT NOT NULL CONSTRAINT [Transcript_version_df] DEFAULT 1,
    [isCurrent] BIT NOT NULL CONSTRAINT [Transcript_isCurrent_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Transcript_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Transcript_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Speaker] (
    [id] NVARCHAR(36) NOT NULL,
    [displayName] NVARCHAR(200) NOT NULL,
    [role] NVARCHAR(30) NOT NULL CONSTRAINT [Speaker_role_df] DEFAULT 'unknown',
    [isMe] BIT NOT NULL CONSTRAINT [Speaker_isMe_df] DEFAULT 0,
    [privacyLabel] NVARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Speaker_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Speaker_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TranscriptSpeaker] (
    [id] NVARCHAR(36) NOT NULL,
    [transcriptId] NVARCHAR(36) NOT NULL,
    [diarizationKey] NVARCHAR(100) NOT NULL,
    [speakerId] NVARCHAR(36),
    [displayLabel] NVARCHAR(200) NOT NULL,
    [manuallyMapped] BIT NOT NULL CONSTRAINT [TranscriptSpeaker_manuallyMapped_df] DEFAULT 0,
    CONSTRAINT [TranscriptSpeaker_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TranscriptSpeaker_transcriptId_diarizationKey_key] UNIQUE NONCLUSTERED ([transcriptId],[diarizationKey])
);

-- CreateTable
CREATE TABLE [dbo].[TranscriptSegment] (
    [id] NVARCHAR(36) NOT NULL,
    [transcriptId] NVARCHAR(36) NOT NULL,
    [speakerId] NVARCHAR(36),
    [diarizationKey] NVARCHAR(100),
    [segmentIndex] INT NOT NULL,
    [startMs] INT,
    [endMs] INT,
    [text] NVARCHAR(max) NOT NULL,
    [translationText] NVARCHAR(max),
    [confidence] FLOAT(53),
    [manuallyVerified] BIT NOT NULL CONSTRAINT [TranscriptSegment_manuallyVerified_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TranscriptSegment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TranscriptSegment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TranscriptSegment_transcriptId_segmentIndex_key] UNIQUE NONCLUSTERED ([transcriptId],[segmentIndex])
);

-- CreateTable
CREATE TABLE [dbo].[LearningItem] (
    [id] NVARCHAR(36) NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [itemType] NVARCHAR(50) NOT NULL CONSTRAINT [LearningItem_itemType_df] DEFAULT 'my_better_version',
    [chineseIntention] NVARCHAR(max),
    [originalText] NVARCHAR(max),
    [explanationCn] NVARCHAR(max),
    [usageMode] NVARCHAR(30) NOT NULL CONSTRAINT [LearningItem_usageMode_df] DEFAULT 'active_use',
    [learningStatus] NVARCHAR(30) NOT NULL CONSTRAINT [LearningItem_learningStatus_df] DEFAULT 'ready',
    [difficulty] INT NOT NULL CONSTRAINT [LearningItem_difficulty_df] DEFAULT 1,
    [priority] INT NOT NULL CONSTRAINT [LearningItem_priority_df] DEFAULT 0,
    [lastUsedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LearningItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [LearningItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LearningItemVariant] (
    [id] NVARCHAR(36) NOT NULL,
    [learningItemId] NVARCHAR(36) NOT NULL,
    [variantType] NVARCHAR(30) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [register] NVARCHAR(30),
    [sortOrder] INT NOT NULL CONSTRAINT [LearningItemVariant_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LearningItemVariant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LearningItemVariant_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LearningItemVariant_learningItemId_variantType_key] UNIQUE NONCLUSTERED ([learningItemId],[variantType])
);

-- CreateTable
CREATE TABLE [dbo].[LearningItemSource] (
    [id] NVARCHAR(36) NOT NULL,
    [learningItemId] NVARCHAR(36) NOT NULL,
    [sourceId] NVARCHAR(36) NOT NULL,
    [segmentId] NVARCHAR(36),
    [relationType] NVARCHAR(30) NOT NULL CONSTRAINT [LearningItemSource_relationType_df] DEFAULT 'derived_from',
    CONSTRAINT [LearningItemSource_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LearningItemSource_learningItemId_sourceId_segmentId_key] UNIQUE NONCLUSTERED ([learningItemId],[sourceId],[segmentId])
);

-- CreateTable
CREATE TABLE [dbo].[ReviewSchedule] (
    [learningItemId] NVARCHAR(36) NOT NULL,
    [nextReviewAt] DATETIME2 NOT NULL,
    [intervalDays] INT NOT NULL CONSTRAINT [ReviewSchedule_intervalDays_df] DEFAULT 1,
    [repetitions] INT NOT NULL CONSTRAINT [ReviewSchedule_repetitions_df] DEFAULT 0,
    [suspended] BIT NOT NULL CONSTRAINT [ReviewSchedule_suspended_df] DEFAULT 0,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ReviewSchedule_pkey] PRIMARY KEY CLUSTERED ([learningItemId])
);

-- CreateTable
CREATE TABLE [dbo].[ReviewEvent] (
    [id] NVARCHAR(36) NOT NULL,
    [learningItemId] NVARCHAR(36) NOT NULL,
    [reviewedAt] DATETIME2 NOT NULL CONSTRAINT [ReviewEvent_reviewedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [rating] NVARCHAR(10) NOT NULL,
    [responseText] NVARCHAR(max),
    [previousStatus] NVARCHAR(30) NOT NULL,
    [newStatus] NVARCHAR(30) NOT NULL,
    [nextReviewAt] DATETIME2 NOT NULL,
    [intervalDays] INT NOT NULL,
    [notes] NVARCHAR(max),
    CONSTRAINT [ReviewEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UsageEvent] (
    [id] NVARCHAR(36) NOT NULL,
    [learningItemId] NVARCHAR(36) NOT NULL,
    [sourceId] NVARCHAR(36),
    [usedAt] DATETIME2 NOT NULL CONSTRAINT [UsageEvent_usedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [scenario] NVARCHAR(200),
    [outcome] NVARCHAR(30) NOT NULL CONSTRAINT [UsageEvent_outcome_df] DEFAULT 'used',
    [notes] NVARCHAR(max),
    CONSTRAINT [UsageEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Source_processingStatus_processingPriority_importedAt_idx] ON [dbo].[Source]([processingStatus], [processingPriority], [importedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SourceAsset_sourceId_idx] ON [dbo].[SourceAsset]([sourceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transcript_sourceId_isCurrent_idx] ON [dbo].[Transcript]([sourceId], [isCurrent]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Speaker_isMe_idx] ON [dbo].[Speaker]([isMe]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TranscriptSpeaker_speakerId_idx] ON [dbo].[TranscriptSpeaker]([speakerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TranscriptSegment_speakerId_idx] ON [dbo].[TranscriptSegment]([speakerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LearningItem_learningStatus_priority_createdAt_idx] ON [dbo].[LearningItem]([learningStatus], [priority], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LearningItemSource_segmentId_idx] ON [dbo].[LearningItemSource]([segmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ReviewSchedule_suspended_nextReviewAt_idx] ON [dbo].[ReviewSchedule]([suspended], [nextReviewAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ReviewEvent_learningItemId_reviewedAt_idx] ON [dbo].[ReviewEvent]([learningItemId], [reviewedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UsageEvent_learningItemId_usedAt_idx] ON [dbo].[UsageEvent]([learningItemId], [usedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[SourceAsset] ADD CONSTRAINT [SourceAsset_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[Source]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Transcript] ADD CONSTRAINT [Transcript_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[Source]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TranscriptSpeaker] ADD CONSTRAINT [TranscriptSpeaker_transcriptId_fkey] FOREIGN KEY ([transcriptId]) REFERENCES [dbo].[Transcript]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TranscriptSpeaker] ADD CONSTRAINT [TranscriptSpeaker_speakerId_fkey] FOREIGN KEY ([speakerId]) REFERENCES [dbo].[Speaker]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TranscriptSegment] ADD CONSTRAINT [TranscriptSegment_transcriptId_fkey] FOREIGN KEY ([transcriptId]) REFERENCES [dbo].[Transcript]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TranscriptSegment] ADD CONSTRAINT [TranscriptSegment_speakerId_fkey] FOREIGN KEY ([speakerId]) REFERENCES [dbo].[Speaker]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LearningItemVariant] ADD CONSTRAINT [LearningItemVariant_learningItemId_fkey] FOREIGN KEY ([learningItemId]) REFERENCES [dbo].[LearningItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LearningItemSource] ADD CONSTRAINT [LearningItemSource_learningItemId_fkey] FOREIGN KEY ([learningItemId]) REFERENCES [dbo].[LearningItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LearningItemSource] ADD CONSTRAINT [LearningItemSource_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[Source]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LearningItemSource] ADD CONSTRAINT [LearningItemSource_segmentId_fkey] FOREIGN KEY ([segmentId]) REFERENCES [dbo].[TranscriptSegment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ReviewSchedule] ADD CONSTRAINT [ReviewSchedule_learningItemId_fkey] FOREIGN KEY ([learningItemId]) REFERENCES [dbo].[LearningItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ReviewEvent] ADD CONSTRAINT [ReviewEvent_learningItemId_fkey] FOREIGN KEY ([learningItemId]) REFERENCES [dbo].[LearningItem]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UsageEvent] ADD CONSTRAINT [UsageEvent_learningItemId_fkey] FOREIGN KEY ([learningItemId]) REFERENCES [dbo].[LearningItem]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UsageEvent] ADD CONSTRAINT [UsageEvent_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[Source]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
