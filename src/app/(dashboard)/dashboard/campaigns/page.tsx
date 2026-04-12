import { getCampaigns } from "@/app/actions/campaigns";
import { getEvents } from "@/app/actions/events";
import { CampaignsClient } from "./CampaignsClient";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default async function CampaignsPage() {
  const { data: campaigns, error: campaignError } = await getCampaigns();
  const { data: events } = await getEvents();
  
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  let isAdmin = false;
  
  if (token) {
    try {
        const decoded: any = jwtDecode(token);
        isAdmin = decoded.role === "admin" || decoded.role === "chef_daara" || true; // Mocked admin for now
    } catch (e) {}
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Campagnes de dons (Jëfs)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Suivez les objectifs de collecte et participez aux actions de la confrérie.
        </p>
      </div>

      {campaignError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{campaignError}</div>
      ) : (
        <CampaignsClient 
          initialCampaigns={campaigns || []} 
          events={events || []} 
          isAdmin={isAdmin} 
        />
      )}
    </div>
  );
}
