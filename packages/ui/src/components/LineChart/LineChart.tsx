import * as React from 'react';
import { SkeletonBlock } from '../Skeleton';

type Series = { name: string; data: { key: string; value: number }[] };

type Props = {
  data: Series[];
  theme?: 'Light' | 'Dark';
  height?: number;
  className?: string;
  loading?: boolean;
  showLegend?: boolean;
};

export const LineChart = ({
  data,
  theme = 'Light',
  height = 340,
  className = '',
  loading = false,
  showLegend = true,
}: Props) => {
  const [pv, setPv] = React.useState<null | {
    PolarisVizProvider: any;
    LineChart: any;
  }>(null);

  React.useEffect(() => {
    let mounted = true;

    import('@shopify/polaris-viz/build/esm/styles.css').catch(() => {});
    import('@shopify/polaris-viz')
      .then((m) => {
        if (mounted) {
          setPv({
            PolarisVizProvider: m.PolarisVizProvider,
            LineChart: m.LineChart,
          });
        }
      })
      .catch((e) => console.error('Polaris Viz failed to load', e));

    return () => {
      mounted = false;
    };
  }, []);

  //──────────────────────────────
  // LOADING → SkeletonBlock
  //──────────────────────────────
  if (loading || !pv) {
    return <SkeletonBlock height={height} className={className + ' rounded-xl'} />;
  }

  const { PolarisVizProvider, LineChart: PVLineChart } = pv;

  return (
    <div style={{ height }} className={className}>
      <PolarisVizProvider>
        <PVLineChart data={data} theme={theme} legendPosition={showLegend ? 'bottom' : 'hidden'} />
      </PolarisVizProvider>
    </div>
  );
};
