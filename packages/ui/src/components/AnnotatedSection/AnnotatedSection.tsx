import * as React from 'react';
import { Layout, Card, BlockStack, Text, Divider } from '@shopify/polaris';
import type { ReactNode } from 'react';

export type AnnotatedSectionItemProps = {
  title: string;
  description?: ReactNode;
  heading?: string;
  helperText?: ReactNode;
  children: ReactNode;
  leftWidth?: '';
};

function Item({ title, description, heading, helperText, children }: AnnotatedSectionItemProps) {
  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          {description ? <Text tone="subdued">{description}</Text> : null}
        </BlockStack>
      </Layout.Section>

      <Layout.Section>
        <Card>
          <BlockStack gap="300">
            {heading ? (
              <Text as="h3" variant="headingSm">
                {heading}
              </Text>
            ) : null}
            {children}
            {helperText ? <Text tone="subdued">{helperText}</Text> : null}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

type WrapperProps = { children: ReactNode };

const AnnotatedSectionBase: React.FC<WrapperProps> = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <BlockStack gap="600">
      {items.map((child, idx) => (
        <React.Fragment key={idx}>
          {child}
          {idx < items.length - 1 ? <Divider /> : null}
        </React.Fragment>
      ))}
    </BlockStack>
  );
};

export const AnnotatedSection: React.FC<WrapperProps> & { Item: typeof Item } = Object.assign(
  AnnotatedSectionBase,
  { Item },
);

export default AnnotatedSection;
