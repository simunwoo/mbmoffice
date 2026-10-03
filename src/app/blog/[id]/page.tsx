import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getBlogPostById, getBlogPosts } from "@/lib/data";

type Params = { id: string };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    description: post.body.slice(0, 140),
    path: `/blog/${id}`,
    images: post.images,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "블로그", path: "/blog" },
          { name: post.title, path: `/blog/${id}` },
        ])}
      />
      {post.category && <p className="text-sm font-semibold text-brand-ink">{post.category}</p>}
      <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>

      {post.images[0] && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-surface">
          <Image src={post.images[0]} alt={post.title} fill className="object-contain p-2" sizes="(min-width: 768px) 640px, 100vw" priority />
        </div>
      )}

      {post.bodyHtml ? (
        <div
          className="prose prose-neutral mt-8 max-w-none text-foreground-soft [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_p]:my-3"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      ) : (
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-foreground-soft">{post.body}</div>
      )}

      <div className="mt-10">
        <Link href="/blog" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">
          다른 글 보기
        </Link>
      </div>
    </article>
  );
}
