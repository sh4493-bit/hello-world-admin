import { requireAdmin } from "@/lib/auth";
import { createMediaAction } from "../../actions";
import MediaForm from "../media-form";

export default async function NewMedia() {
  await requireAdmin();
  return (<><h1>New AI media</h1><p className="muted">&nbsp;</p><MediaForm action={createMediaAction} /></>);
}
