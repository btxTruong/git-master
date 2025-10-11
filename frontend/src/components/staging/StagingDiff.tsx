import { useState, useEffect } from 'react';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { getFileDiff } from '@/api/staging';
import { parseDiff } from '@/utils/diffParser';
import type { FileChange, DiffResult } from '@/types/git';

interface StagingDiffProps {
  selectedFile: FileChange | null;
}

export function StagingDiff({ selectedFile }: StagingDiffProps) {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setDiff(null);
      return;
    }

    const fetchDiff = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const diffText = await getFileDiff(selectedFile.path, selectedFile.staged);
        const parsedDiff = parseDiff(diffText);
        setDiff(parsedDiff);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load diff';
        setError(message);
        setDiff(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiff();
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Select a file to view its changes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <DiffViewer diff={diff} isLoading={isLoading} />
    </div>
  );
}
