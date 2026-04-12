"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface ExportButtonProps {
    data: any[];
    filename: string;
    label?: string;
    variant?: "default" | "outline" | "ghost";
    className?: string;
}

export function ExportButton({ data, filename, label = "Exporter", variant = "outline", className }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Données");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
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
