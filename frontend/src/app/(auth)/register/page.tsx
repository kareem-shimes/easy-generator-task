import Image from "next/image";
import Link from "next/link";
import { AUTH_APP_ROUTES, PROTECTED_ROUTES } from "@/constants/routes";
import { RegisterForm } from "@/features/auth/register/components/register-form";
import { Logo } from "../../../../public/assets/images/logos";

export default function RegisterPage() {
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
          Create Account
        </h1>
      </header>
      <RegisterForm />
      <footer className="flex text-sm text-gray-800 dark:text-gray-alpha-800 gap-1 items-center justify-center mt-4">
        Already have an account?
        <Link
          href={AUTH_APP_ROUTES.LOGIN}
          className="hover:underline font-medium"
        >
          Sign in
        </Link>
      </footer>
    </>
  );
}
