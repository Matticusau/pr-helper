//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Pull Request Reviewer helper
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper, PRFileHelper } from './classes';

export default async function prReviewHandler(core: CoreModule, github: GitHubModule) {

  try {
    // only on new PR
    // if (github.context.eventName === 'pull_request' 
    //     && github.context.payload.action === 'opened') {
    if (github.context.eventName === 'pull_request') {

      const prhelper = new PRHelper(core, github);
      const filehelper = new PRFileHelper(core, github);
      const messagehelper = new MessageHelper;
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
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

        const changedFiles = await filehelper.getChangedFiles(pullRequest);
        const reviewerList : string[] = [];
        // core.info('changedFiles: ' + JSON.stringify(changedFiles));
        
        if (changedFiles) {
          for(let iFile = 0; iFile < changedFiles.data.length; iFile++) {
            const tmpReviewerList : string[] = await filehelper.getReviewerListFromFrontMatter(pullRequest, changedFiles.data[iFile]);
            // core.info('tmpReviewerList: ' + JSON.stringify(tmpReviewerList));
            tmpReviewerList.forEach(element => {
              reviewerList.push(element);
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
      }
      
    }    
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }

}


// function getPrNumber(context: Context): number | undefined {
//   const pullRequest = context.payload.pull_request;
//   if (!pullRequest) {
//     return undefined;
//   }

//   return pullRequest.number;
// }
