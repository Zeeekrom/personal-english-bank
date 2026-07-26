import { describe, expect, it } from "vitest";
import { parseTranscript } from "./transcript-parser.js";

describe("parseTranscript", () => {
  it("parses Otter speaker timestamps", () => {
    const parsed = parseTranscript(
      "Speaker 1  0:04  \nHello there.\n\nSpeaker 2  1:10  \nHi."
    );
    expect(parsed.format).toBe("speaker_timestamp");
    expect(parsed.segments).toHaveLength(2);
    expect(parsed.segments[1]?.startMs).toBe(70_000);
  });

  it("pairs AR glass English and Chinese blocks", () => {
    const parsed = parseTranscript(
      "Translate 1\n\nunknown\n\n07/09\n\nThere you are.\n你来了。\n\nThank you.\n\n谢谢。"
    );
    expect(parsed.format).toBe("bilingual_blocks");
    expect(parsed.segments[0]?.translationText).toBe("你来了。");
    expect(parsed.segments[0]?.text).toBe("There you are.");
  });

  it("keeps low-confidence mixed text as source segments", () => {
    const parsed = parseTranscript("Unknown speaker 00:24  \n好。What? 什么 here？");
    expect(parsed.language).toBe("mixed");
    expect(parsed.segments[0]?.diarizationKey).toBe("Unknown speaker");
  });
});
