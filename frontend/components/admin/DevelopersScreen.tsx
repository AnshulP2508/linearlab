"use client";

import { DeveloperListItem, PaginatedResponse } from "@/types/admin";
import { Card, SearchInput, StatusBadge, Table, TableCell, TableRow } from "./primitives";
import { useRemoteData } from "./useRemoteData";
import { useState } from "react";

const initialDevelopers: PaginatedResponse<DeveloperListItem> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

export function DevelopersScreen() {
  const [search, setSearch] = useState("");
  const { data } = useRemoteData<PaginatedResponse<DeveloperListItem>>(
    `/api/developers?search=${encodeURIComponent(search)}`,
    initialDevelopers,
  );

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-start">
        <SearchInput value={search} onChange={setSearch} placeholder="Search developers..." />
      </div>
      <Card className="p-6">
        {data.items.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
              <span className="text-[32px]">👨‍💻</span>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-[18px] font-semibold text-on-surface">No developers found</h3>
              <p className="text-[14px] text-on-surface-variant">
                Create developer users from the Users module to populate this workspace.
              </p>
            </div>
          </div>
        ) : (
          <Table columns={["Developer", "POCs", "Published", "Avg Rating", "Status", "Last Active"]}>
            {data.items.map((developer) => (
              <TableRow key={developer.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold">{developer.name}</p>
                    <p className="text-xs text-muted-text">{developer.email}</p>
                  </div>
                </TableCell>
                <TableCell>{developer.totalPocs}</TableCell>
                <TableCell>{developer.publishedPocs}</TableCell>
                <TableCell>{developer.averageRating.toFixed(1)}</TableCell>
                <TableCell><StatusBadge value={developer.status} /></TableCell>
                <TableCell>{developer.lastActiveAt ? new Date(developer.lastActiveAt).toLocaleDateString() : "No activity"}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
