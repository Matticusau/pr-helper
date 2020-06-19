//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request label handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, ConfigHelper } from './classes';

export default async function prLabelHandler(core: CoreModule, github: GitHubModule, config: ConfigHelper) {

  try {
    
    // make sure we should proceed
    if (config.configuration.prmerge.check === true) {

      const prhelper = new PRHelper;
      const prnumber = prhelper.getPrNumber(github.context);
      if (!prnumber) {
        console.log('Could not get pull request number from context, exiting');
        return;
      }
      console.log(`Processing PR ${prnumber}!`);
    
      // This should be a token with access to your repository scoped in as a secret.
      // The YML workflow will need to set myToken with the GitHub Secret Token
      // myToken: ${{ secrets.GITHUB_TOKEN }}
      // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
      const myToken = core.getInput('repo-token');

      const octokit = github.getOctokit(myToken);

      const { data: pullRequest } = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: prnumber,
      });
      const { data: pullRequestReviews } = await octokit.pulls.listReviews({
        ...github.context.repo,
        pull_number: prnumber,
      });
      // console.log('<< start PR payload >>');
      // console.log(pullRequest);
      // console.log('<< end PR payload >>');
      
      // make sure the PR is open
      if (pullRequest.state !== 'closed') {

        // make sure it hasn't merged
        if (pullRequest.merged === false) {
          if (pullRequest.mergeable === true && (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable')) {
            await octokit.issues.addLabels({
              owner: github.context.repo.owner,
              repo: github.context.repo.repo,
              issue_number: prnumber,
              labels: [config.configuration.prmerge.labels.automergelabel]
            });
          } else if (pullRequest.requested_reviewers.length >= 0 && pullRequestReviews.length === 0) {
            await octokit.issues.addLabels({
              owner: github.context.repo.owner,
              repo: github.context.repo.repo,
              issue_number: prnumber,
              labels: [config.configuration.prmerge.labels.reviewrequiredlabel]
            });
            
          }
        } else {
          core.info(`PR #${prnumber} is merged, no action taken`);

        }
      } else {
        core.info(`PR #${prnumber} is closed, no action taken`);
      }
    }
      
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

