//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Helpers for working with pull requests changed files
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-07-26   MLavery     Added prepareJekyllAuthorYAMLReader, Extended getReviewerListFromFrontMatter [issue #23]
//
import { CoreModule, GitHubModule,Context, PullRequestPayload, PullRequestFilePayload } from '../types';
import { IssueLabels, GlobHelper, AuthorYAMLReader } from './index';
import { PullsGetResponseData, OctokitResponse, PullsListFilesResponseData, ReposGetContentResponseData } from '@octokit/types/dist-types'
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
    private authorYAMLReader: AuthorYAMLReader;
    
    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        this.authorYAMLReader = new AuthorYAMLReader(this.core, this.github);
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
      
        // this.core.info('found changed files:');
        for (const file of changedFiles) {
        //   this.core.info('  ' + file);
        }
      
        return changedFiles;
    }

    // Call this function to prepare the objects to process authors from the Jekyll Author file
    // This saves extra objects needing to be defined in caller module
    // Will only action if the setting enabled
    async prepareJekyllAuthorYAMLReader() {
        
        try {
        
            this.core.debug('>> prepareJekyllAuthorYAMLReader()');

            if (this.core.getInput('prreviewer-githubuserfromauthorfile') === 'true') {

                // load the author file to memory
                await this.authorYAMLReader.loadAuthorFile();

            }
        } catch (error) {
            this.core.debug('error: ' + JSON.stringify(error));
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async getChangedFileContent(pullRequest: PullsGetResponseData, file: PullRequestFilePayload): Promise<string> {
        
        try {
        
            this.core.debug('>> getChangedFileContent()');

            this.core.info('file.status: ' + file.status);
            // skip new files = 404 error
            if (file.status !== 'added') {

                const myToken = this.core.getInput('repo-token');
                const octokit = this.github.getOctokit(myToken);

                const fileContentsResponse = await octokit.repos.getContent({
                    ...this.github.context.repo
                    , path: file.filename
                    , mediaType: {format: 'raw'}
                    , ref: pullRequest.base.ref
                });
                // this.core.info('fileContentsResponse: ' + JSON.stringify(fileContentsResponse));
                
                if (fileContentsResponse && fileContentsResponse.data) {
                    return String(fileContentsResponse.data);
                }
            }
            
            return '';
        } catch (error) {
            this.core.debug('error: ' + JSON.stringify(error));
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async getReviewerListFromFrontMatter(pullRequest: PullsGetResponseData, file: PullRequestFilePayload): Promise<string[]> {
        this.core.debug('>> getChangedFileContent()');
        
        let results : string[] = [];

        try {
            const fileContents : string = await this.getChangedFileContent(pullRequest, file);
            // this.core.info('file contents: ' + fileContents);

            // get the frontmatter
            const frontmatter : FrontMatterResult<any> = fm(fileContents);
            // this.core.info('frontmatter: ' + JSON.stringify(frontmatter));

            if (frontmatter && frontmatter.attributes) {
                // this.core.debug('has attributes');
                // get the owner attribute
                this.core.debug('prreviewer-authorkey: ' + this.core.getInput('prreviewer-authorkey'));
                this.core.debug('attributes.owner: ' + JSON.stringify(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]));
                if (this.core.getInput('prreviewer-githubuserfromauthorfile') === 'true') {
                    // authors could be an array, most of the time it would be single element
                    const authorList : string[] = String(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]).split(',');
                    const ghuserList : string[] = [];
                    this.core.info('authorList: ' + JSON.stringify(authorList));
                    for (let iauthor = 0; iauthor < authorList.length; iauthor++) {
                        const tmpghuser = await this.authorYAMLReader.getAuthorGitHubUser(authorList[iauthor]);
                        if (undefined !== tmpghuser && tmpghuser.length > 0) {
                            ghuserList.push(tmpghuser);
                        }
                    }
                    // const ghuser = this.authorYAMLReader.getAuthorGitHubUser(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]);
                    this.core.info('ghuserList: ' + JSON.stringify(ghuserList));
                    return ghuserList;
                } else {
                    if (frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]) {
                        const reviewerList : string[] = String(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]).split(',');
                        // results.push(frontmatter.attributes.owner);
                        return reviewerList;
                    }
                }
            }
            
            // const myToken = this.core.getInput('repo-token');
            // const octokit = this.github.getOctokit(myToken);

            return results;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

}
