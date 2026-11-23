import type { S3Handler } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { parseStatement, type ParsedTransaction } from "./parse-statement";

const s3 = new S3Client({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TRANSACTION_TABLE_NAME;
const BATCH_SIZE = 25; // DynamoDB BatchWriteItem limit
const MAX_RETRIES = 5;

// Statements are stored as csv/{account}/{file}.csv
const KEY_PATTERN = /^csv\/([^/]+)\/[^/]+\.csv$/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function writeBatch(items: Record<string, unknown>[]) {
  let pending = items;
  for (let attempt = 0; pending.length > 0; attempt++) {
    if (attempt > MAX_RETRIES) {
      throw new Error(`${pending.length} items still unwritten after retries`);
    }
    if (attempt > 0) await sleep(2 ** attempt * 100);
    const result = await dynamo.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME!]: pending.map((Item) => ({ PutRequest: { Item } })),
        },
      })
    );
    pending = (result.UnprocessedItems?.[TABLE_NAME!] ?? []).map(
      (r) => r.PutRequest!.Item as Record<string, unknown>
    );
  }
}

/** Shapes a row the way Amplify Data stores a `Transaction` model item. */
function toItem(t: ParsedTransaction, now: string) {
  return {
    __typename: "Transaction",
    createdAt: now,
    updatedAt: now,
    ...t,
  };
}

export const handler: S3Handler = async (event) => {
  if (!TABLE_NAME) throw new Error("TRANSACTION_TABLE_NAME is not set");

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    // S3 event keys are URL-encoded with spaces as '+'.
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const match = KEY_PATTERN.exec(key);
    if (!match) {
      console.log(`Ignoring ${key}: not a statement CSV`);
      continue;
    }
    const account = match[1];

    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const csv = (await object.Body?.transformToString("utf-8")) ?? "";

    const { transactions, skipped } = parseStatement(csv, account, key);
    for (const s of skipped) {
      console.warn(`${key}: skipped line ${s.line} (${s.reason})`);
    }

    const now = new Date().toISOString();
    const items = transactions.map((t) => toItem(t, now));
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      await writeBatch(items.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `${key}: wrote ${transactions.length} transactions, skipped ${skipped.length}`
    );
  }
};
