import { HookInlineFormConstants } from "@brhanso/dynamic-forms-core";
import { Shimmer, ShimmerElementType } from "@fluentui/react";
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
      {[...Array(loadingShimmerCount || HookInlineFormConstants.loadingShimmerCount)].map((_, i) => (
        <div key={`hook-form-loading-${i}`} className="form-field-loading">
          {!hideTitleShimmer && <Shimmer width="33%" />}
          <Shimmer
            shimmerElements={[
              {
                type: ShimmerElementType.line,
                width: "100%",
                height: loadingFieldShimmerHeight || HookInlineFormConstants.loadingFieldShimmerHeight
              }
            ]}
          />
        </div>
      ))}
    </div>
  );
};

export default HookFormLoading;
