# @repo/ui

Shared React component library for the Shopwise admin app. Built on Shopify Polaris with React Cosmos for component documentation.

## Components

Accordion, ActionCard, BottomBar, Card, Chip, CircleProgress, CollapsibleCard, DateRangePicker, DebugPanel, ErrorDisplay, ExpandableHtml, FeatureCard, Footer, Guide, HeroCard, IconBox, LineChart, LineChartCard, MarketingCard, MediaGrid, Menu, MetricDisplay, Modal, MultiLineChartCard, OnboardingCards, OnboardingFab, OnboardingStepItem, PageTitle, PreferenceGrid, ProductCard, ProductsGrid, QuickJumpButtons, SectionHeader, SelectableRow, SelectorModal, SettingsHeader, SidebarMenu, SimpleCard, SparkLineChart, Switch, SyncStatus, Table, Tabs, ThreePaneLayout, VerticalNav, AccountStatusCard

## Usage

```tsx
// Barrel import
import { Card, LineChart, ProductsGrid } from '@repo/ui';

// Direct component import
import { Modal } from '@repo/ui/components/Modal';
```

## Peer Dependencies

- `@shopify/polaris` ^12
- `@shopify/polaris-viz` ^16
- `@shopify/app-bridge-react` ^4
- `react` 18.3.x

## Scripts

```bash
pnpm lint           # Run ESLint
pnpm cosmos         # Start React Cosmos dev server
pnpm cosmos-export  # Export static Cosmos build
```
