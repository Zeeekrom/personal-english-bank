ALTER TABLE [Transcript]
ADD [sourceText] NVARCHAR(MAX);

EXEC sp_executesql N'
  UPDATE [Transcript]
  SET [sourceText] = [originalText]
  WHERE [sourceText] IS NULL;
';
