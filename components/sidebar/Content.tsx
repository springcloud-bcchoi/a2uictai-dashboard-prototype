import { links } from "@/app/path/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function Content() {
    const pathname = usePathname();
    const splitPathname = pathname.split('/');
    const pathLastName = splitPathname.length === 2 ? pathname : splitPathname.slice(2).join('/');
    return (
      <>
        {links.map((link) => {
          const LinkIcon = link.icon;
          const splitLinks = link.href.split('/');
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
                {
                  'bg-sky-100 text-blue-600': pathLastName.includes(splitLinks[splitLinks.length-1]),
                },
              )}
            >
              <LinkIcon className="w-6"/>
              <p className="hidden md:block">{link.name}</p>
            </Link>
          );
        })}
      </>
    );
}