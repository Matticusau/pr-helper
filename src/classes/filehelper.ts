//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Helpers for working with pull requests changed files
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { CoreModule, GitHubModule,Context, PullRequestPayload, PullRequestFilePayload } from '../types';
import { IssueLabels, GlobHelper } from './index';
import { PullsGetResponseData, OctokitResponse, PullsListFilesResponseData } from '@octokit/types/dist-types'
import * as yaml from 'js-yaml';
import fm, { FrontMatterResult } from 'front-matter/index';

// interface FrontMatterResultData {
//     attributes: {},
//     body: string,
//     bodyBegin: 1
//   }

export class PRFileHelper {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;
    
    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
    }

    async getChangedFiles(pullRequest: PullsGetResponseData): Promise<OctokitResponse<PullsListFilesResponseData>> {
        this.core.debug('>> getChangedFiles()');

        const myToken = this.core.getInput('repo-token');
        const octokit = this.github.getOctokit(myToken);

        const listFilesResponse = await octokit.pulls.listFiles({
          owner: this.github.context.repo.owner,
          repo: this.github.context.repo.repo,
          pull_number: pullRequest.number
        });
      
        return listFilesResponse;
    }

    async getChangedFileNames(pullRequest: PullsGetResponseData): Promise<string[]> {
        this.core.debug('>> getChangedFileNames()');

        const listFilesResponse = await this.getChangedFiles(pullRequest);
      
        const changedFiles = listFilesResponse.data.map(f => f.filename);
      
        this.core.info('found changed files:');
        for (const file of changedFiles) {
          this.core.info('  ' + file);
        }
      
        return changedFiles;
    }

    async getChangedFileContent(pullRequest: PullsGetResponseData, file: PullRequestFilePayload): Promise<string> {
        this.core.debug('>> getChangedFileContent()');

        const myToken = this.core.getInput('repo-token');
        const octokit = this.github.getOctokit(myToken);

        const fileContentsResponse = await octokit.repos.getContent({
            ...this.github.context.repo
            , path: file.filename
            , mediaType: {format: 'application/vnd.github.v3.raw'}
        });
        
        if (fileContentsResponse && fileContentsResponse.data) {
            return fileContentsResponse.data.content;
        }
        
        return '';
    }

    async getReviewerListFromFrontMatter(pullRequest: PullsGetResponseData, file: PullRequestFilePayload): Promise<string[]> {
        this.core.info('>> getChangedFileContent()');

        let results : string[] = [];
        const fileContents : string = await this.getChangedFileContent(pullRequest, file);
        this.core.info('file contents: ' + fileContents);

        // get the frontmatter
        const frontmatter : FrontMatterResult<any> = fm(fileContents);
        this.core.info('frontmatter: ' + JSON.stringify(frontmatter));

        if (frontmatter && frontmatter.attributes) {
            this.core.info('has attributes');
            // get the owner attribute
            if (frontmatter.attributes.owner) {
                this.core.info('attributes.owner: ' + JSON.stringify(frontmatter.attributes.owner));
                const reviewerList : string[] = String(frontmatter.attributes.owner).split(',');
                // results.push(frontmatter.attributes.owner);
                return reviewerList;
            }
        }
        
        // const myToken = this.core.getInput('repo-token');
        // const octokit = this.github.getOctokit(myToken);

        return results;
    }

}
