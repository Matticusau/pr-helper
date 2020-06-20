//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Comment handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
//

import { CoreModule, GitHubModule, Context } from './types'; // , Client
import { IssueLabels, PRHelper, MessageHelper } from './classes';

// export default async function prHandler(core: CoreModule, context: Context, client: Client) { //, octokit: Client
export default async function prCommentHandler(core: CoreModule, github: GitHubModule) {

    try {

        const messageHelper = new MessageHelper;

        // make sure we should proceed
        // if (config.configuration.prcomments.check === true) {
        if (core.getInput('enable-prcomment-automation') === 'true'){
        
            // core.debug('context: ' + JSON.stringify(github.context));
            const prhelper = new PRHelper;
            const issuenumber = prhelper.getPrNumber(github.context);
            if (!issuenumber) {
                core.error('Could not get issue number from context, exiting');
                return;
            }
            core.info(`Processing Issue/PR ${issuenumber}!`);

            const commentnumber = prhelper.getCommentNumber(github.context);
            if (!commentnumber) {
                core.error('Could not get comment number from context, exiting');
                return;
            }
            core.info(`Processing Comment ${commentnumber}!`);
        
            // This should be a token with access to your repository scoped in as a secret.
            // The YML workflow will need to set myToken with the GitHub Secret Token
            // myToken: ${{ secrets.GITHUB_TOKEN }}
            // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
            const myToken = core.getInput('repo-token');

            const octokit = github.getOctokit(myToken);
            // core.debug('octokit: ' + JSON.stringify(octokit));

            // check if this is a new comment
            core.info('github.context.payload.action: ' + github.context.payload.action);
            if (github.context.payload.action === 'created') {

                // get the PR 
                const { data: pullRequest } = await octokit.pulls.get({
                    ...github.context.repo,
                    pull_number: issuenumber,
                });

                if (!pullRequest) {
                    core.error('Could not get pull request, exiting');
                    return;
                }

                // make sure the PR is open
                if (pullRequest.state !== 'closed') {

                    // get the pr comment
                    const { data: prComment } = await octokit.issues.getComment({
                        ...github.context.repo,
                        comment_id: commentnumber,
                    });
                    // core.debug('got the pr comment');

                    const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                        ...github.context.repo,
                        issue_number: issuenumber,
                    });

                    // var labelArray = [];
                    // for (var i=0; i < issueLabelsData.length; i++) {
                    //     labelArray.push(issueLabelsData[i].name);
                    // }
                                    
                    // var labelsChanged = false;

                    // make sure this is the same person that authored the PR
                    if (pullRequest.user.id === prComment.user.id) {

                        var issueLabels = new IssueLabels(issueLabelsData);

                        // core.debug('body: ' + prComment.body);
                        if (prComment.body.includes('#pr-ready')) {
                            // make sure the PR is mergable
                            if (pullRequest.mergeable !== true || pullRequest.mergeable_state === 'dirty') {
                                // add the comment to inform
                                await octokit.issues.createComment({
                                    owner: github.context.repo.owner,
                                    repo: github.context.repo.repo,
                                    issue_number: issuenumber,
                                    body: messageHelper.prcommentautomationdirtypr
                                });
                            } else {
                                // update the labels
                                // core.debug('1 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                                // issueLabels.removeLabel(config.configuration.prcomments.onholdlabel);
                                // core.debug('2 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                                // issueLabels.addLabel(config.configuration.prcomments.prreadylabel);
                                // core.debug('3 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                                issueLabels.removeLabel(core.getInput('prlabel-onhold'));
                                issueLabels.addLabel(core.getInput('prlabel-ready'));
                            }
                        } else if (prComment.body.includes('#pr-onhold')) {
                            // // clear labels
                            // core.debug('4 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                            // issueLabels.removeLabel(config.configuration.prcomments.prreadylabel);
                            // core.debug('5 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                            // issueLabels.addLabel(config.configuration.prcomments.onholdlabel);
                            // core.debug('6 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                            issueLabels.removeLabel(core.getInput('prlabel-ready'));
                            issueLabels.addLabel(core.getInput('prlabel-onhold'));
                        }

                        core.debug('issueLabels.haschanges: ' + issueLabels.haschanges);
                        core.debug('issueLabels.labels: ' + JSON.stringify(issueLabels.labels));

                        if (issueLabels.haschanges) {
                            
                            // set the label
                            await octokit.issues.setLabels({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: issuenumber,
                                labels: issueLabels.labels
                            });
                        }
                    }
                }
            }
        }
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}
