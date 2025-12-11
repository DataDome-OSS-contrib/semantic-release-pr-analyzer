import getStream from "get-stream";
import intoStream from "into-stream";
import { sync as parser } from "conventional-commits-parser";
import filter from "conventional-commits-filter";
import writer from "conventional-changelog-writer";

import loadChangelogConfig from "./lib/load-changelog-config.js";
import { getCommit } from "./utils.js";

import debugFactory from "debug";
const debug = debugFactory(
  "semantic-release:pr-analyzer:release-notes-generator"
);

export async function generateNotes(strategy, pluginConfig, context) {
  const commit = await getCommit(strategy, context.commits);

  const { parserOpts, writerOpts } = await loadChangelogConfig(
    pluginConfig,
    context
  );

  const changelogContext = {
    version: context.nextRelease.version,
  };

  const parsedCommits = filter(
    [commit]
      .filter(({ message, hash }) => {
        if (!message.trim()) {
          debug("Skip commit %s with empty message", hash);
          return false;
        }

        return true;
      })
      .map((rawCommit) => {
        const parsed = parser(rawCommit.message, { ...parserOpts });
        // Remove undefined date fields from parsed to avoid overwriting valid dates from rawCommit
        const { committerDate: _, authorDate: __, ...parsedWithoutDates } = parsed;
        const result = {
          ...rawCommit,
          ...parsedWithoutDates,
        };
        debug("Parsed commit before writer:", JSON.stringify({
          hash: result.hash,
          committerDate: result.committerDate,
          authorDate: result.authorDate,
          committerDateType: typeof result.committerDate,
          authorDateType: typeof result.authorDate,
        }));
        return result;
      })
  ).map((commit) => {
    // Keep dates as strings (ISO format) - they serialize better through streams
    // conventional-changelog-writer will parse them with new Date(dateString)

    // Remove any undefined date fields
    if (commit.committerDate === undefined) {
      delete commit.committerDate;
    }
    if (commit.authorDate === undefined) {
      delete commit.authorDate;
    }
    debug("Final commit to writer:", JSON.stringify({
      hash: commit.hash,
      committerDate: commit.committerDate,
      authorDate: commit.authorDate,
      committerDateType: typeof commit.committerDate,
      authorDateType: typeof commit.authorDate,
      hasCommitterDate: 'committerDate' in commit,
      hasAuthorDate: 'authorDate' in commit,
    }));
    return commit;
  });

  return getStream(
    intoStream.object(parsedCommits).pipe(writer(changelogContext, writerOpts))
  );
}
