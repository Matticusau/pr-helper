//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with pull requests
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { Context } from '../types';

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

}
