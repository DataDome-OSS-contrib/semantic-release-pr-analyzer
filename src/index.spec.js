import { jest } from "@jest/globals";

// Set up mocks before imports
const mockAnalyzeCommits = jest.fn().mockResolvedValue();
const mockGenerateNotes = jest.fn().mockResolvedValue();

jest.unstable_mockModule("./commit-analyzer.js", () => ({
  analyzeCommits: mockAnalyzeCommits,
}));

jest.unstable_mockModule("./release-notes-generator.js", () => ({
  generateNotes: mockGenerateNotes,
}));

// Import modules dynamically after mocks are configured
const { analyzeCommits, generateNotes } = await import("../index.js");

describe("analyzeCommits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("works when there is no plugin config specified, defaults to github strategy", () => {
    return analyzeCommits().then(() => {
      expect(mockAnalyzeCommits).toBeCalledWith("github", {}, undefined);
    });
  });

  it("throws an error when the strategy is unknown", () => {
    const strategy = "foo";
    return analyzeCommits({ strategy }).then(
      () => {
        throw new Error("Should not be there");
      },
      (err) => {
        expect(err.message).toBe(
          "Invalid strategy: foo. Available options: github, strict-github, pull-request, strict-pull-request"
        );
      }
    );
  });

  it("should pass the whole config down to the commit-analyzer", () => {
    const cfg = { foo: "bar" };
    return analyzeCommits(cfg).then(() => {
      expect(mockAnalyzeCommits).toBeCalledWith("github", cfg, undefined);
    });
  });

  it("should enrich the custom configuration for commit-analyzer", () => {
    const cfg = { foo: "bar", commitAnalyzerConfig: { baz: "feed" } };
    return analyzeCommits(cfg).then(() => {
      expect(mockAnalyzeCommits).toBeCalledWith(
        "github",
        { ...cfg, baz: "feed" },
        undefined
      );
    });
  });

  it("should override default configuration for commit-analyzer", () => {
    const cfg = { foo: "bar", commitAnalyzerConfig: { foo: "baz" } };
    return analyzeCommits(cfg).then(() => {
      expect(mockAnalyzeCommits).toBeCalledWith(
        "github",
        { ...cfg, foo: "baz" },
        undefined
      );
    });
  });
});

describe("generateNotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("works when there is no plugin config specified, defaults to github strategy", () => {
    return generateNotes().then(() => {
      expect(mockGenerateNotes).toBeCalledWith("github", {}, undefined);
    });
  });

  it("throws an error when the strategy is unknown", () => {
    const strategy = "foo";
    return generateNotes({ strategy }).then(
      () => {
        throw new Error("Should not be there");
      },
      (err) => {
        expect(err.message).toBe(
          "Invalid strategy: foo. Available options: github, strict-github, pull-request, strict-pull-request"
        );
      }
    );
  });

  it("should pass the whole config down to the release-notes-generator", () => {
    const cfg = { foo: "bar" };
    return generateNotes(cfg).then(() => {
      expect(mockGenerateNotes).toBeCalledWith("github", cfg, undefined);
    });
  });

  it("should enrich the custom configuration for release-notes-generator", () => {
    const cfg = { foo: "bar", notesGeneratorConfig: { baz: "feed" } };
    return generateNotes(cfg).then(() => {
      expect(mockGenerateNotes).toBeCalledWith(
        "github",
        { ...cfg, baz: "feed" },
        undefined
      );
    });
  });

  it("should override default configuration for release-notes-generator", () => {
    const cfg = { foo: "bar", notesGeneratorConfig: { foo: "baz" } };
    return generateNotes(cfg).then(() => {
      expect(mockGenerateNotes).toBeCalledWith(
        "github",
        { ...cfg, foo: "baz" },
        undefined
      );
    });
  });
});
