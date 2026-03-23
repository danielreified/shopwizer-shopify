import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { ArticleLayout } from '@/components/article-layout';

export default function CaseStudy() {
  const tableOfContents = [
    { id: 'overview', title: 'Overview', level: 2 },
    { id: 'challenge', title: 'The Challenge', level: 2 },
    { id: 'solution', title: 'The Solution', level: 2 },
    { id: 'implementation', title: 'Implementation', level: 3 },
    { id: 'results', title: 'Results', level: 2 },
    { id: 'key-metrics', title: 'Key Metrics', level: 3 },
    { id: 'testimonial', title: 'What They Say', level: 2 },
    { id: 'takeaways', title: 'Key Takeaways', level: 2 },
  ];

  return (
    <>
      <SliceHeader />
      <div style={{ paddingTop: 80 }}>
        <ArticleLayout
          title="How StyleHub Increased Revenue by 156% with AI Recommendations"
          date="October 20, 2025"
          readTime="6 min read"
          author="Michael Torres"
          category="Case Study"
          tableOfContents={tableOfContents}
        >
          <h2 id="overview">Overview</h2>
          <p>
            StyleHub, a fast-growing online fashion retailer with over 5,000 products, was
            struggling to help customers discover relevant items in their extensive catalog. Despite
            strong traffic numbers, their conversion rates were below industry benchmarks, and
            average order values remained stagnant.
          </p>
          <p>
            After implementing ShopWise's AI-powered recommendation engine, StyleHub saw dramatic
            improvements across all key metrics within just 60 days.
          </p>

          <h2 id="challenge">The Challenge</h2>
          <p>StyleHub faced several critical challenges:</p>
          <ul>
            <li>
              <strong>Product Discovery:</strong> With thousands of items, customers struggled to
              find products that matched their style preferences.
            </li>
            <li>
              <strong>Low Engagement:</strong> Visitors were leaving after viewing only 2-3 products
              on average.
            </li>
            <li>
              <strong>Missed Cross-Sell Opportunities:</strong> Their manual "You May Also Like"
              sections weren't resonating with customers.
            </li>
            <li>
              <strong>High Cart Abandonment:</strong> 72% of shoppers were abandoning their carts
              without completing purchases.
            </li>
          </ul>

          <h2 id="solution">The Solution</h2>
          <p>
            StyleHub partnered with ShopWise to implement a comprehensive AI recommendation strategy
            across their entire customer journey.
          </p>

          <h3 id="implementation">Implementation</h3>
          <p>The ShopWise team worked with StyleHub to deploy recommendations in key locations:</p>
          <ul>
            <li>
              <strong>Homepage:</strong> Personalized "Trending for You" sections based on browsing
              history and style preferences
            </li>
            <li>
              <strong>Product Pages:</strong> AI-powered "Complete the Look" suggestions and
              complementary items
            </li>
            <li>
              <strong>Cart Page:</strong> Smart upsells and last-minute add-ons tailored to cart
              contents
            </li>
            <li>
              <strong>Post-Purchase:</strong> Personalized email recommendations for repeat
              purchases
            </li>
          </ul>

          <h2 id="results">Results</h2>
          <p>
            The impact was immediate and substantial. Within the first 60 days of implementing
            ShopWise, StyleHub saw transformative results across their entire business.
          </p>

          <h3 id="key-metrics">Key Metrics</h3>
          <ul>
            <li>
              <strong>156% increase in revenue</strong> from recommendation-driven purchases
            </li>
            <li>
              <strong>89% boost in average order value</strong> through intelligent cross-sells
            </li>
            <li>
              <strong>43% improvement in conversion rate</strong> across all traffic sources
            </li>
            <li>
              <strong>2.8x more products viewed</strong> per session on average
            </li>
            <li>
              <strong>31% reduction in cart abandonment</strong> rate
            </li>
          </ul>

          <h2 id="testimonial">What They Say</h2>
          <blockquote>
            <p>
              "ShopWise completely transformed our business. The AI recommendations feel like having
              a personal stylist for every customer. Our revenue has skyrocketed, and customers are
              discovering products they love. The ROI was evident within the first week."
            </p>
            <footer>— Jessica Martinez, CEO of StyleHub</footer>
          </blockquote>

          <h2 id="takeaways">Key Takeaways</h2>
          <p>StyleHub's success demonstrates several important lessons:</p>
          <ul>
            <li>
              <strong>Personalization drives results:</strong> Generic recommendations can't compete
              with AI-powered personalization
            </li>
            <li>
              <strong>Strategic placement matters:</strong> Recommendations work best when
              integrated throughout the customer journey
            </li>
            <li>
              <strong>Quick implementation, lasting impact:</strong> Results can be seen within
              days, not months
            </li>
            <li>
              <strong>Data compounds over time:</strong> The AI engine gets smarter as it learns
              from more customer interactions
            </li>
          </ul>
          <p>
            Ready to achieve similar results for your store? Get started with ShopWise today and
            unlock the power of AI-driven recommendations.
          </p>
        </ArticleLayout>
      </div>
      <SliceFooter />
    </>
  );
}
