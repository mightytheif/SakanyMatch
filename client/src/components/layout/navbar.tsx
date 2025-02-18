import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <img src="/SAKANY_LOGO.png" alt="SAKANY" className="h-8" />
          </a>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            {user && (
              <>
                <NavigationMenuItem>
                  <Link href="/search">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Search
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/lifestyle">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Lifestyle Match
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </>
            )}
            {user && (
              <NavigationMenuItem>
                <Link href="/messages">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Messages
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    Signed in as {user.name}
                  </DropdownMenuItem>
                  <Link href="/profile">
                    <DropdownMenuItem>
                      Profile Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button>List Property</Button>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}