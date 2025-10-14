import {
  CheckoutCommit,
  ResetBranch,
  RevertCommit,
  CherryPickCommit,
  CreatePatchFile,
  CreateTag,
  CreateBranchAtCommit,
  GetBranchesContainingCommit,
} from '../../wailsjs/go/services/RepositoryService';

export async function checkoutCommit(commitHash: string): Promise<void> {
  return await CheckoutCommit(commitHash);
}

export async function resetBranch(
  commitHash: string,
  mode: 'soft' | 'mixed' | 'hard'
): Promise<void> {
  return await ResetBranch(commitHash, mode);
}

export async function revertCommit(commitHash: string): Promise<void> {
  return await RevertCommit(commitHash);
}

export async function cherryPickCommit(commitHash: string): Promise<void> {
  return await CherryPickCommit(commitHash);
}

export async function createPatchFile(
  commitHash: string,
  filename: string,
  outputPath: string
): Promise<void> {
  return await CreatePatchFile(commitHash, filename, outputPath);
}

export async function createTag(
  tagName: string,
  commitHash: string,
  message: string
): Promise<void> {
  return await CreateTag(tagName, commitHash, message);
}

export async function createBranchAtCommit(branchName: string, commitHash: string): Promise<void> {
  return await CreateBranchAtCommit(branchName, commitHash);
}

export async function getBranchesContainingCommit(commitHash: string): Promise<string[]> {
  return await GetBranchesContainingCommit(commitHash);
}
