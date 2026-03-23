import * as React from 'react';
import { SkeletonBlock } from '../Skeleton';

type Series = { data: { key: string | number; value: number }[]; isComparison?: boolean };

type Props = {
  data: Series[];
  theme?: 'Light' | 'Dark';
  height?: number;
  className?: string;
  loading?: boolean;
  isAnimated?: boolean;
};

export const SparkLineChart = ({
  data,
  theme = 'Light',
  height = 50,
  className = '',
  loading = false,
  isAnimated = true,
}: Props) => {
  const [pv, setPv] = React.useState<null | {
    PolarisVizProvider: any;
    SparkLineChart: any;
  }>(null);

  React.useEffect(() => {
    let mounted = true;

    import('@shopify/polaris-viz/build/esm/styles.css').catch(() => {});
    import('@shopify/polaris-viz')
      .then((m) => {
        if (mounted) {
          setPv({
            PolarisVizProvider: m.PolarisVizProvider,
            SparkLineChart: m.SparkLineChart,
          });
        }
      })
      .catch((e) => console.error('Polaris Viz failed to load', e));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !pv) {
    return <SkeletonBlock height={height} className={className + ' rounded-md'} />;
  }

  const { PolarisVizProvider, SparkLineChart: PVSparkLineChart } = pv;

  return (
    <div style={{ height }} className={className}>
      <PolarisVizProvider>
        <PVSparkLineChart data={data} theme={theme} isAnimated={isAnimated} />
      </PolarisVizProvider>
    </div>
  );
};
