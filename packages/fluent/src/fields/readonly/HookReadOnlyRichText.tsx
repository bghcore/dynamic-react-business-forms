import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import React from "react";

const HookReadOnlyRichText = (props: IHookFieldSharedProps<{}>) => {
  const { value } = props;
  return (
    <div
      className="hook-read-only-rich-text-editor"
      dangerouslySetInnerHTML={{ __html: value as string || "" }}
    />
  );
};

export default HookReadOnlyRichText;
