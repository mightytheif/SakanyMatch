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
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <img 
              src="/SAKANY_LOGO.png" 
              alt="SAKANY" 
              className="h-8 cursor-pointer" 
            />
          </Link>
        </div>

        <NavigationMenu>
          <NavigationMenuList>
            {user && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    onClick={() => window.location.href = '/search'}
                  >
                    Search
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    onClick={() => window.location.href = '/lifestyle'}
                  >
                    Lifestyle Match
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    onClick={() => window.location.href = '/messages'}
                  >
                    Messages
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
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
                    Signed in as {user.displayName}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {user.photoURL === 'landlord' && (
                <Button onClick={() => window.location.href = '/property/new'}>
                  List Property
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
              <Button onClick={() => window.location.href = '/auth'}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}