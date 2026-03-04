import { IFieldProps } from "@bghcore/dynamic-forms-core";
import React from "react";
import { formatDateTime } from "../../helpers";

interface IHookReadOnlyDateTimeProps {
  isListView?: boolean;
  hidetimeStamp?: boolean;
}

const HookReadOnlyDateTime = (props: IFieldProps<IHookReadOnlyDateTimeProps>) => {
  const { config, value } = props;
  return (
    <>{value ? (
      <span className="hook-read-only-date-time">
        {formatDateTime(value as string, { hideTimestamp: config?.hidetimeStamp })}
      </span>
    ) : <>-</>}</>
  );
};

export default HookReadOnlyDateTime;
