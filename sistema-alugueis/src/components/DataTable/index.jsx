import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { PageTableContainer } from '../PageLayout/styles';
import EmptyState from '../EmptyState';

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });
}

export default function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  loading = false,
  emptyIcon,
  emptyMessage = 'Nenhum registro encontrado.',
  searchPlaceholder = 'Buscar...',
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, direction: 'asc' });

  const searchableColumns = columns.filter((column) => column.searchValue);
  const isSearchable = searchableColumns.length > 0;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      searchableColumns.some((column) =>
        String(column.searchValue(row) ?? '')
          .toLowerCase()
          .includes(term)
      )
    );
  }, [rows, search, searchableColumns]);

  const sortedRows = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) =>
      compareValues(column.sortValue(a), column.sortValue(b))
    );
    return sort.direction === 'asc' ? sorted : sorted.reverse();
  }, [filteredRows, sort, columns]);

  const handleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  };

  const colSpan = columns.length;

  return (
    <>
      {isSearchable && (
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 360 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      <PageTableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.sortValue ? (
                    <TableSortLabel
                      active={sort.key === column.key}
                      direction={sort.key === column.key ? sort.direction : 'asc'}
                      onClick={() => handleSort(column.key)}
                    >
                      <strong>{column.header}</strong>
                    </TableSortLabel>
                  ) : (
                    <strong>{column.header}</strong>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  <EmptyState
                    icon={emptyIcon}
                    message={
                      search.trim()
                        ? 'Nenhum resultado encontrado para a busca.'
                        : emptyMessage
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={getRowKey(row)} hover>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PageTableContainer>
    </>
  );
}
