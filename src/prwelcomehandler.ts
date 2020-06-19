//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request welcomer
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, ConfigHelper } from './classes';

export default async function prWelcomeHandler(core: CoreModule, github: GitHubModule, config: ConfigHelper) {

  try {
    const prhelper = new PRHelper;
    const prnumber = prhelper.getPrNumber(github.context);
    if (!prnumber) {
      console.log('Could not get pull request number from context, exiting');
      return;
    }
    console.log(`Processing PR ${prnumber}!`);
  
    // check if this is a new PR
    // if (github.context.eventName === 'pull_request' && github.context.payload.action !== 'opened') {
    //   console.log('No issue or pull request was opened, skipping');
    //   return;
    // }

    // check if the welcome message is to be processed
    if (config.configuration.welcomemessage.check) {

      const welcomeMessage = config.configuration.welcomemessage.message; // core.getInput('welcome-message');
      const myToken = core.getInput('repo-token');

      // add the welcome message if needed
      // check if this is a new PR
      if (github.context.eventName === 'pull_request' 
        && github.context.payload.action === 'opened'
        && welcomeMessage.length > 0) {
        
        const octokit = github.getOctokit(myToken);
        
        // const octokit = github.getOctokit(myToken);
        await octokit.issues.createComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: prnumber,
          body: welcomeMessage
        });
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }

}


function getPrNumber(context: Context): number | undefined {
  const pullRequest = context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}
