import { getNewsPost } from "@/app/actions/news";
import { Newspaper, Calendar, User, ArrowLeft, Youtube, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const { data: post, error } = await getNewsPost(slug);

  if (error || !post) {
    notFound();
  }

  // Helper to format youtube embed URL and handle potential issues
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  };

  const embedUrl = getEmbedUrl(post.youtube_url);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/news">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <Badge variant="outline" className="bg-yessal-green/10 text-yessal-green border-none uppercase font-black px-3 py-1">
          Actualité
        </Badge>
      </div>

      <header className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-muted-foreground border-b pb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-yessal-green" />
            {new Date(post.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </div>
          <div className="flex items-center gap-2">
            <User size={18} className="text-yessal-green" />
            {post.created_by_name || "Confrérie Yessal"}
          </div>
        </div>
      </header>

      {post.cover_image && (
        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border bg-muted">
          <img 
            src={post.cover_image} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="text-lg leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
              {post.content}
            </div>
          </div>

          {embedUrl && (
            <div className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Youtube className="text-red-600" /> Vidéo de l'événement
              </h3>
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  title={post.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {post.gallery && post.gallery.length > 0 && (
            <div className="space-y-4 p-6 rounded-2xl bg-muted/30 border">
              <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <ImageIcon size={20} /> Galerie Média
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {post.gallery.map((img: any) => (
                  <div key={img.id} className="aspect-square rounded-2xl overflow-hidden border bg-muted shadow-sm hover:scale-105 transition-transform cursor-zoom-in">
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
