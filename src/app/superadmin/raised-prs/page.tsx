import { redirect } from "next/navigation";

export default function RaisedPullRequestsRedirect() {
  redirect("/superadmin/pull-requests/mentors");
}
