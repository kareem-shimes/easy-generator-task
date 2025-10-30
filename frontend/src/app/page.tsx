import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/features/auth/actions/user.actions";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AUTH_APP_ROUTES } from "@/constants/routes";

export default async function Home() {
  const result = await getCurrentUserAction();

  // Redirect to login if not authenticated
  if (!result.success || !result.user) {
    redirect(AUTH_APP_ROUTES.LOGIN);
  }

  const { user } = result;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome to Easy Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                User Profile
              </h2>
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Name:
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Email:
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    User ID:
                  </span>
                  <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                    {user._id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Member Since:
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <form action={logoutAction}>
              <Button type="submit" variant="destructive" className="w-full">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
