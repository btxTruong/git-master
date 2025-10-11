/**
 * Remote operations API
 * Bindings for Git remote operations (pull, push, fetch)
 */

import * as RemoteService from '../../wailsjs/go/services/RemoteService';

export interface PullOptions {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}

export interface PushOptions {
  remote?: string;
  branch?: string;
  force?: boolean;
  setUpstream?: boolean;
}

export interface FetchOptions {
  remote?: string;
  prune?: boolean;
}

export interface Remote {
  name: string;
  url: string;
  pushUrl?: string;
}

export interface PullProgress {
  stage: string;
  percentage: number;
  message: string;
}

export interface PushProgress {
  stage: string;
  percentage: number;
  message: string;
}

/**
 * Pull changes from remote repository
 */
export async function pull(options: PullOptions = {}): Promise<void> {
  const remote = options.remote || '';
  const branch = options.branch || '';
  const rebase = options.rebase || false;

  await RemoteService.Pull(remote, branch, rebase);
}

/**
 * Push changes to remote repository
 */
export async function push(options: PushOptions = {}): Promise<void> {
  const remote = options.remote || '';
  const branch = options.branch || '';
  const force = options.force || false;
  const setUpstream = options.setUpstream || false;

  await RemoteService.Push(remote, branch, force, setUpstream);
}

/**
 * Fetch changes from remote repository without merging
 */
export async function fetch(options: FetchOptions = {}): Promise<void> {
  const remote = options.remote || '';
  const prune = options.prune || false;

  await RemoteService.Fetch(remote, prune);
}

/**
 * Get list of remotes
 */
export async function getRemotes(): Promise<Remote[]> {
  return await RemoteService.GetRemotes();
}

/**
 * Add a new remote
 */
export async function addRemote(name: string, url: string): Promise<void> {
  await RemoteService.AddRemote(name, url);
}

/**
 * Remove a remote
 */
export async function removeRemote(name: string): Promise<void> {
  await RemoteService.RemoveRemote(name);
}
