"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  format?: "xlsx" | "csv";
}

export function ExportButton({
  data,
  filename,
  label = "Exporter",
  variant = "outline",
  className,
  format = "xlsx",
}: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    if (format === "csv") {
      // Export CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Échapper les guillemets et entourer de guillemets si nécessaire
              if (value === null || value === undefined) return "";
              const stringValue = String(value).replace(/"/g, '""');
              return `"${stringValue}"`;
            })
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Export XLSX
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Données");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
  };

  return (
    <Button
      variant={variant}
      className={`gap-2 h-11 border-none bg-muted/20 ${className}`}
      onClick={handleExport}
    >
      <FileDown size={18} />
      {label}
    </Button>
  );
}
