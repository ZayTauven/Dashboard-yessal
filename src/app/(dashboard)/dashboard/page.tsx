import AppAreaChart from "@/components/AppAreaChart";
import AppBarChart from "@/components/AppBarChart";
import AppPieChart from "@/components/AppPieChart";
import CardList from "@/components/CardList";
import TodoList from "@/components/TodoList";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
      <div className="bg-card p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2 border shadow-sm">
        <AppBarChart />
      </div>
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <CardList title="Derniers dons" />
      </div>
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <AppPieChart />
      </div>
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <TodoList />
      </div>
      <div className="bg-card p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2 border shadow-sm">
        <AppAreaChart />
      </div>
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <CardList title="Campagnes actives" />
      </div>
    </div>
  );
}
