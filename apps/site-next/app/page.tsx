import styles from '@/components/shopwizer-slices/shopwizer.module.css';
import { SliceHero } from '@/components/shopwizer-slices/SliceHero';
import { SliceBundle } from '@/components/shopwizer-slices/SliceBundle';
import { SliceMerch } from '@/components/shopwizer-slices/SliceMerch';
import { SliceResults } from '@/components/shopwizer-slices/SliceResults';
import { SliceWidget } from '@/components/shopwizer-slices/SliceWidget';
import { SliceDivider } from '@/components/shopwizer-slices/SliceDivider';
import { SliceFeatures } from '@/components/shopwizer-slices/SliceFeatures';
import { SliceSteps } from '@/components/shopwizer-slices/SliceSteps';
import { SliceTestimonials } from '@/components/shopwizer-slices/SliceTestimonials';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceLogoBar } from '@/components/shopwizer-slices/SliceLogoBar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopwizer — Site Slices',
  description: 'Your products, better arranged.',
};

export default function Home() {
  return (
    <>
      <SliceHeader />
      <div className={styles.container}>
        <SliceHero />
        <SliceLogoBar />

        <SliceDivider num="02" label="Smart Bundles" />
        <SliceBundle />

        <SliceDivider num="03" label="Merchandising Grid" />
        <SliceMerch />

        <SliceDivider num="04" label="Platform Features" />
        <SliceFeatures />

        <SliceDivider num="05" label="Social Proof" />
        <SliceResults />

        <SliceDivider num="06" label="How it works" />
        <SliceSteps />

        <SliceDivider num="07" label="Customer Stories" />
        <SliceTestimonials />

        <SliceDivider num="08" label="Recommendation Widget" />
        <SliceWidget />
      </div>
      <SliceFooter />
    </>
  );
}
