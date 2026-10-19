import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Media } from "@/lib/data";
import { updateMediaAction } from "../../actions";
import MediaForm from "../media-form";

export default async function EditMedia({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("caption_generations").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (<><h1>Edit AI media</h1><p className="muted">Created {data.created_at.slice(0, 10)}</p><MediaForm action={updateMediaAction} initial={data as Media} /></>);
}
