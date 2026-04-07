import Image from "next/image";
import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const popularContent = [
  {
    id: 1,
    title: "Construction grande mosquée",
    badge: "Magal",
    image: "",
    count: 4300,
  },
  {
    id: 2,
    title: "Participation Gamou 2025",
    badge: "Gamou",
    image: "",
    count: 3200,
  },
  {
    id: 3,
    title: "Soutien Daara Paris",
    badge: "Solidarité",
    image: "",
    count: 2400,
  },
];

const latestTransactions = [
  {
    id: 1,
    title: "Ahmadou Bamba Fall",
    badge: "Daara Dakar",
    image: "",
    count: 1400,
  },
  {
    id: 2,
    title: "Fatou Diop",
    badge: "Daara Paris",
    image: "",
    count: 2100,
  },
  {
    id: 3,
    title: "Modou Lo",
    badge: "Daara Marseille",
    image: "",
    count: 1300,
  },
];

const CardList = ({ title }: { title: string }) => {
  const list =
    title === "Campagnes actives" ? popularContent : latestTransactions;
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        {list.map((item) => (
          <Card key={item.id} className="flex-row items-center justify-between gap-4 p-4 border-none shadow-none">
            <div className="w-10 h-10 rounded-full relative overflow-hidden bg-muted flex items-center justify-center">
              {/* <Image src={item.image} alt={item.title} fill className="object-cover" /> */}
              <span className="text-xs text-muted-foreground">{item.title.charAt(0)}</span>
            </div>
            <CardContent className="flex-1 p-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Badge variant="secondary" className="mt-1 font-normal bg-secondary">{item.badge}</Badge>
            </CardContent>
            <CardFooter className="p-0 font-medium text-sm text-foreground">{item.count * 100} FCFA</CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CardList;
