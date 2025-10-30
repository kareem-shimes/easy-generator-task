import { PROTECTED_ROUTES } from "@/constants/routes";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = (await cookies()).get("access_token");

  if (accessToken) {
    redirect(PROTECTED_ROUTES.HOME);
  }
  return (
    <main className="bg-background">
      <div className="container min-h-screen flex justify-center items-center md:items-start">
        <div className="w-full h-full max-w-[360px] py-10 md:py-20">
          {children}
        </div>
      </div>
    </main>
  );
}
