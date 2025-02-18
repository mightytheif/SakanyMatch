import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function Navbar() {
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
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex gap-4">
          <Button variant="ghost">Sign In</Button>
          <Button>List Property</Button>
        </div>
      </div>
    </header>
  );
}
