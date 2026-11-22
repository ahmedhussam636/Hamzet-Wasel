"use client";

import { Geo3, geo3ExampleProps } from "@/components/dashboardblocks/geo/geo-03";

export function TopCountries() {
	return (
		<div className="md:col-span-2">
			<Geo3 {...geo3ExampleProps} />
		</div>
	);
}

export default TopCountries;
