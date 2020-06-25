//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Process the actions based on event type
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   Mlavery     Config moved back to workflow file #3
//

import prWelcomeHandler from './prwelcomehandler';
import prCommentHandler from './prcommenthandler';
import prLabelHandler from './prlabelhandler';
import prReviewHandler from './prreviewerhandler';
import prMergeHandler from './prmergerhandler';
import prMergeOnScheduleHandler from './prmergeronschedulehandler';
import { CoreModule, GitHubModule } from './types';
// import { ConfigHelper } from './classes';
// import prHello from './hello'

export default async function main(core: CoreModule, github: GitHubModule) {
    // get the config
    // const config = new ConfigHelper(core, github);
    // await config.loadConfig(core, github);
    // core.debug('config loaded');
    // core.debug('config: ' + JSON.stringify(config.configuration));
    core.debug('context: ' + github.context);
    
    const event = github.context.eventName
    switch (event) {
        case 'pull_request':
            // await prHandler(client, github.context, config)
            await prWelcomeHandler(core, github);
            await prReviewHandler(core, github);
            await prLabelHandler(core, github);
            await prMergeHandler(core, github);
            break;
        // case 'status':
        //     await statusHandler(client, github.context, config)
        //     break
        case 'pull_request_review':
            await prLabelHandler(core, github);
            await prMergeHandler(core, github);
            break;
        case 'issue_comment':
            await prCommentHandler(core, github);
            await prMergeHandler(core, github);
            break;
        case 'schedule':
            await prMergeOnScheduleHandler(core, github);
            break;
        // case 'push':
        // //     await pushHandler(client, github.context, config)
        //     await prHello(core, github);
        //     break
    }
}

// run