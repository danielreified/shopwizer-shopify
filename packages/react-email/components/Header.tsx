import * as React from 'react';
import { Section, Row, Column, Img, Link } from '@react-email/components';

export default function Header() {
  return (
    <Section className="my-[40px] px-[32px] py-[40px]">
      <Row>
        {/* Left side - Logo */}
        <Column className="w-[80%]">
          <Link href="https://shopwise.app" className="[text-decoration:none]">
            <Img
              alt="Shopwise"
              height="34"
              width="168"
              src="https://static.xx.fbcdn.net/rsrc.php/v4/ym/r/__J0RTJO3M_.png"
            />
          </Link>
        </Column>

        {/* Right side - Navigation Links */}
        <Column align="right">
          <Row align="right">
            {[
              { name: 'About', href: 'https://shopwise.app/about' },
              { name: 'Company', href: 'https://shopwise.app/company' },
              { name: 'Blog', href: 'https://shopwise.app/blog' },
            ].map((link) => (
              <Column key={link.name} className="px-[8px]">
                <Link href={link.href} className="text-gray-600 text-[14px] [text-decoration:none]">
                  {link.name}
                </Link>
              </Column>
            ))}
          </Row>
        </Column>
      </Row>
    </Section>
  );
}
