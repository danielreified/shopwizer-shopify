import { useState, useEffect } from 'react';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { CircleProgress } from './CircleProgress';

export default {
  component: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const id = setInterval(() => {
        setProgress((p) => (p < 100 ? p + 10 : p));
      }, 500);
      return () => clearInterval(id);
    }, []);

    return (
      <PolarisFixtureProvider>
        <div className="flex items-center gap-4 p-6">
          <CircleProgress progress={progress} size={24} />
        </div>
      </PolarisFixtureProvider>
    );
  },
};
