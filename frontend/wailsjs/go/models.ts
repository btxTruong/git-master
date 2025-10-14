export namespace git {
	
	export class Executor {
	
	
	    static createFrom(source: any = {}) {
	        return new Executor(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

export namespace models {
	
	export class ArchiveListEntry {
	    id: string;
	    archiveName: string;
	    originalGroupName: string;
	    // Go type: time
	    archivedAt: any;
	    totalFilesCount: number;
	    diffFileSize: number;
	    tags?: string[];
	
	    static createFrom(source: any = {}) {
	        return new ArchiveListEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.archiveName = source["archiveName"];
	        this.originalGroupName = source["originalGroupName"];
	        this.archivedAt = this.convertValues(source["archivedAt"], null);
	        this.totalFilesCount = source["totalFilesCount"];
	        this.diffFileSize = source["diffFileSize"];
	        this.tags = source["tags"];
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
	export class ArchiveMetadata {
	    id: string;
	    originalGroupName: string;
	    archiveName: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    archivedAt: any;
	    filePaths: string[];
	    originalBranch: string;
	    originalCommitHash: string;
	    description?: string;
	    tags?: string[];
	    diffFileSize: number;
	    totalFilesCount: number;
	    totalAdditions: number;
	    totalDeletions: number;
	
	    static createFrom(source: any = {}) {
	        return new ArchiveMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.originalGroupName = source["originalGroupName"];
	        this.archiveName = source["archiveName"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.archivedAt = this.convertValues(source["archivedAt"], null);
	        this.filePaths = source["filePaths"];
	        this.originalBranch = source["originalBranch"];
	        this.originalCommitHash = source["originalCommitHash"];
	        this.description = source["description"];
	        this.tags = source["tags"];
	        this.diffFileSize = source["diffFileSize"];
	        this.totalFilesCount = source["totalFilesCount"];
	        this.totalAdditions = source["totalAdditions"];
	        this.totalDeletions = source["totalDeletions"];
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
	export class Branch {
	    name: string;
	    isHead: boolean;
	    isRemote: boolean;
	    remote: string;
	    commitHash: string;
	    upstream: string;
	
	    static createFrom(source: any = {}) {
	        return new Branch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.isHead = source["isHead"];
	        this.isRemote = source["isRemote"];
	        this.remote = source["remote"];
	        this.commitHash = source["commitHash"];
	        this.upstream = source["upstream"];
	    }
	}
	export class BranchList {
	    current: string;
	    local: Branch[];
	    remote: Branch[];
	
	    static createFrom(source: any = {}) {
	        return new BranchList(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.current = source["current"];
	        this.local = this.convertValues(source["local"], Branch);
	        this.remote = this.convertValues(source["remote"], Branch);
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
	export class ChangelistItem {
	    path: string;
	    trackedSnapshotHash?: string;
	    notes?: string;
	    isMissingFromWorkingTree?: boolean;
	    // Go type: time
	    addedAt: any;
	    // Go type: time
	    lastModifiedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ChangelistItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.trackedSnapshotHash = source["trackedSnapshotHash"];
	        this.notes = source["notes"];
	        this.isMissingFromWorkingTree = source["isMissingFromWorkingTree"];
	        this.addedAt = this.convertValues(source["addedAt"], null);
	        this.lastModifiedAt = this.convertValues(source["lastModifiedAt"], null);
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
	export class Changelist {
	    id: string;
	    name: string;
	    type: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    items: ChangelistItem[];
	    isSystemGenerated: boolean;
	    orderIndex: number;
	    colorHexCode?: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new Changelist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.items = this.convertValues(source["items"], ChangelistItem);
	        this.isSystemGenerated = source["isSystemGenerated"];
	        this.orderIndex = source["orderIndex"];
	        this.colorHexCode = source["colorHexCode"];
	        this.description = source["description"];
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
	export class FileChange {
	    oldPath: string;
	    newPath: string;
	    status: string;
	    insertions: number;
	    deletions: number;
	
	    static createFrom(source: any = {}) {
	        return new FileChange(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.oldPath = source["oldPath"];
	        this.newPath = source["newPath"];
	        this.status = source["status"];
	        this.insertions = source["insertions"];
	        this.deletions = source["deletions"];
	    }
	}
	export class CommitDetail {
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
	    files: FileChange[];
	    diff: string;
	
	    static createFrom(source: any = {}) {
	        return new CommitDetail(source);
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
	        this.files = this.convertValues(source["files"], FileChange);
	        this.diff = source["diff"];
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
	export class CommitFilters {
	    branch: string;
	    author: string;
	    dateFrom: string;
	    dateTo: string;
	    searchText: string;
	
	    static createFrom(source: any = {}) {
	        return new CommitFilters(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.branch = source["branch"];
	        this.author = source["author"];
	        this.dateFrom = source["dateFrom"];
	        this.dateTo = source["dateTo"];
	        this.searchText = source["searchText"];
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
	
	export class ArchiveService {
	
	
	    static createFrom(source: any = {}) {
	        return new ArchiveService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class ChangelistService {
	
	
	    static createFrom(source: any = {}) {
	        return new ChangelistService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class CommitService {
	
	
	    static createFrom(source: any = {}) {
	        return new CommitService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class DiffService {
	
	
	    static createFrom(source: any = {}) {
	        return new DiffService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class FileStatus {
	    path: string;
	    status: string;
	    staged: boolean;
	    modified: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.status = source["status"];
	        this.staged = source["staged"];
	        this.modified = source["modified"];
	    }
	}
	export class ImportPatchOptions {
	    ApplyImmediately: boolean;
	    CreateBackup: boolean;
	    UseThreeWay: boolean;
	    AllowReject: boolean;
	    GroupName: string;
	
	    static createFrom(source: any = {}) {
	        return new ImportPatchOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ApplyImmediately = source["ApplyImmediately"];
	        this.CreateBackup = source["CreateBackup"];
	        this.UseThreeWay = source["UseThreeWay"];
	        this.AllowReject = source["AllowReject"];
	        this.GroupName = source["GroupName"];
	    }
	}
	export class RestoreResult {
	    success: boolean;
	    backupStashRef?: string;
	    appliedCleanly: boolean;
	    rejectFiles?: string[];
	    errorMessage?: string;
	    filesAffected?: string[];
	
	    static createFrom(source: any = {}) {
	        return new RestoreResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.backupStashRef = source["backupStashRef"];
	        this.appliedCleanly = source["appliedCleanly"];
	        this.rejectFiles = source["rejectFiles"];
	        this.errorMessage = source["errorMessage"];
	        this.filesAffected = source["filesAffected"];
	    }
	}
	export class ImportPatchResult {
	    success: boolean;
	    appliedPatch: boolean;
	    createdGroup: boolean;
	    restoreResult?: RestoreResult;
	    createdChangelist?: models.Changelist;
	    errorMessage?: string;
	    filesAffected?: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportPatchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.appliedPatch = source["appliedPatch"];
	        this.createdGroup = source["createdGroup"];
	        this.restoreResult = this.convertValues(source["restoreResult"], RestoreResult);
	        this.createdChangelist = this.convertValues(source["createdChangelist"], models.Changelist);
	        this.errorMessage = source["errorMessage"];
	        this.filesAffected = source["filesAffected"];
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
	export class Remote {
	    name: string;
	    url: string;
	    pushUrl?: string;
	
	    static createFrom(source: any = {}) {
	        return new Remote(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.pushUrl = source["pushUrl"];
	    }
	}
	export class RemoteService {
	
	
	    static createFrom(source: any = {}) {
	        return new RemoteService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class RepositoryService {
	
	
	    static createFrom(source: any = {}) {
	        return new RepositoryService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class RestoreOptions {
	    CreateBackup: boolean;
	    TargetGroupID: string;
	    NewGroupName: string;
	    UseThreeWay: boolean;
	    AllowReject: boolean;
	    ModifyIndex: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RestoreOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.CreateBackup = source["CreateBackup"];
	        this.TargetGroupID = source["TargetGroupID"];
	        this.NewGroupName = source["NewGroupName"];
	        this.UseThreeWay = source["UseThreeWay"];
	        this.AllowReject = source["AllowReject"];
	        this.ModifyIndex = source["ModifyIndex"];
	    }
	}
	
	export class RevertOptions {
	    RevertStagedChanges: boolean;
	    RevertUnstagedChanges: boolean;
	    DeleteUntrackedFiles: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RevertOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.RevertStagedChanges = source["RevertStagedChanges"];
	        this.RevertUnstagedChanges = source["RevertUnstagedChanges"];
	        this.DeleteUntrackedFiles = source["DeleteUntrackedFiles"];
	    }
	}
	export class StagingService {
	
	
	    static createFrom(source: any = {}) {
	        return new StagingService(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class WorkingDirectoryStatus {
	    stagedFiles: FileStatus[];
	    unstagedFiles: FileStatus[];
	    untrackedFiles: FileStatus[];
	
	    static createFrom(source: any = {}) {
	        return new WorkingDirectoryStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stagedFiles = this.convertValues(source["stagedFiles"], FileStatus);
	        this.unstagedFiles = this.convertValues(source["unstagedFiles"], FileStatus);
	        this.untrackedFiles = this.convertValues(source["untrackedFiles"], FileStatus);
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

}

