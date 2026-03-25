import type { Route } from "./+types/_index";
import Home from "~/components/home/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "QuickBite - Fast Food Delivery" },
    { name: "description", content: "Order from your favorite restaurants in minutes." }
  ];
}

export default function Index() {
  return <Home />;
}
