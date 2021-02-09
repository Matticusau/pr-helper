//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Helpers for working with pull requests changed files
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-07-26   MLavery     Added prepareJekyllAuthorYAMLReader, Extended getReviewerListFromFrontMatter [issue #23]
// 2020-09-14   MLavery     Added handler for renaming of files. Octokit currently doesnt support previous_filename in payload [issue #35]
// 2021-02-08   MLavery     Added isAllChangedFilesOwnedByPRAuthor [issue #36]
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
            this.core.info('file.patch: ' + file.patch);
            // skip new files = 404 error
            // if (file.status === 'modified' || file.status === 'renamed') {
            if (file.status === 'modified') {

                let fileName = file.filename;
                //if (file.status === 'renamed') { fileName = file.previous_filename; };

                const myToken = this.core.getInput('repo-token');
                const octokit = this.github.getOctokit(myToken);

                const fileContentsResponse = await octokit.repos.getContent({
                    ...this.github.context.repo
                    , path: fileName
                    , mediaType: {format: 'raw'}
                    , ref: pullRequest.base.ref
                });
                this.core.debug('fileContentsResponse: ' + JSON.stringify(fileContentsResponse));
                
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
            this.core.debug('frontmatter: ' + JSON.stringify(frontmatter));

            if (frontmatter && frontmatter.attributes) {
                
                this.core.debug('prreviewer-authorkey: ' + this.core.getInput('prreviewer-authorkey'));
                this.core.debug('attributes.owner: ' + JSON.stringify(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]));
                // test the owner attribute
                if (undefined !== frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]) {
                    if (this.core.getInput('prreviewer-githubuserfromauthorfile') === 'true') {
                        // authors could be an array, most of the time it would be single element
                        const authorList : string[] = String(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]).split(',');
                        this.core.debug('authorList: ' + JSON.stringify(authorList));
                        const ghuserList : string[] = [];
                        for (let iauthor = 0; iauthor < authorList.length; iauthor++) {
                            const tmpghuser = await this.authorYAMLReader.getAuthorGitHubUser(authorList[iauthor]);
                            if (undefined !== tmpghuser && tmpghuser.length > 0) {
                                ghuserList.push(tmpghuser);
                            }
                        }
                        // const ghuser = this.authorYAMLReader.getAuthorGitHubUser(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]);
                        this.core.debug('ghuserList: ' + JSON.stringify(ghuserList));
                        return ghuserList;
                    } else {
                        const reviewerList : string[] = String(frontmatter.attributes[this.core.getInput('prreviewer-authorkey')]).split(',');
                        // results.push(frontmatter.attributes.owner);
                        return reviewerList;
                    }
                } else {
                    this.core.info('frontmatter does not contain author key attribute');
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

    async isAllChangedFilesOwnedByPRAuthor(pullRequest: PullsGetResponseData): Promise<boolean> {
        this.core.info('>> isAllChangedFilesOwnedByPRAuthor()');
        
        let result : boolean = true;

        try {
            // make sure we need to check this
            if (this.core.getInput('enable-prreviewer-frontmatter') === 'true' && this.core.getInput('prreviewer-bypassforfileowner') === 'true') {
                this.core.info('checking if all files owned by author');
                // get the PR author
                const prAuthor = pullRequest.user.login;
                // load the Jekyll Author file if required
                await this.prepareJekyllAuthorYAMLReader();

                let changedFiles = await this.getChangedFiles(pullRequest);
                if (changedFiles) {
                    for(let iFile = 0; iFile < changedFiles.data.length; iFile++) {
                        this.core.info('Processing file: ' + changedFiles.data[iFile].filename);
                        const tmpReviewerList : string[] = await this.getReviewerListFromFrontMatter(pullRequest, changedFiles.data[iFile]);
                        this.core.info('tmpReviewerList: ' + JSON.stringify(tmpReviewerList));
                        this.core.info('prAuthor: ' + JSON.stringify(prAuthor));
                        // if (tmpReviewerList.indexOf(prAuthor) <= 0) {
                        //     // couldn't find the author for this file
                        //     result = false;
                        //     break;
                        // }
                        let blnAuthorIsOwner: boolean = false;
                        tmpReviewerList.forEach(element => {
                            // make sure this is not the owner of the PR
                            if (prAuthor.toLowerCase() === element.trim().toLowerCase()) {
                                blnAuthorIsOwner = true;
                                //break;
                            }
                        });
                        if (!blnAuthorIsOwner) {result = false; break; }
                    }
                }
                if (result) {this.core.info('all files owned by author - no reviewer required');};
            } else {
                // we need to check individual reviewers
                result = false;
            }

            return result;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

}
