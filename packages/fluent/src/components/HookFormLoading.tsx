import { FormConstants } from "@bghcore/dynamic-forms-core";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import React from "react";

interface IHookFormLoadingProps {
  loadingShimmerCount?: number;
  loadingFieldShimmerHeight?: number;
  inPanel?: boolean;
  hideTitleShimmer?: boolean;
}

export const HookFormLoading = (props: IHookFormLoadingProps) => {
  const { loadingShimmerCount, loadingFieldShimmerHeight, inPanel, hideTitleShimmer } = props;
  return (
    <div className={`hook-form-loading ${inPanel ? "in-panel" : ""}`}>
      {[...Array(loadingShimmerCount || FormConstants.loadingShimmerCount)].map((_, i) => (
        <div key={`hook-form-loading-${i}`} className="form-field-loading">
          <Skeleton>
            {!hideTitleShimmer && <SkeletonItem style={{ width: "33%" }} />}
            <SkeletonItem style={{ height: `${loadingFieldShimmerHeight || FormConstants.loadingFieldShimmerHeight}px` }} />
          </Skeleton>
        </div>
      ))}
    </div>
  );
};

export default HookFormLoading;
