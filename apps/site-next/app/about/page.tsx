import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { SliceAbout } from '@/components/shopwizer-slices/SliceAbout';
import styles from '@/components/shopwizer-slices/shopwizer.module.css';

export default function AboutPage() {
  return (
    <>
      <SliceHeader />
      <div className={styles.container} style={{ marginTop: 80 }}>
        <SliceAbout />
      </div>
      <SliceFooter />
    </>
  );
}
