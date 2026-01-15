"use client";

import ApprovalsList from "@/components/Dashboard/ApprovalsList";
// Actually ApprovalsList returns null if !currentUser. So just rendering it is safe.

export default function ApprovalsPage() {
  return (
    <ApprovalsList enablePagination={true} />
  );
}
