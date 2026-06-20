import { useRef, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadFile, getDownloadUrl } from '../../services/uploadService';

const ACCEPTED = 'application/pdf,image/jpeg,image/png';
const MAX_SIZE_MB = 10;

export default function FileUpload({
  label,
  tipo,
  value,
  onChange,
  onError,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite reenviar o mesmo arquivo depois
    if (!file) return;

    if (!ACCEPTED.split(',').includes(file.type)) {
      onError?.('Tipo de arquivo não permitido. Aceitos: PDF, JPEG, PNG.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onError?.(`O arquivo deve ter no máximo ${MAX_SIZE_MB} MB.`);
      return;
    }

    setIsUploading(true);
    try {
      const key = await uploadFile(file, tipo);
      setFileName(file.name);
      onChange(key);
    } catch (error) {
      console.error('Erro no upload:', error);
      onError?.('Não foi possível enviar o arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async () => {
    try {
      const url = await getDownloadUrl(value);
      window.open(url, '_blank', 'noopener');
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
      onError?.('Não foi possível abrir o arquivo.');
    }
  };

  const handleRemove = () => {
    setFileName('');
    onChange('');
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        hidden
        onChange={handleFile}
      />
      {value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon fontSize="small" color="success" />
          <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName || 'Documento anexado'}
          </Typography>
          <IconButton size="small" color="primary" onClick={handleView} title="Visualizar">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {!disabled && (
            <IconButton size="small" color="error" onClick={handleRemove} title="Remover">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={isUploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          onClick={handlePick}
          disabled={disabled || isUploading}
        >
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </Button>
      )}
    </Box>
  );
}
