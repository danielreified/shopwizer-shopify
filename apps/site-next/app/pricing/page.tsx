import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { SlicePricing } from '@/components/shopwizer-slices/SlicePricing';
import styles from '@/components/shopwizer-slices/shopwizer.module.css';

export default function PricingPage() {
  return (
    <>
      <SliceHeader />
      <div className={styles.container} style={{ marginTop: 80 }}>
        <SlicePricing />
      </div>
      <SliceFooter />
    </>
  );
}
