//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with pull requests
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { CoreModule, GitHubModule,Context, PullRequestPayload } from '../types';
import { ConfigHelper, IssueLabels } from './index';
import { PullsGetResponseData } from '@octokit/types/dist-types'

export class PRHelper {
    
    // ToDo: properties

    constructor() {

    }

    getPrNumber(context: Context): number | undefined {
        var prNumber : number | undefined = undefined;
        // event will determine how we get this from the payload
        switch (context.eventName) {
            case 'issue_comment':
                const issue = context.payload.issue;
                if (issue) {
                    prNumber = issue.number;
                }
                break;
            default:
                const pullRequest = context.payload.pull_request;
                if (pullRequest) {
                    prNumber = pullRequest.number;
                } 
        }
        return prNumber;
    }

    getCommentNumber(context: Context): number | undefined {
        var commentNumber : number | undefined = undefined;
        // event will determine how we get this from the payload
        switch (context.eventName) {
            case 'issue_comment':
                const comment = context.payload.comment;
                if (comment) {
                    commentNumber = comment.id;
                }
                break;
            default:
                commentNumber = undefined;
        }
        return commentNumber;
    }

    isMergeReadyByState(core: CoreModule, pullRequest: PullsGetResponseData) {
        try {
            core.info('PR State: ' + pullRequest.state);
            core.info('PR merged: ' + pullRequest.merged);
            core.info('PR mergeable: ' + pullRequest.mergeable);
            core.info('PR mergeable_state: ' + pullRequest.mergeable_state);
            if (pullRequest.state !== 'closed') {
                if (pullRequest.merged === false) {
                    if (pullRequest.mergeable === true && (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable')) {
                        return true;
                    }
                }
            }
            return false;

        } catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }

    async isMergeReadyByLabel(core: CoreModule, github: GitHubModule, config: ConfigHelper, pullRequest: PullsGetResponseData) {
        try {
            console.log('config..readytomergelabel: ' + config.configuration.prmerge.labels.readytomergelabel);
            console.log('config..reviewrequiredlabel: ' + config.configuration.prmerge.labels.reviewrequiredlabel);
            console.log('config..onholdlabel: ' + config.configuration.prcomments.onholdlabel);

            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);

            // check the labels
            const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                ...github.context.repo,
                issue_number: pullRequest.number,
            });
            var issueLabels = new IssueLabels(issueLabelsData);
            const readyToMergeLabel = (issueLabels.hasLabelFromList([config.configuration.prmerge.labels.readytomergelabel]));
            const NotReadyToMergeLabel = (issueLabels.hasLabelFromList([config.configuration.prmerge.labels.reviewrequiredlabel, config.configuration.prcomments.onholdlabel]));
            
            console.log('readyToMergeLabel:' + readyToMergeLabel);
            console.log('NotReadyToMergeLabel:' + NotReadyToMergeLabel);
            if (readyToMergeLabel && !NotReadyToMergeLabel) {
                return true;
            }

            return false;

        } catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }
}
