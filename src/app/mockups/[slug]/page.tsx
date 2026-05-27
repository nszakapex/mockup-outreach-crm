'use client';

import { use } from 'react';
import {
  Star,
  Smartphone,
  Search,
  BarChart3,
  MessageSquare,
  Calendar,
  ArrowRight,
  CheckCircle,
  Zap,
  TrendingUp,
  Target,
  Globe,
} from 'lucide-react';
import { useMockupBySlug } from '@/lib/hooks';

export default function MockupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { mockup, prospect, loading, error } = useMockupBySlug(slug);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-paper)' }}
      >
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--color-border)',
            borderTopColor: 'var(--color-accent)',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--color-paper)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          Mockup Data Did Not Load
        </h1>
        <p className="text-sm mt-2 max-w-xl break-all" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!mockup) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'var(--color-paper)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          Mockup Not Found
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-ink-3)' }}>
          This mockup may have been removed or the link is incorrect.
        </p>
      </div>
    );
  }

  const features = mockup.features_included?.split(',').map((f) => f.trim()) || [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      {/* ═══ HERO ═══ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-paper-2), var(--color-paper))',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, var(--color-accent-muted), transparent 60%), radial-gradient(ellipse at 70% 80%, var(--color-emerald-muted), transparent 60%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          {prospect && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
              }}
            >
              <Star size={12} />
              Concept for {prospect.business_name}
            </div>
          )}
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ color: 'var(--color-ink)' }}
          >
            {mockup.hero_headline || mockup.title}
          </h1>
          {mockup.hero_subheadline && (
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
              style={{ color: 'var(--color-ink-2)' }}
            >
              {mockup.hero_subheadline}
            </p>
          )}
          {mockup.primary_cta && (
            <a
              href="#schedule"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-transform"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-paper)',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {mockup.primary_cta}
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </section>

      {/* ═══ FEATURED SERVICES / OFFER ═══ */}
      {features.length > 0 && (
        <section className="py-16 md:py-20" style={{ background: 'var(--color-paper-2)' }}>
          <div className="max-w-5xl mx-auto px-6">
            <h2
              className="text-2xl md:text-3xl font-bold text-center mb-12"
              style={{ color: 'var(--color-ink)' }}
            >
              What&apos;s Included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => {
                const icons = [Smartphone, Globe, Star, BarChart3, MessageSquare, Calendar];
                const Icon = icons[i % icons.length];
                return (
                  <div
                    key={i}
                    className="p-5 rounded-xl transition-colors"
                    style={{
                      background: 'var(--color-paper-3)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {feature}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PREMIUM CONCEPT ═══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ color: 'var(--color-ink)' }}
              >
                Built for Growth
              </h2>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: 'var(--color-ink-2)' }}
              >
                This concept is designed to convert visitors into customers. Every element — from the
                headline to the call-to-action — is optimized for your specific market.
              </p>
              <div className="space-y-3">
                {['Conversion-optimized layout', 'Mobile-first responsive design', 'Fast load times under 3 seconds'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: 'var(--color-emerald)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-ink-2)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="aspect-[4/3] rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-paper-3), var(--color-paper-4))',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="text-center px-6">
                <Zap size={40} style={{ color: 'var(--color-accent)', margin: '0 auto 16px' }} />
                <div className="text-sm font-medium" style={{ color: 'var(--color-ink-3)' }}>
                  Interactive preview coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LOCAL SEO + CONVERSION ═══ */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'var(--color-paper-2)' }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: 'var(--color-ink)' }}
          >
            Dominate Local Search
          </h2>
          <p
            className="text-base max-w-2xl mx-auto mb-12"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Get found by customers actively searching for your services in your area.
            We combine local SEO best practices with conversion-focused design.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Local SEO', desc: 'Rank higher for local searches in your area' },
              { icon: TrendingUp, title: 'More Conversions', desc: 'Turn website visitors into paying customers' },
              { icon: Target, title: 'Targeted Reach', desc: 'Attract the right customers for your business' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl"
                style={{
                  background: 'var(--color-paper-3)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Icon
                  size={24}
                  className="mx-auto mb-3"
                  style={{ color: 'var(--color-emerald)' }}
                />
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  {title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTENT + META ADS GROWTH ═══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div
              className="order-2 md:order-1 aspect-[4/3] rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-emerald-subtle), var(--color-accent-subtle))',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="text-center px-6">
                <BarChart3 size={40} style={{ color: 'var(--color-emerald)', margin: '0 auto 16px' }} />
                <div className="text-sm font-medium" style={{ color: 'var(--color-ink-3)' }}>
                  Growth analytics dashboard
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ color: 'var(--color-ink)' }}
              >
                Content + Paid Ads Strategy
              </h2>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: 'var(--color-ink-2)' }}
              >
                Pair your new website with a content and Meta ads strategy designed to
                drive consistent traffic and bookings. We handle the full funnel.
              </p>
              <div className="space-y-3">
                {[
                  'Social media content calendar',
                  'Meta ads campaign management',
                  'Monthly performance reports',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: 'var(--color-accent)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-ink-2)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA — Schedule a Walkthrough ═══ */}
      <section
        id="schedule"
        className="py-16 md:py-24"
        style={{
          background: 'linear-gradient(135deg, var(--color-paper-3), var(--color-paper-2))',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-2xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-ink)' }}
          >
            Ready to See This Come to Life?
          </h2>
          <p
            className="text-base mb-8 max-w-xl mx-auto"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Schedule a free 15-minute walkthrough and we&apos;ll show you exactly
            how this concept can work for your business.
          </p>
          <a
            href="mailto:nate@apexmarketing.ai?subject=Mockup Walkthrough Request"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-transform"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-paper)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Calendar size={18} />
            Schedule a Free Walkthrough
          </a>
          <p className="text-xs mt-4" style={{ color: 'var(--color-ink-muted)' }}>
            No commitment required. No pressure.
          </p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer
        className="py-8 text-center"
        style={{
          background: 'var(--color-paper)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          This is a design concept prepared by Apex Marketing & AI Solutions.
        </p>
      </footer>
    </div>
  );
}
