"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";

interface ProfileBannerProps {
  profile: {
    birth_date?: string;
    gender?: string;
    residence_country?: string;
    documents?: any[];
  } | null;
}

export default function ProfileCompletionBanner({ profile }: ProfileBannerProps) {
  if (!profile) return null;

  // Check if profile is complete
  const isComplete = 
    !!profile.birth_date && 
    !!profile.gender && 
    !!profile.residence_country &&
    (profile.documents && profile.documents.length > 0);

  if (isComplete) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900/50 p-3 px-4 lg:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 p-2 rounded-full">
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            Assurez-vous de compléter votre profil
          </p>
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80 font-medium hidden sm:block">
            Votre date de naissance, genre, numéro de carte d&apos;identité et pays sont requis.
          </p>
        </div>
      </div>
      <Link href="/dashboard/profile" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors bg-orange-100 dark:bg-orange-900/50 px-3 py-2 rounded-lg">
        Compléter <ChevronRight size={14} />
      </Link>
    </div>
  );
}
