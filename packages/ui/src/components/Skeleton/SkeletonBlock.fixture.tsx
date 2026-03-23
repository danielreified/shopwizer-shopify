import { SkeletonBlock } from './SkeletonBlock';

export default {
  name: 'SkeletonBlock',
  component: () => (
    <div className="space-y-6 p-6 w-[300px]">
      <SkeletonBlock height={60} />
      <SkeletonBlock height={120} />
      <SkeletonBlock height={40} width="60%" />
    </div>
  ),
};
