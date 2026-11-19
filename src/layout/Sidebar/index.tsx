import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Divider, useAuthenticator } from "@aws-amplify/ui-react";
import LogoutIcon from "@mui/icons-material/Logout";
import Navigation from "../Navigation";

const DRAWER_WIDTH = 240;

interface SidebarProps {
  isDesktop: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  isDesktop,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const { signOut } = useAuthenticator((context) => [context.signOut]);

  return (
    <Box
      component="aside"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Toolbar>
            <Typography variant="h6" noWrap>
              My App
            </Typography>
          </Toolbar>
          <Navigation setMobileOpen={setMobileOpen} />
          <Divider />
          <List>
            <ListItemButton onClick={signOut}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
