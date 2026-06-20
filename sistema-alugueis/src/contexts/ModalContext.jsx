import { createContext, useContext, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const ModalContext = createContext({
  showModal: () => {},
  showConfirm: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'info', 'warning'
    confirmText: 'OK',
    onConfirm: null,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    confirmColor: 'primary',
    onConfirm: null,
  });

  const showModal = ({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    onConfirm = null,
  }) => {
    setModalConfig({ title, message, type, confirmText, onConfirm });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
  };

  const showConfirm = ({
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'primary',
    onConfirm,
  }) => {
    setConfirmConfig({
      title,
      message,
      confirmText,
      cancelText,
      confirmColor,
      onConfirm,
    });
    setConfirmOpen(true);
  };

  const handleCancelConfirm = () => setConfirmOpen(false);

  const handleAcceptConfirm = () => {
    setConfirmOpen(false);
    confirmConfig.onConfirm?.();
  };

  return (
    <ModalContext.Provider value={{ showModal, showConfirm }}>
      {children}
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              padding: '8px',
              minWidth: '320px',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: modalConfig.type === 'error' ? 'error.main' : 'primary.dark',
          }}
        >
          {modalConfig.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mt: 1 }}>
            {modalConfig.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ paddingRight: '24px', paddingBottom: '16px' }}>
          <Button
            onClick={handleClose}
            variant="contained"
            disableElevation
            color={modalConfig.type === 'error' ? 'error' : 'primary'}
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {modalConfig.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              padding: '8px',
              minWidth: '320px',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.dark' }}>
          {confirmConfig.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mt: 1 }}>
            {confirmConfig.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ paddingRight: '24px', paddingBottom: '16px' }}>
          <Button
            onClick={handleCancelConfirm}
            color="inherit"
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {confirmConfig.cancelText}
          </Button>
          <Button
            onClick={handleAcceptConfirm}
            variant="contained"
            disableElevation
            color={confirmConfig.confirmColor}
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {confirmConfig.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ModalContext.Provider>
  );
};
