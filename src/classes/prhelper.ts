//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with pull requests
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { CoreModule, GitHubModule,Context, PullRequestPayload } from '../types';
import { IssueLabels } from './index';
import { PullsGetResponseData } from '@octokit/types/dist-types'

export class PRHelper {
    
    // ToDo: properties
    mergemethod?: 'merge' | 'squash' | 'rebase'

    constructor() {
        this.mergemethod = "merge";
    }

    setMergeMethod(method: string): void {
        if (method === 'squash') {
            this.mergemethod = 'squash';
        } else if (method === 'rebase') {
            this.mergemethod = 'rebase';
        } else {
            this.mergemethod = 'merge';
        }
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

    isMergeReadyByState(core: CoreModule, pullRequest: PullsGetResponseData) : boolean {
        try {
            core.debug('>> isMergeReadyByState()');
            core.info('PR State: ' + pullRequest.state);
            core.info('PR merged: ' + pullRequest.merged);
            core.info('PR mergeable: ' + pullRequest.mergeable);
            core.info('PR mergeable_state: ' + pullRequest.mergeable_state);

            if (pullRequest.state !== 'closed') {
                if (pullRequest.merged === false && pullRequest.mergeable === true) {
                    // is ready to merge
                    if (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable') {
                        return true;
                    }

                    // if blocked check for pending reviewers
                    if (pullRequest.mergeable_state === 'blocked' && (pullRequest.requested_reviewers.length === 0 && pullRequest.requested_teams.length === 0)) {
                        core.info(`PR #${pullRequest.number} is blocked but has no outstanding reviews`);
                        return true;
                    }

                    // allow blocked state - if branch protection is enabled the blocked state will be returned by the GitHub Actions user
                    if (pullRequest.mergeable_state === 'blocked') {
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

    async isMergeReadyByLabel(core: CoreModule, github: GitHubModule, pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            core.debug('>> isMergeReadyByLabel()');

            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);

            // check the labels
            const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                ...github.context.repo,
                issue_number: pullRequest.number,
            });
            var issueLabels = new IssueLabels(issueLabelsData);
            const readyToMergeLabel = (issueLabels.hasLabelFromList([core.getInput('prlabel-ready')]));
            const NotReadyToMergeLabel = (issueLabels.hasLabelFromList([core.getInput('prlabel-reviewrequired'), core.getInput('prlabel-onhold')]));
            
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

    async isMergeReadyByReview(core: CoreModule, github: GitHubModule, pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            core.debug('>> isMergeReadyByReview()');

            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);
            const requiredReviewCount : Number = Number.parseInt(core.getInput('prmerge-requirereviewcount'));
            
            // check the labels
            const { data: reviewsData } = await octokit.pulls.listReviews({
                ...github.context.repo,
                pull_number: pullRequest.number,
            });

            let reviews = {
                total: reviewsData.length,
                approved: 0
            };
            let result : boolean = false;

            // No outstanding reviews
            if (pullRequest.requested_reviewers.length === 0 && pullRequest.requested_teams.length === 0) {
                result = true;
            }
            
            // get the number of reviews
            for(var iReview = 0; iReview < reviewsData.length; iReview++){
                if (reviewsData[iReview].state === 'APPROVED') {
                    reviews.approved++;
                }
            }
            // check for reviews, and make sure no non-approved reviews
            if (reviews.total > 0 && (reviews.total === reviews.approved) && ((requiredReviewCount >= 0 && reviews.total > requiredReviewCount) || requiredReviewCount < 0)) {
                core.info(`PR #${pullRequest.number} is mergable based on reviews`);
                result = true;
            }

            // check for minimum number of required reviews
            if (requiredReviewCount >= 0 && reviews.approved >= requiredReviewCount) {
                core.info(`PR #${pullRequest.number} is mergable based on minimum required reviews`);
                result = true;
            }            
            
            return result;

        } catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }

    async isMergeReadyByChecks(core: CoreModule, github: GitHubModule, pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            core.debug('>> isMergeReadyByChecks()');
            
            const requireallchecks : boolean = (core.getInput('prmerge-requireallchecks') === 'true');

            // not configured
            if (requireallchecks !== true) {
                core.info('require checks is not enabled');
                return true;
            }
            
            // need all checks
            if (requireallchecks && await this.allChecksSucceeded(core, github, pullRequest)) {
                core.info('required checks have all succeeded');
                return true;
            }

            // failed test
            return false;

        } catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }

    async allChecksSucceeded(core: CoreModule, github: GitHubModule, pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            core.debug('>> allChecksPassed()');

            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);

            // check the labels
            const { data: checksData } = await octokit.checks.listForRef({
                ...github.context.repo,
                ref: pullRequest.merge_commit_sha
            });

            let checks = {
                total: checksData.total_count,
                completed: 0,
                success: 0
            };

            if (checksData && checksData.check_runs.length > 0) {
                checksData.check_runs.forEach(element => {
                    if (element.status === "completed") {
                        checks.completed++;
                    }
    
                    if (element.conclusion === "success") {
                        checks.success++;
                    }
                });
            }

            return (checks.completed >= (checks.total - 1)) && (checks.success >= (checks.total - 1));

        } catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }
}
