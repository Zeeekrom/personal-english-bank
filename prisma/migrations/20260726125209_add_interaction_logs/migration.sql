BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InteractionLog] (
    [id] NVARCHAR(36) NOT NULL,
    [sourceId] NVARCHAR(36) NOT NULL,
    [eventTitle] NVARCHAR(500) NOT NULL,
    [eventDate] DATETIME2,
    [scenario] NVARCHAR(200),
    [whatHappened] NVARCHAR(max),
    [whatTheySaid] NVARCHAR(max),
    [whatISaid] NVARCHAR(max),
    [whatIIntended] NVARCHAR(max),
    [whatWentWrong] NVARCHAR(max),
    [betterVersion] NVARCHAR(max),
    [followUp] NVARCHAR(max),
    [reflection] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InteractionLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [InteractionLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InteractionLog_sourceId_eventDate_idx] ON [dbo].[InteractionLog]([sourceId], [eventDate]);

-- AddForeignKey
ALTER TABLE [dbo].[InteractionLog] ADD CONSTRAINT [InteractionLog_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[Source]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
