//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request label handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper, IssueLabels, GlobHelper } from './classes'; // MatchConfig

export default async function prLabelHandler(core: CoreModule, github: GitHubModule) {

  try {
    
    const messageHelper = new MessageHelper;

    // make sure we should proceed
    if (core.getInput('enable-prlabel-automation') === 'true') {

      const prhelper = new PRHelper;
      const prnumber = prhelper.getPrNumber(github.context);
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      core.info(`Processing PR ${prnumber}!`);
    
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
      // const { data: pullRequestReviews } = await octokit.pulls.listReviews({
      //   ...github.context.repo,
      //   pull_number: prnumber,
      // });
      
      // get the current labels
      const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
        ...github.context.repo,
        issue_number: prnumber,
      });
      var issueLabels = new IssueLabels(issueLabelsData);

      // core.debug('<< start PR payload >>');
      // core.debug(pullRequest);
      // core.debug('<< end PR payload >>');
      
      // make sure the PR is open
      if (pullRequest.state !== 'closed') {

        // make sure it hasn't merged
        if (pullRequest.merged === false) {
          if (pullRequest.mergeable === true && (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable' || pullRequest.mergeable_state === 'blocked')) {
            let autoMergeQualify : boolean = false;
            // should we check the glob paths
            if (core.getInput('enable-prmerge-automation') === 'true' && core.getInput('enable-prmerge-pathcheck') === 'true') {
              // get the changed files
              const changedFiles: string[] = await prhelper.getChangedFiles(core, github, pullRequest);

              // check the glob paths
              let globHelper : GlobHelper = new GlobHelper(core, github);
              // let matchConfig : MatchConfig = globHelper.matchConfigFromActionInputYaml(core.getInput('permerge-allowpaths'));
              if (globHelper.checkGlobs(changedFiles, globHelper.matchConfigFromActionInputYaml(core.getInput('permerge-allowpaths')))) {
                autoMergeQualify = true;
              }
            }
            
            if (autoMergeQualify) {
              issueLabels.addLabel(core.getInput('prlabel-automerge'));
            } else {
              issueLabels.removeLabel(core.getInput('prlabel-automerge'));
            }
          } else {
            // remove the auto merge label
            issueLabels.removeLabel(core.getInput('prlabel-automerge'));
          }
          
          // check if we need reviews
          if (await prhelper.isMergeReadyByReview(core, github, pullRequest)) {
            issueLabels.removeLabel(core.getInput('prlabel-reviewrequired'));
          } else {
            issueLabels.addLabel(core.getInput('prlabel-reviewrequired'));
          }

          core.debug('issueLabels.haschanges: ' + issueLabels.haschanges);
          core.debug('issueLabels.labels: ' + JSON.stringify(issueLabels.labels));

          if (issueLabels.haschanges) {
            // set the label
            await octokit.issues.setLabels({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: prnumber,
                labels: issueLabels.labels
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

