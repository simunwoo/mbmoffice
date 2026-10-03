import { BlogForm } from "@/components/admin/BlogForm";
import { createBlogPost } from "@/lib/actions/admin/blog";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">새 블로그 글 작성</h1>
      <BlogForm action={createBlogPost} submitLabel="게시하기" />
    </div>
  );
}
