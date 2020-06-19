//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Comment handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types'; // , Client
import { IssueLabels, PRHelper, ConfigHelper } from './classes';

// export default async function prHandler(core: CoreModule, context: Context, client: Client) { //, octokit: Client
export default async function prCommentHandler(core: CoreModule, github: GitHubModule, config: ConfigHelper) {

    try {
        // console.log('context: ' + JSON.stringify(github.context));
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
        // console.log('octokit: ' + JSON.stringify(octokit));

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
                // console.log('got the pr comment');

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

                    // console.log('body: ' + prComment.body);
                    if (prComment.body.includes('#pr-ready')) {
                        // make sure the PR is mergable
                        if (pullRequest.mergeable !== true || pullRequest.mergeable_state === 'dirty') {
                            // add the comment to inform
                            await octokit.issues.createComment({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: issuenumber,
                                body: 'Pull request is not mergable, please resolve any conflicts/issues first'
                            });
                        } else {
                            // update the labels
                            core.info('1 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                            issueLabels.removeLabel(config.configuration.prcomments.onholdlabel);
                            core.info('2 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                            issueLabels.addLabel(config.configuration.prcomments.prreadylabel);
                            core.info('3 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                        }
                    } else if (prComment.body.includes('#pr-onhold')) {
                        // // clear labels
                        core.info('4 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                        issueLabels.removeLabel(config.configuration.prcomments.prreadylabel);
                        core.info('5 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                        issueLabels.addLabel(config.configuration.prcomments.onholdlabel);
                        core.info('6 issueLabels.labels: ' + JSON.stringify(issueLabels.labels));
                    }

                    core.info('issueLabels.haschanges: ' + issueLabels.haschanges);
                    core.info('issueLabels.labels: ' + JSON.stringify(issueLabels.labels));

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
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}
