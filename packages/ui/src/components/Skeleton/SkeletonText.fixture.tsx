import { SkeletonText } from './SkeletonText';

export default {
  name: 'SkeletonText',
  component: () => (
    <div className="space-y-3 p-6 w-[300px]">
      <SkeletonText width="100%" />
      <SkeletonText width="60%" />
      <SkeletonText width="40%" />
      <SkeletonText width="80%" height="20px" />
    </div>
  ),
};
