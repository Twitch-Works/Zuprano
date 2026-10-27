import { redirect } from "next/navigation";

// The original storefront sends unknown routes back to the homepage.
export default function NotFound() {
  redirect("/");
}
