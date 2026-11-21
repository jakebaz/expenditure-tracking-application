import { useCallback, useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>({ authMode: "userPool" });

export type DocumentRecord = Schema["Document"]["type"];

export interface UploadedFile {
  file: File;
  path: string;
  account: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const all: DocumentRecord[] = [];
      let nextToken: string | null | undefined;
      do {
        const { data, nextToken: next } = await client.models.Document.list({
          nextToken,
        });
        all.push(...data);
        nextToken = next;
      } while (nextToken);
      all.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setDocuments(all);
      setError(null);
    } catch {
      setError("Could not load your uploaded documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Records an uploaded file. Re-uploading the same path overwrites the S3
   * object, so update the existing record instead of creating a duplicate.
   */
  const saveDocument = useCallback(
    async ({ file, path, account }: UploadedFile) => {
      const fields = {
        account,
        fileName: file.name,
        path,
        size: file.size,
        contentType: "text/csv",
        uploadedAt: new Date().toISOString(),
      };
      const { data: existing } = await client.models.Document.list({
        filter: { path: { eq: path } },
      });
      if (existing.length > 0) {
        await client.models.Document.update({ id: existing[0].id, ...fields });
      } else {
        await client.models.Document.create(fields);
      }
      await reload();
    },
    [reload]
  );

  return { documents, loading, error, saveDocument };
}
