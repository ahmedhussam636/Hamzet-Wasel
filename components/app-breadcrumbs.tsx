import type { ReactNode } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Current page segment shown in the header — pass a nav item or `{ title, icon? }`. */
export type AppBreadcrumbPage = {
	title: string;
	icon?: ReactNode;
	parentTitle?: string;
	parentPath?: string;
};

export function AppBreadcrumbs({ page }: { page?: AppBreadcrumbPage | null }) {
	if (!page?.title) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{page.parentTitle && (
					<>
						<BreadcrumbItem>
							{page.parentPath ? (
								<BreadcrumbLink href={page.parentPath}>
									{page.parentTitle}
								</BreadcrumbLink>
							) : (
								<span>{page.parentTitle}</span>
							)}
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</>
				)}
				<BreadcrumbItem>
					<BreadcrumbPage className="flex items-center gap-2 [&>svg]:size-3.5">
						{page.icon}
						{page.title}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
