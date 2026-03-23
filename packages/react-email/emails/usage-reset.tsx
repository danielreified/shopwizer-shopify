import * as React from 'react';
import {
  Html,
  Head,
  Font,
  Tailwind,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import Header from '../components/Header';

export default function UsageResetEmail() {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: '#FFB703',
                offblack: '#121212',
              },
              fontFamily: {
                sans: ['Inter', 'Arial', 'sans-serif'],
              },
            },
          },
        }}
      >
        <Container className="font-sans bg-white rounded-md">
          <Header />

          <Section className="text-center mt-[24px] mb-[40px]">
            <Heading className="text-2xl font-semibold text-offblack">
              New billing cycle started 🔄
            </Heading>
            <Text className="text-gray-700 text-[16px] mt-[8px] leading-[24px]">
              Your usage has been reset for the new billing month! You’re all set to keep generating
              recommendations and insights without interruption.
            </Text>
          </Section>

          <Section className="text-center mb-[32px]">
            <Button
              href="https://portal.shopwise.app"
              className="bg-brand text-white text-[16px] font-medium px-[24px] py-[12px] rounded"
            >
              View My Dashboard
            </Button>
          </Section>

          <Hr className="my-[24px] border-t-[1px] border-gray-200" />

          <Section className="text-center text-[14px] text-gray-500">
            <Text>
              Want to optimize your new month?{' '}
              <a
                href="https://docs.shopwise.app/tips"
                className="text-brand [text-decoration:none]"
              >
                Check out our performance tips.
              </a>
            </Text>
          </Section>

          <Section className="text-center text-[12px] text-gray-400 mt-[40px]">
            <Text>© {new Date().getFullYear()} Shopwise. All rights reserved.</Text>
          </Section>
        </Container>
      </Tailwind>
    </Html>
  );
}
