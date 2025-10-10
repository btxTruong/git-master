export namespace models {
	
	export class Author {
	    name: string;
	    email: string;
	
	    static createFrom(source: any = {}) {
	        return new Author(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.email = source["email"];
	    }
	}
	export class Commit {
	    hash: string;
	    shortHash: string;
	    author: Author;
	    committer: Author;
	    message: string;
	    shortMessage: string;
	    // Go type: time
	    date: any;
	    parentHashes: string[];
	    refs: string[];
	    filesChanged: number;
	    insertions: number;
	    deletions: number;
	
	    static createFrom(source: any = {}) {
	        return new Commit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.shortHash = source["shortHash"];
	        this.author = this.convertValues(source["author"], Author);
	        this.committer = this.convertValues(source["committer"], Author);
	        this.message = source["message"];
	        this.shortMessage = source["shortMessage"];
	        this.date = this.convertValues(source["date"], null);
	        this.parentHashes = source["parentHashes"];
	        this.refs = source["refs"];
	        this.filesChanged = source["filesChanged"];
	        this.insertions = source["insertions"];
	        this.deletions = source["deletions"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Repository {
	    path: string;
	    name: string;
	    currentBranch: string;
	    isDetached: boolean;
	    // Go type: time
	    lastOpened: any;
	
	    static createFrom(source: any = {}) {
	        return new Repository(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.currentBranch = source["currentBranch"];
	        this.isDetached = source["isDetached"];
	        this.lastOpened = this.convertValues(source["lastOpened"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RepositoryStatus {
	    branch: string;
	    ahead: number;
	    behind: number;
	    stagedFiles: string[];
	    unstagedFiles: string[];
	    untrackedFiles: string[];
	    hasConflicts: boolean;
	    conflictedFiles: string[];
	
	    static createFrom(source: any = {}) {
	        return new RepositoryStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.branch = source["branch"];
	        this.ahead = source["ahead"];
	        this.behind = source["behind"];
	        this.stagedFiles = source["stagedFiles"];
	        this.unstagedFiles = source["unstagedFiles"];
	        this.untrackedFiles = source["untrackedFiles"];
	        this.hasConflicts = source["hasConflicts"];
	        this.conflictedFiles = source["conflictedFiles"];
	    }
	}

}

export namespace services {
	
	export class RepositoryService {
	
	
	    static createFrom(source: any = {}) {
	        return new RepositoryService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

