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

export default function UsageApproachingEmail({ usagePercent = 90 }: { usagePercent?: number }) {
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
                warning: '#E76F51',
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
              You’ve used {usagePercent}% of your monthly limit ⚠️
            </Heading>
            <Text className="text-gray-700 text-[16px] mt-[8px] leading-[24px]">
              Your Shopwise usage is approaching the monthly cap. At{' '}
              <span className="font-semibold">{usagePercent}%</span>, now’s a good time to review
              your plan to ensure uninterrupted insights and recommendations.
            </Text>
          </Section>

          <Section className="text-center mb-[32px]">
            <Button
              href="https://portal.shopwise.app/upgrade"
              className="bg-brand text-white text-[16px] font-medium px-[24px] py-[12px] rounded"
            >
              Review Plan
            </Button>
          </Section>

          <Hr className="my-[24px] border-t-[1px] border-gray-200" />

          <Section className="text-center text-[14px] text-gray-500">
            <Text>
              Shopwise will send you a final notice if you reach your usage cap. Avoid disruption by
              upgrading your plan now.
            </Text>
          </Section>

          <Section className="text-center text-[12px] text-gray-400 mt-[40px]">
            <Text>
              © {new Date().getFullYear()} Shopwise. All rights reserved.
              <br />
              <a
                href="https://shopwise.app/unsubscribe"
                className="text-gray-400 [text-decoration:none]"
              >
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Tailwind>
    </Html>
  );
}
