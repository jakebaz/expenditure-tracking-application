import {
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import type { DocumentRecord } from "../../hooks/useDocuments";

interface DocumentListProps {
  documents: DocumentRecord[];
  loading: boolean;
}

export default function DocumentList({
  documents,
  loading,
}: DocumentListProps) {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }}>
        Uploaded documents
      </Typography>
      {loading ? (
        <LinearProgress sx={{ mt: 1 }} />
      ) : documents.length === 0 ? (
        <Typography color="text.secondary">
          No documents uploaded yet.
        </Typography>
      ) : (
        <List>
          {documents.map((doc) => (
            <ListItem key={doc?.id}>
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary={doc?.fileName}
                secondary={`${new Date(doc?.uploadedAt).toLocaleString()}${
                  doc?.size != null
                    ? ` · ${(doc?.size / 1024).toFixed(1)} KB`
                    : ""
                }`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}
