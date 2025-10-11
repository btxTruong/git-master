import { useRebaseStore } from '@/stores/rebaseStore';
import { RebaseCommitItem } from './RebaseCommitItem';

export function RebaseCommitList() {
  const { commits } = useRebaseStore();

  return (
    <div className="space-y-2 overflow-y-auto max-h-96">
      {commits.map((commit) => (
        <RebaseCommitItem key={commit.hash} commit={commit} />
      ))}
    </div>
  );
}
