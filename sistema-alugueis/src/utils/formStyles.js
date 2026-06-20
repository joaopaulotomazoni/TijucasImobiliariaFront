// Esconde o placeholder nativo "dd/mm/aaaa" de inputs type="date" enquanto
// o campo está vazio e sem foco, deixando o label do MUI centralizado como
// nos demais campos. Reaparece ao focar ou quando há valor preenchido.
export const dateFieldSx = {
  '& .MuiInputBase-input[type="date"]': {
    color: 'transparent',
  },
  '& .MuiInputBase-input[type="date"]:focus, & .MuiInputBase-input[type="date"][value]:not([value=""])':
    { color: 'inherit' },
};
