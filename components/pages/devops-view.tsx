"use client";

import { Dashboard5, dashboard5ExampleProps } from "@/components/dashboardblocks/dashboards/dashboard-05";
import {
  DashboardBusy,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";

export function DevOpsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);

  return (
    <div className="flex flex-col gap-5">
      <DashboardBusy refreshing={state.refreshing} label="Updating platform health">
        <Dashboard5
          {...dashboard5ExampleProps}
          empty={state.isEmpty}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </DashboardBusy>
    </div>
  );
}

export default DevOpsView;
