//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Process the actions based on event type
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import prWelcomeHandler from './prwelcomehandler';
import prCommentHandler from './prcommenthandler';
import prLabelHandler from './prlabelhandler';
import prMergeHandler from './prmergerhandler';
import { CoreModule, GitHubModule } from './types';
import { ConfigHelper } from './classes';
// import prHello from './hello'

export default async function main(core: CoreModule, github: GitHubModule) {
    // get the config
    const config = new ConfigHelper(core, github);
    await config.loadConfig(core, github);
    // core.debug('config loaded');
    // core.debug('config: ' + JSON.stringify(config.configuration));
        
    const event = github.context.eventName
    switch (event) {
        case 'pull_request':
            // await prHandler(client, github.context, config)
            await prWelcomeHandler(core, github, config);
            await prLabelHandler(core, github, config);
            await prMergeHandler(core, github, config);
            break;
        // case 'status':
        //     await statusHandler(client, github.context, config)
        //     break
        case 'pull_request_review':
            await prLabelHandler(core, github, config);
            await prMergeHandler(core, github, config);
            break;
        case 'issue_comment':
            await prCommentHandler(core, github, config);
            await prMergeHandler(core, github, config);
            break;
        // case 'push':
        // //     await pushHandler(client, github.context, config)
        //     await prHello(core, github);
        //     break
    }
}

// run