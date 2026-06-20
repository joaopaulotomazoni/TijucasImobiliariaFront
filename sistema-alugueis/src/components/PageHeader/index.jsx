import { HeaderRow, TitleGroup, IconBadge, Title, Subtitle } from './styles';

export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <HeaderRow>
      <TitleGroup>
        <IconBadge>{icon}</IconBadge>
        <div>
          <Title>{title}</Title>
          {subtitle && <Subtitle variant="body1">{subtitle}</Subtitle>}
        </div>
      </TitleGroup>
      {action}
    </HeaderRow>
  );
}
