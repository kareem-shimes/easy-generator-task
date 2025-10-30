import { PROTECTED_ROUTES } from "@/constants/routes";
import { LoginForm } from "@/features/auth/login/components/login-form";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "../../../../public/assets/images/logos";

export default function LoginPage() {
  return (
    <>
      <Link
        href={PROTECTED_ROUTES.HOME}
        className="hidden md:flex justify-center mb-20"
      >
        <Image
          src={Logo}
          alt="Easy Generator"
          width={150}
          height={40}
          priority
        />
      </Link>
      <header className="mb-14">
        <h1 className="text-2xl text-foreground font-semibold text-center">
          Welcome back
        </h1>
      </header>
      <LoginForm />
      <footer className="flex text-sm text-gray-800 dark:text-gray-alpha-800 gap-1 items-center justify-center mt-4">
        Don&apos;t have an account?
        <Link href="/register" className="hover:underline font-medium">
          Sign up
        </Link>
      </footer>
    </>
  );
}
