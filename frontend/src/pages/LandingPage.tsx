import React, { useState, useEffect, useCallback } from 'react';
import { Button, InputNumber, Typography, Segmented, Drawer, message, Spin, Collapse } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getPublicInvestmentPackages } from '../api/investor';
import {
  ArrowRightOutlined,
  CalculatorOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  GlobalOutlined,
  LineChartOutlined,
  GoldOutlined,
  LeftOutlined,
  RightOutlined,
  StarFilled,
  UserOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const { Title, Text, Paragraph } = Typography;

const PLAN_PALETTE = [
  { color: '#0d9488', bg: '#f0fdfa' },
  { color: '#6366f1', bg: '#eef2ff' },
  { color: '#b45309', bg: '#fffbeb' },
  { color: '#059669', bg: '#ecfdf5' },
  { color: '#7c3aed', bg: '#f5f3ff' },
];

const formatKES = (n: number) => 'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  decimals: number;
}

// Forex pairs fetched from ExchangeRate API
const FOREX_CONFIG = [
  { symbol: 'XAU/USD', key: 'XAU', decimals: 2 },
  { symbol: 'GBP/USD', key: 'GBP', decimals: 4 },
  { symbol: 'USD/JPY', key: 'JPY', decimals: 2, invert: true },
  { symbol: 'EUR/USD', key: 'EUR', decimals: 4 },
  { symbol: 'XAG/USD', key: 'XAG', decimals: 2 },
  { symbol: 'USD/CAD', key: 'CAD', decimals: 4, invert: true },
  { symbol: 'USD/CHF', key: 'CHF', decimals: 4, invert: true },
  { symbol: 'USD/KES', key: 'KES', decimals: 2, invert: true },
  { symbol: 'AUD/USD', key: 'AUD', decimals: 4 },
  { symbol: 'NZD/USD', key: 'NZD', decimals: 4 },
  { symbol: 'USD/ZAR', key: 'ZAR', decimals: 4, invert: true },
];

// Crypto fetched from CoinGecko API
const CRYPTO_CONFIG = [
  { symbol: 'BTC/USD', id: 'bitcoin', decimals: 0 },
  { symbol: 'ETH/USD', id: 'ethereum', decimals: 0 },
];

// Indices & oil - simulated (no free browser API available)
const MARKET_SIMULATED = [
  { symbol: 'NAS100', basePrice: 21458, decimals: 0 },
  { symbol: 'SPX500', basePrice: 5728, decimals: 0 },
  { symbol: 'WTI OIL', basePrice: 71.32, decimals: 2 },
];

const FALLBACK_TICKERS: TickerItem[] = [
  { symbol: 'XAU/USD', price: 3023.40, change: 0.42, decimals: 2 },
  { symbol: 'GBP/USD', price: 1.2948, change: -0.18, decimals: 4 },
  { symbol: 'USD/JPY', price: 149.87, change: 0.23, decimals: 2 },
  { symbol: 'EUR/USD', price: 1.0825, change: -0.09, decimals: 4 },
  { symbol: 'XAG/USD', price: 33.48, change: 0.67, decimals: 2 },
  { symbol: 'USD/CAD', price: 1.3821, change: 0.11, decimals: 4 },
  { symbol: 'USD/CHF', price: 0.9012, change: -0.06, decimals: 4 },
  { symbol: 'USD/KES', price: 129.50, change: 0.12, decimals: 2 },
  { symbol: 'AUD/USD', price: 0.6534, change: 0.15, decimals: 4 },
  { symbol: 'NZD/USD', price: 0.5982, change: -0.22, decimals: 4 },
  { symbol: 'USD/ZAR', price: 18.12, change: -0.31, decimals: 4 },
  { symbol: 'BTC/USD', price: 87420, change: 1.45, decimals: 0 },
  { symbol: 'ETH/USD', price: 2045, change: 0.92, decimals: 0 },
  { symbol: 'NAS100', price: 21458, change: 0.88, decimals: 0 },
  { symbol: 'SPX500', price: 5728, change: 0.54, decimals: 0 },
  { symbol: 'WTI OIL', price: 71.32, change: -0.35, decimals: 2 },
];

const MarketTicker: React.FC = () => {
  const [tickers, setTickers] = useState<TickerItem[]>(FALLBACK_TICKERS);
  const prevPricesRef = React.useRef<Record<string, number>>({});

  const fetchAllRates = useCallback(async () => {
    const prevPrices = prevPricesRef.current;
    const results: TickerItem[] = [];

    // 1. Forex & metals from ExchangeRate API
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success') {
        const rates = data.rates;
        FOREX_CONFIG.forEach(cfg => {
          const rate = rates[cfg.key];
          if (!rate) return;
          const price = cfg.invert ? rate : (1 / rate);
          const prev = prevPrices[cfg.symbol];
          const change = prev ? ((price - prev) / prev) * 100 : 0;
          prevPrices[cfg.symbol] = price;
          results.push({ symbol: cfg.symbol, price, change: parseFloat(change.toFixed(2)), decimals: cfg.decimals });
        });
      }
    } catch { /* keep fallbacks */ }

    // 2. Crypto from CoinGecko
    try {
      const ids = CRYPTO_CONFIG.map(c => c.id).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      const data = await res.json();
      CRYPTO_CONFIG.forEach(cfg => {
        const coin = data[cfg.id];
        if (!coin) return;
        const price = coin.usd;
        const change = coin.usd_24h_change ? parseFloat(coin.usd_24h_change.toFixed(2)) : 0;
        prevPrices[cfg.symbol] = price;
        results.push({ symbol: cfg.symbol, price, change, decimals: cfg.decimals });
      });
    } catch { /* keep fallbacks */ }

    // 3. Indices & oil - simulated with small drift
    MARKET_SIMULATED.forEach(cfg => {
      const prev = prevPrices[cfg.symbol] || cfg.basePrice;
      const drift = (Math.random() - 0.48) * 0.002 * prev; // slight upward bias
      const price = prev + drift;
      const change = ((price - cfg.basePrice) / cfg.basePrice) * 100;
      prevPrices[cfg.symbol] = price;
      results.push({ symbol: cfg.symbol, price, change: parseFloat(change.toFixed(2)), decimals: cfg.decimals });
    });

    prevPricesRef.current = prevPrices;

    // Merge: use fetched data where available, fall back to existing
    if (results.length > 0) {
      setTickers(prev => {
        const map = new Map(results.map(r => [r.symbol, r]));
        const merged = prev.map(t => map.get(t.symbol) || t);
        // Add any new items not in prev
        results.forEach(r => { if (!prev.find(t => t.symbol === r.symbol)) merged.push(r); });
        return merged;
      });
    }
  }, []);

  useEffect(() => {
    fetchAllRates();
    // Forex/crypto refresh every 60s, indices drift every 10s
    const mainId = setInterval(fetchAllRates, 60000);
    const simId = setInterval(() => {
      setTickers(prev => prev.map(t => {
        const sim = MARKET_SIMULATED.find(m => m.symbol === t.symbol);
        if (!sim) return t;
        const drift = (Math.random() - 0.48) * 0.002 * t.price;
        const price = t.price + drift;
        const change = ((price - sim.basePrice) / sim.basePrice) * 100;
        return { ...t, price, change: parseFloat(change.toFixed(2)) };
      }));
    }, 10000);
    return () => { clearInterval(mainId); clearInterval(simId); };
  }, [fetchAllRates]);

  const items = [...tickers, ...tickers]; // duplicate for seamless loop

  return (
    <div
      style={{
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        overflow: 'hidden',
        height: 42,
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 999,
      }}
    >
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, #0f172a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, #0f172a, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div className="market-ticker-track">
        {items.map((item, i) => (
          <div key={i} className="market-ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-price">
              {item.price.toFixed(item.decimals)}
            </span>
            <span className={`ticker-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { whatsappNumber } = useSettings();
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  const [calcPeriod, setCalcPeriod] = useState<string>('12');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: rawPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ['public-investment-packages'],
    queryFn: () => getPublicInvestmentPackages().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const activePackages: Array<{
    id: number; name: string; min_amount: number; max_amount: number | null;
    interest_rate: number; features: string[]; is_active: boolean; sort_order: number;
  }> = Array.isArray(rawPackages)
    ? rawPackages.filter((p: any) => p.is_active).sort((a: any, b: any) => a.sort_order - b.sort_order)
    : [];

  const plans = activePackages.map((pkg, i) => {
    const palette = PLAN_PALETTE[i % PLAN_PALETTE.length];
    const rateDecimal = Number(pkg.interest_rate);
    const rateDisplay = (rateDecimal * 100).toFixed(2).replace(/\.?0+$/, '') + '%';
    const minFmt = `KES ${Number(pkg.min_amount).toLocaleString('en-KE')}`;
    const maxFmt = pkg.max_amount != null ? ` - KES ${Number(pkg.max_amount).toLocaleString('en-KE')}` : '+';
    return {
      tier: pkg.name,
      range: minFmt + maxFmt,
      rate: rateDisplay,
      rateDecimal,
      color: palette.color,
      bg: palette.bg,
      popular: i === 1 && activePackages.length > 1,
      features: Array.isArray(pkg.features) ? pkg.features : [],
    };
  });

  const getRate = (amount: number) => {
    if (activePackages.length > 0) {
      const sorted = [...activePackages].sort((a, b) => b.min_amount - a.min_amount);
      const match = sorted.find(p => amount >= p.min_amount && (p.max_amount == null || amount <= p.max_amount));
      if (match) return Number(match.interest_rate);
      return 0;
    }
    // fallback while packages load
    if (amount >= 500000) return 0.25;
    if (amount >= 150000) return 0.2308;
    if (amount >= 50000) return 0.175;
    return 0;
  };

  const rate = getRate(calcAmount);
  const months = parseInt(calcPeriod);
  const totalInterest = calcAmount * rate * months;
  const monthlyPayout = calcAmount > 0 ? (calcAmount + totalInterest) / months : 0;
  const totalReturns = totalInterest;
  const totalValue = monthlyPayout * months;

  // Testimonials carousel
  const testimonials = [
    { name: 'James M.', role: '', text: 'A game-changer for my savings. Monthly payouts are consistent and the team is very professional.' },
    { name: 'Grace W.', role: '', text: 'The transparency of the investor portal won me over. I can track every payout in real time.' },
    { name: 'Peter K.', role: '', text: 'Reliable passive income every month without fail. The returns have exceeded my expectations.' },
    { name: 'Amina H.', role: '', text: 'Modern platform, easy to use. The interest rates are very competitive compared to other options.' },
    { name: 'David O.', role: '', text: 'Their risk management approach gives me confidence. My investment is in safe hands.' },
    { name: 'Sarah N.', role: '', text: 'Upgraded from Starter to Growth in 6 months. The team guided me through the entire process.' },
    { name: 'Collins T.', role: '', text: 'Best decision I made. The returns are reliable and I appreciate the detailed monthly reports.' },
    { name: 'Lucy A.', role: '', text: 'Smooth onboarding and intuitive portal. I can see exactly where my money is at all times.' },
    { name: 'Michael R.', role: '', text: 'Solid risk management and prompt communication. A trustworthy investment partner.' },
  ];

  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleCount = windowWidth <= 480 ? 1 : 2;
  const totalPages = Math.ceil(testimonials.length / visibleCount);
  const maxIndex = totalPages - 1;

  const nextTestimonial = useCallback(() => {
    setTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 4000);
    return () => clearInterval(timer);
  }, [nextTestimonial]);

  useEffect(() => {
    if (testimonialIndex > maxIndex) setTestimonialIndex(maxIndex);
  }, [maxIndex, testimonialIndex]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", margin: 0, padding: 0, overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a365d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BankOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', lineHeight: 1.2 }}>Zig Capital</div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1.5, textTransform: 'uppercase' }}>Investment Ltd</div>
          </div>
        </div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#plans">Plans</a>
          <a href="#calculator">Calculator</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
          <Button type="default" onClick={() => navigate('/investor/login')} style={{ borderRadius: 8 }}>Login</Button>
          <Button type="primary" onClick={() => navigate('/investor/register')} style={{ borderRadius: 8 }}>Sign Up</Button>
        </div>
        <Button
          className="mobile-menu-btn"
          type="text"
          icon={<MenuOutlined style={{ fontSize: 20 }} />}
          onClick={() => setMobileMenuOpen(true)}
        />
      </nav>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="right"
        width={280}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
          {['About', 'Plans', 'Calculator', 'Testimonials', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '14px 24px', color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: 15, borderBottom: '1px solid #f1f5f9' }}
            >
              {item}
            </a>
          ))}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button block onClick={() => { navigate('/investor/login'); setMobileMenuOpen(false); }} style={{ borderRadius: 8 }}>Login</Button>
            <Button block type="primary" onClick={() => { navigate('/investor/register'); setMobileMenuOpen(false); }} style={{ borderRadius: 8 }}>Sign Up</Button>
          </div>
        </div>
      </Drawer>

      {/* Market Data Ticker */}
      <MarketTicker />

      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '130px 40px 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hero-section"
      >
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 10, 40, 0.55)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              backdropFilter: 'blur(4px)',
            }}
          >
            Trusted Investment Partner
          </div>
          <Title className="hero-title" style={{ color: '#fff' }}>
            Grow Your Wealth with{' '}
            <span style={{ color: '#60a5fa' }}>Zig Capital</span>{' '}
            Investment
          </Title>
          <Paragraph className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Earn up to <strong style={{ color: '#fff' }}>22% monthly returns</strong> on your investment.
            Transparent, secure, and professionally managed investment plans designed for consistent growth.
          </Paragraph>
          <div className="hero-buttons">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => {
                document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ borderRadius: 10, height: 48, padding: '0 28px', fontSize: 15, fontWeight: 600 }}
            >
              View Investment Plans
            </Button>
            <Button
              size="large"
              icon={<CalculatorOutlined />}
              onClick={() => {
                document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ borderRadius: 10, height: 48, padding: '0 28px', fontSize: 15, fontWeight: 600 }}
            >
              Calculate Returns
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            {[
              { icon: <SafetyCertificateOutlined />, label: 'Secure Investments' },
              { icon: <RiseOutlined />, label: 'Up to 25% Returns' },
              { icon: <TeamOutlined />, label: 'Trusted by Investors' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                <span style={{ fontSize: 20, color: '#60a5fa' }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="about-grid">
            {/* Left - Text */}
            <div>
              <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>About Us</Text>
              <Title level={2} style={{ margin: '8px 0 20px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
                8 Years of Market Expertise, Working for You
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 24px' }}>
                At Zig Capital Investment, we turn 8 years of market expertise into results. We trade across metals, forex, and indices using dynamic long-term and short-term strategies. Our primary focus is on maximizing your investment potential while implementing rigorous risk management to safeguard against major losses.
              </Paragraph>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { value: '8+', label: 'Years Experience' },
                  { value: '25%', label: 'Max Monthly Returns' },
                  { value: '100+', label: 'Active Investors' },
                  { value: '24/7', label: 'Portal Access' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f8fafc',
                      borderRadius: 12,
                      padding: '16px 20px',
                      borderLeft: '3px solid #2563eb',
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>{stat.value}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                {
                  icon: <GoldOutlined style={{ fontSize: 22, color: '#b45309' }} />,
                  bg: '#fffbeb',
                  border: '#fde68a',
                  title: 'Metals Trading',
                  desc: 'Strategic positions in gold, silver, and precious metals markets for stable long-term growth.',
                },
                {
                  icon: <GlobalOutlined style={{ fontSize: 22, color: '#2563eb' }} />,
                  bg: '#eef2ff',
                  border: '#c7d2fe',
                  title: 'Forex Markets',
                  desc: 'Dynamic currency pair trading leveraging global market movements and economic trends.',
                },
                {
                  icon: <LineChartOutlined style={{ fontSize: 22, color: '#0d9488' }} />,
                  bg: '#f0fdfa',
                  border: '#99f6e4',
                  title: 'Indices Trading',
                  desc: 'Diversified exposure to major global indices using both long-term and short-term strategies.',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    background: card.bg,
                    borderRadius: 14,
                    padding: '24px',
                    border: `1px solid ${card.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section id="plans" style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Investment Plans</Text>
            <Title level={2} style={{ margin: '8px 0 12px', fontWeight: 700, color: '#1a1a2e' }}>
              Choose the Right Plan for You
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Our tiered investment structure rewards larger investments with higher returns.
            </Paragraph>
          </div>

          {packagesLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          )}
          <div className="plans-grid">
            {!packagesLoading && plans.map((plan) => (
              <div
                key={plan.tier}
                style={{
                  position: 'relative',
                  background: '#fff',
                  borderRadius: 16,
                  padding: 32,
                  border: plan.popular ? `2px solid ${plan.color}` : '1px solid #e5e7eb',
                  boxShadow: plan.popular ? '0 8px 30px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: plan.color,
                      color: '#fff',
                      padding: '4px 16px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: plan.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <RiseOutlined style={{ fontSize: 22, color: plan.color }} />
                </div>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{plan.tier}</Text>
                <div style={{ margin: '8px 0 4px' }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: plan.color }}>{plan.rate}</span>
                  <span style={{ fontSize: 14, color: '#94a3b8', marginLeft: 4 }}>/ month</span>
                </div>
                <Text style={{ fontSize: 14, color: '#64748b', display: 'block', marginBottom: 20 }}>{plan.range}</Text>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <CheckCircleFilled style={{ color: plan.color, fontSize: 14 }} />
                      <span style={{ fontSize: 14, color: '#475569' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  type={plan.popular ? 'primary' : 'default'}
                  block
                  size="large"
                  onClick={() => navigate('/investor/register')}
                  style={{
                    marginTop: 20,
                    borderRadius: 10,
                    height: 44,
                    fontWeight: 600,
                    ...(plan.popular ? {} : { borderColor: plan.color, color: plan.color }),
                  }}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Investment Calculator</Text>
            <Title level={2} style={{ margin: '8px 0 12px', fontWeight: 700, color: '#1a1a2e' }}>
              See How Your Money Grows
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Enter your investment amount and see your projected returns.
            </Paragraph>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 40,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
            }}
          >
            <div className="calc-grid">
              {/* Input Side */}
              <div>
                <div style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', display: 'block', marginBottom: 8 }}>
                    Investment Amount (KES)
                  </Text>
                  <InputNumber
                    value={calcAmount}
                    onChange={(v) => setCalcAmount(v ?? 0)}
                    min={0}
                    max={100000000}
                    step={10000}
                    status={calcAmount < 50000 ? 'error' : undefined}
                    style={{ width: '100%' }}
                    size="large"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v!.replace(/,/g, '') as unknown as number}
                  />
                  {calcAmount < 50000 && (
                    <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 6 }}>
                      Investment cannot be less than Ksh 50,000
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', display: 'block', marginBottom: 8 }}>
                    Investment Period
                  </Text>
                  <Segmented
                    value={calcPeriod}
                    onChange={(v) => setCalcPeriod(v as string)}
                    options={[
                      { label: '6 Months', value: '6' },
                      { label: '12 Months', value: '12' },
                      { label: '24 Months', value: '24' },
                    ]}
                    block
                    size="large"
                  />
                </div>
                <div
                  style={{
                    background: '#eef2ff',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#64748b' }}>Your interest rate</Text>
                  <Text style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>{(rate * 100).toFixed(2)}%</Text>
                </div>
              </div>

              {/* Results Side */}
              <div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a365d 0%, #1e40af 100%)',
                    borderRadius: 16,
                    padding: 28,
                    color: '#fff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Monthly Payout</div>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{formatKES(monthlyPayout)}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Total Returns ({months}mo)</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatKES(totalReturns)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Total Value</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatKES(totalValue)}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Principal Investment</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{formatKES(calcAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Why Choose Us</Text>
            <Title level={2} style={{ margin: '8px 0 0', fontWeight: 700, color: '#1a1a2e' }}>
              Built on Trust and Transparency
            </Title>
          </div>
          <div className="whyus-grid">
            {[
              { icon: <SafetyCertificateOutlined />, title: 'Secure', desc: 'Your investment is safeguarded with robust financial protocols.' },
              { icon: <RiseOutlined />, title: 'High Returns', desc: 'Earn competitive monthly interest rates of up to 22%.' },
              { icon: <BankOutlined />, title: 'Transparent', desc: 'Track every payout through your personal investor portal.' },
              { icon: <TeamOutlined />, title: 'Dedicated Support', desc: 'Get personalized support from our investment team.' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: '28px 20px',
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: '#eef2ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    fontSize: 24,
                    color: '#4f46e5',
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section id="testimonials" style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Testimonials</Text>
            <Title level={2} style={{ margin: '8px 0 12px', fontWeight: 700, color: '#1a1a2e' }}>
              What Our Investors Say
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Hear from real investors who trust Zig Capital with their financial growth.
            </Paragraph>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Carousel Controls */}
            <button
              className="testimonial-nav-btn testimonial-nav-prev"
              onClick={prevTestimonial}
              style={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <LeftOutlined style={{ fontSize: 14, color: '#475569' }} />
            </button>
            <button
              className="testimonial-nav-btn testimonial-nav-next"
              onClick={nextTestimonial}
              style={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <RightOutlined style={{ fontSize: 14, color: '#475569' }} />
            </button>

            {/* Cards Container */}
            <div className="testimonial-viewport" style={{ overflow: 'hidden', borderRadius: 12 }}>
              <div
                style={{
                  display: 'flex',
                  gap: visibleCount === 1 ? 0 : 24,
                  transition: 'transform 0.5s ease',
                  transform: `translateX(calc(-${testimonialIndex} * 100% - ${testimonialIndex} * ${visibleCount === 1 ? 0 : 24}px))`,
                }}
              >
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      minWidth: visibleCount === 1 ? '100%' : 'calc((100% - 24px) / 2)',
                      maxWidth: visibleCount === 1 ? '100%' : 'calc((100% - 24px) / 2)',
                      background: '#fff',
                      borderRadius: 12,
                      padding: '18px 20px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      flexShrink: 0,
                      boxSizing: 'border-box' as const,
                    }}
                  >
                    {/* Stars */}
                    <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarFilled key={s} style={{ color: '#facc15', fontSize: 13 }} />
                      ))}
                    </div>
                    {/* Quote */}
                    <Paragraph style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: '0 0 14px', minHeight: 60 }}>
                      &ldquo;{t.text}&rdquo;
                    </Paragraph>
                    {/* Author */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#eef2ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UserOutlined style={{ color: '#6366f1', fontSize: 14 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{t.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  style={{
                    width: testimonialIndex === i ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: testimonialIndex === i ? '#2563eb' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#eff6ff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, color: '#2563eb', fontSize: 24,
            }}>
              <QuestionCircleOutlined />
            </div>
            <Title level={2} style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a1a2e' }}>
              Frequently Asked Questions
            </Title>
            <Text style={{ color: '#64748b', fontSize: 16 }}>
              Everything you need to know about investing with us
            </Text>
          </div>
          <Collapse
            accordion
            size="large"
            expandIconPosition="end"
            style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}
            items={[
              {
                key: '0',
                label: <Text strong style={{ fontSize: 15 }}>What does Zig Capital do?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Zig Capital Investment Ltd specialises in trading across forex, commodities, and financial markets. We pool investor funds and deploy them through professionally managed trading strategies to generate consistent returns. Our experienced trading team leverages market analysis, risk management, and diversified positions to deliver monthly payouts to our investors.
                  </Text>
                ),
              },
              {
                key: '1',
                label: <Text strong style={{ fontSize: 15 }}>What is the minimum investment amount?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    The minimum investment amount is KES 50,000. We offer different investment tiers — the higher your investment, the better your monthly interest rate. You can view all available packages on our investment plans section above. You also have the option to top up your investment at any time to move into a higher tier and earn better returns.
                  </Text>
                ),
              },
              {
                key: '2',
                label: <Text strong style={{ fontSize: 15 }}>How do I receive my monthly payouts?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    During registration, you choose your preferred payout method — either M-Pesa or bank transfer. Monthly interest payouts are processed according to your contract schedule and sent directly to your chosen method.
                  </Text>
                ),
              },
              {
                key: '3',
                label: <Text strong style={{ fontSize: 15 }}>How long is the investment contract?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Our standard investment contracts run for 12 months from the date your account is approved. You receive monthly interest payouts throughout the contract period, and your principal is returned at the end of the term.
                  </Text>
                ),
              },
              {
                key: '4',
                label: <Text strong style={{ fontSize: 15 }}>How do I get started?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Simply click "Start Investing" to register. Fill in your personal details, banking information, and investment amount. After submitting, send your funds via M-Pesa Paybill. Our team will review your application and activate your account, after which you'll receive your login credentials via email.
                  </Text>
                ),
              },
              {
                key: '5',
                label: <Text strong style={{ fontSize: 15 }}>Can I withdraw my investment early?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Early withdrawal before the contract period ends may be subject to penalties and processing fees. We recommend investing amounts you can commit for the full 12-month term. Contact our support team for specific early withdrawal terms.
                  </Text>
                ),
              },
              {
                key: '6',
                label: <Text strong style={{ fontSize: 15 }}>How does the referral program work?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Every approved investor receives a unique referral code. When someone registers using your code and gets approved, you earn a commission based on their total annual payout. You can track your referrals and earnings directly from your investor dashboard.
                  </Text>
                ),
              },
              {
                key: '7',
                label: <Text strong style={{ fontSize: 15 }}>Is my investment secure?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    We employ rigorous risk management strategies and maintain full transparency with our investors. All accounts are reviewed and verified by our team before activation. You can monitor your investment, payouts, and contract status in real-time through your secure investor portal.
                  </Text>
                ),
              },
              {
                key: '8',
                label: <Text strong style={{ fontSize: 15 }}>How long does account approval take?</Text>,
                children: (
                  <Text style={{ color: '#475569', lineHeight: 1.8 }}>
                    Account approval typically takes 1–3 business days after we verify your payment. Once approved, you'll receive an email with your login credentials to access the investor portal.
                  </Text>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Get in Touch</Text>
            <Title level={2} style={{ margin: '8px 0 12px', fontWeight: 700, color: '#1a1a2e' }}>
              Contact Us
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Ready to start investing? Reach out to us today.
            </Paragraph>
          </div>

          <div className="contact-grid">
            {[
              {
                icon: <PhoneOutlined style={{ fontSize: 24, color: '#2563eb' }} />,
                title: 'Phone',
                lines: ['+254 708 898 668', '+254 100 930 727'],
              },
              {
                icon: <MailOutlined style={{ fontSize: 24, color: '#2563eb' }} />,
                title: 'Email',
                lines: ['info@sci.com'],
              },
              {
                icon: <EnvironmentOutlined style={{ fontSize: 24, color: '#2563eb' }} />,
                title: 'Office',
                lines: ['Zig Capital Investment Ltd', 'Nairobi, Kenya'],
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 32,
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: '#eef2ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 8 }}>{card.title}</div>
                {card.lines.map((line, j) => (
                  <div key={j} style={{ fontSize: 15, color: '#475569', lineHeight: 1.8 }}>{line}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: '#1a1a2e',
          padding: '32px 40px',
          textAlign: 'center',
          margin: 0,
          width: '100%',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          All Rights Reserved by Zig Capital Investment Ltd. Developed by Bluechange Technology.
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        html, body, #root { margin: 0; padding: 0; overflow-x: hidden; }

        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .market-ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: ticker-scroll 50s linear infinite;
        }
        .market-ticker-track:hover { animation-play-state: paused; }
        .market-ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
          font-size: 13px;
          font-family: 'Inter', monospace, sans-serif;
        }
        .ticker-symbol { color: #94a3b8; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; }
        .ticker-price { color: #f1f5f9; font-weight: 700; font-variant-numeric: tabular-nums; }
        .ticker-change { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
        .ticker-change.positive { color: #4ade80; background: rgba(74,222,128,0.12); }
        .ticker-change.negative { color: #f87171; background: rgba(248,113,113,0.12); }
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
          border-bottom: 1px solid #f0f0f0; padding: 0 40px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-links {
          display: flex; align-items: center; gap: 24px;
        }
        .nav-links a {
          color: #475569; text-decoration: none; font-weight: 500; font-size: 14px;
          transition: color 0.2s;
        }
        .nav-links a:hover {
          color: #2563eb;
        }
        .mobile-menu-btn { display: none !important; }
        .hero-title {
          font-size: 52px !important; font-weight: 800 !important; color: #fff !important;
          line-height: 1.15 !important; margin: 0 0 20px !important;
        }
        .hero-subtitle {
          font-size: 18px !important; color: rgba(255,255,255,0.85) !important; max-width: 600px;
          margin: 0 auto 36px !important; line-height: 1.7 !important;
        }
        .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .trust-indicators { display: flex; justify-content: center; gap: 40px; margin-top: 60px; flex-wrap: wrap; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .whyus-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

        @media (max-width: 1024px) {
          .whyus-grid { grid-template-columns: repeat(2, 1fr); }
          .plans-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .contact-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .landing-nav { padding: 0 16px; }
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: inline-flex !important; }

          section { padding: 50px 16px !important; }
          .hero-section { padding-top: 110px !important; }

          .hero-title { font-size: 30px !important; }
          .hero-subtitle { font-size: 15px !important; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .hero-buttons .ant-btn { width: 100%; max-width: 300px; }
          .trust-indicators { gap: 20px; margin-top: 36px; }

          .about-grid { grid-template-columns: 1fr !important; gap: 32px; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .calc-grid { grid-template-columns: 1fr !important; gap: 24px; }
          .whyus-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .contact-grid { grid-template-columns: 1fr !important; }

          .testimonial-nav-btn { width: 32px !important; height: 32px !important; }
          .testimonial-nav-prev { left: -4px !important; }
          .testimonial-nav-next { right: -4px !important; }

          footer { padding: 24px 16px !important; }
        }

        @media (max-width: 576px) {
          .hero-section { padding-top: 100px !important; }
          .hero-title { font-size: 26px !important; line-height: 1.2 !important; }
          .hero-subtitle { font-size: 14px !important; }
          .whyus-grid { grid-template-columns: 1fr !important; }
          section { padding: 40px 12px !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 22px !important; }
          .trust-indicators { flex-direction: column; align-items: center; gap: 12px; }
          .testimonial-nav-prev { left: 2px !important; }
          .testimonial-nav-next { right: 2px !important; }
        }
        @media (max-width: 360px) {
          .hero-title { font-size: 20px !important; }
          .hero-subtitle { font-size: 13px !important; }
          section { padding: 32px 8px !important; }
          .hero-section { padding-top: 96px !important; min-height: auto !important; padding-bottom: 40px !important; }
          .landing-nav { padding: 0 10px !important; height: 56px !important; }
          footer { padding: 20px 8px !important; }
        }
      `}</style>

      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#25d366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,211,102,0.4)',
            zIndex: 1000,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,211,102,0.4)'; }}
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
};

export default LandingPage;
