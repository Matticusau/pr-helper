//
// Author:  Matt Lavery
// Date:    2020-07-26
// Purpose: Helper class to read a Jekyll Author YAML file used to map authors friendly names to github account names, to enhance Reviewer assignment.
// 
// References used to build this functionality:
//          https://stackabuse.com/reading-and-writing-yaml-to-a-file-in-node-js-javascript/
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from '../types'
import * as yaml from 'js-yaml';

// interface AuthorFile {}

export class AuthorYAMLReader {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;
    // authorFile : AuthorFile;
    authorFile: any;
    
    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        // initialize the config
        this.authorFile = {};
    }

    async loadAuthorFile() //: Promise<Map<string, Config>> {
    {
        const authorContent: string = await this.fetchContent();
        
        if (authorContent.length > 0) {
            // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
            const authorFileObject: any = yaml.safeLoad(authorContent);
        
            // core.debug('authorFileObject: ' + JSON.stringify(authorFileObject));
            // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
            // return getLabelGlobMapFromObject(authorFileObject);
            // return authorFileObject;
            
            this.authorFile = authorFileObject;
        } else {
            // set the defaults
            this.authorFile = {};
        }
    }

    // get the content from the current Pull Request context
    // TODO: Pull content from default branch or action asset from checkout 
    private async fetchContent(): Promise<string> {

        const authorFilePath = this.core.getInput('author-file-path');
        const myToken = this.core.getInput('repo-token');
        const octokit = this.github.getOctokit(myToken);
        this.core.debug('authorFilePath: ' + authorFilePath);

        // make sure we have an author file path
        if (authorFilePath.length === 0) {
            this.core.info('No Author File found. Defaults will be applied.');
            return '';
        } else {
            const response: any = await octokit.repos.getContent({
                ...this.github.context.repo,
                ref: this.github.context.sha,
                path: authorFilePath,
            });
            // core.debug('fetchContent response: ' + JSON.stringify(response));
            
            return Buffer.from(response.data.content, response.data.encoding).toString();
        }
    }


    // get the github user name from the author definition
    async getAuthorGitHubUser(authorname: string): Promise<string> {

        let authorgithubuser = '';
        try {
            if (authorname.length > 0) {
                if (undefined !== this.authorFile[authorname]) {
                    if (undefined !== this.authorFile[authorname].github) {
                        authorgithubuser = this.authorFile[authorname].github
                    } else {
                        this.core.info('getAuthorGitHubUser no github key defined for author [' + authorname + ']');
                    }
                } else {
                    this.core.info('getAuthorGitHubUser no entry for [' + authorname + '] in authorFile');
                }
            } else {
                this.core.info('getAuthorGitHubUser no authorname param supplied');
            }
            return authorgithubuser;
        } catch (error) {
            this.core.info('getAuthorGitHubUser error: ' + error.message);
            throw error;
        }
    }

}
