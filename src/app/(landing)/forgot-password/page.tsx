"use client"

import { useState, useTransition } from "react"
import { forgotPasswordAction } from "@/app/actions/auth"
import Link from "next/link"
import { Mail, ChevronLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg("")
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    startTransition(async () => {
      const res = await forgotPasswordAction(email)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setIsSuccess(true)
      }
    })
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="h-20 w-20 bg-green-50 text-yessal-green rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-100">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Email Envoyé !</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consultez votre boîte mail. Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé.
          </p>
          <Button asChild className="w-full bg-yessal-green hover:bg-green-700 text-white rounded-xl h-12 shadow-xl shadow-yessal-green/10">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-yessal-green transition-colors mb-8 uppercase tracking-widest">
            <ChevronLeft size={14} /> Retour
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">Récupération</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-80 leading-relaxed max-w-[280px] mx-auto">Saisissez l'email lié à votre compte membre</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5 px-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Adresse Email</Label>
            <div className="relative">
              <Input
                name="email"
                type="email"
                placeholder="nom@exemple.com"
                required
                className="h-11 rounded-xl bg-muted/20 border-none px-4 pl-12 focus-visible:ring-1 focus-visible:ring-yessal-green"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-destructive text-xs font-bold text-center animate-shake">{errorMsg}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-yessal-green hover:bg-green-700 text-white rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-yessal-green/10 border-none transition-all hover:scale-[1.02] active:scale-95"
          >
            {isPending ? "Traitement..." : "Envoyer le lien"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
          Besoin d'aide supplémentaire ?{" "}
          <Link href="/contact" className="text-yessal-green font-bold">Maintenance Centrale</Link>
        </p>
      </div>
    </div>
  )
}
