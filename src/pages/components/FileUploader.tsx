import { useState } from "react";
import { Alert, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { uploadData } from "aws-amplify/storage";
import Dropzone from "./Dropzone";
import UploadQueue, { type UploadItem } from "./UploadQueue";
import type { UploadedFile } from "../../hooks/useDocuments";

interface FileUploaderProps {
  /** Account the statements belong to, e.g. "amex". Used in the S3 path. */
  account: string;
  /** Called after a file has been stored; rejecting marks the file as failed. */
  onUploaded: (uploaded: UploadedFile) => Promise<void>;
}

const isCsv = (file: File) =>
  file.name.toLowerCase().endsWith(".csv") ||
  file.type === "text/csv" ||
  file.type === "application/vnd.ms-excel";

export default function FileUploader({
  account,
  onUploaded,
}: FileUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const addFiles = (fileList: FileList) => {
    const files = Array.from(fileList);
    const csvFiles = files.filter(isCsv);
    setMessage(
      csvFiles.length < files.length ? "Only .csv files are accepted." : null
    );
    setItems((prev) => [
      ...prev,
      ...csvFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  };

  const updateItem = (file: File, patch: Partial<UploadItem>) =>
    setItems((prev) =>
      prev.map((item) => (item.file === file ? { ...item, ...patch } : item))
    );

  const removeItem = (file: File) =>
    setItems((prev) => prev.filter((item) => item.file !== file));

  const handleUpload = async () => {
    setUploading(true);
    for (const { file } of items.filter((i) => i.status !== "done")) {
      updateItem(file, { status: "uploading", progress: 0, error: undefined });
      try {
        const { path } = await uploadData({
          path: `csv/${account}/${file.name}`,
          data: file,
          options: {
            contentType: "text/csv",
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                updateItem(file, {
                  progress: Math.round((transferredBytes / totalBytes) * 100),
                });
              }
            },
          },
        }).result;
        await onUploaded({ file, path, account });
        updateItem(file, { status: "done", progress: 100 });
      } catch (err) {
        updateItem(file, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }
    // Uploaded files appear in the saved list, so clear them from the queue.
    setItems((prev) => prev.filter((item) => item.status !== "done"));
    setUploading(false);
  };

  const hasUploadable = items.some((i) => i.status !== "done");

  return (
    <>
      <Dropzone onFiles={addFiles} />

      {message && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      {items.length > 0 && (
        <>
          <UploadQueue items={items} onRemove={removeItem} />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={uploading || !hasUploadable}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </>
      )}
    </>
  );
}
