import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";
import { LayoutList } from "lucide-react";

interface CardListItem {
  id: number | string;
  title: string;
  badge?: string;
  count?: number;
  amount?: number;
  image?: string;
  severity?: "critical" | "warning" | "info";
}

// Données de démo utilisées seulement si aucune prop items n'est passée
const FALLBACK_ITEMS: CardListItem[] = [
  { id: 1, title: "Construction grande mosquée", badge: "Magal", count: 4300 },
  { id: 2, title: "Participation Gamou 2025", badge: "Gamou", count: 3200 },
  { id: 3, title: "Soutien Daara Paris", badge: "Solidarité", count: 2400 },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/40",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
};

const CardList = ({ title, items }: { title: string; items?: CardListItem[] }) => {
  const list = items && items.length > 0 ? items : FALLBACK_ITEMS;
  const isEmpty = items !== undefined && items.length === 0;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      {isEmpty ? (
        <EmptyState icon={LayoutList} title="Aucune donnée" size="sm" />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((item) => {
            const displayValue = item.amount ?? (item.count ? item.count * 100 : null);
            const severityClass = item.severity ? SEVERITY_COLORS[item.severity] : "";

            return (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4 border-none shadow-none hover:bg-muted/30 transition-colors rounded-xl cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    item.severity ? severityClass : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.title.charAt(0).toUpperCase()}
                </div>
                <CardContent className="flex-1 p-0 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">{item.title}</CardTitle>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className={`mt-1 font-normal text-[10px] ${item.severity ? severityClass + " border-none" : "bg-secondary"}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </CardContent>
                {displayValue !== null && (
                  <CardFooter className="p-0 font-bold text-sm text-foreground flex-shrink-0">
                    {displayValue.toLocaleString("fr-FR")} <span className="text-[10px] text-muted-foreground ml-1">FCFA</span>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CardList;
