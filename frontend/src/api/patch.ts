import type { Changelist } from '@/types/changelist';
// import { models } from '../../wailsjs/go/models';
// import { SaveFileDialog } from '../../wailsjs/go/main/App';
// TODO: DiffService bindings need to be generated
// import {
//   CreatePatchFile,
//   CreatePatchFileForFiles,
//   GenerateDefaultPatchFileName,
// } from '../../wailsjs/go/services/DiffService';

/**
 * Create a patch file for a changelist group
 * TODO: Re-enable once DiffService bindings are generated
 */
export async function createPatchForGroup(
  _group: Changelist,
  _outputPath?: string
): Promise<{ path: string; size: number }> {
  // const wailsGroup = new models.Changelist(group);

  // // If no output path provided, prompt user to select one
  // let finalPath = outputPath;
  // if (!finalPath) {
  //   // Generate default filename
  //   const defaultFilename = await GenerateDefaultPatchFileName(group.name);

  //   // Show save file dialog
  //   finalPath = await SaveFileDialog(defaultFilename);

  //   // User cancelled
  //   if (!finalPath) {
  //     throw new Error('Patch creation cancelled');
  //   }
  // }

  // // Create the patch file
  // const fileSize = await CreatePatchFile(wailsGroup, finalPath);

  // return {
  //   path: finalPath,
  //   size: fileSize,
  // };
  throw new Error('createPatchForGroup not implemented - DiffService bindings needed');
}

/**
 * Create a patch file for specific files
 * TODO: Re-enable once DiffService bindings are generated
 */
export async function createPatchForFiles(
  _filePaths: string[],
  _defaultName: string,
  _outputPath?: string
): Promise<{ path: string; size: number }> {
  // // If no output path provided, prompt user to select one
  // let finalPath = outputPath;
  // if (!finalPath) {
  //   // Generate default filename
  //   const defaultFilename = await GenerateDefaultPatchFileName(defaultName);

  //   // Show save file dialog
  //   finalPath = await SaveFileDialog(defaultFilename);

  //   // User cancelled
  //   if (!finalPath) {
  //     throw new Error('Patch creation cancelled');
  //   }
  // }

  // // Create the patch file
  // const fileSize = await CreatePatchFileForFiles(filePaths, finalPath);

  // return {
  //   path: finalPath,
  //   size: fileSize,
  // };
  throw new Error('createPatchForFiles not implemented - DiffService bindings needed');
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
