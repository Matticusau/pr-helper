//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Merge on Schedule handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, ConfigHelper } from './classes';

export default async function prMergeOnScheduleHandler(core: CoreModule, github: GitHubModule, config: ConfigHelper) {

  try {
    
    // make sure we should proceed
    // core.debug('config.configuration.prmerge.check: ' + JSON.stringify(config.configuration.prmerge.check));
    if (config.configuration.prmerge.check === true) {
      
      const prhelper = new PRHelper;
      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
          ...github.context.repo,
          state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){
        const { data: pullRequest } = await octokit.pulls.get({
          ...github.context.repo,
          pull_number: pullRequestList[iPr].number,
        });
        
        core.info('\n\npullRequest: ' + JSON.stringify(pullRequest));

        // merge the PR if criteria is met
        if (prhelper.isMergeReadyByState(core, pullRequest)) {
          if (await prhelper.isMergeReadyByLabel(core, github, config, pullRequest)) {
            core.info(`Merged PR #${pullRequest.number}`);
            await octokit.pulls.merge({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                pull_number: pullRequest.number,
                sha : pullRequest.head.sha, // safe guard no other pushes since starting action
                merge_method: config.configuration.prmerge.mergemethod,
            });
          } else {
            core.info(`PR #${pullRequest.number} labels do not allow merge`);
          }
        } else {
          core.info(`PR #${pullRequest.number} state does not allow merge, no action taken`);
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}
