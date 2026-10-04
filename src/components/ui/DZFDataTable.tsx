'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { ChevronDownIcon } from './DZFIcons';
import DZFEmptyState from './DZFEmptyState';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface DZFDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pageSize?: number;
  page?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  keyExtractor?: (row: T, index: number) => string | number;
}

export function DZFDataTable<T extends object = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria in this view.',
  emptyActionLabel,
  onEmptyAction,
  pageSize = 10,
  page = 0,
  totalCount,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  keyExtractor,
}: DZFDataTableProps<T>) {
  const [internalPage, setInternalPage] = React.useState(page);
  const [internalPageSize, setInternalPageSize] = React.useState(pageSize);

  const activePage = onPageChange ? page : internalPage;
  const activePageSize = onPageSizeChange ? pageSize : internalPageSize;
  const activeTotal = totalCount !== undefined ? totalCount : data.length;

  const paginatedData = React.useMemo(() => {
    if (totalCount !== undefined) {
      // Server-side paginated
      return data;
    }
    const start = activePage * activePageSize;
    return data.slice(start, start + activePageSize);
  }, [data, activePage, activePageSize, totalCount]);

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalPage(0);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 3,
        border: `1px solid ${dzfColors.surfaces.border}`,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      }}
    >
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="dzf data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const isSorted = sortColumn === column.id;
                return (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth }}
                    sx={{
                      backgroundColor: '#f5f7fa',
                      color: dzfColors.navy[700],
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: column.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      borderBottom: `1px solid ${dzfColors.surfaces.border}`,
                      '&:hover': column.sortable
                        ? { backgroundColor: '#edf2f7', color: dzfColors.maroon[900] }
                        : {},
                    }}
                    onClick={() => column.sortable && onSort?.(column.id)}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        justifyContent:
                          column.align === 'right'
                            ? 'flex-end'
                            : column.align === 'center'
                            ? 'center'
                            : 'flex-start',
                      }}
                    >
                      <span>{column.label}</span>
                      {column.sortable && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: isSorted ? 1 : 0.35,
                            transform: isSorted && sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.15s ease',
                            color: isSorted ? dzfColors.maroon[900] : 'inherit',
                          }}
                        >
                          <ChevronDownIcon size={14} />
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={`skeleton-row-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={`skeleton-cell-${rIdx}-${cIdx}`} align={col.align || 'left'}>
                      <Skeleton variant="text" height={24} width={cIdx === 0 ? '60%' : '85%'} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6, border: 0 }}>
                  <DZFEmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                    sx={{ border: 'none', py: 2 }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const rowRecord = row as Record<string, unknown>;
                const key = keyExtractor ? keyExtractor(row, index) : ((rowRecord.id ?? rowRecord._id ?? index) as React.Key);
                return (
                  <TableRow
                    key={String(key)}
                    hover
                    sx={{
                      transition: 'background-color 0.1s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(111, 17, 17, 0.03) !important',
                      },
                      '&:last-child td': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{
                          fontSize: '0.875rem',
                          color: dzfColors.surfaces.textPrimary,
                          py: 1.5,
                        }}
                      >
                        {column.render ? column.render(row) : (rowRecord[column.id] as React.ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && activeTotal > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            borderTop: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: '#ffffff',
          }}
        >
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            Showing {Math.min(activeTotal, activePage * activePageSize + 1)}–
            {Math.min(activeTotal, (activePage + 1) * activePageSize)} of {activeTotal} items
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={activeTotal}
            rowsPerPage={activePageSize}
            page={activePage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              border: 0,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8125rem',
                color: dzfColors.surfaces.textSecondary,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default DZFDataTable;
