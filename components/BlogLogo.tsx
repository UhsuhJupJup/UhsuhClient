"use client";

import { useState } from "react";

const BRAND_DOMAIN: Record<string, string> = {
  "techblog.woowahan.com": "woowahan.com",
  "d2.naver.com": "naver.com",
  "meetup.nhncloud.com": "nhncloud.com",
  "hyperconnect.github.io": "hyperconnect.com",
  "techblog.lycorp.co.jp": "line.me",
  "tech.kakaobank.com": "kakaobank.com",
  "techblog.gccompany.co.kr": "yeogi.com",
  "devocean.sk.com": "sktelecom.com",
  "medium.com/daangn": "daangn.com",
  "medium.com/coupang-engineering": "coupang.com",
  "medium.com/watcha": "watcha.com",
  "medium.com/zigbang": "zigbang.com",
  "medium.com/naver-place-dev": "naver.com",
  "medium.com/wantedjobs": "wanted.co.kr",
  "medium.com/mathpresso": "mathpresso.com",
  "medium.com/musinsa-tech": "musinsa.com",
};

function faviconSrc(domain: string) {
  const brand = BRAND_DOMAIN[domain] ?? domain.split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${brand}&sz=128`;
}

export function BlogLogo({
  name,
  domain,
  logoUrl,
  className = "w-6 h-6",
}: {
  name: string;
  domain: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl || faviconSrc(domain);

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md bg-chip-bg text-[11px] font-bold text-muted ${className}`}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-md object-contain bg-surface ${className}`}
    />
  );
}
