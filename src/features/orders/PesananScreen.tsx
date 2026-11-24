"use client";

import React, { useState } from "react";
import { Segmented } from "@/ui/Segmented";
import { PreorderList } from "@/features/orders/PreorderList";
import { ConsignmentList } from "@/features/consignment/ConsignmentList";

type Tab = "preorder" | "consignment";

export function PesananScreen() {
  const [tab, setTab] = useState<Tab>("preorder");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 className="mb-3 text-lg font-extrabold">Pesanan</h1>
      <Segmented
        options={[
          { value: "preorder", label: "Pre-order" },
          { value: "consignment", label: "Titip jual" },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        className="mb-4"
      />
      {tab === "preorder" ? <PreorderList /> : <ConsignmentList />}
    </div>
  );
}
