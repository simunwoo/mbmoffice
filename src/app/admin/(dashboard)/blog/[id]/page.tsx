import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blogPostFromRow } from "@/lib/supabase/mappers";
import { BlogForm } from "@/components/admin/BlogForm";
import { updateBlogPost } from "@/lib/actions/admin/blog";

type Params = { id: string };

export default async function EditBlogPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (!row) notFound();

  const post = blogPostFromRow(row);
  const action = updateBlogPost.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">블로그 글 수정</h1>
      <p className="mt-1 text-sm text-foreground-soft">{post.title}</p>
      <BlogForm action={action} post={post} initialStatus={row.status} submitLabel="변경사항 저장" />
    </div>
  );
}
