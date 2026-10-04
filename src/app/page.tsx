'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';

import { dzfColors } from '@/theme/colors';
import {
  AppShell,
  DZFButton,
  PageHeader,
  Kicker,
  Mono,
  DZFBadge,
  DZFInput,
  DZFSearchInput,
  DZFBarcodeInput,
  DZFStatCard,
  DZFDataTable,
  Column,
  BookIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon,
  PlusIcon,
  SearchIcon,
  CheckIcon,
} from '@/components';

interface CatalogItem {
  id: string;
  barcode: string;
  title: string;
  author: string;
  classification: string;
  status: 'available' | 'borrowed' | 'overdue' | 'reserved';
  dueDate?: string;
  patronType?: 'student' | 'teacher' | 'staff' | 'guest';
}

const mockCatalog: CatalogItem[] = [
  {
    id: '1',
    barcode: '20230001',
    title: 'Things Fall Apart',
    author: 'Chinua Achebe',
    classification: '823.914',
    status: 'available',
    patronType: 'student',
  },
  {
    id: '2',
    barcode: '20230002',
    title: 'Purple Hibiscus',
    author: 'Chimamanda Ngozi Adichie',
    classification: '823.92',
    status: 'borrowed',
    dueDate: '2026-10-12',
    patronType: 'student',
  },
  {
    id: '3',
    barcode: '20230003',
    title: 'The Lion and the Jewel',
    author: 'Wole Soyinka',
    classification: '822.914',
    status: 'overdue',
    dueDate: '2026-09-28',
    patronType: 'teacher',
  },
  {
    id: '4',
    barcode: '20230004',
    title: 'Joys of Motherhood',
    author: 'Buchi Emecheta',
    classification: '823.912',
    status: 'reserved',
    patronType: 'staff',
  },
  {
    id: '5',
    barcode: '20230005',
    title: 'Half of a Yellow Sun',
    author: 'Chimamanda Ngozi Adichie',
    classification: '823.92',
    status: 'available',
    patronType: 'guest',
  },
  {
    id: '6',
    barcode: '20230006',
    title: 'Arrow of God',
    author: 'Chinua Achebe',
    classification: '823.914',
    status: 'available',
    patronType: 'student',
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeNav, setActiveNav] = React.useState('dashboard');
  const [buttonLoading, setButtonLoading] = React.useState(false);
  const [tableLoading, setTableLoading] = React.useState(false);
  const [tableEmpty, setTableEmpty] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [scannedList, setScannedList] = React.useState<string[]>([
    '20230001 (Monograph Checked)',
    '20230002 (Patron SS2 Verified)',
  ]);
  const [sortCol, setSortCol] = React.useState<string>('title');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const handleSimulateScan = (code: string) => {
    setScannedList((prev) => [`${code} - ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 4)]);
  };

  const handleTriggerButtonLoading = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
    }, 1500);
  };

  const filteredData = React.useMemo(() => {
    if (tableEmpty) return [];
    let items = [...mockCatalog];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.barcode.includes(q) ||
          b.classification.includes(q)
      );
    }
    items.sort((a, b) => {
      const valA = String(a[sortCol as keyof CatalogItem] ?? '');
      const valB = String(b[sortCol as keyof CatalogItem] ?? '');
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [tableEmpty, searchQuery, sortCol, sortDir]);

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colId);
      setSortDir('asc');
    }
  };

  const columns: Column<CatalogItem>[] = [
    {
      id: 'barcode',
      label: 'Barcode',
      minWidth: 120,
      render: (row) => <Mono>{row.barcode}</Mono>,
    },
    {
      id: 'title',
      label: 'Book Title & Author',
      minWidth: 220,
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
            {row.title}
          </Typography>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            {row.author}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'classification',
      label: 'Dewey Decimal',
      minWidth: 130,
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.classification}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Inventory Status',
      minWidth: 140,
      sortable: true,
      render: (row) => {
        switch (row.status) {
          case 'available':
            return <DZFBadge label="Available" variant="success" dot />;
          case 'borrowed':
            return <DZFBadge label="Checked Out" variant="warning" dot />;
          case 'overdue':
            return <DZFBadge label="Critical Overdue" variant="error" solid />;
          case 'reserved':
            return <DZFBadge label="On Hold" variant="info" dot />;
        }
      },
    },
    {
      id: 'patronType',
      label: 'Patron Type',
      minWidth: 120,
      render: (row) => {
        if (!row.patronType) return <Typography variant="caption">—</Typography>;
        return (
          <DZFBadge
            label={row.patronType.toUpperCase()}
            variant={
              row.patronType === 'student'
                ? 'primary'
                : row.patronType === 'teacher'
                ? 'success'
                : row.patronType === 'staff'
                ? 'warning'
                : 'default'
            }
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 110,
      align: 'right',
      render: () => (
        <DZFButton variant="secondary" size="small">
          Manage
        </DZFButton>
      ),
    },
  ];

  return (
    <AppShell activeNavId={activeNav} onNavigate={setActiveNav}>
      {/* Page Header */}
      <PageHeader
        kicker="DZF-ILLS Academic Workspace"
        title="Good morning, Sister Blessing"
        subtitle="Dzuels Integrated Library & Learning System central design system workbench, token explorer, and live component playground."
        actionSlot={
          <>
            <DZFButton
              variant="secondary"
              startIcon={<SearchIcon size={16} />}
              onClick={() => setActiveTab(2)}
            >
              Search Catalog
            </DZFButton>
            <DZFButton
              variant="primary"
              startIcon={<PlusIcon size={16} />}
              onClick={() => setActiveTab(1)}
            >
              Scan Barcode
            </DZFButton>
          </>
        }
      />

      {/* Metric Stat Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DZFStatCard
            title="Total Monograph Items"
            value="2,348"
            subtitle="Verified copies on shelf"
            icon={<BookIcon size={20} />}
            trend={{ value: '+14 this month', positive: true }}
            accentColor="maroon"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DZFStatCard
            title="Registered Patrons"
            value="672"
            subtitle="Students, Teachers, Staff"
            icon={<UsersIcon size={20} />}
            trend={{ value: '+8 new SS1', positive: true }}
            accentColor="navy"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DZFStatCard
            title="Active Circulations"
            value="84"
            subtitle="14 due within 48h"
            icon={<ClockIcon size={20} />}
            trend={{ value: '6 Overdue', positive: false }}
            accentColor="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DZFStatCard
            title="Gamified Reading Points"
            value="18,920"
            subtitle="Champion: Chinedu O. (SS3)"
            icon={<TrophyIcon size={20} />}
            trend={{ value: '🏆 Top 10 Active', neutral: true }}
            accentColor="gold"
          />
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: `1px solid ${dzfColors.surfaces.border}`, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: dzfColors.surfaces.textSecondary,
              minHeight: 48,
              '&.Mui-selected': {
                color: dzfColors.maroon[900],
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: dzfColors.maroon[900],
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Component Primitives (Buttons & Badges)" />
          <Tab label="Hardware Barcode Scanner & Forms" />
          <Tab label="Master Data Table & Empty States" />
          <Tab label="Color Tokens & Typography Scale" />
        </Tabs>
      </Box>

      {/* Tab 0: Primitives */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Buttons Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 1, color: dzfColors.navy[700] }}>
                Buttons & Interaction States
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
                Standardized variants matching DZF design specifications with loading and disabled states.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                <DZFButton variant="primary">Primary Maroon</DZFButton>
                <DZFButton variant="secondary">Secondary Outlined</DZFButton>
                <DZFButton variant="danger">Danger Crimson</DZFButton>
                <DZFButton variant="soft">Soft Tint</DZFButton>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Loading & Mutation State:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
                <DZFButton
                  variant="primary"
                  loading={buttonLoading}
                  onClick={handleTriggerButtonLoading}
                >
                  {buttonLoading ? 'Saving Transaction...' : 'Click for 1.5s Loading Spinner'}
                </DZFButton>
                <DZFButton variant="secondary" disabled>
                  Disabled Button
                </DZFButton>
              </Box>
            </Card>
          </Grid>

          {/* Badges & Status Pills */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 1, color: dzfColors.navy[700] }}>
                Semantic Badges & Status Pills
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
                Conveys status, loan conditions, patron demographics, and gamification tiers.
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: dzfColors.surfaces.textMuted }}>
                OUTLINED / SOFT WITH STATUS DOTS:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <DZFBadge label="Default Neutral" variant="default" />
                <DZFBadge label="Available" variant="success" dot />
                <DZFBadge label="Checked Out" variant="warning" dot />
                <DZFBadge label="Critical Overdue" variant="error" dot />
                <DZFBadge label="Hold Active" variant="info" dot />
                <DZFBadge label="Top 10 Reader" variant="top10" dot />
                <DZFBadge label="Student Patron" variant="primary" dot />
              </Box>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: dzfColors.surfaces.textMuted }}>
                SOLID BADGES (FOR DIRECT EMPHASIS):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <DZFBadge label="Primary #6f1111" variant="primary" solid />
                <DZFBadge label="Approved" variant="success" solid />
                <DZFBadge label="1–14d Overdue" variant="warning" solid />
                <DZFBadge label=">14d Blocked" variant="error" solid />
                <DZFBadge label="Scholastic Navy" variant="info" solid />
                <DZFBadge label="🥇 1st Place Gold" variant="top10" solid />
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Hardware Barcode Scanner & Forms */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 1, color: dzfColors.navy[700] }}>
                Hardware Barcode Scanner Simulation
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
                Hardware USB/Bluetooth scanners rapidly stream characters ending with an Enter key. Type or click preset test barcodes to test automatic submission and focus retention.
              </Typography>

              <DZFBarcodeInput
                label="Physical Scanner Input Port"
                onScan={handleSimulateScan}
                placeholder="Simulate scanner or type barcode..."
              />

              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Click preset barcodes to simulate hardware scanner:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['20230001 (Monograph)', '20230002 (Patron)', '490.15 (Dewey Tag)', 'DZF-SS2-044'].map((code) => (
                    <Chip
                      key={code}
                      label={code}
                      onClick={() => handleSimulateScan(code)}
                      variant="outlined"
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        borderColor: dzfColors.maroon[200],
                        color: dzfColors.maroon[900],
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: dzfColors.maroon[50],
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Recent Scan Log:
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: dzfColors.surfaces.canvas,
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  minHeight: 100,
                }}
              >
                {scannedList.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      borderBottom: idx < scannedList.length - 1 ? `1px solid ${dzfColors.surfaces.border}` : 0,
                    }}
                  >
                    <CheckIcon size={14} color={dzfColors.status.success.text} />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 1, color: dzfColors.navy[700] }}>
                Form Inputs & Search Controls
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
                Fields with accessible labels, subtle borders, focus outlines, and validation messages.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <DZFSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Filter catalog by title or author..."
                />
              </Box>

              <DZFInput
                label="Book Title"
                placeholder="Enter monograph title"
                required
                defaultValue="Things Fall Apart"
                helperText="Must match title page exactly"
              />

              <DZFInput
                label="Accession Control Number"
                placeholder="e.g. 490.15"
                defaultValue="INVALID-CODE"
                errorText="Invalid classification code. Must be numeric Dewey Decimal."
              />
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Master Data Table & Empty States */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', color: dzfColors.navy[700] }}>
                Library Catalog & Circulation Master Table
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary }}>
                Clean table with sticky headers, subtle row hover tint, sorting, and pagination.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tableLoading}
                    onChange={(e) => setTableLoading(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Simulate Loading</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={tableEmpty}
                    onChange={(e) => setTableEmpty(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Simulate Empty</Typography>}
              />
            </Box>
          </Box>

          <DZFDataTable
            columns={columns}
            data={filteredData}
            loading={tableLoading}
            sortColumn={sortCol}
            sortDirection={sortDir}
            onSort={handleSort}
            emptyTitle="No catalog items found"
            emptyDescription="There are no books matching your current search criteria. Try modifying your filter or clear the query."
            emptyActionLabel="Clear Search"
            onEmptyAction={() => {
              setSearchQuery('');
              setTableEmpty(false);
            }}
          />
        </Box>
      )}

      {/* Tab 3: Tokens & Typography */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 2, color: dzfColors.navy[700] }}>
                Brand & Palette Token Swatches
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Brand Maroon (Foundation Primary):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[
                  { label: '50', color: dzfColors.maroon[50], text: '#171717' },
                  { label: '200', color: dzfColors.maroon[200], text: '#171717' },
                  { label: '500', color: dzfColors.maroon[500], text: '#ffffff' },
                  { label: '700', color: dzfColors.maroon[700], text: '#ffffff' },
                  { label: '900 (Main)', color: dzfColors.maroon[900], text: '#ffffff' },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 1.5,
                      backgroundColor: s.color,
                      color: s.text,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                    }}
                  >
                    {s.label}
                  </Box>
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Scholastic Navy (Headings & Atmosphere):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[
                  { label: '50', color: dzfColors.navy[50], text: '#171717' },
                  { label: '200', color: dzfColors.navy[200], text: '#171717' },
                  { label: '500', color: dzfColors.navy[500], text: '#ffffff' },
                  { label: '700 (Deep)', color: dzfColors.navy[700], text: '#ffffff' },
                  { label: '900', color: dzfColors.navy[900], text: '#ffffff' },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 1.5,
                      backgroundColor: s.color,
                      color: s.text,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                    }}
                  >
                    {s.label}
                  </Box>
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Academic Gold (Kickers, Medals & Accents):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { label: '100 (Soft)', color: dzfColors.gold[100], text: '#171717' },
                  { label: '200', color: dzfColors.gold[200], text: '#171717' },
                  { label: '400', color: dzfColors.gold[400], text: '#171717' },
                  { label: '500 (Gold)', color: dzfColors.gold[500], text: '#ffffff' },
                  { label: '700 (Kicker)', color: dzfColors.gold[700], text: '#ffffff' },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 1.5,
                      backgroundColor: s.color,
                      color: s.text,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                    }}
                  >
                    {s.label}
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.125rem', mb: 2, color: dzfColors.navy[700] }}>
                Typography Scale & Hierarchy
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Kicker>ACADEMIC KICKER OVERLINE (12px / Gold 700)</Kicker>
                <Typography variant="h1" sx={{ fontSize: '1.75rem', color: dzfColors.navy[700] }}>
                  H1 Page Heading (32px / Navy 700)
                </Typography>
                <Typography variant="h2" sx={{ fontSize: '1.35rem', color: dzfColors.navy[700], mt: 0.5 }}>
                  H2 Section Title (24px / Navy 700)
                </Typography>
                <Typography variant="h3" sx={{ fontSize: '1.125rem', color: dzfColors.navy[700], mt: 0.5 }}>
                  H3 Card & Subheader (20px / Navy 700)
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: dzfColors.surfaces.textPrimary }}>
                  Body1 regular text (15px) for patron profile bios, monograph descriptions, and staff notes.
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: dzfColors.surfaces.textSecondary }}>
                  Body2 secondary text (14px) for table data cells, dates, metadata labels.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: dzfColors.surfaces.textMuted }}>
                  Caption text (12px) for timestamps and footnotes.
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ display: 'inline', mr: 1 }}>
                    Monospace text for barcodes:
                  </Typography>
                  <Mono>20230048-AAOJ</Mono>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </AppShell>
  );
}
