import { Backdrop, CircularProgress } from '@mui/material';
import { HomeWork, Assignment, Groups } from '@mui/icons-material';
import logo from '../../assets/1d8f442f-6b26-4680-bdb0-faff2aa2724f.png';

import {
  Wrapper,
  BrandPanel,
  BrandContent,
  BrandLogoBadge,
  BrandWordmark,
  BrandTagline,
  FeatureList,
  FeatureItem,
  FeatureIconBadge,
  FormPanel,
  FormContent,
  Title,
  Subtitle,
} from './styles';

const FEATURES = [
  { icon: HomeWork, label: 'Cadastro completo de imóveis' },
  { icon: Assignment, label: 'Contratos de aluguel organizados' },
  { icon: Groups, label: 'Gestão de clientes em um só lugar' },
];

export default function AuthLayout({ title, subtitle, isLoading, children }) {
  return (
    <Wrapper>
      <BrandPanel>
        <BrandContent>
          <BrandLogoBadge>
            <img src={logo} alt="Tijucas Imobiliária" />
          </BrandLogoBadge>
          <BrandWordmark variant="h3" component="p">
            Tijucas <span>Imobiliária</span>
          </BrandWordmark>
          <BrandTagline variant="body1">
            Gestão completa de imóveis para locação, em um só sistema.
          </BrandTagline>
          <FeatureList>
            {FEATURES.map(({ icon: Icon, label }) => (
              <FeatureItem key={label}>
                <FeatureIconBadge>
                  <Icon sx={{ color: '#ffffff' }} fontSize="small" />
                </FeatureIconBadge>
                <span>{label}</span>
              </FeatureItem>
            ))}
          </FeatureList>
        </BrandContent>
      </BrandPanel>

      <FormPanel>
        <FormContent>
          <Title component="h1" variant="h5">
            {title}
          </Title>
          {subtitle && <Subtitle variant="body2">{subtitle}</Subtitle>}

          {children}
        </FormContent>
      </FormPanel>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999 }}
        open={!!isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Wrapper>
  );
}
