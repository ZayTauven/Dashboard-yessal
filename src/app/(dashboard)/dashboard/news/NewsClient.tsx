"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNewsPost, deleteNewsPost, updateNewsPost, addGalleryImage, deleteGalleryImage } from "@/app/actions/news";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MoreHorizontal, Newspaper, Calendar, User, Edit, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type NewsGalleryImage = {
  id: number;
  image: string;
  caption?: string;
};

type NewsPost = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  youtube_url?: string | null;
  is_published: boolean;
  created_at: string;
  created_by_name?: string | null;
  gallery?: NewsGalleryImage[];
};

export function NewsClient({
  initialPosts,
  isAdmin,
}: {
  initialPosts: NewsPost[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [galleryLoading, setGalleryLoading] = useState(false);

  async function handleAdd(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addNewsPost(formData);
      if (res.error) {
        toast.error(res.error);
        setErrorMsg(res.error);
      } else {
        toast.success("Article publié avec succès !");
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editingPost) return;
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateNewsPost(editingPost.id, formData);
      if (res.error) {
        toast.error(res.error);
        setErrorMsg(res.error);
      } else {
        toast.success("Article mis à jour !");
        setEditingPost(null);
        router.refresh();
      }
    });
  }

  async function handleDelete(slug: string) {
    if (!confirm("Supprimer cet article ?")) return;
    const { error } = await deleteNewsPost(slug as any); // Assuming deleteNewsPost handles slug now
    if (!error) {
        toast.success("Article supprimé.");
        router.refresh();
    } else {
        toast.error(error);
    }
  }

  async function handleAddGallery(slug: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setGalleryLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    const { error } = await addGalleryImage(slug as any, formData);
    if (!error) {
      toast.success("Image ajoutée à la galerie");
      router.refresh();
      // Update editingPost gallery manually to show new image without re-opening
      const { data: updatedPost } = await (await fetch(`/api/news/posts/${slug}/`)).json();
      if (updatedPost) setEditingPost(updatedPost);
    } else {
      toast.error(error);
    }
    setGalleryLoading(false);
  }

  async function handleDeleteGallery(imageId: number) {
    if (!confirm("Supprimer cette image ?")) return;
    const { error } = await deleteGalleryImage(imageId);
    if (!error) {
      toast.success("Image supprimée");
      router.refresh();
      if (editingPost) {
        setEditingPost({
            ...editingPost,
            gallery: editingPost.gallery?.filter(img => img.id !== imageId)
        });
      }
    } else {
      toast.error(error);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Newspaper size={28} className="text-yessal-green" /> Actualités
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Le journal de la confrérie : événements, annonces et récits.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yessal-green hover:bg-green-700 text-white gap-3 border-none px-8 h-12 shadow-xl shadow-yessal-green/20 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                <Plus size={20} /> Publier une actualité
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvel article d'actualité</DialogTitle>
                <DialogDescription>Partagez les moments forts avec les membres.</DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" name="title" required className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Résumé court</Label>
                  <Input id="excerpt" name="excerpt" className="h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover_image">Bannière</Label>
                    <Input id="cover_image" name="cover_image" type="file" accept="image/*" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">Vidéo YouTube</Label>
                    <Input id="youtube_url" name="youtube_url" placeholder="https://..." className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery_images">Ajouter des photos à la galerie (Multiple)</Label>
                  <Input id="gallery_images" name="gallery_images" type="file" accept="image/*" multiple className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contenu</Label>
                  <Textarea id="content" name="content" rows={6} required className="rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_published" name="is_published" value="true" defaultChecked />
                  <Label htmlFor="is_published">Publier immédiatement</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="w-full bg-yessal-green text-white h-11 rounded-xl font-bold">
                    {isPending ? "Publication..." : "Publier maintenant"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={!!editingPost} onOpenChange={(val) => !val && setEditingPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Modifier l'article</DialogTitle>
            </DialogHeader>
            {editingPost && (
                <form action={handleUpdate} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input name="title" defaultValue={editingPost.title} required className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label>Résumé</Label>
                        <Input name="excerpt" defaultValue={editingPost.excerpt || ""} className="h-11 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bannière</Label>
                            <Input name="cover_image" type="file" className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>YouTube</Label>
                            <Input name="youtube_url" defaultValue={editingPost.youtube_url || ""} className="h-11 rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Contenu</Label>
                        <Textarea name="content" defaultValue={editingPost.content} rows={8} required className="rounded-xl" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="is_published" value="true" defaultChecked={editingPost.is_published} />
                        <Label>Publié</Label>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold flex items-center gap-2"><ImageIcon size={16}/> Galerie</Label>
                            <label className="cursor-pointer">
                                <Badge variant="outline" className="text-[10px] gap-1 hover:bg-yessal-green hover:text-white transition-colors">
                                    {galleryLoading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Ajouter
                                </Badge>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAddGallery(editingPost.slug, e)} />
                            </label>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {editingPost.gallery?.map((img) => (
                                <div key={img.id} className="aspect-square rounded-lg border overflow-hidden relative group">
                                    <img src={img.image} className="w-full h-full object-cover" />
                                    <button onClick={() => handleDeleteGallery(img.id)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="w-full bg-yessal-green text-white h-11 rounded-xl font-bold">
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {initialPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-none shadow-md bg-card/50 backdrop-blur-sm group flex flex-col rounded-[1rem]">
            {post.cover_image && (
              <div className="h-52 w-full overflow-hidden">
                <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            )}
            <CardHeader className="pb-3 pt-6 px-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Badge variant="outline" className="bg-yessal-green/10 text-yessal-green border-none text-[10px] uppercase font-black px-2 py-0.5 mb-2">Actualité</Badge>
                    <CardTitle className="text-xl font-black group-hover:text-yessal-green transition-colors leading-tight line-clamp-2">{post.title}</CardTitle>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full border-none"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                        <DropdownMenuItem onClick={() => setEditingPost(post)} className="font-bold cursor-pointer"><Edit size={16} className="mr-2" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(post.slug)} className="text-red-600 font-bold cursor-pointer"><Trash2 size={16} className="mr-2" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
            </CardHeader>
            <CardContent className="px-8 pb-4 flex-1">
              <p className="text-sm font-bold text-yessal-green mb-2 line-clamp-1">{post.excerpt}</p>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{post.content}</p>
            </CardContent>
            <CardFooter className="px-8 pb-8 pt-0">
              <Link href={`/dashboard/news/${post.slug}`} className="w-full">
                <Button variant="outline" className="w-full rounded-2xl border-yessal-green/20 text-yessal-green font-black uppercase text-[10px] tracking-widest h-10 transition-all">Lire la suite</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
