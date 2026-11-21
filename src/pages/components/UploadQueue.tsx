import {
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface UploadItem {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface UploadQueueProps {
  items: UploadItem[];
  onRemove: (file: File) => void;
}

export default function UploadQueue({ items, onRemove }: UploadQueueProps) {
  return (
    <List>
      {items.map(({ file, status, progress, error }) => (
        <ListItem
          key={`${file.name}-${file.lastModified}`}
          secondaryAction={
            status !== "uploading" && (
              <Button size="small" onClick={() => onRemove(file)}>
                Remove
              </Button>
            )
          }
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText
            primary={file.name}
            secondary={
              <>
                {status === "done" && "Uploaded"}
                {status === "error" && (error ?? "Upload failed")}
                {status === "pending" && `${(file.size / 1024).toFixed(1)} KB`}
                {status === "uploading" && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mt: 1 }}
                  />
                )}
              </>
            }
            slotProps={{ secondary: { component: "div" } }}
          />
        </ListItem>
      ))}
    </List>
  );
}
