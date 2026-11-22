"use client";

import { Flow1, flow1ExampleProps } from "@/components/dashboardblocks/flow/flow-01";
import { Flow2, flow2ExampleProps } from "@/components/dashboardblocks/flow/flow-02";
import { Flow4, flow4ExampleProps } from "@/components/dashboardblocks/flow/flow-04";
import {
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";

export function FlowsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);

  return (
    <div className="flex flex-col gap-5">
      <Flow1
        {...flow1ExampleProps}
        links={state.isEmpty ? [] : flow1ExampleProps.links}
        refreshing={state.refreshing}
        status={state.status}
        errorMessage={state.errorMessage}
      />
      <Flow2
        {...flow2ExampleProps}
        links={state.isEmpty ? [] : flow2ExampleProps.links}
        refreshing={state.refreshing}
        status={state.status}
        errorMessage={state.errorMessage}
      />
      <Flow4
        {...flow4ExampleProps}
        paths={state.isEmpty ? [] : flow4ExampleProps.paths}
        refreshing={state.refreshing}
        status={state.status}
        errorMessage={state.errorMessage}
      />
    </div>
  );
}

export default FlowsView;
