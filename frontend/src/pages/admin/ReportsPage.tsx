import React, { useState } from 'react';
import { Card, Tabs, Table, Select, Statistic, Row, Col, Button, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyPayoutReport, getOverdueReport } from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/format';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title } = Typography;

const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({ value: currentYear - i, label: String(currentYear - i) }));

const ReportsPage: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['report-monthly', month, year],
    queryFn: () => getMonthlyPayoutReport(month, year).then(r => r.data),
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['report-overdue'],
    queryFn: () => getOverdueReport().then(r => r.data),
  });

  const exportMonthly = () => {
    if (!monthlyData?.schedules) return;
    const ws = XLSX.utils.json_to_sheet(monthlyData.schedules.map((s: any) => ({
      'Investor': s.investor?.first_name + ' ' + s.investor?.second_name,
      'Investor ID': s.investor?.investor_id,
      'Due Date': s.due_date,
      'Expected': s.expected_amount,
      'Paid': s.paid_amount,
      'Status': s.status,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Payout');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `monthly-payout-${year}-${month}.xlsx`);
  };

  const exportOverdue = () => {
    if (!overdueData?.investors) return;
    const ws = XLSX.utils.json_to_sheet(overdueData.investors.map((i: any) => ({
      'Name': i.name,
      'Investor ID': i.investor_id,
      'Total Overdue': i.total_overdue_amount,
      'Months Overdue': i.overdue_months,
      'Earliest Overdue': i.earliest_overdue_date,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'overdue-report.xlsx');
  };

  return (
    <div>
      <Title level={3}>Reports</Title>
      <Tabs items={[
        {
          key: 'monthly',
          label: 'Monthly Payout Summary',
          children: (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Select value={month} onChange={setMonth} options={months} style={{ width: 150 }} />
                <Select value={year} onChange={setYear} options={years} style={{ width: 100 }} />
                <Button onClick={exportMonthly}>Export Excel</Button>
              </div>
              {monthlyData?.summary && (
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}><Card><Statistic title="Total Payable" value={monthlyData.summary.total_payable} formatter={v => formatCurrency(v as number)} /></Card></Col>
                  <Col xs={24} sm={8}><Card><Statistic title="Total Paid" value={monthlyData.summary.total_paid} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                  <Col xs={24} sm={8}><Card><Statistic title="Outstanding" value={monthlyData.summary.total_outstanding} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#cf1322' }} /></Card></Col>
                </Row>
              )}
              <Table
                loading={monthlyLoading}
                dataSource={monthlyData?.schedules}
                rowKey="id"
                size="small"
                scroll={{ x: 700 }}
                columns={[
                  { title: 'Investor', key: 'investor', render: (_: any, r: any) => `${r.investor?.first_name} ${r.investor?.second_name}` },
                  { title: 'ID', key: 'inv_id', render: (_: any, r: any) => r.investor?.investor_id },
                  { title: 'Due Date', dataIndex: 'due_date', render: (v: string) => formatDate(v) },
                  { title: 'Expected', dataIndex: 'expected_amount', render: (v: number) => formatCurrency(v) },
                  { title: 'Paid', dataIndex: 'paid_amount', render: (v: number) => formatCurrency(v) },
                  { title: 'Status', dataIndex: 'status', render: (s: string) => s.replace('_', ' ').toUpperCase() },
                ]}
              />
            </>
          ),
        },
        {
          key: 'overdue',
          label: 'Overdue Summary',
          children: (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Statistic title="Total Overdue" value={overdueData?.total_overdue ?? 0} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#cf1322' }} />
                <Button onClick={exportOverdue}>Export Excel</Button>
              </div>
              <Table
                loading={overdueLoading}
                dataSource={overdueData?.investors}
                rowKey="investor_id"
                size="small"
                scroll={{ x: 600 }}
                columns={[
                  { title: 'Investor Name', dataIndex: 'name' },
                  { title: 'Investor ID', dataIndex: 'investor_id' },
                  { title: 'Total Overdue', dataIndex: 'total_overdue_amount', render: (v: number) => formatCurrency(v) },
                  { title: 'Months Overdue', dataIndex: 'overdue_months' },
                  { title: 'Earliest Overdue', dataIndex: 'earliest_overdue_date', render: (v: string) => v ? formatDate(v) : '-' },
                ]}
              />
            </>
          ),
        },
      ]} />
    </div>
  );
};

export default ReportsPage;
