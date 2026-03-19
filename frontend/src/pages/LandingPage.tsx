import React, { useState, useEffect, useCallback } from 'react';
import { Button, InputNumber, Typography, Segmented, Drawer } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const plans = [
  {
    tier: 'Starter',
    range: 'KES 50,000 - 149,999',
    rate: '17.5%',
    rateDecimal: 0.175,
    color: '#0d9488',
    bg: '#f0fdfa',
    features: ['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Email notifications'],
  },
  {
    tier: 'Growth',
    range: 'KES 150,000 - 499,999',
    rate: '23.08%',
    rateDecimal: 0.2308,
    color: '#6366f1',
    bg: '#eef2ff',
    popular: true,
    features: ['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Priority support', 'Email notifications'],
  },
  {
    tier: 'Premium',
    range: 'KES 500,000+',
    rate: '25%',
    rateDecimal: 0.25,
    color: '#b45309',
    bg: '#fffbeb',
    features: ['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Dedicated account manager', 'Priority support', 'Negotiable rates'],
  },
];

const formatKES = (n: number) => 'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  const [calcPeriod, setCalcPeriod] = useState<string>('12');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRate = (amount: number) => {
    if (amount >= 500000) return 0.25;
    if (amount >= 150000) return 0.2308;
    return 0.175;
  };

  const rate = getRate(calcAmount);
  const monthlyPayout = calcAmount * rate;
  const months = parseInt(calcPeriod);
  const totalReturns = monthlyPayout * months;
  const totalValue = calcAmount + totalReturns;

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
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', lineHeight: 1.2 }}>Samawati Capital</div>
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

      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 40%, #f0fdfa 100%)',
          padding: '100px 40px 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hero-section"
      >
        {/* Trading Candlestick Background */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.07,
            pointerEvents: 'none',
          }}
          viewBox="0 0 1200 700"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Grid lines */}
          {[100, 200, 300, 400, 500, 600].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="#2563eb" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="700" stroke="#2563eb" strokeWidth="0.3" strokeDasharray="4 4" />
          ))}

          {/* Candlesticks - bullish (green) and bearish (red) */}
          {[
            // x, open, close, high, low, bullish
            [60, 420, 350, 330, 440, true],
            [110, 350, 380, 320, 400, false],
            [160, 380, 310, 290, 400, true],
            [210, 310, 340, 280, 360, false],
            [260, 340, 270, 250, 360, true],
            [310, 270, 300, 240, 320, false],
            [360, 300, 240, 220, 320, true],
            [410, 240, 280, 210, 300, false],
            [460, 280, 220, 200, 300, true],
            [510, 220, 260, 190, 280, false],
            [560, 260, 200, 180, 280, true],
            [610, 200, 230, 170, 250, false],
            [660, 230, 180, 160, 250, true],
            [710, 180, 220, 150, 240, false],
            [760, 220, 160, 140, 240, true],
            [810, 160, 200, 130, 220, false],
            [860, 200, 150, 120, 220, true],
            [910, 150, 190, 110, 210, false],
            [960, 190, 140, 100, 210, true],
            [1010, 140, 180, 90, 200, false],
            [1060, 180, 130, 80, 200, true],
            [1110, 130, 170, 70, 190, false],
          ].map(([x, open, close, high, low, bullish], i) => {
            const top = Math.min(open as number, close as number);
            const bottom = Math.max(open as number, close as number);
            const color = bullish ? '#16a34a' : '#dc2626';
            return (
              <g key={i}>
                {/* Wick */}
                <line x1={x as number} y1={high as number} x2={x as number} y2={low as number} stroke={color} strokeWidth="1.5" />
                {/* Body */}
                <rect
                  x={(x as number) - 12}
                  y={top}
                  width={24}
                  height={Math.max(bottom - top, 3)}
                  fill={bullish ? color : color}
                  rx={2}
                />
              </g>
            );
          })}

          {/* Moving average line flowing through the candles */}
          <polyline
            points="60,385 110,365 160,345 210,325 260,305 310,285 360,270 410,260 460,250 510,240 560,230 610,215 660,205 710,200 760,190 810,180 860,175 910,170 960,165 1010,160 1060,155 1110,150"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Second MA line */}
          <polyline
            points="60,405 110,390 160,370 210,350 260,330 310,310 360,295 410,285 460,275 510,265 560,255 610,240 660,230 710,225 760,215 810,205 860,200 910,195 960,190 1010,185 1060,180 1110,175"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
        </svg>

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-block',
              background: '#eef2ff',
              color: '#4f46e5',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Trusted Investment Partner
          </div>
          <Title className="hero-title">
            Grow Your Wealth with{' '}
            <span style={{ color: '#2563eb' }}>Samawati Capital</span>{' '}
            Investment
          </Title>
          <Paragraph className="hero-subtitle">
            Earn up to <strong style={{ color: '#1a1a2e' }}>25% monthly returns</strong> on your investment.
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                <span style={{ fontSize: 20, color: '#2563eb' }}>{item.icon}</span>
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
                At Samawati Capital Investment, we turn 8 years of market expertise into results. We trade across metals, forex, and indices using dynamic long-term and short-term strategies. Our primary focus is on maximizing your investment potential while implementing rigorous risk management to safeguard against major losses.
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

          <div className="plans-grid">
            {plans.map((plan) => (
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
                    onChange={(v) => setCalcAmount(v || 50000)}
                    min={50000}
                    max={100000000}
                    step={10000}
                    style={{ width: '100%' }}
                    size="large"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v!.replace(/,/g, '') as unknown as number}
                  />
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
              { icon: <RiseOutlined />, title: 'High Returns', desc: 'Earn competitive monthly interest rates of up to 25%.' },
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
              Hear from real investors who trust Samawati Capital with their financial growth.
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
                lines: ['Samawati Capital Investment Ltd', 'Nairobi, Kenya'],
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
          All Rights Reserved by Samawati Capital Investment Ltd. Developed by Bluechange Technology.
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        html, body, #root { margin: 0; padding: 0; overflow-x: hidden; }
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
          font-size: 52px !important; font-weight: 800 !important; color: #1a1a2e !important;
          line-height: 1.15 !important; margin: 0 0 20px !important;
        }
        .hero-subtitle {
          font-size: 18px !important; color: #64748b !important; max-width: 600px;
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
        }

        @media (max-width: 768px) {
          .landing-nav { padding: 0 16px; }
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: inline-flex !important; }

          section { padding: 50px 16px !important; }

          .hero-title { font-size: 32px !important; }
          .hero-subtitle { font-size: 15px !important; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .hero-buttons .ant-btn { width: 100%; max-width: 300px; }
          .trust-indicators { gap: 20px; margin-top: 36px; }

          .about-grid { grid-template-columns: 1fr !important; gap: 32px; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .calc-grid { grid-template-columns: 1fr !important; gap: 24px; }
          .whyus-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }

          .testimonial-nav-btn { width: 32px !important; height: 32px !important; }
          .testimonial-nav-prev { left: -4px !important; }
          .testimonial-nav-next { right: -4px !important; }

          footer { padding: 24px 16px !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 26px !important; }
          .trust-indicators { flex-direction: column; align-items: center; gap: 12px; }
          .testimonial-nav-prev { left: 2px !important; }
          .testimonial-nav-next { right: 2px !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
