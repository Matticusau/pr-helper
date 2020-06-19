//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Merge handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { IssueLabels, PRHelper, ConfigHelper } from './classes';

export default async function prMergeHandler(core: CoreModule, github: GitHubModule, config: ConfigHelper) {

  try {
    
    // make sure we should proceed
    // console.log('config.configuration.prmerge.check: ' + JSON.stringify(config.configuration.prmerge.check));
    if (config.configuration.prmerge.check === true) {
      const prhelper = new PRHelper;
      const prnumber = prhelper.getPrNumber(github.context);
      if (!prnumber) {
        console.log('Could not get pull request number from context, may not be a pull request event, exiting');
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

      // make sure the PR is open
      if (pullRequest.state !== 'closed') {
        if (pullRequest.merged === false) {
          if (pullRequest.mergeable === true && (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable')) {
            
            // console.log('prmerge check enabled');

            // console.log('config..readytomergelabel: ' + config.configuration.prmerge.labels.readytomergelabel);
            // console.log('config..reviewrequiredlabel: ' + config.configuration.prmerge.labels.reviewrequiredlabel);
            // console.log('config..onholdlabel: ' + config.configuration.prcomments.onholdlabel);
            // check the labels
            const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
              ...github.context.repo,
              issue_number: prnumber,
            });
            var issueLabels = new IssueLabels(issueLabelsData);
            const readyToMergeLabel = (issueLabels.hasLabelFromList([config.configuration.prmerge.labels.readytomergelabel]));
            const NotReadyToMergeLabel = (issueLabels.hasLabelFromList([config.configuration.prmerge.labels.reviewrequiredlabel, config.configuration.prcomments.onholdlabel]));
            
            if (readyToMergeLabel && !NotReadyToMergeLabel) {

              await octokit.pulls.merge({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                pull_number: prnumber,
                sha : pullRequest.head.sha, // safe guard no other pushes since starting action
                merge_method: config.configuration.prmerge.mergemethod,
              });
            } else {
              core.info(`PR #${prnumber} labels do not allow merge`);
            }
            
          }
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
