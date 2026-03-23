import { useEffect, useState, type ReactNode } from 'react';
import { InlineGrid, Card, Text } from '@shopify/polaris';

/* ------------------------------------------------------
   🎰 AnimatedNumber — smooth lottery-style count up
-------------------------------------------------------*/
export function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    if (end === 0) {
      setDisplay(0);
      return;
    }

    const stepTime = 16; // ~60fps
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    let current = start;
    const interval = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(interval);
      }
      setDisplay(Math.floor(current));
    }, stepTime);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

/* ------------------------------------------------------
   🧩 HeroItemCard — reusable overlay metric card
-------------------------------------------------------*/
export function HeroItemCard({
  label,
  value,
  prefix,
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
      <Text as="span" fontWeight="semibold">
        {label}
      </Text>
      <Text as="span" fontWeight="semibold" variant="headingLg" tone="subdued">
        {prefix ? `${prefix} ` : ''}
        <AnimatedNumber value={value} />
      </Text>
    </div>
  );
}

/* ------------------------------------------------------
   💡 HERO CARD
-------------------------------------------------------*/
type HeroCardProps = {
  imageUrl?: string;
  image?: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  overlay?: ReactNode | boolean;
  imageHeight?: number | string;
};

export function HeroCard({
  imageUrl,
  image,
  leftSlot,
  rightSlot,
  overlay = true,
  imageHeight = 220,
}: HeroCardProps) {
  const height = typeof imageHeight === 'number' ? `${imageHeight}px` : imageHeight;

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Hero Image */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height, overflow: 'hidden', borderRadius: '8px' }}>
            {image ? (
              <div style={{ height: '100%', width: '100%' }}>{image}</div>
            ) : (
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Default Overlay OR custom overlay */}
          {overlay && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                zIndex: 30,
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  borderRadius: '12px',
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  backgroundColor: 'white',
                  padding: '24px',
                }}
              >
                {/* Default if overlay === true */}
                {overlay === true ? (
                  <>
                    <HeroItemCard label="Generated Revenue" value={3104} prefix="ZAR" />

                    <div
                      style={{
                        width: '1px',
                        height: '40px',
                        background: 'linear-gradient(to bottom, transparent, #9ca3af, transparent)',
                      }}
                    />

                    <HeroItemCard label="Generated Orders" value={12} />
                  </>
                ) : (
                  overlay
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Slots */}
        {(leftSlot || rightSlot) && (
          <div style={{ padding: '0' }}>
            <InlineGrid gap="400" columns={{ xs: '1fr', md: '1fr 1fr' }} alignItems="start">
              <div>{leftSlot}</div>
              <div>{rightSlot}</div>
            </InlineGrid>
          </div>
        )}
      </div>
    </Card>
  );
}

export default HeroCard;
