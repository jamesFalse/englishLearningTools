"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "~/trpc/react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: settings, isLoading } = api.grammar.getSettings.useQuery();

  useEffect(() => {
    // 仅在 web 环境下运行
    if (!isLoading && settings?.runningEnv === "web") {
      const savedKey = window.sessionStorage.getItem("english-learning-passkey");
      
      // 如果没有密钥且当前不在首页，则重定向回首页
      if (!savedKey && pathname !== "/") {
        router.push("/");
      }
    }
  }, [settings, isLoading, pathname, router]);

  // 加载配置时不显示内容，防止闪烁
  if (isLoading && pathname !== "/") return null;

  return <>{children}</>;
}
