import { Alert, Box, Typography } from "@mui/material";
import { useDocuments } from "../hooks/useDocuments";
import FileUploader from "./components/FileUploader";
import DocumentList from "./components/DocumentList";

export default function Documents() {
  const { documents, loading, error, saveDocument } = useDocuments();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Documents
      </Typography>

      <FileUploader account="amex" onUploaded={saveDocument} />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <DocumentList documents={documents} loading={loading} />
    </Box>
  );
}
