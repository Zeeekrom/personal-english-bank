ALTER TABLE [Source]
ADD [summaryCn] NVARCHAR(MAX),
    [curatedBy] NVARCHAR(50) NOT NULL
        CONSTRAINT [Source_curatedBy_df] DEFAULT 'codex_manual';

ALTER TABLE [TranscriptSegment]
ADD [rawText] NVARCHAR(MAX),
    [rawTranslationText] NVARCHAR(MAX),
    [curationDecision] NVARCHAR(20) NOT NULL
        CONSTRAINT [TranscriptSegment_curationDecision_df] DEFAULT 'keep',
    [curationNotes] NVARCHAR(MAX);

ALTER TABLE [LearningItem]
ADD [sourceTranslation] NVARCHAR(MAX),
    [refinedEnglish] NVARCHAR(MAX),
    [refinedChinese] NVARCHAR(MAX),
    [mainIssue] NVARCHAR(MAX);

ALTER TABLE [ReviewEvent]
ADD [completionMode] NVARCHAR(30) NOT NULL
        CONSTRAINT [ReviewEvent_completionMode_df] DEFAULT 'manual_complete';
