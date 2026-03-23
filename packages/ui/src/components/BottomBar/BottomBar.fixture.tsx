import { useState, useEffect } from 'react';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { BottomBar } from './BottomBar';

export default {
  component: () => {
    const [open, setOpen] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Show the bar after 1 second
    useEffect(() => {
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }, []);

    // Mark complete after 10 seconds
    useEffect(() => {
      if (!open) return;
      const t = setTimeout(() => setIsComplete(true), 10000);
      return () => clearTimeout(t);
    }, [open]);

    return (
      <PolarisFixtureProvider>
        <div className="relative h-screen border-8">
          <BottomBar
            open={open}
            message={isComplete ? 'Sync complete' : 'Syncing products'}
            isComplete={isComplete}
            onDismiss={() => setOpen(false)}
          />
        </div>
      </PolarisFixtureProvider>
    );
  },
};
