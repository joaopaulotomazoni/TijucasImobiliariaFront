import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon, message }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        py: 5,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ '& svg': { fontSize: '2.5rem', opacity: 0.4 } }}>{icon}</Box>
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
