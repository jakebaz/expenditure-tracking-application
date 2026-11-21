import { useRef, useState } from "react";
import { Button, Paper, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface DropzoneProps {
  onFiles: (files: FileList) => void;
}

export default function Dropzone({ onFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <Paper
      variant="outlined"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
      sx={{
        p: 4,
        textAlign: "center",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: dragging ? "primary.main" : "divider",
        bgcolor: dragging ? "action.hover" : "background.paper",
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 48 }} color="primary" />
      <Typography sx={{ mb: 2 }}>Drag and drop CSV files here, or</Typography>
      <Button variant="outlined" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </Paper>
  );
}
