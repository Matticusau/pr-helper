//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Pull Request Reviewer helper
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-07-26   MLavery     Extended merge handling for both onDemand and onSchedule [issue #24]
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper, PRFileHelper } from './classes';

async function prReviewHandler(core: CoreModule, github: GitHubModule, prnumber: number) {

  try {

    // TODO: Come back to this and review for onschedule

    // only on new PR
    // if (github.context.eventName === 'pull_request' 
    //     && github.context.payload.action === 'opened') {
    if (github.context.eventName === 'pull_request') {

      // const prhelper = new PRHelper(core, github);
      const filehelper = new PRFileHelper(core, github);
      const messagehelper = new MessageHelper;
      //const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('No pull request number parameter supplied, exiting');
        return;
      }
      core.info(`Processing PR ${prnumber}!`);
  
      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // check if the reviewers need to be retrieved from the YAML front matter
      if (core.getInput('enable-prreviewer-frontmatter') === 'true') {
        
        const { data: pullRequest } = await octokit.pulls.get({
          ...github.context.repo,
          pull_number: prnumber,
        });

        // make sure the PR is open
        if (pullRequest.state !== 'closed') {

          // make sure it hasn't merged
          if (pullRequest.merged === false) {

            const changedFiles = await filehelper.getChangedFiles(pullRequest);
            const reviewerList : string[] = [];
            // core.info('changedFiles: ' + JSON.stringify(changedFiles));

            if (changedFiles) {
              for(let iFile = 0; iFile < changedFiles.data.length; iFile++) {
                const tmpReviewerList : string[] = await filehelper.getReviewerListFromFrontMatter(pullRequest, changedFiles.data[iFile]);
                // core.info('tmpReviewerList: ' + JSON.stringify(tmpReviewerList));
                tmpReviewerList.forEach(element => {
                  reviewerList.push(element.trim());
                });
              }
            }

            // Add the reviewers
            if (github.context.eventName === 'pull_request' 
              // && github.context.payload.action === 'opened'
              && reviewerList.length > 0) {
              // core.info('reviewerList: ' + JSON.stringify(reviewerList));
              await octokit.pulls.requestReviewers({
                ...github.context.repo,
                pull_number: prnumber,
                reviewers: reviewerList
              });
            }
          } else {
            core.info(`PR #${prnumber} is merged, no reviewer automation taken`);
          }
        } else {
          core.info(`PR #${prnumber} is closed, no reviewer automation taken`);
        }
      }
      
    }    
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }

}


// 
// OnDemand
//
export async function prReviewHandler_OnDemand(core: CoreModule, github: GitHubModule) {

  core.debug('>> prReviewHandler_OnDemand');

  try {

    // check if the reviewers need to be retrieved from the YAML front matter
    if (core.getInput('enable-prreviewer-frontmatter') === 'true') {

      const prhelper = new PRHelper(core, github);
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      // core.info(`Processing PR ${prnumber}!`)
      
      // process the pull request
      await prReviewHandler(core, github, prnumber);

    }

  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

// 
// OnSchedule
//
export async function prReviewHandler_OnSchedule(core: CoreModule, github: GitHubModule) {

  core.debug('>> prReviewHandler_OnSchedule');

  try {
    // check if the reviewers need to be retrieved from the YAML front matter
    if (core.getInput('enable-prreviewer-frontmatter') === 'true') {

      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
        ...github.context.repo,
        state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){

        // process the pull request
        await prReviewHandler(core, github, pullRequestList[iPr].number);
      
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}