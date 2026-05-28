"use client";

import { PaginatedResponse, PocListItem } from "@/types/admin";
import { useState } from "react";
import { Button, Card, StatusBadge, Table, TableCell, TableRow, Toast } from "./primitives";
import { useRemoteData } from "./useRemoteData";

const initialApprovals: PaginatedResponse<PocListItem> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

export function ApprovalsScreen() {
  const [toast, setToast] = useState<string | null>(null);
  const { data, setData } = useRemoteData<PaginatedResponse<PocListItem>>(
    "/api/pocs/approvals",
    initialApprovals,
  );

  async function decide(id: string, action: "approve" | "reject") {
    const response = await fetch(`/api/pocs/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        action === "reject"
          ? JSON.stringify({ reason: "Please revise documentation and compliance notes." })
          : JSON.stringify({ notes: "Approved for publication." }),
    });
    if (!response.ok) return;
    setData({
      ...data,
      items: data.items.filter((item) => item.id !== id),
      total: Math.max(0, data.total - 1),
    });
    setToast(`POC ${action}d`);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      <Card className="p-6">
        <Table columns={["POC", "Developer", "Submitted", "Status", "Actions"]}>
          {data.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-text">{item.summary}</p>
              </TableCell>
              <TableCell>{item.developer?.name ?? "Unknown"}</TableCell>
              <TableCell>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}</TableCell>
              <TableCell><StatusBadge value={item.status} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button onClick={() => decide(item.id, "approve")}>Approve</Button>
                  <Button variant="danger" onClick={() => decide(item.id, "reject")}>
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
