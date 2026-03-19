import React, { useState } from 'react';
import {
  Card,
  Col,
  Row,
  Select,
  DatePicker,
  Calendar,
  Spin,
  Typography,
  Tag,
  Tooltip,
  List,
  Avatar,
  Empty,
} from 'antd';

const dashboardStyles = `
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  @media (max-width: 1200px) {
    .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .metrics-grid { grid-template-columns: 1fr; }
  }
  .dashboard-calendar .ant-picker-calendar {
    background: transparent;
  }
  .dashboard-calendar .ant-picker-calendar-header {
    padding: 8px 12px 12px;
  }
  .dashboard-calendar .ant-picker-panel {
    border-top: none;
  }
  .dashboard-calendar .ant-picker-cell {
    padding: 2px 0;
  }
  .dashboard-calendar .ant-picker-cell .ant-picker-cell-inner {
    min-height: 60px;
    border-radius: 8px;
    transition: all 0.2s;
    padding: 4px 6px;
  }
  .dashboard-calendar .ant-picker-cell:hover .ant-picker-cell-inner {
    background: #f8fafc !important;
  }
  .dashboard-calendar .ant-picker-cell-selected .ant-picker-cell-inner,
  .dashboard-calendar .ant-picker-cell-today .ant-picker-cell-inner {
    background: transparent !important;
  }
  .dashboard-calendar .ant-picker-cell-today .ant-picker-cell-inner {
    position: relative;
  }
  .dashboard-calendar .ant-picker-cell-today .ant-picker-cell-inner::before {
    border-radius: 8px !important;
    border-color: #6366f1 !important;
  }
  .dashboard-calendar .ant-picker-content th {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 8px;
  }
  .dashboard-calendar .ant-picker-content td {
    vertical-align: top;
  }
  .cal-payout-badge {
    margin-top: 2px;
    padding: 2px 5px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .cal-payout-badge:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;
import {
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboard, getDashboardCalendar } from '../../api/admin';
import { formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_month_last_year', label: 'This Month Last Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'current_financial_year', label: 'Current Financial Year' },
  { value: 'custom', label: 'Custom Range' },
];

interface CalendarSchedule {
  id: number | string;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: string;
  type?: string;
  investor: {
    id: number;
    first_name: string;
    second_name: string;
    last_name: string | null;
    investor_id: string;
  };
  referred?: {
    first_name: string;
    second_name: string;
  };
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: '#1677ff', label: 'Pending' },
  overdue: { color: '#ff4d4f', label: 'Overdue' },
  partially_paid: { color: '#faad14', label: 'Partial' },
  paid: { color: '#52c41a', label: 'Paid' },
  paid_in_advance: { color: '#13c2c2', label: 'Advance' },
  commission: { color: '#8b5cf6', label: 'Commission' },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, accent, iconBg }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 12,
      height: '100%',
      borderLeft: `3px solid ${accent}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}
    styles={{
      body: { padding: '20px' },
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {title}
      </Text>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
    <Text
      strong
      style={{
        fontSize: 22,
        display: 'block',
        lineHeight: 1.3,
      }}
    >
      {value}
    </Text>
  </Card>
);

const DashboardPage: React.FC = () => {
  const [range, setRange] = useState('this_month');
  const [customDates, setCustomDates] = useState<[string?, string?]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(dayjs().format('YYYY-MM'));

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', range, customDates],
    queryFn: () => getDashboard(range, customDates[0], customDates[1]).then((r) => r.data),
  });

  const { data: calendarData } = useQuery({
    queryKey: ['dashboard-calendar', calendarMonth],
    queryFn: () => getDashboardCalendar(calendarMonth).then((r) => r.data),
  });

  const getDateEntries = (dateStr: string): CalendarSchedule[] => {
    return calendarData?.[dateStr] ?? [];
  };

  const selectedEntries = selectedDate ? getDateEntries(selectedDate) : [];

  // Collect all upcoming entries sorted by date for the sidebar list
  const allUpcoming: CalendarSchedule[] = calendarData
    ? Object.values(calendarData as Record<string, CalendarSchedule[]>)
        .flat()
        .sort((a, b) => dayjs(a.due_date).diff(dayjs(b.due_date)))
    : [];

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const entries = getDateEntries(dateStr);
    if (!entries.length) return null;

    const totalAmount = entries.reduce((sum, e) => sum + (e.expected_amount - e.paid_amount), 0);
    const payoutEntries = entries.filter((e) => e.type !== 'commission');
    const commissionEntries = entries.filter((e) => e.type === 'commission');
    const hasOverdue = payoutEntries.some((e) => e.status === 'overdue');
    const hasPaid = payoutEntries.length > 0 && payoutEntries.every((e) => e.status === 'paid' || e.status === 'paid_in_advance');
    const hasPartial = payoutEntries.some((e) => e.status === 'partially_paid');
    const hasCommission = commissionEntries.length > 0;
    const isSelected = selectedDate === dateStr;

    const badgeColor = hasPaid && !hasCommission
      ? { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#16a34a' }
      : hasOverdue
        ? { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#dc2626' }
        : hasPartial
          ? { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#d97706' }
          : hasCommission && payoutEntries.length === 0
            ? { bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6', text: '#8b5cf6' }
            : { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#2563eb' };

    return (
      <Tooltip
        title={
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {payoutEntries.length > 0 && <>{payoutEntries.length} payout{payoutEntries.length > 1 ? 's' : ''}</>}
              {payoutEntries.length > 0 && commissionEntries.length > 0 && ' + '}
              {commissionEntries.length > 0 && <>{commissionEntries.length} commission{commissionEntries.length > 1 ? 's' : ''}</>}
              {' — '}{formatCurrency(totalAmount)}
            </div>
            {entries.slice(0, 5).map((e) => {
              const cfg = statusConfig[e.status] || statusConfig.pending;
              return (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '2px 0' }}>
                  <span>
                    {e.type === 'commission' ? '🏷 ' : ''}{e.investor.first_name} {e.investor.second_name}
                    {e.type === 'commission' && e.referred ? ` (ref: ${e.referred.first_name})` : ''}
                  </span>
                  <span style={{ color: cfg.color, fontWeight: 500 }}>{formatCurrency(e.expected_amount - e.paid_amount)}</span>
                </div>
              );
            })}
            {entries.length > 5 && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>+{entries.length - 5} more</div>
            )}
          </div>
        }
      >
        <div
          className="cal-payout-badge"
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          style={{
            background: isSelected ? badgeColor.border : badgeColor.bg,
            border: `1px solid ${isSelected ? badgeColor.dot : badgeColor.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: badgeColor.text }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor.dot, flexShrink: 0 }} />
            {payoutEntries.length > 0 && <>{payoutEntries.length} payout{payoutEntries.length > 1 ? 's' : ''}</>}
            {payoutEntries.length > 0 && commissionEntries.length > 0 && ' + '}
            {commissionEntries.length > 0 && <>{commissionEntries.length} comm.</>}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3, fontWeight: 500 }}>
            {formatCurrency(totalAmount).replace('KES ', '')}
          </div>
        </div>
      </Tooltip>
    );
  };

  const metrics = [
    {
      title: 'New Investors',
      value: dashboardData?.new_investors ?? 0,
      icon: <TeamOutlined />,
      accent: '#6366f1',
      iconBg: '#f0f0ff',
    },
    {
      title: 'Total Sum Invested',
      value: formatCurrency(dashboardData?.total_sum_invested ?? 0),
      icon: <RiseOutlined />,
      accent: '#0d9488',
      iconBg: '#ecfdf5',
    },
    {
      title: 'Total Due Payout',
      value: formatCurrency(dashboardData?.total_due_payout ?? 0),
      icon: <CalendarOutlined />,
      accent: '#2563eb',
      iconBg: '#eff6ff',
    },
    {
      title: 'Total Payout Paid',
      value: formatCurrency(dashboardData?.total_payout_paid ?? 0),
      icon: <CheckCircleOutlined />,
      accent: '#16a34a',
      iconBg: '#f0fdf4',
    },
    {
      title: 'Total Overdue',
      value: formatCurrency(dashboardData?.total_overdue ?? 0),
      icon: <WarningOutlined />,
      accent: '#dc2626',
      iconBg: '#fef2f2',
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Overview of your investment portfolio
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select
            value={range}
            onChange={setRange}
            options={rangeOptions}
            style={{ width: 200 }}
            size="middle"
          />
          {range === 'custom' && (
            <RangePicker
              onChange={(_, dateStrings) => setCustomDates(dateStrings as [string, string])}
              size="middle"
            />
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <Spin spinning={isLoading}>
        <style>{dashboardStyles}</style>
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>
      </Spin>

      {/* Calendar + Upcoming Payouts */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}
            styles={{
              header: { borderBottom: 'none', padding: '20px 24px 0' },
              body: { padding: '0 16px 16px' },
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontSize: 18,
                    }}
                  >
                    <CalendarOutlined />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      Payout Calendar
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Click on a date to view payout details
                    </Text>
                  </div>
                </div>
                {/* Legend inline */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { color: '#2563eb', label: 'Pending' },
                    { color: '#dc2626', label: 'Overdue' },
                    { color: '#d97706', label: 'Partial' },
                    { color: '#16a34a', label: 'Paid' },
                    { color: '#8b5cf6', label: 'Commission' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="dashboard-calendar">
              <Calendar
                fullscreen={false}
                cellRender={(date) => dateCellRender(date as dayjs.Dayjs)}
                onPanelChange={(value) => setCalendarMonth(value.format('YYYY-MM'))}
              />
            </div>
          </Card>
        </Col>

        {/* Sidebar: Selected date detail or Upcoming list */}
        <Col xs={24} lg={8}>
          {selectedDate && selectedEntries.length > 0 ? (
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}
              styles={{
                header: { borderBottom: 'none', padding: '0' },
                body: { padding: '0', maxHeight: 520, overflowY: 'auto' },
              }}
              title={
                <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '20px', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                        {dayjs(selectedDate).format('DD')}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                        {dayjs(selectedDate).format('dddd, MMMM YYYY')}
                      </div>
                    </div>
                    <Tag
                      style={{ cursor: 'pointer', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                      onClick={() => setSelectedDate(null)}
                    >
                      Clear
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', flex: 1 }}>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>Payouts</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedEntries.length}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', flex: 1 }}>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>Total Due</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {formatCurrency(selectedEntries.reduce((s, e) => s + (e.expected_amount - e.paid_amount), 0)).replace('KES ', '')}
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <List
                dataSource={selectedEntries}
                renderItem={(entry) => {
                  const remaining = entry.expected_amount - entry.paid_amount;
                  const cfg = statusConfig[entry.status] || statusConfig.pending;
                  const isCommission = entry.type === 'commission';
                  return (
                    <List.Item style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{ background: cfg.color, fontWeight: 600 }}
                            size={40}
                          >
                            {entry.investor.first_name[0]}
                            {entry.investor.second_name[0]}
                          </Avatar>
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 13, fontWeight: 600 }}>
                              {entry.investor.first_name} {entry.investor.second_name}
                            </Text>
                            <Tag color={cfg.color} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
                              {cfg.label}
                            </Tag>
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {isCommission && entry.referred
                                ? `Commission (ref: ${entry.referred.first_name} ${entry.referred.second_name})`
                                : entry.investor.investor_id}
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                              {formatCurrency(remaining)}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          ) : (
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}
              styles={{
                header: { borderBottom: 'none', padding: '20px 20px 0' },
                body: { padding: '0 8px 8px', maxHeight: 520, overflowY: 'auto' },
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: '#fef2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626',
                      fontSize: 18,
                    }}
                  >
                    <ClockCircleOutlined />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      Upcoming Payouts
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Click a calendar date for details
                    </Text>
                  </div>
                </div>
              }
            >
              {allUpcoming.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No upcoming payouts"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  dataSource={allUpcoming.slice(0, 15)}
                  renderItem={(entry) => {
                    const remaining = entry.expected_amount - entry.paid_amount;
                    const cfg = statusConfig[entry.status] || statusConfig.pending;
                    const dueDate = dayjs(entry.due_date);
                    const isToday = dueDate.isSame(dayjs(), 'day');
                    const isCommission = entry.type === 'commission';
                    return (
                      <List.Item style={{ padding: '12px', borderBottom: '1px solid #f8fafc', margin: '0 8px', borderRadius: 10 }}>
                        <List.Item.Meta
                          avatar={
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, background: isCommission ? '#f5f3ff' : '#f8fafc', borderRadius: 10, padding: '6px 8px' }}>
                              <Text style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                                {dueDate.format('DD')}
                              </Text>
                              <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                                {dueDate.format('MMM')}
                              </Text>
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                {entry.investor.first_name} {entry.investor.second_name}
                              </Text>
                              <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                                {formatCurrency(remaining)}
                              </Text>
                            </div>
                          }
                          description={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {isToday ? (
                                <Tag color="#6366f1" style={{ borderRadius: 6, fontSize: 10, margin: 0 }}>
                                  Today
                                </Tag>
                              ) : (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {isCommission && entry.referred
                                    ? `Comm. (ref: ${entry.referred.first_name})`
                                    : dueDate.format('ddd, MMM D')}
                                </Text>
                              )}
                              <Tag
                                color={cfg.color}
                                style={{ borderRadius: 6, fontSize: 10, margin: 0 }}
                              >
                                {cfg.label}
                              </Tag>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
              {allUpcoming.length > 15 && (
                <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    +{allUpcoming.length - 15} more payouts
                  </Text>
                </div>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
