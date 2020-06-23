//
// Author:  Matt Lavery
// Date:    2020-06-22
// Purpose: Provides support for matching GLOBs
//          Some of this logic is based on the project https://github.com/actions/labeler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { CoreModule, GitHubModule,Context } from '../types';
import {Minimatch, IMinimatch} from 'minimatch';

interface MatchConfig {
    all?: string[];
    any?: string[];
}

type StringOrMatchConfig = string | MatchConfig;

export class GlobHelper {
    
    // ToDo: properties
    private core: CoreModule;
    private github: GitHubModule;

    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
    }

    matchConfigFromActionInputYaml(json: string) : MatchConfig[] {
        // convert json to string array
        let pattern : string[] = JSON.parse(json);
        this.core.info('json pattern: ' + JSON.stringify(pattern));

        // return the match config
        return [{
            any: pattern
        }];
    }

    checkGlobs(
        changedFiles: string[],
        globs: StringOrMatchConfig[]
      ): boolean {
        for (const glob of globs) {
            this.core.debug(` checking pattern ${JSON.stringify(glob)}`);
            const matchConfig = this.toMatchConfig(glob);
            if (this.checkMatch(changedFiles, matchConfig)) {
              return true;
            }
        }
        return false;
    }

    private toMatchConfig(config: StringOrMatchConfig): MatchConfig {
        if (typeof config === "string") {
          return {
            any: [config]
          };
        }
      
        return config;
    }

    private checkMatch(changedFiles: string[], matchConfig: MatchConfig): boolean {
        if (matchConfig.all !== undefined) {
          if (!this.checkAll(changedFiles, matchConfig.all)) {
            return false;
          }
        }
      
        if (matchConfig.any !== undefined) {
          if (!this.checkAny(changedFiles, matchConfig.any)) {
            return false;
          }
        }
      
        return true;
      }

    // equivalent to "Array.some()" but expanded for debugging and clarity
    private checkAny(changedFiles: string[], globs: string[]): boolean {
        const matchers = globs.map(g => new Minimatch(g));
        this.core.debug(`  checking "any" patterns`);
        for (const changedFile of changedFiles) {
            if (this.isMatch(changedFile, matchers)) {
                this.core.debug(`  "any" patterns matched against ${changedFile}`);
                return true;
            }
        }
  
        this.core.debug(`  "any" patterns did not match any files`);
        return false;
    }
  
    // equivalent to "Array.every()" but expanded for debugging and clarity
    private checkAll(changedFiles: string[], globs: string[]): boolean {
        const matchers = globs.map(g => new Minimatch(g));
        this.core.debug(` checking "all" patterns`);
        for (const changedFile of changedFiles) {
            if (!this.isMatch(changedFile, matchers)) {
                this.core.debug(`  "all" patterns did not match against ${changedFile}`);
                return false;
            }
        }
  
        this.core.debug(`  "all" patterns matched all files`);
        return true;
    }

    private isMatch(individualFile: string, matchers: IMinimatch[]): boolean {
        this.core.debug(` matching patterns against file ${individualFile}`);
        for (const matcher of matchers) {
          this.core.debug(`  - ${this.printPattern(matcher)}`);
          if (!matcher.match(individualFile)) {
            this.core.debug(`   ${this.printPattern(matcher)} did not match`);
            return false;
          }
        }
      
        this.core.debug(` all patterns matched`);
        return true;
      }

    private printPattern(matcher: IMinimatch): string {
        return (matcher.negate ? "!" : "") + matcher.pattern;
    }
}
