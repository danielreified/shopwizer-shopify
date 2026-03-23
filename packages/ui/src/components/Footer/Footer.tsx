import { FooterHelp, Link } from '@shopify/polaris';

export interface FooterProps {
  text: string;
  linkLabel: string;
  linkUrl: string;
}

export function Footer({ text, linkLabel, linkUrl }: FooterProps) {
  return (
    <FooterHelp>
      {text}{' '}
      <Link url={linkUrl} target="_blank">
        {linkLabel}
      </Link>
    </FooterHelp>
  );
}
