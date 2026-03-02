import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import React from "react";
import { formatDateTime } from "../../helpers";

interface IHookReadOnlyDateTimeProps {
  isListView?: boolean;
  hidetimeStamp?: boolean;
}

const HookReadOnlyDateTime = (props: IHookFieldSharedProps<IHookReadOnlyDateTimeProps>) => {
  const { meta, value } = props;
  return (
    <>
      {value ? (
        <span className="hook-read-only-date-time">
          {formatDateTime(value as string, { hideTimestamp: meta?.hidetimeStamp })}
        </span>
      ) : <>-</>}
    </>
  );
};

export default HookReadOnlyDateTime;
