"use client";

import { useEffect, useState } from "react";

interface Props {
  date: string | Date;
  locale?: string;
}

export function ClientTimeDisplay({ date, locale = "es-CO" }: Props) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    setFormatted(
      new Date(date).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, [date, locale]);

  if (!formatted) return <span className="animate-pulse">--:--</span>;

  return <span>{formatted}</span>;
}