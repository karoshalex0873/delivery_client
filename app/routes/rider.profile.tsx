import { useOutletContext } from "react-router";
import { type RiderContextData } from "./rider";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Bike, Phone, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { logout as logoutUser } from "~/services/auth";
import { useEffect, useState } from "react";

export default function RiderProfilePage() {
  const { rider, handleUpdateShippingRate } = useOutletContext<RiderContextData>();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [costPerKm, setCostPerKm] = useState("40");
  const [savingRate, setSavingRate] = useState(false);
  
  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    navigate("/auth/signin", { replace: true });
  };

  useEffect(() => {
    if (typeof rider?.costPerKm === "number") {
      setCostPerKm(String(rider.costPerKm));
    }
  }, [rider?.costPerKm]);

  const handleSaveRate = async () => {
    const parsed = Number(costPerKm);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    setSavingRate(true);
    await handleUpdateShippingRate(parsed);
    setSavingRate(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Rider Profile</h2>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
           <div className="h-20 w-20 rounded-full bg-brand-red/10 flex items-center justify-center text-3xl font-bold text-brand-red uppercase">
              {rider?.name?.[0] || "R"}
           </div>
           <div className="space-y-1">
             <CardTitle className="text-xl">{rider?.name || "Rider"}</CardTitle>
             <div className="flex items-center gap-2">
                <Badge variant={rider?.status === "online" ? "success" : "secondary"}>
                   {rider?.status || "Offline"}
                </Badge>
                <span className="text-sm text-muted-foreground">{rider ? "Verified Rider" : "Loading..."}</span>
             </div>
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid gap-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                      <p className="text-sm font-medium">Contact Number</p>
                      <p className="text-sm text-muted-foreground">{rider?.phoneNumber || "-"}</p>
                  </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border">
                  <Bike className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                      <p className="text-sm font-medium">Shipping Cost Per KM</p>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={costPerKm}
                          onChange={(event) => setCostPerKm(event.target.value)}
                          className="input-field h-10 py-2"
                          placeholder="40"
                          inputMode="decimal"
                        />
                        <Button onClick={() => void handleSaveRate()} disabled={savingRate}>
                          {savingRate ? "Saving..." : "Save"}
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Used to calculate delivery shipping cost.</p>
                  </div>
              </div>
           </div>

           <div className="pt-6">
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
