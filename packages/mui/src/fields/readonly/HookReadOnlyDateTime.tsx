import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Typography } from "@mui/material";
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
      <Typography variant="body2" className="hook-read-only-date-time" component="span">
        {formatDateTime(value as string, { hideTimestamp: config?.hidetimeStamp })}
      </Typography>
    ) : <>-</>}</>
  );
};

export default HookReadOnlyDateTime;
