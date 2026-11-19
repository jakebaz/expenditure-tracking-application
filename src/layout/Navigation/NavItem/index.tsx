import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { NavLink, useMatch } from "react-router";

interface NavItemProps {
  label: string;
  to: string;
  icon: React.ReactNode;
  end: boolean;
  onClick?: () => void;
}

export default function NavItem({
  label,
  to,
  icon,
  end,
  onClick,
}: NavItemProps) {
  const selected = useMatch({ path: to, end }) !== null;

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      selected={selected}
      onClick={onClick}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
