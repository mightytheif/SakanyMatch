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
import { User, Building } from "lucide-react";

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const isLandlord = user?.displayName?.split('|')[1] === 'landlord';

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <img 
              src="/assets/logo.png" 
              alt="SAKANY Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.src = '/assets/fallback-logo.svg';
                console.error('Error loading logo image');
              }}
            />
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
                {isAdmin && (
                  <NavigationMenuItem>
                    <Link href="/admin/dashboard">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Admin Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
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
                    Signed in as {user.displayName?.split('|')[0]}
                    {isAdmin && " (Admin)"}
                  </DropdownMenuItem>
                  <Link href="/profile">
                    <DropdownMenuItem>
                      Profile Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => logout()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isLandlord && (
                <Link href="/properties/add">
                  <Button className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    List Property
                  </Button>
                </Link>
              )}
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