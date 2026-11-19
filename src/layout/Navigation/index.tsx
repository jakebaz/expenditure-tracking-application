import { List } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import NavItem from "./NavItem";

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: <HomeOutlinedIcon />, end: true },
  {
    label: "Documents",
    to: "/documents",
    icon: <DescriptionOutlinedIcon />,
    end: false,
  },
];

interface NavigationProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Navigation({ setMobileOpen }: NavigationProps) {
  return (
    <List component="nav" aria-label="Main navigation" sx={{ flexGrow: 1 }}>
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
      ))}
    </List>
  );
}
