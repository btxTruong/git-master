import { FileStatus, type StagingFileChange } from '@/types/git';

// Import Wails-generated bindings
// These will be available after running `wails dev` or `wails build`
// FileStatusInfo from backend (different from frontend FileStatus enum)
interface FileStatusInfo {
  path: string;
  status: string;
  staged: boolean;
  modified: boolean;
}

let GetStatus:
  | (() => Promise<{
      stagedFiles: FileStatusInfo[];
      unstagedFiles: FileStatusInfo[];
      untrackedFiles: FileStatusInfo[];
    }>)
  | null = null;

let StageFile: ((path: string) => Promise<void>) | null = null;
let UnstageFile: ((path: string) => Promise<void>) | null = null;
let StageAll: (() => Promise<void>) | null = null;
let UnstageAll: (() => Promise<void>) | null = null;
let GetFileDiff: ((path: string, staged: boolean) => Promise<string>) | null = null;
let Commit: ((message: string, amend: boolean) => Promise<void>) | null = null;

// Lazy load Wails bindings
async function loadBindings() {
  if (GetStatus) return;

  try {
    const StagingService = await import('../../wailsjs/go/services/StagingService');
    GetStatus = StagingService.GetStatus;
    StageFile = StagingService.StageFile;
    UnstageFile = StagingService.UnstageFile;
    StageAll = StagingService.StageAll;
    UnstageAll = StagingService.UnstageAll;
    GetFileDiff = (StagingService as any).GetFileDiff || null;
    Commit = (StagingService as any).Commit || null;
  } catch (error) {
    console.error('Failed to load Wails bindings:', error);
    throw new Error('Wails bindings not available');
  }
}

// Convert backend FileStatusInfo to frontend StagingFileChange
function convertFileStatus(fileStatus: FileStatusInfo, staged: boolean): StagingFileChange {
  const status = fileStatus.status.trim();
  let changeType: FileStatus;

  if (status === 'A' || status === '?') {
    changeType = FileStatus.Added;
  } else if (status === 'D') {
    changeType = FileStatus.Deleted;
  } else if (status === 'M') {
    changeType = FileStatus.Modified;
  } else if (status === 'R') {
    changeType = FileStatus.Renamed;
  } else {
    changeType = FileStatus.Modified;
  }

  return {
    path: fileStatus.path,
    oldPath: null,
    status: changeType,
    additions: 0,
    deletions: 0,
    isBinary: false,
    staged,
  };
}

export async function getWorkingDirectoryStatus(): Promise<{
  stagedFiles: StagingFileChange[];
  unstagedFiles: StagingFileChange[];
  untrackedFiles: StagingFileChange[];
}> {
  await loadBindings();

  if (!GetStatus) {
    throw new Error('GetStatus binding not available');
  }

  const result = await GetStatus();

  return {
    stagedFiles: result.stagedFiles.map((f) => convertFileStatus(f, true)),
    unstagedFiles: result.unstagedFiles.map((f) => convertFileStatus(f, false)),
    untrackedFiles: result.untrackedFiles.map((f) => convertFileStatus(f, false)),
  };
}

export async function stageFile(path: string): Promise<void> {
  await loadBindings();

  if (!StageFile) {
    throw new Error('StageFile binding not available');
  }

  await StageFile(path);
}

export async function unstageFile(path: string): Promise<void> {
  await loadBindings();

  if (!UnstageFile) {
    throw new Error('UnstageFile binding not available');
  }

  await UnstageFile(path);
}

export async function stageAllFiles(): Promise<void> {
  await loadBindings();

  if (!StageAll) {
    throw new Error('StageAll binding not available');
  }

  await StageAll();
}

export async function unstageAllFiles(): Promise<void> {
  await loadBindings();

  if (!UnstageAll) {
    throw new Error('UnstageAll binding not available');
  }

  await UnstageAll();
}

export async function getFileDiff(path: string, staged: boolean): Promise<string> {
  await loadBindings();

  if (!GetFileDiff) {
    throw new Error('GetFileDiff binding not available');
  }

  return await GetFileDiff(path, staged);
}

export async function commitChanges(message: string, amend: boolean = false): Promise<void> {
  await loadBindings();

  if (!Commit) {
    throw new Error('Commit binding not available');
  }

  await Commit(message, amend);
}
