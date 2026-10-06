'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFSearchInput,
  DZFBadge,
  PageHeader,
  Mono,
  PrinterIcon,
  BookIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
} from '@/components';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { ITokenPayload } from '@/lib/auth/jwt';
import { ICataloging } from '@/models/Cataloging';
import {
  ThermalBookPrintDialog,
  BookDetailModal,
  BookEditModal,
  ThermalBookLabelData,
} from '@/components/catalog';
import { canManageCatalog, canDeleteBook } from '@/lib/auth/rbac';

interface CatalogListClientProps {
  initialBooks: ICataloging[];
  initialTotal: number;
  user?: ITokenPayload | null;
}

export default function CatalogListClient({
  initialBooks,
  initialTotal,
  user,
}: CatalogListClientProps) {
  const canEdit = user ? canManageCatalog(user.role) : false;
  const canDelete = user ? canDeleteBook(user.role) : false;

  const [books, setBooks] = React.useState<ICataloging[]>(initialBooks);
  const [totalCount, setTotalCount] = React.useState<number>(initialTotal);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [classificationFilter, setClassificationFilter] = React.useState<string>('all');
  const [availableOnly, setAvailableOnly] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(15);

  // Selection for Batch Thermal Label Printing
  const [selectedBookIds, setSelectedBookIds] = React.useState<Set<string>>(new Set());

  // Modal Dialogs
  const [detailBook, setDetailBook] = React.useState<ICataloging | null>(null);
  const [printLabels, setPrintLabels] = React.useState<ThermalBookLabelData[] | null>(null);
  const [editBook, setEditBook] = React.useState<ICataloging | null>(null);
  const [deleteBook, setDeleteBook] = React.useState<ICataloging | null>(null);
  const [deleting, setDeleting] = React.useState<boolean>(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Avoid synchronous setState inside initial effect
  const isFirstMount = React.useRef(true);

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    let active = true;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page + 1));
        params.set('limit', String(pageSize));
        if (search.trim()) params.set('search', search.trim());
        if (classificationFilter !== 'all') params.set('classification', classificationFilter);
        if (availableOnly) params.set('available', 'true');

        const res = await fetch(`/api/catalog?${params.toString()}`);
        const data = await res.json();

        if (active && data.success) {
          setBooks(data.books);
          setTotalCount(data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [page, pageSize, search, classificationFilter, availableOnly]);

  // Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(books.map((b) => String(b._id)));
      setSelectedBookIds(allIds);
    } else {
      setSelectedBookIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Thermal Print Handlers
  const handlePrintSingle = (book: Partial<ICataloging>) => {
    const mainTitle = book.title?.mainTitle || 'Untitled Book';
    setPrintLabels([
      {
        barcode: book.barcode || '00000000',
        title: mainTitle,
        controlNumber: book.controlNumber || '000.0',
        classification: book.classification,
        shelfLocation: book.shelfLocation || 'Main Stacks',
      },
    ]);
  };

  const handlePrintBatch = () => {
    const selected = books.filter((b) => selectedBookIds.has(String(b._id)));
    if (selected.length === 0) return;

    const labels: ThermalBookLabelData[] = selected.map((b) => ({
      barcode: b.barcode,
      title: b.title.mainTitle,
      controlNumber: b.controlNumber,
      classification: b.classification,
      shelfLocation: b.shelfLocation || 'Main Stacks',
    }));

    setPrintLabels(labels);
  };

  const isAllSelected = books.length > 0 && selectedBookIds.size === books.length;
  const isSomeSelected = selectedBookIds.size > 0 && selectedBookIds.size < books.length;

  const columns: Column<ICataloging>[] = [
    {
      id: 'select',
      label: '',
      minWidth: 48,
      render: (row) => (
        <Checkbox
          size="small"
          checked={selectedBookIds.has(String(row._id))}
          onChange={() => handleToggleSelect(String(row._id))}
          sx={{
            color: dzfColors.surfaces.textMuted,
            '&.Mui-checked': { color: dzfColors.maroon[900] },
          }}
        />
      ),
    },
    {
      id: 'title',
      label: 'Book Title & Author',
      minWidth: 260,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 48,
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              border: `1px solid ${dzfColors.surfaces.border}`,
            }}
          >
            {row.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <BookIcon size={18} color={dzfColors.maroon[800]} />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: dzfColors.navy[900],
                fontSize: '0.875rem',
                textTransform: 'capitalize',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 260,
              }}
            >
              {row.title?.mainTitle}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: dzfColors.surfaces.textSecondary,
                display: 'block',
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 260,
              }}
            >
              {row.author?.mainAuthor}
              {row.publicationInfo?.year ? ` (${row.publicationInfo.year})` : ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'classification',
      label: 'Dewey / Call No',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Mono sx={{ fontSize: '0.8125rem', color: dzfColors.maroon[900], fontWeight: 700 }}>
            {row.controlNumber}
          </Mono>
          <Typography variant="caption" sx={{ display: 'block', color: dzfColors.surfaces.textMuted }}>
            Class {row.classification}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'barcode',
      label: 'Barcode',
      minWidth: 130,
      render: (row) => (
        <Mono sx={{ fontSize: '0.8125rem' }}>{row.barcode}</Mono>
      ),
    },
    {
      id: 'shelf',
      label: 'Shelf Location',
      minWidth: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: dzfColors.navy[700], fontWeight: 500 }}>
          {row.shelfLocation || 'Main Stacks'}
        </Typography>
      ),
    },
    {
      id: 'copies',
      label: 'Copies',
      minWidth: 110,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: dzfColors.navy[900] }}>
          {row.copiesAvailable ?? (row.isCheckedOut ? 0 : 1)} / {row.copiesTotal ?? 1}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 130,
      render: (row) => (
        <DZFBadge
          variant={row.isCheckedOut ? 'warning' : 'success'}
          label={row.isCheckedOut ? 'Borrowed' : 'Available'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Catalog Card">
            <IconButton
              size="small"
              onClick={() => setDetailBook(row)}
              sx={{ color: dzfColors.navy[700], '&:hover': { color: dzfColors.maroon[900] } }}
            >
              <EyeIcon size={18} />
            </IconButton>
          </Tooltip>

          {canEdit && (
            <Tooltip title="Edit Catalog Record">
              <IconButton
                size="small"
                onClick={() => setEditBook(row)}
                sx={{ color: dzfColors.navy[700], '&:hover': { color: dzfColors.maroon[700] } }}
              >
                <EditIcon size={18} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Print 60×40mm Thermal Label">
            <IconButton
              size="small"
              onClick={() => handlePrintSingle(row)}
              sx={{ color: dzfColors.navy[700], '&:hover': { color: dzfColors.gold[700] } }}
            >
              <PrinterIcon size={18} />
            </IconButton>
          </Tooltip>

          {canDelete && (
            <Tooltip title="Delete Book">
              <IconButton
                size="small"
                onClick={() => {
                  setDeleteBook(row);
                  setDeleteError(null);
                }}
                sx={{ color: dzfColors.surfaces.textMuted, '&:hover': { color: dzfColors.status.error.button } }}
              >
                <TrashIcon size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <PageHeader
        kicker="STATION AAoJ • LIBRARY COLLECTION"
        title="Catalog & Book Inventory"
        subtitle="Manage Dewey Decimal accession, physical shelf mapping, copy labeling, and instant thermal roll barcode printing for 1,350+ volumes."
        actionSlot={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            {selectedBookIds.size > 0 && (
              <DZFButton
                variant="secondary"
                startIcon={<PrinterIcon size={18} />}
                onClick={handlePrintBatch}
              >
                Print Selected ({selectedBookIds.size}) Labels
              </DZFButton>
            )}

            <Link href="/catalog/acquire" style={{ textDecoration: 'none' }}>
              <DZFButton variant="primary" startIcon={<PlusIcon size={18} />}>
                Acquire New Book
              </DZFButton>
            </Link>
          </Box>
        }
      />

      {/* Filter and Search Bar */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: '#ffffff',
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', lg: 'center' },
            gap: 2,
          }}
        >
          {/* Dewey Decimal Classification Tabs */}
          <Tabs
            value={classificationFilter}
            onChange={(_, val) => {
              setClassificationFilter(val);
              setPage(0);
              setLoading(true);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: dzfColors.surfaces.textSecondary,
                '&.Mui-selected': {
                  color: dzfColors.maroon[900],
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: dzfColors.maroon[900],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab label={`All Books (${totalCount})`} value="all" />
            <Tab label="000 General & Info" value="000" />
            <Tab label="100 Philosophy" value="100" />
            <Tab label="200 Religion" value="200" />
            <Tab label="300 Social Sciences" value="300" />
            <Tab label="400 Language" value="400" />
            <Tab label="500 Science" value="500" />
            <Tab label="600 Technology" value="600" />
            <Tab label="700 Arts" value="700" />
            <Tab label="800 Literature" value="800" />
            <Tab label="900 History & Geo" value="900" />
          </Tabs>

          {/* Right Controls: Availability Toggle & Search Box */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={availableOnly}
                  onChange={(e) => {
                    setAvailableOnly(e.target.checked);
                    setPage(0);
                    setLoading(true);
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: dzfColors.maroon[900] },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: dzfColors.maroon[900] },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: dzfColors.navy[700] }}>
                  Available Only
                </Typography>
              }
            />

            <Box sx={{ width: { xs: '100%', sm: 300 } }}>
              <DZFSearchInput
                placeholder="Search title, author, barcode, ISBN..."
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(0);
                  setLoading(true);
                }}
                onClear={() => {
                  setSearch('');
                  setPage(0);
                  setLoading(true);
                }}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Batch Selection Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            size="small"
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            sx={{
              p: 0.5,
              color: dzfColors.surfaces.textMuted,
              '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: dzfColors.maroon[900] },
            }}
          />
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: dzfColors.navy[700], fontWeight: 600 }}>
            Select Page Books ({selectedBookIds.size} selected)
          </Typography>
        </Box>

        {selectedBookIds.size > 0 && (
          <DZFButton
            variant="secondary"
            size="small"
            startIcon={<PrinterIcon size={16} />}
            onClick={handlePrintBatch}
          >
            Print Thermal Labels ({selectedBookIds.size})
          </DZFButton>
        )}
      </Box>

      {/* Main Catalog Data Table */}
      <Card
        sx={{
          backgroundColor: '#ffffff',
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <DZFDataTable
          columns={columns}
          data={books}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(newPage) => {
            setPage(newPage);
            setLoading(true);
          }}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
            setLoading(true);
          }}
          keyExtractor={(row) => String(row._id)}
          emptyTitle="No books found"
          emptyDescription={
            search
              ? `No catalog records match "${search}". Try searching by title, author, or barcode.`
              : 'No books cataloged under this Dewey Decimal classification.'
          }
        />
      </Card>

      {/* Book Detail Modal */}
      <BookDetailModal
        open={Boolean(detailBook)}
        onClose={() => setDetailBook(null)}
        book={detailBook}
        onPrintLabel={(book) => {
          setDetailBook(null);
          handlePrintSingle(book);
        }}
        onEdit={(book) => {
          setDetailBook(null);
          setEditBook(book);
        }}
        onDelete={(book) => {
          setDetailBook(null);
          setDeleteBook(book);
          setDeleteError(null);
        }}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Book Edit Modal */}
      <BookEditModal
        open={Boolean(editBook)}
        onClose={() => setEditBook(null)}
        book={editBook}
        onSuccess={(updated) => {
          setBooks((prev) =>
            prev.map((b) =>
              (b._id && updated._id && String(b._id) === String(updated._id)) || b.barcode === updated.barcode
                ? updated
                : b
            )
          );
          if (
            detailBook &&
            ((detailBook._id && updated._id && String(detailBook._id) === String(updated._id)) ||
              detailBook.barcode === updated.barcode)
          ) {
            setDetailBook(updated);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteBook)}
        onClose={deleting ? undefined : () => setDeleteBook(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
          Delete Book Record
        </DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: dzfColors.navy[900] }}>
              &ldquo;{deleteBook?.title?.mainTitle}&rdquo;
            </strong>{' '}
            (Barcode:{' '}
            <Mono sx={{ fontSize: '0.85rem', color: dzfColors.maroon[900] }}>
              {deleteBook?.barcode}
            </Mono>
            )?
          </Typography>
          <Typography variant="caption" sx={{ color: dzfColors.status.error.text, mt: 1, display: 'block' }}>
            Warning: This action cannot be undone. Books on active loan or in the reservation queue cannot be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <DZFButton
            variant="soft"
            onClick={() => setDeleteBook(null)}
            disabled={deleting}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon size={16} />}
            onClick={async () => {
              if (!deleteBook) return;
              setDeleting(true);
              setDeleteError(null);
              try {
                const identifier = deleteBook._id ? String(deleteBook._id) : deleteBook.barcode;
                const res = await fetch(`/api/catalog/${identifier}`, {
                  method: 'DELETE',
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                  throw new Error(data.error || 'Failed to delete book');
                }
                setBooks((prev) =>
                  prev.filter(
                    (b) =>
                      (b._id ? String(b._id) !== String(deleteBook._id) : b.barcode !== deleteBook.barcode)
                  )
                );
                setTotalCount((prev) => Math.max(0, prev - 1));
                setDeleteBook(null);
              } catch (err) {
                const e = err as Error;
                setDeleteError(e.message || 'Failed to delete book');
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Book'}
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* Thermal Print Dialog (60×40mm) */}
      <ThermalBookPrintDialog
        open={Boolean(printLabels)}
        onClose={() => setPrintLabels(null)}
        labels={printLabels}
      />
    </Box>
  );
}
