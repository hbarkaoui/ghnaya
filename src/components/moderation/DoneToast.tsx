"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Confirme la décision qui vient d'être prise (« Proposition approuvée »), en toast, sur l'élément
 * suivant de la file où l'action a mené (`?statut=`). Le paramètre est ensuite retiré de l'adresse :
 * un rechargement ou un lien copié ne répète pas le message.
 */
export function DoneToast({ message }: { message: string | null }) {
  const toast = useToast();
  useEffect(() => {
    if (!message) return;
    toast(message, "success");
    const url = new URL(window.location.href);
    url.searchParams.delete("statut");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [message, toast]);
  return null;
}
